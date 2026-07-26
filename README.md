# Recacho Advisory

Static website for [Recacho Advisory](https://www.recachoadvisory.com/).

The site has three audience paths:

- `/` — founder-first Revenue Architecture advisory
- `/diagnostic.html` — fixed-scope Revenue Architecture Diagnostic and secure application
- `/diagnostic-sample.html` — fictional sample decision memo
- `/executive-experience.html` — product marketing leadership experience

## Revenue Architecture Diagnostic

The fixed-scope offer includes:

- $2,500 fixed fee
- one consequential GTM decision
- five-business-day delivery after complete inputs
- review of up to eight artifacts
- 45-minute kickoff, decision memo, 60-minute readout, and 30-day follow-up

The application submits through `api/contact.js`; it does not expose the
recipient address or accept file uploads. Operating assets live in `product/`:

- `DIAGNOSTIC_RUBRIC.md`
- `DELIVERY_PLAYBOOK.md`
- `DECISION_MEMO_TEMPLATE.md`
- `outcome-tracker.csv`

## Local preview

From the repository root:

```sh
npm test
vercel dev
```

Then open the local URL printed by Vercel CLI (normally
`http://127.0.0.1:3000/`).

The contact form is delivered by the Vercel Function in `api/contact.js`.
Copy `.env.example` to an untracked local environment file and provide:

- `RESEND_API_KEY`: server-only Resend credential
- `CONTACT_TO_EMAIL`: private recipient
- `CONTACT_FROM_EMAIL`: sender on a Resend-verified domain
- `CONTACT_ALLOWED_ORIGINS`: optional comma-separated additional origins

Never prefix these values with `NEXT_PUBLIC_` or commit their values.

## Production

The site is deployed on Vercel from the `main` branch. Production metadata,
structured data, the sitemap, and social preview assets use the canonical
`https://www.recachoadvisory.com/` URL.

Google Analytics and Pendo load only on the production hostname. Shared
presentation and interaction behavior live in `styles.css` and `site.js`.

Set the three required contact variables for both Preview and Production in
Vercel before deploying. The browser receives only a success or failure
response; recipient and provider credentials remain server-side.
