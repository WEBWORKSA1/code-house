# Code.House

**The house where software gets built.**

A two-engine web property on the domain `code.house`:

1. **Traffic engine (free):** tutorials, interactive roadmaps, free developer tools, coding challenges, contests and a YouTube course hub — monetized with Google AdSense, affiliates, sponsorships and donations.
2. **Money engine (lead generation):** businesses submit a project brief; briefs are scored and routed to up to 3 vetted development agencies who pay per qualified lead.

## What's in this repo

| File | Purpose |
|---|---|
| `index.html` | Live interactive preview of the site: home page, 7-step project wizard, cost estimator, JSON formatter tool, contests, jobs board and donation page. Self-contained, no build step. |
| `BUILD-PROMPTS.md` | Full strategy document and the phase-wise build prompt pack (Phases 0–12) for building the production Next.js version. |

## Live preview

Published with GitHub Pages: https://webworksa1.github.io/code-house/

## Status

Preview build. All statistics, prize amounts, job listings and fundraising totals shown in `index.html` are placeholders. Payments (Stripe), lead storage (Supabase) and AdSense units are wired in Phases 2, 7 and 10 of the prompt pack.
