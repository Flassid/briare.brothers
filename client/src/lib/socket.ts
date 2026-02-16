import { io, Socket } from "socket.io-client";

type TypedSocket = Socket;

// Store socket on window to survive Next.js hot reloads
declare global {
  interface Window {
    __dungeonSocket?: TypedSocket;
    __socketListeners?: ((connected: boolean) => void)[];
    __socketCreated?: boolean;
  }
}

// Module-level socket reference (backup)
let moduleSocket: TypedSocket | null = null;

function getSocketInstance(): TypedSocket {
  if (typeof window === 'undefined') {
    return null as any;
  }
  
  // First check window, then module
  const existingSocket = window.__dungeonSocket || moduleSocket;
  
  if (existingSocket) {
    if (existingSocket.connected) {
      return existingSocket;
    }
    // Socket exists but disconnected - just return it (it will auto-reconnect)
    return existingSocket;
  }
  
  // Create new socket only if none exists
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
  console.log("[Socket] Creating socket to", serverUrl);
  
  const newSocket = io(serverUrl, { 
    autoConnect: true,
    reconnection: true, 
    reconnectionAttempts: 100,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    timeout: 30000,
    transports: ['websocket', 'polling'],
  });
  
  // Store in both places
  window.__dungeonSocket = newSocket;
  moduleSocket = newSocket;
  window.__socketListeners = window.__socketListeners || [];
  
  newSocket.on("connect", () => {
    console.log("[Socket] Connected, id:", newSocket.id);
    window.__socketListeners?.forEach(cb => cb(true));
  });
  
  newSocket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
    window.__socketListeners?.forEach(cb => cb(false));
  });
  
  newSocket.on("connect_error", (err) => {
    console.error("[Socket] Error:", err.message);
  });
  
  return newSocket;
}

export function getSocket(): TypedSocket {
  return getSocketInstance();
}

export function onConnectionChange(callback: (connected: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  if (!window.__socketListeners) window.__socketListeners = [];
  window.__socketListeners.push(callback);
  
  // Immediately call with current state
  const s = getSocket();
  if (s) callback(s.connected);
  
  // Return cleanup function
  return () => {
    if (window.__socketListeners) {
      window.__socketListeners = window.__socketListeners.filter(cb => cb !== callback);
    }
  };
}

export function isConnected(): boolean {
  return window?.__dungeonSocket?.connected ?? false;
}

export function connectSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (!s) {
      reject(new Error('Socket not available'));
      return;
    }
    
    if (s.connected) { 
      console.log("[Socket] Already connected, id:", s.id);
      resolve(); 
      return; 
    }
    
    // Set timeout for connection
    const timeout = setTimeout(() => {
      console.log("[Socket] Connection timeout, resolving anyway");
      resolve(); // Resolve anyway, socket will reconnect
    }, 5000);
    
    const onConnect = () => {
      clearTimeout(timeout);
      s.off("connect", onConnect);
      s.off("connect_error", onError);
      console.log("[Socket] Connected successfully, id:", s.id);
      resolve();
    };
    
    const onError = (error: Error) => {
      clearTimeout(timeout);
      s.off("connect", onConnect);
      s.off("connect_error", onError);
      console.error("[Socket] Connection failed:", error.message);
      // Don't reject - just resolve and let reconnection handle it
      resolve();
    };
    
    s.once("connect", onConnect);
    s.once("connect_error", onError);
    
    console.log("[Socket] Connecting...");
    if (!s.connected) {
      s.connect();
    }
  });
}

export function disconnectSocket(): void {
  // Don't actually disconnect - keep connection alive
  console.log("[Socket] Disconnect requested but keeping connection alive");
}
