// SkillSwap scoring v1 — same weights as IMPLEMENTATION_PLAN Table 5.
// Pure function: no DB, unit-testable. Used by GET /api/matches later.
export type ScoredUser = {
  id: string;
  name: string;
  teaches: string[];
  learns: string[];
  mode: "online" | "inperson" | "either";
  availability: string[];
  rating: number;
  verified: boolean;
};

export type Me = {
  teaches: string[];
  learns: string[];
  mode: "online" | "inperson" | "either";
  availability: string[];
};

export type MatchResult = {
  user: ScoredUser;
  score: number;
  reasons: string[];
  youTeach: string | null;
  youLearn: string | null;
};

function modeOverlap(a: Me["mode"], b: ScoredUser["mode"]): boolean {
  return a === "either" || b === "either" || a === b;
}

export function scoreMatch(me: Me, u: ScoredUser): MatchResult {
  const youTeach = me.teaches.find((s) => u.learns.includes(s)) ?? null;
  const youLearn = u.teaches.find((s) => me.learns.includes(s)) ?? null;
  let score = 0;
  const reasons: string[] = [];

  if (youTeach && youLearn) {
    score += 40;
    reasons.push("Mutual swap +40");
  } else if (youTeach || youLearn) {
    score += 20;
    reasons.push("One-way +20");
  }
  if (modeOverlap(me.mode, u.mode)) {
    score += 10;
    reasons.push("Same mode +10");
  }
  if (u.availability.some((a) => me.availability.includes(a))) {
    score += 10;
    reasons.push("Availability +10");
  }
  if (u.rating >= 4.7) {
    score += 10;
    reasons.push(`Rated ${u.rating} +10`);
  }
  if (u.verified) {
    score += 10;
    reasons.push("Verified +10");
  }
  return { user: u, score, reasons, youTeach, youLearn };
}

export function rankMatches(me: Me, users: ScoredUser[]): MatchResult[] {
  return users.map((u) => scoreMatch(me, u)).sort((a, b) => b.score - a.score);
}
