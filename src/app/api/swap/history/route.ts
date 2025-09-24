import { NextResponse } from "next/server";
import { getSwapHistory } from "@/lib/mockDB";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "demo";
  const history = getSwapHistory(userId);
  return NextResponse.json({ ok: true, history });
}