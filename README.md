# Recacho Advisory

Static website for [Recacho Advisory](https://www.recachoadvisory.com/).

The site has two audience paths:

- `/` — founder-first Revenue Architecture advisory
- `/diagnostic.html` — fixed-scope Revenue Architecture Diagnostic and structured application
- `/diagnostic-sample.html` — fictional sample decision memo
- `/executive-experience.html` — product marketing leadership experience

## Revenue Architecture Diagnostic MVP

The diagnostic is a service-enabled MVP with a fixed product contract:

- $2,500 fixed fee
- one consequential GTM decision
- five-business-day delivery after complete inputs
- review of up to eight artifacts
- 45-minute kickoff, decision memo, 60-minute readout, and 30-day follow-up

The application intentionally creates a structured email rather than collecting
or storing confidential information on the public website. Operating assets are
kept in `product/`:

- `DIAGNOSTIC_RUBRIC.md`
- `DELIVERY_PLAYBOOK.md`
- `DECISION_MEMO_TEMPLATE.md`
- `outcome-tracker.csv`

## Local preview

From the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000/`.

## Production

The site is deployed on Vercel from the `main` branch. Production metadata,
structured data, the sitemap, and social preview assets use the canonical
`https://www.recachoadvisory.com/` URL.

Google Analytics and Pendo load only on the production hostname. Shared
presentation and interaction behavior live in `styles.css` and `site.js`.
