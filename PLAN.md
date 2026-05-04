# Human Evaluation Survey — Project Plan

## Overview

A web-based pairwise preference survey for evaluating human motion generation quality.
Evaluators watch two side-by-side motion clips for the same text prompt and pick the more realistic one.
Responses are collected via Google Forms.

---

## Data

- **20 text prompts** — `checkpoints_from_remote/fit3d/sample_20_prompts.txt`
- **3 methods**, each with 20 videos (`sample00.mp4`–`sample19.mp4`, 1920×1080, ~6 s, no audio):
  - `fit3d_mdm_on_wham` — MDM on WHAM
  - `ours` — Our method
  - `ours_pnp` — Our method + PNP
- Video source: `videoMDMviz/outputs/fit3d/<method>/video/sampleXX.mp4`
- The code and structure are kept flexible so additional methods can be added in the future.

---

## Design Decisions

| Question | Decision | Reason |
|---|---|---|
| Comparisons per session | All 20 prompts in one session | Standard for paper evaluations |
| Which 2 of 3 methods shown per prompt | Randomly chosen, seeded per session | Balances coverage across evaluators |
| Left/right assignment | Randomized per user per prompt | Removes position bias |
| When can the user vote | Only after **both** videos have played to completion | Ensures both clips are watched |
| Replay | Yes, per-video Replay button | Lets evaluators re-watch before deciding |
| Method names shown to evaluator | Hidden — shown only as "Video A" / "Video B" | Blind evaluation |
| Evaluator identity | Optional name/ID field | Allows tracking without forcing login |
| Data collection | Google Form (one submission at end of session) | Centralized, shareable, no backend needed |
| Hosting | Python HTTP server + ngrok tunnel | Simple remote access without a cloud deploy |

---

## File Structure

```
survey/
├── index.html              # Single-page survey UI
├── style.css               # Styling
├── survey.js               # All survey logic
├── config.js               # Google Form entry IDs — fill in after creating the form
├── server.py               # Python HTTP server (handles video range requests)
├── extract_form_ids.py     # Helper: auto-extracts entry IDs from a Google Form URL
├── PLAN.md                 # This file
└── videos/                 # Symlinks — no disk copy of videos needed
    ├── fit3d_mdm_on_wham   -> videoMDMviz/outputs/fit3d/fit3d_mdm_on_wham/video/
    ├── ours                -> videoMDMviz/outputs/fit3d/ours/video/
    └── ours_pnp            -> videoMDMviz/outputs/fit3d/ours_pnp/video/
```

---

## Survey Flow

### Screen 1 — Welcome
- Brief task description ("watch two clips, pick the more realistic one")
- Optional name/ID text field
- "Start" button

### Screens 2–21 — One prompt per screen (20 total)

```
  ┌─────────────────────────────────────────────────┐
  │  Prompt 7 of 20                    ████████░░   │
  │  "a person is performing push-ups."             │
  │                                                 │
  │  [ Video A  ▶ ]         [ Video B  ▶ ]          │
  │     (autoplay, muted)      (autoplay, muted)    │
  │                                                 │
  │  [↻ Replay A]           [↻ Replay B]            │
  │                                                 │
  │  [ ← Video A is better ]  [ Video B is better →]│
  │        (disabled until both videos finish)      │
  └─────────────────────────────────────────────────┘
```

- Both videos autoplay simultaneously when the screen loads.
- Choice buttons are **disabled** (grayed out) until both `video.onended` events fire.
- Replay resets and replays only that video; choice buttons re-lock until both have ended again.
- Clicking a choice records the answer and advances to the next prompt.
- A progress bar shows current position (e.g. 7/20).

### Screen 22 — Submitting
- Spinner + "Submitting your responses…"
- JS encodes all 20 answers and POSTs to Google Form via `fetch` with `mode: 'no-cors'`.

### Screen 23 — Done
- "Thank you! Your responses have been recorded."

---

## Answer Encoding

Each of the 20 Google Form text fields stores a structured string:

```
methodLeft=ours|methodRight=fit3d_mdm_on_wham|winner=left|winnerMethod=ours
```

This records:
- Which two methods were compared
- Which side each method was on (for position-bias analysis)
- Which side the evaluator chose
- The winning method name (for easy tabulation)

---

## Randomization

A seeded LCG (linear congruential generator) is initialized once per session from `Math.random()` and stored in `sessionStorage`.

For each prompt `i`:
1. Shuffle the 3 methods with the RNG → take the first 2 as the pair.
2. Flip a coin with the RNG → assign the pair to left/right.

This is reproducible within a session (page refresh keeps the same seed) but unique across sessions.

---

## Google Form Setup

### Step 1 — Create the form

1. Go to [forms.google.com](https://forms.google.com) and create a new blank form.
2. Title: **"Motion Generation Survey — Responses"**
3. Add these fields (all **Short answer**, all **not required**):

   | Field title | Type |
   |---|---|
   | Prompt 00 result | Short answer |
   | Prompt 01 result | Short answer |
   | … | … |
   | Prompt 19 result | Short answer |

   Total: **20 fields**.

4. Under **Responses → Link to Sheets** — connect to a Google Sheet for easy analysis.

### Step 2 — Get the form URL and entry IDs

Run the helper script:
```bash
python3 extract_form_ids.py "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform"
```

It prints the `actionUrl` and all 21 `entry.XXXXXXXXXX` IDs ready to paste into `config.js`.

### Step 3 — Fill in `config.js`

Paste the output from Step 2 into `config.js`.

---

## Running the Server

```bash
cd /home/merav/Projects/videoMDM/survey
python3 server.py          # starts on http://localhost:8000
```

### Remote access via ngrok

```bash
# In a second terminal:
ngrok http 8000
# Share the https://xxxx.ngrok.io URL with evaluators
```

---

## Data Analysis

After collecting responses, export the linked Google Sheet as CSV. A short Python/pandas script can:

1. Parse each `prompt_XX_result` field.
2. Count wins per method per prompt.
3. Compute overall win rate per method.
4. Run a binomial test or Bradley–Terry model for statistical significance.

---

## Adding a New Method (Future)

1. Add the video directory symlink:
   ```bash
   ln -sfn /path/to/new_method/video /home/merav/Projects/videoMDM/survey/videos/new_method
   ```
2. Add the method name to the `METHODS` array at the top of `survey.js`:
   ```js
   const METHODS = ["fit3d_mdm_on_wham", "ours", "ours_pnp", "new_method"];
   ```
3. No other code changes needed — the pairing and randomization logic is method-count agnostic.
