# Project Specification: Tournament Decklist Catalog

## Overview

Build a public single-page catalog of published tournament top cuts. Visitors can search by event name, top-cut player name, or event date, and lazily expand submitted Corp and Runner decklists. Administrators review imported data, edit catalog metadata and links, and explicitly publish events.

Cobra's tournament data and submitted deck pages are the authoritative entrant and decklist snapshots. The [Always Be Running API](https://alwaysberunning.net/apidoc) supplies event and NetrunnerDB links where available, and the [NetrunnerDB V3 API](https://api.netrunnerdb.com/api/docs/) validates and compares those optional links.

## Goals

- Add a decklist catalog linked from the homepage.
- List published events newest first and expose a searchable client-side event index.
- Show every top-cut player with their Swiss placement and final cut placement. Keep Cobra player IDs internal.
- Render complete stored Cobra Corp and Runner lists inline through accessible, lazy-loaded expanders.
- Link events to Cobra and Always Be Running, and decks to NetrunnerDB, when those links exist.
- Auto-detect an event-level ABR tournament through the public tournament API when date and available event metadata produce one unambiguous match. Keep the ABR URL editable and require manual selection when detection is ambiguous.
- Make event metadata, publication state, player source mappings, and deck links manageable in the authenticated dashboard.
- Preserve submitted tournament lists independently of later upstream changes.

## Technical Implementation

### Architecture

- Use `/decklists` as the only public catalog route. Do not create tournament-specific public detail pages.
- Add an authenticated catalog editor at `/dashboard/decklists`, linked from the existing dashboard.
- Keep catalog queries server-side. Hydrate every published event and top-cut player name in the initial `/decklists` payload for client-side search. Do not expose Cobra player IDs. Exclude deck card JSON from that payload and load stored cards through an internal endpoint only when a visitor opens a list.
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
- Treat Cobra IDs as canonical internal source mappings. Preserve IDs for imported standings but never expose them in the public catalog.
- For existing tournaments, preview the original tournament data and match top-cut standings back to source players.
- Normalize player names using Unicode normalization, case folding, trimmed and collapsed whitespace, and normalized surrounding punctuation. Auto-match only an unambiguous one-to-one result. Do not use fuzzy matching. Ambiguous or unmatched entries require an administrator selection.
- For each top-cut player:
  - Fetch and parse the public Cobra deck page when one exists.
  - Capture deck title, identity, quantities, card names, influence values, and totals for both sides.
  - When ABR and saved data provide no NRDB URL, search NRDB V3 by the Cobra deck title with candidates ordered oldest first. Accept the first candidate whose normalized NRDB title contains the normalized Cobra title and whose side, identity, card count, and complete card quantities match the Cobra submission exactly.
- Do not use NRDB content as a substitute for a missing Cobra submission. Cobra is authoritative for decklist contents; NRDB remains an optional outbound link and comparison source.
- Compare Cobra and NRDB by printing ID and quantity when both sources provide IDs, with canonicalized card titles as the legacy fallback. Surface identity or card differences in the admin preview. A mismatch does not replace the Cobra snapshot or block publication after explicit admin acceptance.
- Treat external failures as review warnings. Never automatically delete a saved snapshot or link because an upstream request failed.
- Validate manual ABR links against `alwaysberunning.net` and NRDB links against the supported NetrunnerDB hosts. External links open in a new tab with safe `rel` attributes.

### Security and Policies

- Add authenticated tournament update policies, since tournaments currently have insert and public-select policies but no update policy.
- Allow authenticated users to create, update, and delete tournament deck snapshots.
- Permit anonymous snapshot reads only when the related tournament is published; authenticated users can read unpublished review data.
- Keep imported player names and placements read-only in the catalog editor. Corrections to those fields continue to come from the tournament import workflow.

## UI/UX

### Public Catalog

- Add a homepage link labeled `Tournament decklists`.
- `/decklists` displays published events newest first. Each event includes its name, date, location, format, cut size, deck coverage, and Cobra and ABR links when available.
- Provide one client-side search input. Normalize case and diacritics, and match event name, top-cut player name, stored ISO date, and the displayed date.
- Event-level matches retain the complete top cut. Player-level matches retain the containing event and narrow it to matching top-cut players.
- Do not paginate the initial catalog. Do not include deck contents in its hydrated search payload.
- Provide specific empty states for no published events and no search results.

### Single-page Tournament Ledger

