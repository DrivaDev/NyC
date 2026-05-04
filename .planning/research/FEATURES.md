# Features Research — Menú Digital

**Domain:** Restaurant digital menu SaaS (QR-based, read-only public menu)
**Researched:** 2026-05-04
**Overall confidence:** HIGH (core features) / MEDIUM (UX patterns)

---

## Table Stakes (must have or users leave)

### Admin Panel

Features restaurant owners universally expect. If any of these are missing, the product feels broken before they even share a QR code.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dish CRUD (name, description, price) | Core job to be done — no menu without it | Low | Text fields only; price as decimal string to avoid float issues |
| Category CRUD with ordering | Menus are always sectioned (starters, mains, desserts, drinks). No categories = unusable | Low | Display order must be manually controllable |
| Dish-to-category assignment | Every dish belongs to a section | Low | A dish without a category is orphaned and won't display |
| Allergen assignment per dish | EU Regulation 1169/2011 requires per-item allergen disclosure; legally mandatory since Dec 2014 | Low | Pre-seeded fixed list of 14; no free-text allergens in v1 |
| Dish image upload | Photos increase perceived value and scan conversions by ~30% (Deloitte); users expect it | Medium | Cloudinary upload widget; enforce aspect ratio crop (1:1 or 4:3) |
| Dish visibility toggle (show/hide) | Out-of-stock or seasonal items must disappear from public menu without deletion | Low | Boolean `isActive` flag; hidden dishes stay in DB for re-enabling |
| QR code view and download | The entire point of the product — restaurant needs to print it and place it on tables | Low | PNG download is enough for v1; vector (SVG) is nice-to-have |
| Unique menu URL/slug | The QR must point somewhere permanent; URL cannot change after printing | Low | Slug set at registration; treat it as immutable after creation |
| Real-time menu preview | Restaurants need to see how the public menu looks before sharing | Low | Link to `/menu/[slug]` opens in new tab; no embedded iframe needed in v1 |
| Account login / logout | Protecting the admin panel from public access | Low | Delegated to Clerk — not custom-built |

**Note on allergens:** EU Regulation 1169/2011 mandates written per-dish allergen disclosure for non-prepacked food served in restaurants. The 14 regulated allergens are: cereals containing gluten, crustaceans, eggs, fish, peanuts, soybeans, milk, nuts, celery, mustard, sesame seeds, sulphur dioxide/sulphites, lupin, molluscs. These must be displayed with visual emphasis (icon, badge colour, or bold text) — not buried in a description paragraph. This is a legal requirement in the EU, not a UX choice.

---

### Public Menu

Features diners expect when they scan a QR code. Failure here = restaurant loses trust.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dish listing grouped by category | Every physical menu is sectioned; diners navigate by section | Low | Categories as sticky anchors or tabs |
| Dish name, description, price | Minimum readable menu content | Low | Price must always show currency symbol |
| Dish photo display | Expected for modern menus; absence feels cheap | Low | Use Cloudinary CDN URL with `f_auto,q_auto` transformations |
| Allergen icons per dish | Diners with allergies scan menus specifically to check this; legally required to be visible | Medium | Icon set for the 14 EU allergens; tooltip or label on hover/tap |
| Filter by category | Navigation shortcut — diners jump directly to Drinks, Desserts, etc. | Low | Tab bar or sticky side nav; essentially a scroll anchor |
| Filter by allergen (exclusion) | Diners with allergies need to hide dishes containing a specific allergen | Medium | Multi-select exclusion filter: "hide dishes with gluten, hide dishes with milk" — logic is `dish.allergens does NOT contain selected` |
| Mobile-first responsive layout | 95%+ of QR scans happen on a phone; desktop is secondary | Low | Single-column card layout; large tap targets (min 44px) |
| No login required | The entire value proposition — scan and see, zero friction | Low | The public route must be completely unauthenticated |
| Fast load (< 2s on 4G) | Diners abandon slow menus; restaurant reputation suffers | Medium | SSR via Next.js App Router; Cloudinary CDN; no client-side data fetching on initial load |
| "Restaurant not found" state | Slug typos or inactive restaurants must show a clear error, not a blank page | Low | Simple 404 page with brand identity |

