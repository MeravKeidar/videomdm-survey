# Deployment Guide

The survey is a static site hosted on **GitHub Pages** (always-on, free).
Data is collected via a **Google Apps Script** web app that writes to a Google Sheet.

---

## Step 1 — Create a NEW Google Sheet

1. Go to [sheets.new](https://sheets.new) — this creates a blank spreadsheet.
2. Name it something like **"Motion Survey v2 — Responses"**.
3. Copy its ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_LONG_STRING`**`/edit`

> Use a *new* sheet, not the v1 one. Survey v2 compares a different set of
> methods, so mixing both into one sheet makes the results ambiguous.

## Step 2 — Set up the Google Apps Script

1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Delete the default `function myFunction() {}` and paste all of `apps_script.js`.
3. Replace `PASTE_NEW_SHEET_ID_HERE` with the sheet ID from Step 1.
4. Click **Save** (disk icon). Name the project e.g. "Motion Survey v2".
5. Select `addHeaders` in the function dropdown, click **Run**.
   - First run prompts for authorization: **Review permissions → your account →
     Advanced → Go to (project name) → Allow**.
   - Check the sheet now has a header row.
6. Click **Deploy → New deployment**:
   - Gear icon → type **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy**, then copy the web app URL.
7. Paste the URL into `config.js`:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ID/exec";
   ```

> Note: after any later edit to the script you must **Deploy → New deployment**
> again (or Manage deployments → edit → New version). Saving alone does not
> update the live endpoint.

---

## Step 3 — Push to GitHub

```bash
cd /home/merav/Projects/videoMDM/survey_v2

git init
git add index.html style.css survey.js config.js videos/
git commit -m "Initial survey"

# Create a repo on github.com (e.g. "videomdm-survey"), then:
git remote add origin https://github.com/YOUR_USERNAME/videomdm-survey.git
git push -u origin main
```

---

## Step 4 — Enable GitHub Pages

1. Go to your repo on github.com → **Settings → Pages**.
2. Source: **Deploy from a branch** → branch `main`, folder `/ (root)`.
3. Click **Save**.
4. After ~1 minute your survey is live at:
   `https://YOUR_USERNAME.github.io/videomdm-survey/`

That's it — share that URL with evaluators. No server, no tunnel.

---

## Adding a new method in the future

```bash
# 1. Copy videos
mkdir survey/videos/new_method
cp /path/to/new_method/sample*.mp4 survey/videos/new_method/

# 2. Add to survey.js
# Find the METHODS array and append "new_method"

# 3. Push
git add videos/new_method survey.js
git commit -m "Add new_method"
git push
```

GitHub Pages redeploys automatically on every push.
