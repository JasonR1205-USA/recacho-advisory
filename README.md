# Recacho Advisory

Static website for [Recacho Advisory](https://www.recachoadvisory.com/).

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

Set the three required contact variables for both Preview and Production in
Vercel before deploying. The browser receives only a success or failure
response; recipient and provider credentials remain server-side.
