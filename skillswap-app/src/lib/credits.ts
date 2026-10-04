// SkillSwap credits — 1 hour taught = +1, 1 hour learned = -1.
// Rules mirror the immutable CreditLedger: balance = SUM(delta).
// Direct swaps move 0 credits and need no balance.

export type LedgerEntry = {
  delta: number;
  reason: string;
};

export function balanceOf(ledger: LedgerEntry[]): number {
  return ledger.reduce((sum, e) => sum + e.delta, 0);
}

/** Can this user fund a credit swap of `hours`? */
export function canAfford(ledger: LedgerEntry[], hours: number): boolean {
  return balanceOf(ledger) >= hours;
}

/** Entries created when a session completes. Teacher +, learner -. */
export function settleSession(hours: number): { teacher: number; learner: number } {
  return { teacher: hours, learner: -hours };
}
