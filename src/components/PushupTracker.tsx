"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type PushupTrackerProps = {
  userId: string;
  onMilestone?: (result: { milestonesTriggered: number }) => void;
};

export default function PushupTracker({ userId, onMilestone }: PushupTrackerProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // Confirmation modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastSwap, setLastSwap] = useState<{
    monadAmount: number;
    usdcAmount: number;
    rate: number;
    txHash: string;
  } | null>(null);

  const nextMilestone = useMemo(() => 10 - (count % 10 || 10), [count]);
  const pct = useMemo(() => ((count % 10) / 10) * 100, [count]);

  // Attempt a real onchain tx (zero-value tx to self) to require wallet signature
  const tryOnchainTx = useCallback(async () => {
    const eth = (typeof window !== "undefined" && (window as any).ethereum) as any | undefined;
    if (!eth) return; // no injected wallet
    try {
      // Ensure we're on Monad (chainId 0x279f / 10143). If not, politely request a switch/add.
      let cid = await eth.request({ method: "eth_chainId" });
      if (String(cid).toLowerCase() !== "0x279f") {
        try {
          // Ask to switch first (user will see a wallet prompt)
          await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x279f" }] });
        } catch (switchErr: any) {
          // If chain is unknown (4902), add Monad testnet then switch
          if (switchErr?.code === 4902) {
            try {
              await eth.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x279f",
                    chainName: "Monad Testnet",
                    nativeCurrency: { name: "tMON", symbol: "tMON", decimals: 18 },
                    rpcUrls: ["https://testnet-rpc.monad.xyz/"],
                    blockExplorerUrls: ["https://testnet.monadscan.org"],
                  },
                ],
              });
              await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x279f" }] });
            } catch (addErr) {
              console.warn("User declined or failed to add/switch to Monad:", addErr);
              return; // hard-stop: no Ethereum involvement
            }
          } else {
            console.warn("User declined to switch to Monad:", switchErr);
            return; // hard-stop: no Ethereum involvement
          }
        }
        // re-check chain after switch
        cid = await eth.request({ method: "eth_chainId" });
        if (String(cid).toLowerCase() !== "0x279f") {
          console.warn("Still not on Monad after switch attempt. Current:", cid);
          return; // hard-stop
        }
      }

      const [from] = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      // Ensure the tx actually broadcasts and consumes gas on Monad:
      // - fetch gas price
      // - include minimal gas limit
      // - include a 1-byte data payload to avoid client optimizations
      const gasPrice = (await eth.request({ method: "eth_gasPrice" })) as string;
      const txHash = (await eth.request({
        method: "eth_sendTransaction",
        params: [
          {
            from,
            to: from,
            value: "0x0",
            data: "0x01",
            gas: "0x5208", // 21000
            gasPrice,
          },
        ],
      })) as string;

      setLastSwap((prev) => (prev ? { ...prev, txHash } : prev));
    } catch (err) {
      // If user rejects or no funds, just keep the backend-provided mock hash
      console.warn("Onchain tx skipped:", err);
    }
  }, []);

  const sendMilestone = useCallback(async (delta: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pushups/milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pushupsDelta: delta }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to send milestone");
      onMilestone?.({ milestonesTriggered: data.milestonesTriggered || 0 });

      // If backend executed swaps, show confirmation popup with the latest swap
      if (Array.isArray(data.swaps) && data.swaps.length > 0) {
        const s = data.swaps[data.swaps.length - 1];
        setLastSwap({
          monadAmount: s.monadAmount,
          usdcAmount: s.usdcAmount,
          rate: s.rate,
          txHash: s.txHash,
        });
        setShowConfirm(true);
        // Fire a real wallet signature + tx (zero-value) to demonstrate onchain action
        // This requires testnet gas on the currently selected network
        tryOnchainTx();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, onMilestone, tryOnchainTx]);

  const addPushup = async () => {
    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 10 === 0) {
      // Simulate ESP32 milestone event every 10 pushups
      await sendMilestone(10);
    }
  };

  const simulate10 = async () => {
    const base = count;
    setCount(base + 10);
    await sendMilestone(10);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push-up Tracker</CardTitle>
        <CardDescription>ESP32 mock: milestone sent to backend at every 10 push-ups.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-semibold">{count}</div>
          <div className="text-sm text-muted-foreground">push-ups</div>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="text-sm text-muted-foreground">{nextMilestone} to next milestone</div>
        <div className="flex gap-3">
          <Button onClick={addPushup} disabled={loading}>Do a push-up</Button>
          <Button variant="secondary" onClick={simulate10} disabled={loading}>+10 (simulate milestone)</Button>
          <Button variant="outline" onClick={tryOnchainTx} disabled={loading}>
            Sign test tx (Monad only)
          </Button>
        </div>

        {/* Confirmation Popup */}
        {showConfirm && lastSwap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
            {/* Modal */}
            <div className="relative z-10 w-[90%] max-w-md rounded-lg border bg-card p-5 shadow-xl">
              <div className="mb-2 text-lg font-semibold">Swap Executed</div>
              <div className="text-sm text-muted-foreground mb-4">Your milestone triggered an automatic swap.</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>From (MONAD)</span><span className="font-medium">{lastSwap.monadAmount}</span></div>
                <div className="flex justify-between"><span>To (USDC)</span><span className="font-medium">{lastSwap.usdcAmount}</span></div>
                <div className="flex justify-between"><span>Rate</span><span className="font-medium">{lastSwap.rate} USDC / MONAD</span></div>
                <div className="truncate"><span className="text-muted-foreground">Tx:</span> <span className="font-mono">{lastSwap.txHash}</span></div>
                {lastSwap.txHash && (
                  <a
                    href={`https://testnet.monadscan.org/tx/${lastSwap.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View on MonadScan
                  </a>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setShowConfirm(false)}>Got it</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}