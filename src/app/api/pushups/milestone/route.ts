import { NextResponse } from "next/server";
import { addMilestone } from "@/lib/mockDB";
import { getSafeBlockNumber, getMonadRpcUrl } from "@/lib/rpc";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || "demo";
    const pushupsDelta = Number(body.pushupsDelta ?? 10);
    if (!Number.isFinite(pushupsDelta) || pushupsDelta <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid pushupsDelta" }, { status: 400 });
    }

    // Verify event (mock), log, and execute contract (mock)
    const result = addMilestone({ userId, pushupsDelta });

    // Access Monad RPC via ethers (Alchemy URL if provided) — no Ethereum fallback
    const monadBlockNumber = await getSafeBlockNumber();
    const rpcConfigured = Boolean(getMonadRpcUrl());

    return NextResponse.json({ ok: true, ...result, rpc: { rpcConfigured, monadBlockNumber } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}