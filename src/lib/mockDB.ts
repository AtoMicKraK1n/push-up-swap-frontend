// Simple in-memory mock database for demo purposes
export type UserStats = {
  id: string;
  address: string;
  pushups: number;
  monadBalance: number;
  usdcBalance: number;
};

export type SwapRecord = {
  id: number;
  userId: string;
  timestamp: number;
  monadAmount: number;
  usdcAmount: number;
  rate: number; // USDC per MONAD
  txHash: string;
};

const state: {
  users: Record<string, UserStats>;
  swaps: SwapRecord[];
  nextSwapId: number;
  rate: number;
} = {
  users: {
    demo: {
      id: "demo",
      address: "0xDEMO000000000000000000000000000000000001",
      pushups: 0,
      monadBalance: 5,
      usdcBalance: 20,
    },
  },
  swaps: [],
  nextSwapId: 1,
  rate: 1.25, // 1 MONAD = 1.25 USDC (mock)
};

function randomTxHash() {
  const chars = "abcdef0123456789";
  let out = "0x";
  for (let i = 0; i < 64; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function getRate() {
  return state.rate;
}

export function getUser(userId: string = "demo"): UserStats {
  if (!state.users[userId]) {
    state.users[userId] = {
      id: userId,
      address: "0x" + userId.padEnd(40, "0"),
      pushups: 0,
      monadBalance: 0,
      usdcBalance: 0,
    };
  }
  return state.users[userId];
}

export function getUserStats(userId: string = "demo") {
  const user = getUser(userId);
  return { ...user };
}

export function getSwapHistory(userId: string = "demo") {
  return state.swaps.filter((s) => s.userId === userId).slice().reverse();
}

// Add pushups milestone, trigger swap of 1 MONAD -> USDC per 10 pushups milestone
export function addMilestone({ userId = "demo", pushupsDelta = 10 }: { userId?: string; pushupsDelta?: number }) {
  const user = getUser(userId);
  const prev = user.pushups;
  user.pushups += pushupsDelta;

  const prevMilestones = Math.floor(prev / 10);
  const newMilestones = Math.floor(user.pushups / 10);
  const milestonesTriggered = Math.max(0, newMilestones - prevMilestones);

  const performed: SwapRecord[] = [];
  for (let i = 0; i < milestonesTriggered; i++) {
    if (user.monadBalance <= 0) break;
    const mon = 1;
    const usdc = mon * state.rate;
    user.monadBalance -= mon;
    user.usdcBalance += usdc;
    const rec: SwapRecord = {
      id: state.nextSwapId++,
      userId,
      timestamp: Date.now(),
      monadAmount: mon,
      usdcAmount: usdc,
      rate: state.rate,
      txHash: randomTxHash(),
    };
    state.swaps.push(rec);
    performed.push(rec);
  }

  return {
    milestonesTriggered,
    swaps: performed,
    stats: { ...user },
  };
}