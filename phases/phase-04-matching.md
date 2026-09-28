# Phase 4 — Smart Matching (4 days)

Goal: proactive recommendations.
PRD: §8

## Tasks (prototype: done in `matching.html` — cache/API need Next.js+Postgres)
- [x] Scoring: 40 mutual + 20 one-way + 10 mode + 10 availability + 10 rating + 10 verified (JS engine, same weights as plan Table 5)
- [ ] `MatchCache` table + nightly recompute + on profile edit — PENDING backend
- [ ] `GET /api/matches` — PENDING backend (prototype reads `onboarding.html` picks from browser)
- [x] MatchCard with reason chips + score breakdown + empty state

Done when: Chiaka↔David mutual on top with breakdown.
Next: Phase 5.
