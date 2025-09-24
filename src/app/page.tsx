"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WalletConnectMock from "@/components/WalletConnectMock";
import PushupTracker from "@/components/PushupTracker";
import SwapExecutor from "@/components/SwapExecutor";
import HistoryTable from "@/components/HistoryTable";

type Stats = {
  id: string;
  address: string;
  pushups: number;
  monadBalance: number;
  usdcBalance: number;
};

export default function Home() {
  const [userId] = useState<string>("demo");
  const [stats, setStats] = useState<Stats | null>(null);
  const [rate, setRate] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/stats?userId=${userId}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setStats(data.stats);
        setRate(data.rate ?? 1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const headerSubtitle = useMemo(() => {
    return "Push-ups → Milestone → MONAD → USDC (mock flow)";
  }, []);

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
    load();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-background/80 text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Pushup-to-Earn Dashboard</h1>
            <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
          </div>
          <WalletConnectMock />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Push-ups</CardTitle>
              <CardDescription>Total counted (mock)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats?.pushups ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>MONAD</CardTitle>
              <CardDescription>Wallet balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{(stats?.monadBalance ?? 0).toFixed(4)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>USDC</CardTitle>
              <CardDescription>Wallet balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{(stats?.usdcBalance ?? 0).toFixed(4)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PushupTracker userId={userId} onMilestone={() => triggerRefresh()} />
          <SwapExecutor
            userId={userId}
            rate={rate}
            monadBalance={stats?.monadBalance ?? 0}
            onExecuted={() => triggerRefresh()}
          />
        </div>

        {/* Rate + Refresh */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Current mock rate: 1 MONAD = {rate.toFixed(2)} USDC</p>
          <Button size="sm" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</Button>
        </div>

        {/* History */}
        <HistoryTable userId={userId} refreshKey={refreshKey} />
      </div>

      {/* Background visual (unsplash) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06] bg-cover bg-center"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1600&auto=format&fit=crop)" }}
      />
    </div>
  );
}