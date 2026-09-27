# SkillSwap — Implementation Plan (Simple Version)

**PRD in 5 lines:**
- SkillSwap = teach what you know, learn what you want.
- 2 users only: **Members** (teach + learn) and **Admins** (manage platform).
- Core loop: Profile → Match → Request → Chat → Schedule → Exchange → Credits → Review.
- Credits: 1 hour taught = +1 credit. 1 hour learned = -1 credit.
- Success = number of completed exchanges.

---

## 1. Architectural Decisions (Tables)

### Table 1 — Main Stack (what we build with)

| Decision | Choice | Why (simple) | Other options we said No to |
|---|---|---|---|
| Website framework | Next.js 14 + TypeScript | One repo for Members + Admin, easy to deploy, one language | React+Vite + separate backend = too much work for beginner |
| Language | TypeScript | Catches errors early | JavaScript alone = more bugs |
| Styling | Tailwind CSS + shadcn/ui | Fast, clean, ready components | Plain CSS = slow |
| Backend | Next.js API routes (same repo) | No second server to manage | Express separate server = extra hosting |
| Database | PostgreSQL (Neon/Supabase) + Prisma | Safe for money-like credits, easy tables | Firebase = weak for credits/audit |
| Login/Auth | Clerk | Login, Google OAuth, roles out of box | Build own passwords = unsafe |
| Roles | `member` vs `admin` in login token | Admin pages blocked server-side | Client-only check = hackable |
| Hosting | Vercel | Push to GitHub = auto live link, free preview per change | Manual VPS = hard |
| Chat realtime | Supabase Realtime (start with refresh, upgrade later) | Simple, works with Postgres | Pusher = extra cost |
| File uploads | Supabase Storage (avatars, ID docs) | Same account as DB | AWS S3 direct = harder setup |
| Testing | Vitest + Playwright | Unit + click-through test | No tests = break credits |
| Tracking | PostHog + Sentry | See what users do + catch crashes | No tracking = blind |

### Table 2 — Where code lives

| Folder | What is inside | Who uses it |
|---|---|---|
| `app/(member)/` | Home, Matches, Browse, Requests, Messages, Schedule, Credits, Profile | Members |
| `app/admin/` | Dashboard, Users, Verifications, Reports, Categories, Credits, Metrics | Admins only |
| `app/api/` | matches, requests, messages, credits, reviews, admin/... | Both (phonebook for frontend) |
| `prisma/` | Database tables | Developer |
| `components/` | Buttons + SkillBadge, MatchCard, CreditPill, TrustBadge | Both |
| `lib/` | matching.ts, credits.ts, auth.ts, notifications.ts | Developer |

### Table 3 — Login rules

| User | How created | Can do | Cannot do |
|---|---|---|---|
| Member | Self signup (email/Google) | Teach/learn, match, chat, earn credits | Open `/admin` |
| Admin | Invited by another admin only | Verify users, ban, edit categories, fix credits, see metrics | Have Teach/Learn skills, earn credits |

Rule: `/admin/*` and `/api/admin/*` check role on server. Fail = 403 + log.

### Table 4 — Database (simple)

| Table | Stores | Example |
|---|---|---|
| User | people + role | Chiaka, member |
| Category, Skill | skills list | Photography, Excel |
| UserTeach / UserLearn | who teaches/learns what | Chiaka teaches Sales |
| SwapRequest | request to exchange | Chiaka → David, 1h Sales ↔ Photography |
| Conversation, Message | chat | "Hi, free Friday?" |
| Session | meeting time | Fri 5pm, online |
| CreditLedger | credit history (never edit, only add) | +1 taught, -1 learned |
| Review | stars after session | 5 stars |
| Verification, Report | ID check, abuse report | passport.jpg, spam |
| Notification, AuditLog | alerts, admin actions | "New match", "Admin banned X" |

Rules:
- Balance = sum of ledger. No negative for credit swaps.
- Session needs both confirm (or 1 + 48h timeout).
- Review only after completed session, once per side.

### Table 5 — Matching v1 (simple points)

| Points | When |
|---|---|
| 40 | Mutual: A teaches what B wants AND B teaches what A wants |
| 20 | One-way only |
| 10 | Same mode (both online) |
| 10 | Availability overlaps |
| 10 | High rating ≥4.7 |
| 10 | Verified |

Top 50 saved per user, recompute on profile edit + nightly.

---

## 2. Design System (Phase 1 — do before features)

### Colors

| Name | Code | Use |
|---|---|---|
| Trust Blue | #2563EB | Buttons, links |
| Growth Teal | #0D9488 | Verified, success |
| Currency Amber | #F59E0B | Credits only |
| Ink | #0F172A | Text |
| Paper | #FFFFFF | Background |
| Muted | #F8FAFC | Cards |
| Danger | #DC2626 | Ban, errors |

Font: Inter. Sizes 12/14/16/20/24/32. Radius 12px cards, pill buttons. Mobile 360px first, desktop 1280px.

### Components to build

| Component | Use |
|---|---|
| SkillBadge, MatchCard (You↔Sarah + Request button) | Matching |
| CreditPill 🪙14 | Credits |
| TrustBadgeRow ✓ Identity, ✓ Skill, ⭐, 🔄 | Trust |
| AvailabilityPicker, ModeToggle | Scheduling |
| RequestTimeline | Discover→Review steps |
| AdminTable, QueueItem | Admin |

Done when: all screens clickable with fake data, no backend yet.

---

## 3. Build Phases (in order)

| Phase | Name | Time | PRD | Done when |
|---|---|---|---|---|
| 0 | Foundations | 3 days | — | `pnpm dev` runs, DB connected, deploy preview live |
| 1 | Design System + Prototype | 1 week | §14, §17 | 11 screens clickable mobile+desktop |
| 2 | Auth + Profiles + Onboarding | 1 week | §4,§5,§6,§14 | Member creates Teach=Excel/Learn=Photo; non-admin blocked from /admin |
| 3 | Categories + Browse/Search | 3 days | §7,§9 | Search "photo" finds Sarah |
| 4 | Smart Matching | 4 days | §8 | Chiaka↔David mutual on top with reason |
| 5 | Request→Chat→Schedule | 1.5 weeks | §10,§16 | Playwright e2e Discover→Complete passes |
| 6 | Credits (Direct vs Credit) | 3 days | §11,§12 | Teach 2h=+2, learn 2h=-2, no negative |
| 7 | Reviews + Verification + Safety | 3 days | §14,§15 | Review once, block stops chat, badge shows |
| 8 | Admin MVP | 1 week | §15b,§17b | Ban/verify/category/credit-fix + audit log |
| 9 | Notifications + Home | 3 days | §17a,§19 | Request → bell+email <60s |
| 10 | Harden + Launch beta | 1 week | §24 | 10 real pairs do 1h exchange, metrics live |
| 11 | Later (not MVP) | — | §13,§18,§20 | Paid, premium, feed, business |

Details per phase in previous version — ask if you want any phase expanded to daily tasks.

---

## 4. What to do next
Approve Table 1 → I scaffold Phase 0 on branch `chore/scaffold` (Next.js+Prisma+Clerk+CI+seed Chiaka/David).
