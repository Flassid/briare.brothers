"use client";

import { useGameStore } from "@/stores/gameStore";
import { LobbyScreen } from "@/components/screens/LobbyScreen";
import { CharacterCreationScreen } from "@/components/screens/CharacterCreationScreen";
import { GameScreen } from "@/components/screens/GameScreen";

export default function Home() {
  const { screen } = useGameStore();

  return (
    <main className="h-screen w-screen overflow-hidden bg-dungeon-gradient">
      {screen === "lobby" && <LobbyScreen />}
      {screen === "character-creation" && <CharacterCreationScreen />}
      {screen === "game" && <GameScreen />}
    </main>
  );
}
