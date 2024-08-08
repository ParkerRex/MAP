// src/app/health/SyncButton.tsx

"use client";

import { Button } from "@map/ui/button";
import { useState } from "react";

interface SyncButtonProps {
  onSync: () => Promise<void>;
}

export default function SyncButton({ onSync }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleClick = async () => {
    setIsSyncing(true);
    try {
      await onSync();
    } catch (error) {
      console.error("Error syncing data:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isSyncing}>
      {isSyncing ? "Syncing..." : "Sync Health Data"}
    </Button>
  );
}
