# Roadmap — Menú Digital

**4 phases** | **34 requirements** | Granularity: coarse

---

## Phases

- [ ] **Phase 1: Foundation** - Clerk auth is live, restaurant accounts are created with a permanent slug, and the MongoDB connection is stable.
- [ ] **Phase 2: Admin Panel** - A logged-in restaurant owner can fully manage their menu — categories, dishes, images, allergens, and availability — from the dashboard.
- [ ] **Phase 3: Public Menu & QR** - A diner can scan the QR, open the public menu, and a restaurant owner can preview and download their QR code.
- [ ] **Phase 4: Polish & Brand** - The entire product consistently applies Driva Dev's visual identity, handles empty and error states gracefully, and passes a mobile audit.

---

## Phase Details

### Phase 1: Foundation
**Goal**: A restaurant owner can create an account, log in, and have a permanent unique slug assigned automatically — the backbone every other feature depends on.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, REST-01, REST-02
**Success Criteria** (what must be TRUE):
  1. A restaurant owner can register with email and password via Clerk and immediately access the dashboard.
  2. A restaurant owner can close and reopen the browser and remain logged in without re-authenticating.
  3. A restaurant owner can click "Sign out" from any dashboard page and be logged out completely.
  4. Upon registration, a `Restaurant` document exists in MongoDB with a unique, URL-safe slug derived from the restaurant name — and that slug cannot be changed.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Admin Panel
**Goal**: A logged-in restaurant owner can build and maintain their full menu — creating categories and dishes, uploading images, assigning allergens, and toggling availability — all from the dashboard.
**Depends on**: Phase 1
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, DISH-01, DISH-02, DISH-03, DISH-04, DISH-05, DISH-06, DISH-07
**Success Criteria** (what must be TRUE):
  1. A restaurant owner can create, rename, delete, and reorder categories using up/down controls, and the saved order is reflected everywhere.
  2. A restaurant owner can create a dish with name, description, price, and category — and later edit or delete it.
  3. A restaurant owner can upload an image for a dish and see it stored via Cloudinary without any API secret appearing in the browser.
  4. A restaurant owner can assign any combination of the 14 EU allergens to a dish from a fixed list.
  5. A restaurant owner can toggle a dish as "unavailable" and it immediately disappears from the public menu without being deleted.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Public Menu & QR
**Goal**: A diner can open the restaurant's public menu by scanning a QR code and browse dishes by category and allergen — and the restaurant owner can preview and download that QR from the dashboard.
**Depends on**: Phase 2
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04, PUB-05, PUB-06, PUB-07, QR-01, QR-02, QR-03, QR-04
**Success Criteria** (what must be TRUE):
  1. A diner can navigate to `/menu/[slug]` without logging in and see all available dishes grouped by category in the restaurant's configured order.
  2. A diner can see each dish's photo, name, description, price, and allergen icons — with tooltip labels visible on hover or tap.
  3. A diner can tap a category tab to filter the visible dishes client-side with no page reload.
  4. A diner who scans a QR for a non-existent slug sees a clear 404 page rather than an error or blank screen.
  5. A restaurant owner can see their QR code in the dashboard, open their public menu in a new tab, and download the QR as a PNG — all pointing to `https://menudig.com.ar/menu/[slug]`.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Polish & Brand
**Goal**: Every screen in the product — admin and public — consistently applies Driva Dev's visual identity, handles empty and error states cleanly, and is fully usable on mobile.
**Depends on**: Phase 3
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06
**Success Criteria** (what must be TRUE):
  1. Every page uses only the defined Driva Dev color palette (`#EA580C`, `#9A3412`, `#FED7AA`, `#FFF7ED`, `#1C1917`) — no off-palette colors anywhere.
  2. All text renders in Fira Sans with the correct weight hierarchy (Bold H1/H2, Medium H3, Regular body, Light caption) and minimum 12px size.
  3. Primary buttons show `#EA580C` background with white text; secondary buttons show `#EA580C` border with transparent background; input focus shows `#EA580C` border; badges show `#FED7AA` background with `#9A3412` text.
  4. The footer on every page reads "Desarrollado por Driva Dev" and no gradients, excessive shadows, or off-palette decorations appear anywhere.
**Plans**: TBD
**UI hint**: yes

---

## Progress Table

| Phase | Name | Plans Complete | Status | Completed |
|-------|------|----------------|--------|-----------|
| 1 | Foundation | 0/? | Not started | — |
| 2 | Admin Panel | 0/? | Not started | — |
| 3 | Public Menu & QR | 0/? | Not started | — |
| 4 | Polish & Brand | 0/? | Not started | — |
