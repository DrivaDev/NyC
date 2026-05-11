# Discussion Log — Phase 1: Foundation

**Date:** 2026-05-04
**Phase:** 1 — Foundation
**Mode:** Default (interactive)
**Outcome:** All gray areas resolved via Claude discretion (user had no strong preferences)

---

## Gray Areas Presented

| Area | Selected? |
|------|-----------|
| Creación del Restaurant doc | Carried forward (no preference) |
| Onboarding y slug UX | Carried forward (no preference) |
| Scaffolding del proyecto | Carried forward (no preference) |
| Alcance del dashboard shell | Carried forward (no preference) |

---

## Decisions Captured

### Restaurant Document Creation
- **Options presented:** Clerk webhook vs. first-load check
- **Decision:** Clerk webhook (`user.created` event) with Svix verification and upsert idempotency
- **Rationale:** More reliable for production SaaS; avoids race conditions

### Slug UX
- **Options presented:** Auto-generate with preview vs. manual entry
- **Decision:** Auto-generate from restaurant name + `nanoid(6)`, with preview and one-time edit before first save
- **Rationale:** Better UX than manual; slug is permanent so user needs visibility before committing

### Project Scaffolding
- **Options presented:** With/without `src/`, TypeScript strictness
- **Decision:** No `src/`, TypeScript strict, standard App Router structure with pre-scaffolded route groups
- **Rationale:** Simpler structure, strict TS catches errors early

### Dashboard Shell
- **Options presented:** Minimal auth-only shell vs. full nav scaffold
- **Decision:** Full navigation scaffold with Phase 2+ items disabled
- **Rationale:** Prevents expensive nav refactors in later phases

---

## Deferred Ideas

*(None)*

---

## Notes

User had no specific preferences for any gray area — all decisions made by Claude based on research findings and best practices for a production SaaS on Vercel + Clerk + MongoDB Atlas.
