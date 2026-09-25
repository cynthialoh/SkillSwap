# SkillSwap — Detailed Implementation Plan

Source: `SkillSwap — Product Requirements Document (PRD).md`
Roles: **Group 1: Members (Learners/Teachers, unified)** | **Group 2: Admins (operators, no exchange)**
Tagline: Your Skills Are Currency.
Core loop: Profile → Add Skills → Find Matches → Request → Chat → Schedule → Exchange → Credits → Review → Repeat
North-star metric: meaningful completed exchanges.

---

## 0. Architectural Decisions (locked for MVP)

### 0.1 Stack choice — recommended
**Full-stack TypeScript monorepo: Next.js 14+ (App Router) + Tailwind + shadcn/ui + Prisma + PostgreSQL + Clerk Auth, deployed on Vercel. Realtime via Supabase Realtime (or Pusher). Storage via Supabase Storage / S3.**

Why this for a beginner:
- One repo, one language, one deploy (`/`, `/matches`, `/messages`, `/admin` in same app).
- Auth + RBAC out of box (Clerk `publicMetadata.role: member|admin`), no custom password handling.
- Postgres + Prisma gives credit ledger integrity (transactions).
- Vercel preview per PR + GitHub Actions CI = easy review.
- Upgrade path: matching v1 SQL → v2 scored → v3 ML without rewrite.

Alternatives considered:
- React+Vite + Express separate: more DevOps, slower for solo beginner. Rejected for MVP.
- Firebase-only: fast but credit ledger + complex queries + admin audit weaker. Rejected.
- Flutter/React Native first: PRD is discovery-heavy, web-first validates faster. Mobile later via PWA → native.

### 0.2 Repo structure
```
SkillSwap/
  PRD.md
  IMPLEMENTATION_PLAN.md
  app/
    (member)/page.tsx            # Member Home §17a
    (member)/matches/            # §8
    (member)/browse/             # §9
    (member)/requests/           # §10
    (member)/messages/[id]/      # §10 chat
    (member)/schedule/           # §10
    (member)/credits/            # §11
    (member)/profile/[id]/       # §14a
    admin/
      page.tsx                   # §17b dashboard
      users/ verifications/ reports/ categories/ credits/ metrics/
    api/
      matches/ requests/ messages/ credits/ reviews/ admin/.../
  prisma/schema.prisma
  components/ui/ (shadcn) + skillswap/ (SkillBadge, MatchCard, CreditPill, TrustBadge)
  lib/matching.ts credits.ts auth.ts notifications.ts
  e2e/ + __tests__/
```

### 0.3 Auth & RBAC
- Clerk (or Supabase Auth). `role` in JWT. Middleware:
  - `/admin/*` → `role==admin` else 403 + audit log.
  - `/api/admin/*` → server-side role check, never client-only.
- Admins created by invite only, no self-register. Seed one `super-admin` via CLI.
- Members: email + OAuth (Google). Explore-before-signup allowed for browse (read-only).

### 0.4 Data model (MVP tables)
`User(id, role member|admin, name, bio, avatar, location, availability JSON, prefs online|inperson|either, identityStatus, createdAt)`
`Skill(id, name, categoryId)`
`Category(id, name, icon)`
`UserTeach(userId, skillId, level, mode)`
`UserLearn(userId, skillId, mode)`
`MatchCache(userA, userB, skillAtoB, skillBtoA, score, createdAt)`
`SwapRequest(id, from, to, type direct|credit, offeredSkill, requestedSkill, hours, status pending|accepted|declined|cancelled, createdAt)`
`Conversation(id, requestId)` + `Message(id, conversationId, senderId, body, createdAt)`
`Session(id, requestId, startsAt, endsAt, mode, status scheduled|completed|no_show|cancelled)`
`CreditLedger(id, userId, delta +/-, reason taught|learned|adjustment|dispute, sessionId?, adminId?, createdAt)` — balance = SUM(delta). Immutable, no updates, only compensating entries.
`Review(id, sessionId, reviewerId, revieweeId, rating 1-5, text, createdAt)`
`Verification(id, userId, type identity|skill, evidenceUrl, status, reviewerAdminId)`
`Report(id, reporterId, reportedId, reason, status, resolverAdminId)`
`Notification(id, userId, type, payload JSON, readAt)`
`AuditLog(id, adminId, action, target, meta, createdAt)`

