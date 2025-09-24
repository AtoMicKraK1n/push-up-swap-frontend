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

  const nextMilestone = useMemo(() => 10 - (count % 10 || 10), [count]);
  const pct = useMemo(() => ((count % 10) / 10) * 100, [count]);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, onMilestone]);

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
        </div>
      </CardContent>
    </Card>
  );
}