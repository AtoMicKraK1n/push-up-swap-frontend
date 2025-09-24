import { NextResponse } from "next/server";
import { getUserStats, getRate } from "@/lib/mockDB";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "demo";
  const stats = getUserStats(userId);
  return NextResponse.json({ ok: true, stats, rate: getRate() });
}