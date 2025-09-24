import { NextResponse } from "next/server";

// Simple 0x proxy for Monad (chainId 10143)
// Supports both price (no takerAddress) and quote (with takerAddress)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const chainId = searchParams.get("chainId") || "10143"; // Monad
    const sellToken = searchParams.get("sellToken");
    const buyToken = searchParams.get("buyToken");
    const takerAddress = searchParams.get("takerAddress") || "";

    // amount handling: accept either sellAmount (wei) or amount (decimal) + decimals
    const sellAmountRaw = searchParams.get("sellAmount"); // base units
    const amountDecimal = searchParams.get("amount"); // human units
    const decimalsParam = searchParams.get("decimals");
    const slippageBps = searchParams.get("slippageBps") || "50"; // 0.50%

    if (!sellToken || !buyToken) {
      return NextResponse.json({ ok: false, error: "sellToken and buyToken are required" }, { status: 400 });
    }

    let sellAmount = sellAmountRaw;
    if (!sellAmount) {
      // Convert amount (decimal) to base units using provided decimals or default 18
      const decimals = Number(decimalsParam ?? 18);
      if (!amountDecimal) {
        // default to 1 token worth if nothing provided
        sellAmount = BigInt(10 ** Math.min(decimals, 18)).toString();
      } else {
        const [whole, frac = ""] = amountDecimal.split(".");
        const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
        const num = BigInt(whole || "0");
        const fracNum = BigInt(fracPadded || "0");
        const base = BigInt(10) ** BigInt(decimals);
        sellAmount = (num * base + fracNum).toString();
      }
    }

    const isQuote = !!takerAddress;
    const endpoint = isQuote ? "quote" : "price";

    const qs = new URLSearchParams({
      chainId,
      sellToken,
      buyToken,
      sellAmount: sellAmount!,
    });
    if (isQuote) {
      qs.set("takerAddress", takerAddress);
      qs.set("slippageBps", slippageBps);
    }

    const url = `https://api.0x.org/swap/v1/${endpoint}?${qs.toString()}`;
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data?.validationErrors?.[0]?.reason || data?.reason || "0x error", details: data }, { status: res.status });
    }

    return NextResponse.json({ ok: true, endpoint, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}