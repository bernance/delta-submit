# delta-submit

A notebook submission portal for Data Science Advanced · Cohort Delta.
Students upload `.ipynb` files by day; you review, download, and export notes via a passcode-protected instructor view.

This version is self-hosted — no dependency on Claude.ai. It uses **Supabase** (free tier) as the backend and **GitHub Pages** for hosting.

---

## One-time setup (about 10 minutes)
   
### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New project**. Pick any name (e.g. `delta-submit`), set a database password (save it somewhere), pick a region close to Nigeria (e.g. `eu-west` or `eu-central`).
3. Wait ~2 minutes for it to finish provisioning.

### 2. Create the database table
1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open `supabase_schema.sql` from this repo, copy all of it, paste it into the editor.
4. Click **Run**. You should see "Success. No rows returned."

### 3. Get your API credentials
1. In Supabase, go to **Project Settings** (gear icon) → **API**.
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`).
3. Copy the **anon public** key (a long string starting with `eyJ...`).

### 4. Add credentials to the code
1. Open `src/supabaseClient.js` in this repo.
2. Replace `YOUR_PROJECT_REF.supabase.co` with your Project URL.
3. Replace `YOUR_ANON_PUBLIC_KEY` with your anon key.
4. Save.

### 5. Push to GitHub
1. Create a new **public** GitHub repo named `delta-submit` (or any name — just update `vite.config.js` and `package.json`'s `homepage` field to match).
2. Push this project to it:
   ```bash
   git init
   git add .
   git commit -m "Initial delta-submit setup"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/delta-submit.git
   git push -u origin main
   ```

### 6. Enable GitHub Pages
1. In your GitHub repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) will automatically build and deploy on every push to `main`.
4. After a minute or two, your site will be live at:
   `https://YOUR_USERNAME.github.io/delta-submit/`

That's it — share that URL with your students.

---

## Changing the instructor passcode

Open `src/App.jsx`, find this line near the top:
```js
const INSTRUCTOR_PASSCODE = "delta2026";
```
Change it, save, commit, and push — the live site updates automatically.

⚠️ Note: this is a basic client-side gate, not real security. It stops casual snooping but the code is visible to anyone who opens browser dev tools. Don't rely on it for sensitive data.

---

## Local development (optional)

If you want to test changes on your own machine before pushing:
```bash
npm install
npm run dev
```
This runs the app locally at `http://localhost:5173`.

---

## Notes on the database

- Notebook files are stored as base64 text in the `content` column. Free-tier Supabase gives you 500MB of database storage — plenty for a 20-day cohort of typical `.ipynb` files.
- The `submissions` table has open read/write/delete policies (`anon` role) so the app works without a login system. Anyone with your Supabase URL and anon key could technically read/write the table directly (not just via the app) — this is fine for a low-stakes class tool, but don't reuse this Supabase project for anything sensitive.