---

## Differentiators (competitive advantage for later)

Features that separate a product from free QR-link alternatives. Not expected in v1, but worth building once table stakes are solid.

| Feature | Value Proposition | Complexity | Phase |
|---------|-------------------|------------|-------|
| Custom QR code branding (logo embedded, color) | Restaurants want on-brand QR codes, not generic black squares | Medium | Post-v1 |
| Dish display order drag-and-drop | Manual sorting within a category is a frequent admin request | Medium | Post-v1 |
| Menu availability schedule (lunch/dinner) | Automatically show/hide sections by time of day | High | Post-v1 |
| Menu analytics (views, popular dishes, scan counts) | Restaurants want to know if their QR is being used | High | Post-v1 |
| Multiple menus per restaurant (dinner menu, wine list, kids menu) | Single restaurant may need several separate menus | Medium | Post-v1 |
| "Dish of the day" or featured dish highlight | Merchandising: promote high-margin items visually | Low | Post-v1 |
| Multi-language menu (ES/EN/PT) | Relevant for tourist-area restaurants; EU compliance for hospitality chains | High | Post-v1 |
| PDF export of the menu | Some restaurants want a printable fallback | Medium | Post-v1 |
| Diner search by dish name | Needed only on large menus (50+ items); overkill for typical 15-30 dish menu | Low | Post-v1 |
| WhatsApp share button for the menu URL | Quick social sharing for restaurant marketing | Low | Post-v1 |
| Table number on QR (per-table codes) | Used when online ordering is introduced; useless without ordering | High | Only relevant if ordering is added |

---

## Anti-Features (deliberately NOT building in v1)

These features appear reasonable but kill v1 scope, timeline, and focus.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Online ordering / add to cart | Completely different product — order management, kitchen flows, payment processing, real-time stock. Changes every assumption about the data model. | Display "this is informational only" in product copy; order in person |
| Payment integration | Requires PCI compliance, payment gateway contracts, refund flows. Months of work unrelated to the menu problem. | Out of scope until ordering is built |
| Waiter / KDS (kitchen display) | Adds operational complexity (order states, notification systems) that the current user base doesn't need | Not applicable to read-only menu |
| Custom free-text allergen tags | The 14 EU allergens are a fixed, regulated list. Custom tags create compliance ambiguity and support burden. | Use the fixed 14 — they cover all legal cases |
| Per-table QR codes (table routing) | Useful only when ordering is added. Without ordering, there is zero functional difference between table codes. | Single restaurant QR; add table codes only when ordering exists |
| Customer accounts / favorites / ratings | Adds auth layer for diners, GDPR surface, and user management. The entire value prop of this menu is zero-friction. | No diner accounts ever in v1; reconsider only if social features are planned |
| Inventory / stock management | Full inventory system is a separate product category (POS-adjacent). Way out of scope. | isActive toggle on dish is sufficient |
| Multi-restaurant / franchise management | Adds tenant hierarchy, permission models, and billing complexity | Single restaurant per account in v1 |
| Email marketing / newsletter | Unrelated to the menu product | Not applicable |
| Calorie / nutritional information | Required by some jurisdictions (UK 2022 law for chains 250+ employees) but not EU-wide for small restaurants. Significant data collection overhead. | Add a free-text "nutritional notes" field in a later phase if demanded |
| Reservation system | Different product entirely | Not applicable |
| Analytics / heatmaps | Valuable but adds infra (tracking, storage, dashboards). No value until restaurants have real traffic. | Add in Phase 2 once restaurants have live menus with real usage |
| Multi-language UI / menu content | Doubles content management complexity (field per language, translation management) | Ship in Spanish; add i18n routing in a later milestone |

---

## Feature Complexity Notes

Deceptively simple features that hide significant implementation work:

### Allergen Filter (Public Menu)
Looks simple — it's a checkbox. The complexity is in the filter semantics:
- "Exclude dishes WITH gluten" requires the filtering logic to read `dish.allergens` as an array and exclude dishes where the allergen is present.
- UI must handle the "no dishes match your filters" empty state gracefully.
- The filter state must survive category navigation (e.g., user filters by gluten, then clicks Desserts — filter stays applied).
- Confidence: MEDIUM — straightforward in isolation, but cross-cutting state management needs thought.

