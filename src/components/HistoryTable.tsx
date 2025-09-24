"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type HistoryItem = {
  id: number;
  timestamp: number;
  monadAmount: number;
  usdcAmount: number;
  rate: number;
  txHash: string;
};

export default function HistoryTable({ userId, refreshKey }: { userId: string; refreshKey: number }) {
  const [rows, setRows] = useState<HistoryItem[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/swap/history?userId=${userId}`);
      const data = await res.json();
      if (!active) return;
      if (res.ok && data.ok) setRows(data.history || []);
    })();
    return () => { active = false; };
  }, [userId, refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Swap History</CardTitle>
        <CardDescription>Recent milestone-triggered MONAD → USDC swaps.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>MONAD</TableHead>
                <TableHead>USDC</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No swaps yet</TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>#{r.id}</TableCell>
                  <TableCell>{new Date(r.timestamp).toLocaleTimeString()}</TableCell>
                  <TableCell>{r.monadAmount.toFixed(4)}</TableCell>
                  <TableCell>{r.usdcAmount.toFixed(4)}</TableCell>
                  <TableCell>{r.rate.toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-xs">{r.txHash.slice(0, 10)}…{r.txHash.slice(-6)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}