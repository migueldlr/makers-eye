# Project Specification: Top-Cut Decklist Catalog

## Overview

Build a public catalog of published tournament top cuts. Visitors can browse events, search by event name, player name, or event date, and expand each top-cut player's submitted Corp and Runner decklists. Administrators review imported data, edit catalog metadata and links, and explicitly publish events.

Cobra's submitted deck pages are the authoritative tournament snapshots. The [Always Be Running API](https://alwaysberunning.net/apidoc) supplies event and NetrunnerDB links where available, and the [NetrunnerDB V3 API](https://api.netrunnerdb.com/api/docs/) validates those links and fills gaps when Cobra has no public list.

## Goals

- Add a decklist catalog linked from the homepage.
- List published events newest first and expose a searchable client-side event index.
- Show only top-cut players, with both Swiss and final cut placements.
- Render complete Corp and Runner lists inline through accessible expanders.
- Link events to Always Be Running and decks to NetrunnerDB when those links exist.
- Make event metadata, publication state, player source mappings, and deck links manageable in the authenticated dashboard.
- Preserve submitted tournament lists independently of later upstream changes.

## Technical Implementation

### Architecture

- Add public routes at `/decklists` and `/decklists/[eventId]`.
- Add an authenticated catalog editor at `/dashboard/decklists`, linked from the existing dashboard.
- Keep catalog queries server-side. Hydrate only published event summaries and top-cut player names for client-side search; load deck contents only on an event detail page.
- Implement source refresh as two operations:
  1. A read-only preview fetches Cobra, ABR, and NRDB data and returns proposed mappings, content changes, warnings, and mismatches.
  2. An authenticated apply action writes only the accepted preview in one transaction.
- Verify the Supabase user in every mutation action rather than relying only on client routing or row-level security.

### Data Model

- Add `catalog_published boolean not null default false` and nullable `catalog_published_at` to `tournaments`.
- Add nullable `source_player_id text` to `standings` so imported players can be associated with their Cobra player records.
- Add `tournament_decklists` with:
  - Internal primary key and a foreign key to `standings` with cascade deletion.
  - A `side` value restricted to `corp` or `runner`, unique with `standing_id`.
  - Cobra source URL, optional NRDB URL, title, identity, card count, influence total, and display-ready cards stored as JSON.
  - Source kind, source and NRDB content hashes, comparison status, and import/verification timestamps.
- Store each display card as a title, quantity, and optional influence and card-type fields. Preserve source ordering.
- Leave the existing numeric `decklists` table and standings deck IDs unchanged because they support the current statistics pipeline. The catalog table is a per-tournament historical snapshot and supports modern NRDB UUID links.
- Update Drizzle schema and relations, generate a migration, and regenerate the Supabase TypeScript database types.

### Source Adapters and Data Flow

- Preserve the source player ID during new tournament imports.
- For existing tournaments, preview the original tournament data and match top-cut standings back to source players.
- Normalize player names using Unicode normalization, case folding, trimmed and collapsed whitespace, and normalized surrounding punctuation. Auto-match only an unambiguous one-to-one result. Do not use fuzzy matching. Ambiguous or unmatched entries require an administrator selection.
- For each top-cut player:
  - Fetch and parse the public Cobra deck page when one exists.
  - Capture deck title, identity, quantities, card names, influence values, and totals for both sides.
  - If Cobra has no submitted list for a side, fall back to the ABR-linked NRDB list.
  - Store the Cobra list as authoritative when both sources exist.
- Compare Cobra and NRDB by canonicalized card title and quantity sets, independent of display order. Surface identity or card differences in the admin preview. A mismatch does not replace the Cobra snapshot or block publication after explicit admin acceptance.
- Treat external failures as review warnings. Never automatically delete a saved snapshot or link because an upstream request failed.
- Validate manual ABR links against `alwaysberunning.net` and NRDB links against the supported NetrunnerDB hosts. External links open in a new tab with safe `rel` attributes.

### Security and Policies

- Add authenticated tournament update policies, since tournaments currently have insert and public-select policies but no update policy.
- Allow authenticated users to create, update, and delete tournament deck snapshots.
- Permit anonymous snapshot reads only when the related tournament is published; authenticated users can read unpublished review data.
- Keep imported player names and placements read-only in the catalog editor. Corrections to those fields continue to come from the tournament import workflow.

## UI/UX

### Public Catalog