### Dish Image Upload
- Cloudinary upload widget on the frontend must handle: file type validation (JPG/PNG/WebP only), file size limit (recommend max 5MB before Cloudinary optimization), upload progress feedback.
- Image crop/aspect ratio enforcement matters for consistent card layout — dishes with portrait vs landscape photos look broken in a uniform card grid.
- Deletion flow: when a dish is deleted or image replaced, the old Cloudinary asset should be cleaned up (orphaned assets cost storage; easy to defer but debt accumulates).
- Confidence: MEDIUM — Cloudinary handles the hard parts, but the UX around upload + crop is non-trivial.

### Category Ordering
- Drag-and-drop reorder is high complexity for v1. A simple "up/down arrow" or explicit numeric order field in the edit form is sufficient and takes 10% of the effort.
- Store `displayOrder: Number` on category; sort by it on public menu render.

### QR Code Generation
- `npm qrcode` generates PNGs trivially. The complexity is what the QR encodes: it must be the fully-qualified public URL (`https://yourdomain.com/menu/[slug]`), not a relative path.
- Download as PNG: straightforward canvas-to-blob.
- The QR code must never need to be reprinted unless the domain changes — so the slug must be immutable after generation.

### Slug Uniqueness
- Slug is set at restaurant registration. It must be unique across all restaurants.
- Must be URL-safe (no spaces, accents, special chars). Validate on input: `/^[a-z0-9-]+$/`.
- Collision handling: if "pizzeria-roma" is taken, suggest "pizzeria-roma-2" or ask user to choose another.
- This is a one-time operation but the uniqueness check requires a DB query at registration time.

---

## Dependencies Between Features

```
Restaurant account (Clerk)
  └── Admin panel access
        ├── Category CRUD
        │     └── Dish CRUD (dish requires a category)
        │           ├── Allergen assignment (allergens require dishes to exist)
        │           └── Image upload (requires dish record to attach to)
        └── QR code view/download
              └── Unique slug (slug must exist before QR can be generated)

Unique slug
  └── Public menu URL (/menu/[slug])
        ├── Category filter (categories must exist on the menu)
        └── Allergen filter (allergens must be assigned to dishes)
```

**Critical path for first working demo:**
1. Clerk auth → restaurant record with slug
2. Category CRUD
3. Dish CRUD (with category assignment)
4. Public menu renders at `/menu/[slug]`
5. QR generates pointing to that URL

Everything else (images, allergens, filters) layers on top of this spine.

---

## Sources

- EU Regulation 1169/2011 allergen labelling: [Menutech — EU 1169/2011 Guide](https://menutech.com/en/blog/legal-requirements/eu-11692011-guide-allergen-labelling-requirements)
- EU allergen QR compliance: [QR Menu Generator — EU Allergen Regulations](https://qrmenugenerator.io/blog/eu-allergen-regulations-qr-menus-restaurants-compliant-solutions)
- 14 allergens complete list: [KitchenNmbrs — How to correctly list the 14 allergens](https://kitchennmbrs.app/en/knowledge-base/allergen-registration-eu-legislation/how-do-i-correctly-list-the-14-allergens-on-my-menu)
- Dish hide/availability toggle: [MenuAddis — Hide Menu Item](https://menuaddis.com/help/admin/availability/)
- Diner UX expectations: [Redro — Reduce Menu Confusion](https://www.redro.menu/blog/reduce-menu-confusion-and-improve-customer-confidence)
- QR code necessary vs nice-to-have: [Supercode — QR Codes for Restaurants](https://www.supercode.com/blog/qr-codes-for-restaurants)
- Image impact on ordering (Deloitte stat): [QRBox — Understanding Menu Management](https://blog.qrbox.menu/en/docs/menu-management/understanding-menu/)
- Dynamic QR codes and slug management: [TableQR — How QR Code Menus Work](https://tableqr.co/blog/qr-menu-for-restaurants/)
- Cloudinary image optimization: [Cloudinary — Image Optimization](https://cloudinary.com/documentation/image_optimization)