Key invariants:
- 1 hour taught = +1 credit, 1 hour learned = -1 credit. MVP allows negative? No — require balance >= hours for credit swaps. Direct swaps need no credits.
- Session completion requires both sides confirm OR one confirm + 48h timeout → auto-complete + credits settle.
- Reviews only after completed session, one per direction.

### 0.5 Matching v1 (rule-based, explainable)
Score = 40*mutual_overlap + 20*one_way + 10*same_mode + 10*availability_overlap + 10*rating + 10*verified. Mutual_overlap = A.teaches ∩ B.learns AND B.teaches ∩ A.learns.
Store top 50/user in `MatchCache`, recompute on profile edit + nightly cron. UI shows "Photography ↔ Excel + reason chips".

### 0.6 Non-functionals
- PWA responsive mobile-first (PRD is mobile discovery). WCAG AA, i18n-ready (en first).
- GDPR: export/delete account, consent for verification docs. PII encrypted at rest.
- Observability: Sentry + PostHog (events: signup, match_view, request_sent, session_completed). Success dashboard = §24 metrics.
- CI: lint + typecheck + unit + e2e (Playwright critical path) on every PR. Branch protection on `main`.

---

## 1. Design System (Phase 1 — before features)

Tokens (`tailwind.config.ts` + CSS vars):
- Colors: Primary Trust Blue `#2563EB`, Secondary Growth Teal `#0D9488`, Accent Currency Amber `#F59E0B` (credits only), Ink `#0F172A`, Paper `#FFFFFF`, Muted `#F8FAFC`, Success `#16A34A`, Danger `#DC2626`.
- Type: Inter, scale 12/14/16/20/24/32, line-height 1.5. Headings semibold.
- Radius 12px cards, 999px pills. Shadows sm/md. Spacing 4pt.
- Trust badges: `✓ Identity Verified (blue)`, `✓ Skill Verified (teal)`, `⭐ Highly Rated ≥4.7`, `🔄 N exchanges`.

Component inventory (shadcn base + custom):
`Button, Input, Select, Dialog, Tabs, Avatar, Badge, Card, Toast, EmptyState` + `SkillBadge, MatchCard (You↔Sarah + Request SkillSwap CTA), CreditPill (🪙 14), TrustBadgeRow, AvailabilityPicker, ModeToggle (Online/In-person/Either), RequestTimeline (Discover→Review), AdminTable, ModerationQueueItem`.

Screens to prototype in Figma (or v0) first: Member Home §17a, Browse, Match detail, Request flow, Chat, Schedule, Credits, Profile §14a, Admin Dashboard §17b, Verification queue, Report queue.
Acceptance: Storybook/Chromatic with all states (loading/empty/error), Axe pass, mobile 360px + desktop 1280px.

---

## 2. Phased Build

### Phase 0 — Foundations (0.5 week)
- Init Next.js+TS+Tailwind+shadcn, ESLint/Prettier, Prisma + Postgres (Neon/Supabase), Clerk, Sentry/PostHog, GitHub Actions.
- Env: `DATABASE_URL, CLERK_*, STORAGE_*`. Seed categories/skills (§7) + demo users Chiaka/David (§22).
- Done when: `pnpm dev` runs, `/health` 200, preview deploy works.

### Phase 1 — Design System + Clickable Prototype (1 week)
- Build tokens + 15 components above. Prototype 11 screens with mock data, no backend.
- Done when: stakeholder clicks Home→Match→Request→Chat→Schedule on mobile + desktop, a11y pass.

### Phase 2 — Auth, Roles, Profiles, Onboarding (§4, §5, §6, §14) (1 week)
- Member signup → Teach/Learn picker → Skill Profile. Explore-before-signup for browse.
- Admin invite-only, `/admin` guard + audit.
- APIs: `POST /api/profile, /api/teach, /api/learn`, `GET /api/me`.
- Done when: new member creates Teach=Excel Learn=Photography; non-admin blocked from `/admin` (test).

