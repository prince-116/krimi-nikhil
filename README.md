# Krimi Nikhil — royal-prestige (reception)

Reception invitation for Krimi & Nikhil — a copy of `../krimi-wedding` scoped to one
function: the **Reception, 7:00 PM onward, at Rani Sati Bhawan Hall** (the only
venue shown). Same design, bundle, static-data shim and routing gates as
krimi-wedding.

```bash
node server.mjs       # or: npm start
```

Open **http://localhost:5399** — `/` redirects straight to the invitation
(`/invite/demo?template=royal-prestige`). To deploy, publish the contents of
`public/` to any static host — the site is fully self-contained (no server needed).

## Differences from krimi-wedding

- Program Timeline has one entry: **Reception — Friday, Nov 20, 2026, 7:00 PM —
  Rani Sati Bhawan Hall** (`dayProgram` trimmed to it; pre-wedding events removed
  from the mock data).
- Venue section shows only the hall: the house block (Samrat Nagar) and the
  "View Home on Google Maps" button are off (empty `receptionVenue*` fields in
  `public/mock-data/demo_templates.json`) — the merged venue layout itself is
  untouched.
- Countdown, hero card and the Save-the-Date calendar entry point at **7:00 PM**
  (`weddingTime: "19:00"`).
- Opening line and welcome text say "Reception" instead of "Wedding ceremony" —
  in English and Gujarati — and `Reception → સ્વાગત સમારંભ` was added to the
  dictionary.
- Same changes as krimi-wedding's latest round: the **elder blessings section**
  (identical `blessingText` and dictionary entries — rendered as the first content
  section, under the cover/welcome line) and the **name order** (the app renders the
  `groomName` slot first, so Krimi — with her parentage in `groomSubText` — sits in
  it and the invite reads "Krimi & Nikhil"). The timeline is unchanged from the
  reception-only build.
- Default port **5399** (krimi-wedding runs 5299) so both can run side by side.
- Everything else — design, bundle, media, fonts, favicon, shim, gating,
  backups — is inherited from krimi-wedding; see its README for the full history
  of this build.

The invitation reads its content from `public/mock-data/demo_templates.json` — edit
it and restart the server (it loads the JSON at boot; the static shim picks it up on
the next page load). Pristine reference copies and backups live in `backups/`.

## Provenance

Mirrored from zareqia.com for local development. Their template, copy, imagery and
video remain their copyrighted work — a dev scratch build, not for public deployment.
