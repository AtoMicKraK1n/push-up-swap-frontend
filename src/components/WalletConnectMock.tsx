"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type WalletConnectMockProps = {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
};

export default function WalletConnectMock({ onConnect, onDisconnect }: WalletConnectMockProps) {
  const [address, setAddress] = useState<string | null>("0xDEMO000000000000000000000000000000000001");
  const connected = Boolean(address);

  const handleToggle = () => {
    if (connected) {
      setAddress(null);
      onDisconnect?.();
    } else {
      const a = "0xDEMO000000000000000000000000000000000001";
      setAddress(a);
      onConnect?.(a);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Badge variant="secondary">Network: Monad (mock)</Badge>
      {connected ? (
        <span className="text-sm text-muted-foreground">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Disconnected</span>
      )}
      <Button size="sm" onClick={handleToggle}>{connected ? "Disconnect" : "Connect Wallet"}</Button>
    </div>
  );
}