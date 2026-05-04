# Deployment Guide

The survey is a static site hosted on **GitHub Pages** (always-on, free).
Data is collected via a **Google Apps Script** web app that writes to a Google Sheet.

---

## Step 1 — Set up the Google Apps Script

1. Go to [script.google.com](https://script.google.com) and create a **New project**.
2. Delete the default code, paste the contents of `apps_script.js`.
3. Click **Save**.
4. Run `addHeaders` once manually (click ▶ with `addHeaders` selected) — this adds column names to your sheet.
5. Click **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and copy the web app URL.
6. Paste the URL into `config.js`:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ID/exec";
   ```

---

## Step 2 — Push to GitHub

```bash
cd /home/merav/Projects/videoMDM/survey

git init
git add index.html style.css survey.js config.js videos/
git commit -m "Initial survey"

# Create a repo on github.com (e.g. "videomdm-survey"), then:
git remote add origin https://github.com/YOUR_USERNAME/videomdm-survey.git
git push -u origin main
```

---

## Step 3 — Enable GitHub Pages

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