- Render every published tournament and its complete top cut directly on `/decklists`, ordered by event date and final placement.
- Give each event a compact top-cut ledger with Swiss place, final place, player name, and Corp/Runner summary cells.
- Search locally by event, date, or top-cut player name. Event-level matches retain the complete cut; player-level matches may narrow the visible rows within the matching event.
- Fetch no external source while browsing. Opening a top-cut entrant requests both available stored snapshots from an internal published-only endpoint and then retains them in client state.
- Show NRDB as an optional outbound link but never use it as the browsing-time deck content source.
- Stack or horizontally scroll dense ledger data on narrow screens without hiding entrant names.
- Label the Corporation side as `Corp` and display identities through the shared `shortenId` mapping from `src/lib/util.ts`.
- Render quantity, card name, optional influence, card count, and totals in the expanded stored list. A missing side reads `No Cobra list available`.

### Visual Direction and Accessibility

- Extend the existing dark Netrunner interface, orange accents, and Netrunner glyph treatment rather than introducing a separate visual system.
- Use the dense tournament ledger, with distinct Swiss and cut rank columns, as the catalog's signature visual element.
- Preserve visible keyboard focus, semantic headings and links, screen-reader labels, sufficient contrast, responsive behavior, and reduced-motion preferences.

### Admin Catalog Editor

- Protect the route on the server before rendering catalog data.
- List published and unpublished events with deck coverage and refresh status.
- Allow editing event name, date, location, region, format/card pool, tournament source URL, ABR URL, and publication state.
- Show imported top-cut names and placements as read-only.
- Allow editing NRDB links and resolving source-player mappings. ABR player matching is automatic; show a per-player ABR resolution control only for unmatched or ambiguous records.
- Show a per-player refresh preview with additions, replacements, unavailable sources, and Cobra/NRDB mismatches before applying.
- Label NRDB links found through exact title-and-card automatching in the preview before import.
- Present the normal admin path as one ordered workflow: find decklists, then import and publish the reviewed event in one action. Keep event metadata and manual link corrections in collapsed advanced sections so their save actions do not compete with the primary flow.
- Permit publication only when an event has a name, date, at least one top-cut player, and at least one saved deck snapshot. Permit unpublishing at any time.

## Constraints and Tradeoffs

- Existing events start unpublished and require individual review. Deployment does not trigger external-data backfills.
- Cobra renders public decklists as server-generated HTML rather than a documented deck API, so isolate parsing behind a tested adapter and fail with actionable review errors when the structure changes.
- Cobra remains authoritative because it records the submitted tournament deck. NRDB is an outbound reference and comparison source and may later diverge.
- ABR and NRDB links are optional. Missing links never hide an otherwise valid Cobra snapshot.
- A title match alone never creates an NRDB link. Paginate oldest-first and require exact Cobra content verification; if no candidate qualifies, leave the NRDB URL empty.
- Import the accepted preview directly. Do not repeat Cobra, ABR, or NRDB requests during the import-and-publish action.
- Batch standing mappings, deck upserts, and event publication into one authenticated transaction.
- Reuse upstream responses through ETag or Last-Modified validators when those headers are available. ABR responses without validators remain uncached.
- Cache published catalog queries and invalidate them after catalog mutations. Keep authenticated admin queries dynamic.
- Keep catalog queries aggregated and indexed by tournament/Swiss placement, tournament/top-cut placement, and published event date.

## Testing

- Add Vitest, React Testing Library, and a DOM test environment.
- Test Cobra parser fixtures for both sides, one missing side, special characters, influence values, totals, malformed markup, and the currently observed Cobra structure.
- Test name normalization and matching for case and diacritic differences, unique matches, duplicate normalized names, unmatched entries, and manual resolution.
- Test Cobra/NRDB comparison for identical reordered lists, quantity differences, missing cards, identity differences, unavailable NRDB, and UUID deck links.
- Test NRDB title search for exact verified matches, rejection of title-only matches, oldest-first selection, pagination, and upstream failures.
- Test catalog search by event, player, ISO date, displayed date, case, and diacritics, plus clearing and empty results. Assert that Cobra player IDs are absent from the public payload and interface.
- Test published-event filtering, complete top-cut inclusion, final-placement ordering, missing links, lazy deck expansion, missing-side states, and external-link safety.
- Test server authentication, URL validation, preview without writes, atomic apply, publication validation, unpublishing, and upstream failures.
- Run type checking, linting, automated tests, a production build, and browser QA at desktop and mobile widths before release.

## Success Criteria

- A visitor can reach the catalog from the homepage and find a published event by event name, top-cut player name, or event date.
- The single catalog page exposes every top-cut player's name, Swiss placement, and final placement without a follow-up request, while Cobra player IDs remain private.
- Submitted Cobra decklists render fully after an on-demand request to the application's stored snapshot endpoint, without a live Cobra or NRDB request.
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
