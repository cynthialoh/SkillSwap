# Phase 5 — Request → Chat → Schedule (1.5 weeks)

Goal: core loop works.
PRD: §10, §16

## Tasks (prototype: done in `exchange.html` + request/chat/schedule pages — server + Convex need Next.js build)
- [x] Request timeline UI Discover→Review (`exchange.html` tracker, status in browser)
- [x] Flow wired: `request.html` → `chat.html` → `schedule.html` → `credits.html` → `exchange.html` status
- [ ] SwapRequest state machine on server (pending→accepted→scheduled→completed) — PENDING backend
- [ ] Chat Convex realtime — PENDING backend (mock chat in `chat.html`)
- [ ] Sessions timezone/reminders + Playwright e2e — PENDING backend

Done when: e2e green.
Next: Phase 6.
