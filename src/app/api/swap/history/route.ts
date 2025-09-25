import { NextResponse } from "next/server";
import { getSwapHistory, addSwapRecord } from "@/lib/mockDB";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "demo";
  const history = getSwapHistory(userId);
  return NextResponse.json({ ok: true, history });
}

// Append a swap record after a successful on-chain tx
// Body: { userId?: string, monadAmount: number, usdcAmount: number, rate: number, txHash: string }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = (body.userId as string) || "demo";
    const monadAmount = Number(body.monadAmount);
    const usdcAmount = Number(body.usdcAmount);
    const rate = Number(body.rate);
    const txHash = String(body.txHash || "");

    if (!Number.isFinite(monadAmount) || monadAmount <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid monadAmount" }, { status: 400 });
    }
    if (!Number.isFinite(usdcAmount) || usdcAmount <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid usdcAmount" }, { status: 400 });
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid rate" }, { status: 400 });
    }
    if (!txHash || !txHash.startsWith("0x")) {
      return NextResponse.json({ ok: false, error: "Invalid txHash" }, { status: 400 });
    }

    const rec = addSwapRecord({ userId, monadAmount, usdcAmount, rate, txHash });
    return NextResponse.json({ ok: true, record: rec });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}