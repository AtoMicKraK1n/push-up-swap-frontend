import { JsonRpcProvider } from "ethers";

// Prefer a direct Alchemy URL if you have one (e.g., via an Alchemy proxy/gateway for Monad)
// Set MONAD_ALCHEMY_RPC_URL to a full HTTPS RPC endpoint. We do not fabricate URLs.
// If not set, we fall back to MONAD_RPC_URL. No Ethereum fallback is ever used here.

export function getMonadRpcUrl(): string | null {
  const url = process.env.MONAD_ALCHEMY_RPC_URL || process.env.MONAD_RPC_URL || null;
  return url || null;
}

let cachedProvider: JsonRpcProvider | null = null;

export function getMonadProvider(): JsonRpcProvider | null {
  if (cachedProvider) return cachedProvider;
  const rpcUrl = getMonadRpcUrl();
  if (!rpcUrl) return null;
  cachedProvider = new JsonRpcProvider(rpcUrl, 10143); // Monad chainId
  return cachedProvider;
}

export async function getSafeBlockNumber(): Promise<number | null> {
  const provider = getMonadProvider();
  if (!provider) return null;
  try {
    const bn = await provider.getBlockNumber();
    return Number(bn);
  } catch {
    return null;
  }
}