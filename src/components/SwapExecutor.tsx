"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SwapExecutor({ userId, onExecuted }: {
  userId: string;
  onExecuted?: () => void;
}) {
  const [manualMon, setManualMon] = useState<string>("1");
  const [sellToken, setSellToken] = useState<string>("MONAD");
  const [buyToken, setBuyToken] = useState<string>("USDC");
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [quoteError, setQuoteError] = useState<string>("");

  const mon = useMemo(() => {
    const n = Number(manualMon);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [manualMon]);

  const disabled = loading || mon <= 0;

  const getQuote = useCallback(async () => {
    setQuoting(true);
    setQuote(null);
    setQuoteError("");
    try {
      const params = new URLSearchParams({
        sellToken: sellToken.trim(),
        buyToken: buyToken.trim(),
        amount: String(manualMon || "1"),
        decimals: "18",
      });
      const res = await fetch(`/api/swap/quote?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to fetch quote");
      }
      setQuote(json.data);
    } catch (e: any) {
      setQuoteError(e?.message || "Unknown error");
    } finally {
      setQuoting(false);
    }
  }, [sellToken, buyToken, manualMon]);

  const triggerMilestone = useCallback(async () => {
    // Each milestone represents 10 push-ups and will attempt to swap in the backend
    setLoading(true);
    try {
      const res = await fetch(`/api/pushups/milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pushupsDelta: 10 }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to execute swap");
      onExecuted?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, onExecuted]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Swap MONAD → USDC</CardTitle>
        <CardDescription>
          Configure sell and buy tokens. Default sells 1 MONAD for USDC. Swaps trigger per 10 push-ups milestone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="sellToken">Sell Token</Label>
            <Input id="sellToken" value={sellToken} onChange={(e) => setSellToken(e.target.value)} placeholder="MONAD or 0x..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyToken">Buy Token</Label>
            <Input id="buyToken" value={buyToken} onChange={(e) => setBuyToken(e.target.value)} placeholder="USDC or 0x..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mon">Amount (sell)</Label>
            <Input id="mon" value={manualMon} onChange={(e) => setManualMon(e.target.value)} placeholder="1" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Button variant="secondary" className="w-full" onClick={getQuote} disabled={quoting || mon <= 0}>
              {quoting ? "Getting Quote..." : "Get Quote"}
            </Button>
            {quote && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Price source: 0x ({quote?.sources?.[0]?.name ?? "mixed"})</div>
                <div>Estimated buy amount (base units): {quote?.buyAmount}</div>
                {quote?.guaranteedPrice && <div>Guaranteed price: {quote.guaranteedPrice}</div>}
              </div>
            )}
            {quoteError && <div className="text-xs text-destructive">{quoteError}</div>}
          </div>
          <div className="space-y-2">
            <Button className="w-full" disabled={disabled} onClick={triggerMilestone}>
              Execute (trigger 1 milestone)
            </Button>
            <div className="text-xs text-muted-foreground">Executes 1 milestone (10 push-ups)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}