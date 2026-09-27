# Phase 2 — Auth + Profiles + Onboarding (1 week)

Goal: 2 roles work (Members vs Admins).
PRD: §4, §5, §6, §14

## Tasks
- [ ] Clerk: member signup (email/Google), admin invite-only, `role` in token
- [ ] Middleware: `/admin/*` + `/api/admin/*` server role check, 403 + audit
- [ ] Member onboarding: Teach picker → Learn picker → Skill Profile
- [ ] Explore-before-signup (browse read-only)
- [ ] APIs: `POST /api/profile`, `/api/teach`, `/api/learn`, `GET /api/me`

Done when: Teach=Excel/Learn=Photo saved; non-admin blocked from /admin.
Next: Phase 3.
