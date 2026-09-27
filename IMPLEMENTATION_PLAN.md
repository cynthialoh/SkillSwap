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

Overview:

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

---

### Phase 0 — Foundations (3 days)
| Item | Detail |
|---|---|
| Goal | Running app + DB + deploy |
| Build | Next.js+TS+Tailwind+shadcn, Prisma+Postgres, Clerk, Sentry/PostHog, GitHub Actions, seed categories + Chiaka/David |
| PRD | — |
| Done when | `pnpm dev` works, `/health` 200, Vercel preview live |

### Phase 1 — Design System + Prototype (1 week)
| Item | Detail |
|---|---|
| Goal | Look + click before code |
| Build | Tokens, 15 components (§2 tables), 11 screens: Member Home, Browse, Match, Request, Chat, Schedule, Credits, Profile, Admin Dashboard, Verification queue, Report queue |
| PRD | §14, §17 |
| Done when | Click Home→Match→Request→Chat→Schedule on 360px + 1280px, Axe pass |

### Phase 2 — Auth + Profiles + Onboarding (1 week)
| Item | Detail |
|---|---|
| Goal | 2 roles work |
| Build | Member signup → Teach/Learn picker → Skill Profile. Explore-before-signup read-only. Admin invite-only + `/admin` guard + audit. APIs: `POST /api/profile, /api/teach, /api/learn`, `GET /api/me` |
| PRD | §4, §5, §6, §14 |
| Done when | New member Teach=Excel Learn=Photo saved; non-admin gets 403 on `/admin` |

### Phase 3 — Categories + Browse/Search (3 days)
| Item | Detail |
|---|---|
| Goal | Find people without matching |
| Build | Admin category CRUD, Postgres full-text search, filters: skill, mode, location, rating |
| PRD | §7, §9 |
| Done when | "photography" finds Sarah; in-person filter works |

### Phase 4 — Smart Matching (4 days)
| Item | Detail |
|---|---|
| Goal | Proactive recommendations |
| Build | Scoring Table 5 + `MatchCache` + `GET /api/matches` + MatchCard with reason chips |
| PRD | §8 |
| Done when | Chiaka (Sales→Photo) sees David (Photo→Sales) top with breakdown |

### Phase 5 — Exchange Flow: Request→Chat→Schedule (1.5 weeks)
| Item | Detail |
|---|---|
| Goal | Core loop works |
| Build | SwapRequest state machine (pending→accepted→scheduled→completed), chat (polling→Realtime), sessions with timezone + reminders, online/in-person/either |
| PRD | §10, §16 |
| Done when | E2E Discover→Request→Accept→Chat→Schedule→Complete green |

### Phase 6 — Credits (3 days)
| Item | Detail |
|---|---|
| Goal | Currency works, no cheating |
| Build | Immutable ledger, balance pill, direct (0 credits) vs credit toggle, settlement on complete, admin adjust with reason |
| PRD | §11, §12 |
| Done when | +2 taught / -2 learned, insufficient blocks credit swap |

### Phase 7 — Reviews + Verification + Safety (3 days)
| Item | Detail |
|---|---|
| Goal | Trust |
| Build | Dual review once per session, avg rating, TrustBadgeRow, ID upload → admin approve, Report/Block |
| PRD | §14, §15 |
| Done when | Reviewed once, blocked cannot message, badge visible |

### Phase 8 — Admin MVP (1 week)
| Item | Detail |
|---|---|
| Goal | Operate platform |
| Build | Dashboard (verifications, reports, growth, credits, flagged), queues: suspend/ban, approve, resolve, category CRUD, ledger view+adjust, metrics |
| PRD | §15b, §17b |
| Done when | Report→suspend writes audit; credit fix shows adminId |

### Phase 9 — Notifications + Personalized Home (3 days)
| Item | Detail |
|---|---|
| Goal | Users return |
| Build | Member: match, request, accepted, message, reminder, credit, review. Admin: verification, report, dispute. Bell + email (Resend) + PWA push. Home: Matches, Learn New, Want Your Skills, Credits, Upcoming, Explore |
| PRD | §17a, §19 |
| Done when | Request triggers bell+email <60s, mark-read works |

### Phase 10 — Harden + Launch Beta (1 week)
| Item | Detail |
|---|---|
| Goal | Safe launch |
| Build | Rate limits, PII redaction, backups, cron load test, §24 dashboard (users, swaps, repeat, credits, retention, avg/user, ratings, verified) |
| PRD | §24 |
| Done when | 10 real pairs complete 1h, north-star tracked, 0 P0 |

### Phase 11 — Post-MVP (Later, per PRD)
Paid sessions + commission, premium, promoted, community feed §18, advanced verification, business accounts, partnerships, ML matching.

---

## 4. What to do next
Approve Table 1 → I scaffold Phase 0 on branch `chore/scaffold` (Next.js+Prisma+Clerk+CI+seed Chiaka/David).