### Phase 3 — Categories, Browse/Search (§7, §9) (0.5 week)
- Category CRUD (admin), full-text search (Postgres `tsvector`), filters: skill, mode, location, rating.
- Done when: search "photography" finds Sarah; filter in-person Cairo works.

### Phase 4 — Smart Matching (§8) (0.5–1 week)
- Implement scoring §0.5 + `MatchCache` + `/api/matches` + MatchCard UI with reasons.
- Done when: Chiaka (Sales→Photography) sees David (Photography→Sales) as top mutual match with score breakdown.

### Phase 5 — Exchange Flow: Request→Chat→Schedule (§10, §16) (1.5 weeks)
- SwapRequest state machine, Conversation/Message (polling → Realtime), Session scheduler with timezone + reminders.
- Modes online/in-person/either per skill.
- Done when: e2e Discover→Request→Accept→Chat→Schedule→Complete passes in Playwright.

### Phase 6 — Credits + Direct Swap (§11, §12) (0.5 week)
- Ledger (§0.4), balance pill, direct vs credit toggle at request time, settlement on session complete, dispute adjustment (admin only).
- Done when: teach 2h → +2; learn 2h → -2; insufficient balance blocks credit swap; direct swap needs 0 balance.

### Phase 7 — Reviews, Verification Basic, Trust (§14, §15) (0.5 week)
- Post-session dual review, rating avg, exchange count, TrustBadgeRow. Identity upload + admin approve/reject. Report/Block.
- Done when: after session both can review once; blocked user cannot message; verified badge shows.

### Phase 8 — Admin MVP (§17b, §15b, §19 admin) (1 week)
- Dashboard: pending verifications, open reports, growth/completions, credit disputes, flagged reviews.
- Queues: users suspend/ban, verification approve, report resolve, category CRUD, ledger view+adjust (with reason + audit).
- Done when: admin resolves report → user suspended → audit log entry; credit adjust reflects with adminId.

### Phase 9 — Notifications, Home Personalization (§17a, §19) (0.5 week)
- Member events: match, request, accepted, message, upcoming/reminder, credit earned, review request. Admin events: verification, report, dispute.
- In-app bell + email (Resend) + push (PWA). Home sections: Matches, Learn New, Want Your Skills, Credits, Upcoming, Explore.
- Done when: request triggers push+email <60s; bell marks read.

### Phase 10 — Hardening, Metrics, Launch (1 week)
- Rate-limit, abuse caps, PII redaction, backups, load test matching cron, seed demo.
- Analytics dashboard maps to §24: users, completed swaps, repeat rate, credits earned/used, retention, avg/user, ratings, verified %.
- UAT with 10–20 real pairs doing 1h exchanges. Launch private beta.
- Done when: north-star (completed exchanges) tracked + 80% e2e pass + zero P0.

### Phase 11 — Post-MVP (deferred per PRD §25 Later)
Paid sessions + commission, premium, promoted, community feed (§18), advanced verification, business accounts, partnerships, ML recommendations.

---

## 3. MVP Acceptance Checklist (maps to PRD §25)
Member: register, profile, Teach/Learn, categories, discovery, matching, browse/search, requests, messaging, scheduling, credits, tracking, ratings, basic verification, mode pref.
Admin: secure login+roles, user suspend/ban, verification queue, report queue, category CRUD, ledger+dispute, metrics.
All guarded by tests + audit.

## 4. Risks
OneDrive + git sync conflicts → recommend moving repo to `C:\Projects\SkillSwap` or pause OneDrive for `.git/`. Placeholder filenames (em-dash) → rename PRD to `PRD.md`. Credit gaming → require session confirm + rate limits. Safety → verification + block + admin SLA <24h.

## 5. Next action
Approve stack (§0.1) → I scaffold Phase 0 in this repo on branch `chore/scaffold`, PR with health check + seed.
