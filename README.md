# Spendly

A mobile-first personal spending tracker built with React, Vite, React Router, Lucide React, and Recharts. The six screens follow the PNG references in `design-reference/`.

## Run locally

Use Node.js 22.12+ or a supported newer release.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, including `/Spendly/` (normally `http://localhost:5173/Spendly/`). For a production build and local preview:

```sh
npm run build
npm run preview
```

Run the financial calculation and component integration tests with `npm test`.

## GitHub Pages deployment

The target is `https://amnihudzori.github.io/Spendly/`. Vite uses `base: '/Spendly/'`, and React Router reads the same base from `import.meta.env.BASE_URL`. The routes listed below are relative to that base, so Home is `/Spendly/home` on Pages.

1. In the Spendly repository, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. Publishing the `main` branch's root serves the development `index.html` and cannot run the React source.
2. Commit and push these changes to `main`. The **Deploy Spendly to GitHub Pages** workflow can also be started manually from **Actions**.
3. The workflow runs `npm ci`, `npm test`, `npm run build`, and `node scripts/verify-pages-build.mjs`. It uploads **only `./dist`** as the Pages artifact, then deploys that artifact. Keep `dist/` ignored in Git; Actions rebuilds it from the lockfile.

`public/404.html` handles direct visits and refreshes to client routes. GitHub serves that fallback for a missing path; it redirects to `/Spendly/` with the original path, query, and hash encoded in `__spendly_route`. Before React mounts, `src/main.jsx` restores the original URL using `history.replaceState`. This keeps clean URLs such as `/Spendly/history` and `/Spendly/add?type=income`, without changing wallet data or introducing hash-based navigation.

After building locally, run `node scripts/verify-pages-build.mjs` to check JavaScript, CSS, favicon, font URLs, and the generated `dist/404.html`. Preview the production build at `http://localhost:4173/Spendly/`.

## Screens and behavior

- `/` — Welcome, with Get Started. Subsequent visits go to Home. `/welcome` always opens the welcome screen.
- `/home` — Wallet balance, Add Money, Set/Edit Initial Balance, current-month income and expenses, live monthly budget, recent transactions, and in-app budget reminders.
- `/add` — Add an expense or income with amount, category, date, and optional description. Add Money opens `/add?type=income` with Income selected. Income sources are Allowance, Salary, Part-time Job, Gift, and Other.
- `/edit/:id` — Edit an existing transaction. Tap any transaction on Home or History to edit or delete it.
- `/history` — Search and filter by month, income/expense, and category.
- `/analytics` — Monthly income, expenses, net cash flow, spending categories, a six-month income/expense chart, and a computed monthly comparison.
- `/profile` — Edit name, email, and profile type; change budget, reminder preference, and display currency; export transactions as CSV; clear transaction data.

New users start with no transactions, no preset wallet money, and no monthly budget. Set an initial balance for money you already had before tracking, then use Add Money for new income and Add for expenses. No sample transactions are created. Existing saved transactions and profile preferences are preserved, including legacy income categories.

## Data and calculations

Transactions and preferences persist in this browser's `localStorage`, under `spendly.v1`. There is no backend, database, login, authentication, or cloud sync. Clearing browser storage removes saved data; CSV export provides a portable copy of transactions. Fonts are bundled locally.

Amounts are validated and summed as integer cents. **Total Balance = Initial Balance + all Income − all Expenses.** The initial balance is stored once as a separate `initialBalance` value in `spendly.v1`; editing it replaces that value, without creating a transaction or adding it again. It never counts as monthly income or net cash flow. Zero is valid for the initial balance; income and expenses must be positive with at most two decimal places. All amounts, sources/categories, and dates are required; descriptions are optional.

Older v1 data gains an unset initial balance without changing transactions or profile settings. An unreadable saved value is left unchanged rather than overwritten. Clearing transactions retains the initial balance and profile settings.

Income, expense summaries, and budgets use the selected month (the current month on Home). The monthly budget applies to each month. Changing display currency changes symbols only, without converting amounts. Notifications are in-app budget check-ins, available through the Home bell.

Layouts use a fixed bottom navigation on mobile and a sidebar on desktop. The Analytics bundle is loaded only when visited.
