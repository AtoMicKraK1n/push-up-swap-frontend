"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type WalletConnectMockProps = {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
};

// Prefer Phantom's injected EIP-1193 provider if present, else fallback to generic window.ethereum
function getInjectedProvider(): any | null {
  if (typeof window === "undefined") return null;
  const phantom = (window as any)?.phantom?.ethereum || (window as any)?.phantom?.solana; // phantom may expose .ethereum for EVM
  if (phantom && (phantom as any).isPhantom) return phantom;
  const ethereum = (window as any)?.ethereum;
  return ethereum || null;
}

export default function WalletConnectMock({ onConnect, onDisconnect }: WalletConnectMockProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState<boolean>(false);

  const provider = getInjectedProvider();

  useEffect(() => {
    setHasProvider(Boolean(provider));
    if (!provider) return;

    // Identify wallet name heuristically
    const name = (provider.isPhantom && "Phantom") || (provider.isMetaMask && "MetaMask") || provider?.name || "Injected";
    setWalletName(name);

    // Initialize chainId
    (async () => {
      try {
        const cid = await provider.request?.({ method: "eth_chainId" });
        if (cid) setChainId(String(cid));
        const accounts: string[] = await provider.request?.({ method: "eth_accounts" });
        if (accounts && accounts[0]) setAddress(accounts[0]);
      } catch {}
    })();

    const handleAccountsChanged = (accounts: string[]) => {
      const a = accounts?.[0] ?? null;
      setAddress(a);
      if (!a) onDisconnect?.();
    };
    const handleChainChanged = (cid: string) => {
      setChainId(String(cid));
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const connected = Boolean(address);

  const connect = async () => {
    if (!provider) return;
    try {
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      const a = accounts?.[0] ?? null;
      setAddress(a);
      if (a) onConnect?.(a);
      const cid = await provider.request({ method: "eth_chainId" });
      if (cid) setChainId(String(cid));
    } catch (e) {
      // ignore
    }
  };

  const disconnect = async () => {
    // Injected providers usually don't support programmatic disconnect; we just clear local state
    setAddress(null);
    onDisconnect?.();
  };

  const short = (a?: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

  return (
    <div className="flex items-center gap-3">
      <Badge variant="secondary">
        {hasProvider ? (
          <span>
            {walletName ? `${walletName} • ` : ""}
            {chainId ? `Chain ${chainId}` : "Unknown chain"}
          </span>
        ) : (
          <span>No EVM provider detected</span>
        )}
      </Badge>
      {connected ? (
        <span className="text-sm text-muted-foreground">{short(address)}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Disconnected</span>
      )}
      {connected ? (
        <Button size="sm" onClick={disconnect}>Disconnect</Button>
      ) : (
        <Button size="sm" onClick={connect} disabled={!hasProvider}>Connect Wallet</Button>
      )}
    </div>
  );
}