- Add a homepage link labeled `Top cut decklists`.
- `/decklists` displays published events newest first. Each event includes its name, date, location, format, cut size, deck coverage, and an ABR link when available.
- Provide one client-side search input. Normalize case and diacritics, and match event name, top-cut player name, stored ISO date, and the displayed date.
- Player-name matches retain the containing event and identify the matching player or players.
- Do not paginate the initial catalog. Do not include deck contents in its hydrated search payload.
- Provide specific empty states for no published events and no search results.

### Event Detail

- Return not found for missing or unpublished events.
- Include only standings where `top_cut_rank > 0`, ordered by final cut placement and then Swiss placement.
- Show final placement, Swiss placement, player name, both identities, deck titles, and NRDB links when available.
- Use keyboard-accessible player expanders that allow multiple players to remain open.
- Inside each player, stack Corp and Runner panels on small screens and show them side by side when space allows.
- Render quantity, card name, optional influence, card count, and totals. A missing side reads `No submitted list available`.

### Visual Direction and Accessibility

- Extend the existing dark Netrunner interface, orange accents, and Netrunner glyph treatment rather than introducing a separate visual system.
- Use a restrained `cut rail` connecting final placements as the catalog's signature visual element.
- Preserve visible keyboard focus, semantic headings and links, screen-reader labels, sufficient contrast, responsive behavior, and reduced-motion preferences.

### Admin Catalog Editor

- Protect the route on the server before rendering catalog data.
- List published and unpublished events with deck coverage and refresh status.
- Allow editing event name, date, location, region, format/card pool, tournament source URL, ABR URL, and publication state.
- Show imported top-cut names and placements as read-only.
- Allow editing NRDB links and resolving source-player or ABR-player mappings.
- Show a per-player refresh preview with additions, replacements, unavailable sources, and Cobra/NRDB mismatches before applying.
- Permit publication only when an event has a name, date, at least one top-cut player, and at least one saved deck snapshot. Permit unpublishing at any time.

## Constraints and Tradeoffs

- Existing events start unpublished and require individual review. Deployment does not trigger external-data backfills.
- Cobra renders public decklists as server-generated HTML rather than a documented deck API, so isolate parsing behind a tested adapter and fail with actionable review errors when the structure changes.
- Cobra remains authoritative because it records the submitted tournament deck. NRDB is an outbound reference and comparison source and may later diverge.
- ABR and NRDB links are optional. Missing links never hide an otherwise valid Cobra snapshot.
- Current production catalog volume is not available in the local environment. Avoid unmeasured numeric performance assumptions and keep the index payload structurally small by excluding deck contents.

## Testing

- Add Vitest, React Testing Library, and a DOM test environment.
- Test Cobra parser fixtures for both sides, one missing side, special characters, influence values, totals, malformed markup, and the currently observed Cobra structure.
- Test name normalization and matching for case and diacritic differences, unique matches, duplicate normalized names, unmatched entries, and manual resolution.
- Test Cobra/NRDB comparison for identical reordered lists, quantity differences, missing cards, identity differences, unavailable NRDB, and UUID deck links.
- Test catalog search by event, player, ISO date, displayed date, case, and diacritics, plus clearing and empty results.
- Test published-event filtering, top-cut filtering, ordering, missing links, deck expanders, missing-side states, and external-link safety.
- Test server authentication, URL validation, preview without writes, atomic apply, publication validation, unpublishing, and upstream failures.
- Run type checking, linting, automated tests, a production build, and browser QA at desktop and mobile widths before release.

## Success Criteria

- A visitor can reach the catalog from the homepage and find a published event by event name, top-cut player, or event date.
- Every event page shows the correct Swiss and final placement for each top-cut player.
- Submitted Cobra decklists render fully without requiring a live NRDB request at page-view time.
- ABR and NRDB links appear only when saved and available.
- An authenticated administrator can preview, resolve, apply, publish, update, and unpublish catalog data without editing imported placements.
- Unpublished or incomplete events never appear in the public catalog.

## Rollout

1. Apply the schema migration with all existing tournaments unpublished.
2. Deploy the public routes and protected catalog editor.
3. Review each existing event through the dashboard, resolve mappings, import snapshots, and publish qualifying events individually.
4. Monitor parser and upstream failures through actionable admin errors and server logs.

## Future Considerations

- Server-side search or pagination if measured catalog growth later warrants it.
- Additional tournament-manager adapters behind the same snapshot interface.
- Public filters for format, card pool, identity, or placement after the initial catalog is validated.
