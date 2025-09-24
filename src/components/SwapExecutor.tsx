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
  const [loading, setLoading] = useState(false);

  const mon = useMemo(() => {
    const n = Number(manualMon);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [manualMon]);

  const disabled = loading || mon <= 0;

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
          Swaps are triggered per 10 push-ups milestone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="mon">MONAD</Label>
            <Input id="mon" value={manualMon} onChange={(e) => setManualMon(e.target.value)} placeholder="1" />
          </div>
          <div className="space-y-2">
            <Label className="invisible">Execute</Label>
            <Button className="w-full" disabled={disabled} onClick={triggerMilestone}>
              Execute (trigger 1 milestone)
            </Button>
            <div className="text-xs text-muted-foreground">Executes 1 milestone</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}