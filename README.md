# delta-submit

A submission portal for collecting and reviewing assignment notebooks from students in a Data Science training program.

Students upload their `.ipynb` files for each day of the course, along with optional notes. The instructor view (passcode-protected) lets you see all submissions, filter by day, download individual notebooks, and export everything — including student notes — as a CSV for review.

Built for Cohort Delta, Data Science Advanced.

## How it works

- **Students** open the live site, enter their name, pick the assignment day, upload their notebook, and optionally add a note.
- **Instructor** unlocks a separate tab with a passcode to view, download, and manage submissions across the whole cohort.

## Stack

- React + Vite, hosted on GitHub Pages
- Supabase (Postgres) as the backend for storing submissions

---
