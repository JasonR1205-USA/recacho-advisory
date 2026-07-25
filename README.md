# Recacho Advisory

Static website for [Recacho Advisory](https://www.recachoadvisory.com/).

The site has two audience paths:

- `/` — founder-first Revenue Architecture advisory
- `/executive-experience.html` — product marketing leadership experience

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
