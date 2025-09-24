"use client";

// remove unused React hooks
import WalletConnectMock from "@/components/WalletConnectMock";
import PushupTracker from "@/components/PushupTracker";
import SwapExecutor from "@/components/SwapExecutor";

export default function Home() {
  const userId = "demo";
  const headerSubtitle = "Do 10 push-ups, then swap MONAD to USDC";

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

        {/* Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PushupTracker userId={userId} />
          <SwapExecutor userId={userId} />
        </div>
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