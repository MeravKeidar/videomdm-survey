#!/usr/bin/env python3
"""Copy wham_new_joints clips into survey/fit3d_lift/wham_new_joints/sample{N:02d}.mp4.

For each of the 20 survey prompts, picks the first alphabetical clip whose
exercise name matches the prompt, then copies it as sampleNN.mp4.
Missing clips are reported at the end.

Usage:
    python make_wham_new_joints_samples.py
    python make_wham_new_joints_samples.py --dry_run
"""

import argparse
import re
import shutil
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
SRC_DIR    = Path("/home/merav/Projects/videoMDM/videoMDMviz/outputs/fit3d_lift/wham_new_joints/video")
DST_DIR    = SCRIPT_DIR / "fit3d_lift" / "wham_new_joints"

# Maps survey prompt index → exercise keyword to search in filename.
# None means no matching clip exists in wham_new_joints.
PROMPT_EXERCISE = {
    0:  None,              # overhead extension thrusters
    1:  None,              # walk the box
    2:  "diamond_pushup",  # starting diamond push-ups
    3:  "pushup",          # performing push-ups
    4:  None,              # dumbbell hammer curls
    5:  None,              # dumbbell biceps curls
    6:  "barbell_dead_row",# starting barbell dead rows
    7:  "deadlift",        # performing deadlifts
    8:  "clean_and_press", # starting clean and presses
    9:  "squat",           # starting squats
    10: None,              # starting man makers
    11: "barbell_shrug",   # starting barbell shrugs
    12: None,              # performing man makers
    13: None,              # dumbbell curl trifectas
    14: "band_pull_apart", # starting band pull-aparts
    15: "burpees",         # starting burpees
    16: "diamond_pushup",  # performing diamond push-ups
    17: "burpees",         # performing burpees
    18: "barbell_shrug",   # performing barbell shrugs
    19: None,              # mule kicks
}


def pick_clip(exercise: str) -> Path | None:
    """Return the first alphabetical clip with an exact exercise name match."""
    # Filename pattern: s<digits>_<exercise>__<start>_<end>.mp4
    pattern = re.compile(rf"^s\d+_{re.escape(exercise)}__[\d.]+_[\d.]+\.mp4$")
    matches = sorted(p for p in SRC_DIR.iterdir() if pattern.match(p.name))
    return matches[0] if matches else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry_run", action="store_true")
    args = ap.parse_args()

    if not SRC_DIR.is_dir():
        print(f"ERROR: source dir not found: {SRC_DIR}")
        return

    if not args.dry_run:
        DST_DIR.mkdir(parents=True, exist_ok=True)

    missing = []
    for i in range(20):
        exercise = PROMPT_EXERCISE[i]
        dst = DST_DIR / f"sample{i:02d}.mp4"

        if exercise is None:
            print(f"  sample{i:02d}  — NO MATCH (no clip for this prompt)")
            missing.append(i)
            continue

        src = pick_clip(exercise)
        if src is None:
            print(f"  sample{i:02d}  — NO MATCH for exercise '{exercise}'")
            missing.append(i)
            continue

        if args.dry_run:
            print(f"  sample{i:02d}  DRY RUN  {src.name}  →  {dst}")
        else:
            shutil.copy2(src, dst)
            print(f"  sample{i:02d}  copied   {src.name}")

    print(f"\n{'='*60}")
    print(f"Copied: {20 - len(missing)}/20")
    if missing:
        print(f"Missing samples (no clip available): {missing}")
    if not args.dry_run:
        print(f"Output: {DST_DIR}")


if __name__ == "__main__":
    main()
