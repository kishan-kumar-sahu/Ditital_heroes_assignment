import { Subscription, Score } from "../models/index.js";
import { money } from "./security.js";
export async function activeSubs() {
  return Subscription.find({ status: "active" }).lean();
}
export async function prizePool() {
  const subs = await activeSubs();
  return money(subs.reduce((a, s) => a + s.amount * 0.5, 0));
}
export function drawNumbers(seed) {
  const a = Array.from({ length: 20 }, (_, i) => i + 1);
  let x = seed || Date.now();
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, 5).sort((a, b) => a - b);
}
export async function ticket(uid) {
  const scores = await Score.find({ userId: uid })
    .sort({ date: -1 })
    .limit(5)
    .lean();
  return scores
    .map((s) => Math.min(20, Math.max(1, Math.round(s.score / 2.25))))
    .sort((a, b) => a - b);
}
export async function simulate(mode) {
  const subs = await activeSubs();
  const win = drawNumbers();
  const rows = [];
  for (const s of subs) {
    const t = await ticket(s.userId);
    if (t.length === 5) {
      const matches = t.filter((n) => win.includes(n)).length;
      if (matches >= 3) rows.push({ userId: s.userId, matches });
    }
  }
  const pool = await prizePool(),
    tiers = {};
  for (const m of [5, 4, 3]) {
    const ws = rows.filter((r) => r.matches === m);
    const p = money(pool * { 5: 0.4, 4: 0.35, 3: 0.25 }[m]);
    tiers[m] = {
      winnerCount: ws.length,
      pool: p,
      perWinner: ws.length ? money(p / ws.length) : 0,
    };
  }
  return {
    winningNumbers: win,
    mode,
    pool,
    tiers,
    eligible: subs.length,
    generatedAt: new Date().toISOString(),
    rows,
  };
}
