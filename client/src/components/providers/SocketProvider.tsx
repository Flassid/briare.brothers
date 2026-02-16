"use client";

import { useEffect, useRef } from "react";
import { connectSocket, getSocket } from "@/lib/socket";
import { useGameStore } from "@/stores/gameStore";
import { generateId } from "@/lib/utils";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const { setConnected, addMessage, setIsLoading } = useGameStore();

  useEffect(() => {
    // Only run once, ever
    if (initialized.current) {
      console.log("[SocketProvider] Already initialized, skipping");
      return;
    }
    initialized.current = true;

    console.log("[SocketProvider] *** INITIALIZING SOCKET ***");

    const init = async () => {
      try {
        await connectSocket();
        const socket = getSocket();

        // Setup global listeners
        socket.on("dm:narrate", (data: { content: string; timestamp: number }) => {
          console.log("[SocketProvider] DM narrate received");
          setIsLoading(false);
          addMessage({
            id: generateId(),
            timestamp: data.timestamp || Date.now(),
            type: "dm",
            content: data.content,
          });
        });

        socket.on("game:state", (state: any) => {
          console.log("[SocketProvider] game:state received, tiles:", state?.tiles?.length);
          setIsLoading(false);
          // Dispatch custom event for PhaserGame
          window.dispatchEvent(new CustomEvent("game:state", { detail: state }));
        });

        socket.on("backstory:chunk", (data: { text: string }) => {
          window.dispatchEvent(new CustomEvent("backstory:chunk", { detail: data }));
        });

        socket.on("backstory:complete", () => {
          window.dispatchEvent(new CustomEvent("backstory:complete"));
        });

        socket.on("spritesheet:ready", (data: any) => {
          console.log("[SocketProvider] Sprite ready:", data.type);
          window.dispatchEvent(new CustomEvent("spritesheet:ready", { detail: data }));
        });

        socket.on("generation:status", (data: any) => {
          window.dispatchEvent(new CustomEvent("generation:status", { detail: data }));
        });

        socket.on("generation:progress", (data: any) => {
          window.dispatchEvent(new CustomEvent("generation:progress", { detail: data }));
        });

        socket.on("generation:error", (data: any) => {
          window.dispatchEvent(new CustomEvent("generation:error", { detail: data }));
        });

        socket.on("dungeon:pregenerated", () => {
          console.log("[SocketProvider] Dungeon pre-generated");
          window.dispatchEvent(new CustomEvent("dungeon:pregenerated"));
        });

        socket.on("room:image:ready", (data: any) => {
          console.log("[SocketProvider] Room image ready:", data.roomType);
          window.dispatchEvent(new CustomEvent("room:image:ready", { detail: data }));
        });

        // Animation events
        socket.on("player:anim", (data: any) => {
          console.log("[SocketProvider] Player anim:", data.anim);
          window.dispatchEvent(new CustomEvent("player:anim", { detail: data }));
        });

        socket.on("player:moved", (data: any) => {
          window.dispatchEvent(new CustomEvent("player:moved", { detail: data }));
        });

        socket.on("entity:anim", (data: any) => {
          window.dispatchEvent(new CustomEvent("entity:anim", { detail: data }));
        });

        socket.on("room:change", (data: any) => {
          window.dispatchEvent(new CustomEvent("room:change", { detail: data }));
        });

        socket.on("connect", () => {
          console.log("[SocketProvider] Socket connected");
          setConnected(true);
        });

        socket.on("disconnect", (reason) => {
          console.log("[SocketProvider] Socket disconnected:", reason);
          setConnected(false);
        });

        console.log("[SocketProvider] Socket ready, id:", socket.id);
      } catch (err) {
        console.error("[SocketProvider] Init error:", err);
      }
    };

    init();

    // No cleanup - socket stays alive forever
  }, [setConnected, addMessage, setIsLoading]);

  return <>{children}</>;
}
