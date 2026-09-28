# Phase 2 — Auth + Profiles + Onboarding (1 week)

Goal: 2 roles work (Members vs Admins).
PRD: §4, §5, §6, §14

## Tasks (prototype: done in static HTML — real backend needs Phase 0 Node/Postgres)
- [ ] Clerk: member signup (email/Google), admin invite-only, `role` in token — PENDING Node install
- [ ] Middleware: `/admin/*` + `/api/admin/*` server role check, 403 + audit — PENDING Next.js build
- [x] Member onboarding: Teach picker → Learn picker → Skill Profile (`onboarding.html`, saves to browser)
- [x] Explore-before-signup (browse read-only — `browse.html` needs no login)
- [ ] APIs: `POST /api/profile`, `/api/teach`, `/api/learn`, `GET /api/me` — PENDING Next.js build

Done when: Teach=Excel/Learn=Photo saved; non-admin blocked from /admin.
Next: Phase 3.
