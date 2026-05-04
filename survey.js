"use strict";

// ─── Methods ───────────────────────────────────────────────────────────────
// To add a future method: append its folder name here and add the symlink
// under videos/. No other changes needed.
const METHODS = [
  "fit3d_mdm_on_wham",
  "ours",
  "ours_pnp",
];

// ─── Prompts ───────────────────────────────────────────────────────────────
const PROMPTS = [
  "a person is starting overhead extension thrusters.",
  "a person is performing walk the box.",
  "a person is starting diamond push-ups.",
  "a person is performing push-ups.",
  "a person is performing dumbbell hammer curls.",
  "a person is starting dumbbell biceps curls.",
  "a person is performing barbell dead rows.",
  "a person is performing deadlifts.",
  "a person is starting clean and presses.",
  "a person is starting squats.",
  "a person is starting man makers.",
  "a person is starting barbell shrugs.",
  "a person is performing man makers.",
  "a person is starting dumbbell curl trifectas.",
  "a person is starting band pull-aparts.",
  "a person is starting burpees.",
  "a person is performing diamond push-ups.",
  "a person is performing burpees.",
  "a person is performing barbell shrugs.",
  "a person is starting mule kicks.",
];

// ─── Seeded RNG (Park-Miller LCG) ──────────────────────────────────────────
class RNG {
  constructor(seed) {
    this.s = Math.abs(Math.floor(seed * 2147483646)) % 2147483646 + 1;
  }
  next() {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// ─── Session state ─────────────────────────────────────────────────────────
const state = {
  currentIdx: 0,
  // [{promptIdx, methodLeft, methodRight, winner:"left"|"right", winnerMethod}]
  answers: [],
  // pre-computed pair assignments for all prompts
  pairs: [],
  leftEnded: false,
  rightEnded: false,
};

// ─── Session init ──────────────────────────────────────────────────────────
function initSession() {
  let seed = sessionStorage.getItem("survey_seed");
  if (!seed) {
    seed = String(Math.random());
    sessionStorage.setItem("survey_seed", seed);
  }
  const rng = new RNG(parseFloat(seed));

  for (let i = 0; i < PROMPTS.length; i++) {
    const shuffled = rng.shuffle(METHODS);
    const methodA  = shuffled[0];
    const methodB  = shuffled[1];
    const leftIsA  = rng.next() > 0.5;
    state.pairs.push({
      methodLeft:  leftIsA ? methodA : methodB,
      methodRight: leftIsA ? methodB : methodA,
    });
  }
}

// ─── Screen management ─────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function videoPath(method, promptIdx) {
  return `videos/${method}/sample${String(promptIdx).padStart(2, "0")}.mp4`;
}

function setSpinner(side, visible) {
  document.getElementById(`spinner-${side}`).classList.toggle("visible", visible);
}

function updateWaitingMsg() {
  const msg = document.getElementById("waiting-msg");
  if (state.leftEnded && state.rightEnded) {
    msg.classList.add("hidden");
  } else if (state.leftEnded) {
    msg.textContent = "Waiting for Video B to finish…";
    msg.classList.remove("hidden");
  } else if (state.rightEnded) {
    msg.textContent = "Waiting for Video A to finish…";
    msg.classList.remove("hidden");
  } else {
    msg.textContent = "Watch both videos to unlock the choice…";
    msg.classList.remove("hidden");
  }
}

// ─── Comparison screen ─────────────────────────────────────────────────────
function loadComparison(idx) {
  const { methodLeft, methodRight } = state.pairs[idx];
  state.leftEnded  = false;
  state.rightEnded = false;

  const pct = (idx / PROMPTS.length) * 100;
  document.getElementById("progress-fill").style.width = `${pct}%`;
  document.getElementById("progress-label").textContent = `${idx + 1} / ${PROMPTS.length}`;
  document.getElementById("prompt-text").textContent = PROMPTS[idx];

  document.getElementById("btn-left").disabled  = true;
  document.getElementById("btn-right").disabled = true;
  updateWaitingMsg();

  loadVideo("left",  methodLeft,  idx);
  loadVideo("right", methodRight, idx);
}

function loadVideo(side, method, promptIdx) {
  const video = document.getElementById(`video-${side}`);
  setSpinner(side, true);

  video.src = videoPath(method, promptIdx);
  video.load();

  video.oncanplay = () => {
    setSpinner(side, false);
    video.play().catch(() => {});
  };

  video.onended = () => onVideoEnded(side);

  video.onerror = () => {
    console.error(`Failed to load: ${video.src}`);
    setSpinner(side, false);
    onVideoEnded(side);  // allow survey to continue even if a video is missing
  };
}

function onVideoEnded(side) {
  if (side === "left")  state.leftEnded  = true;
  else                  state.rightEnded = true;

  updateWaitingMsg();

  if (state.leftEnded && state.rightEnded) {
    document.getElementById("btn-left").disabled  = false;
    document.getElementById("btn-right").disabled = false;
  }
}

function replayVideo(side) {
  // Only reset the replayed side — the other stays marked as ended
  if (side === "left")  state.leftEnded  = false;
  else                  state.rightEnded = false;

  document.getElementById("btn-left").disabled  = true;
  document.getElementById("btn-right").disabled = true;
  updateWaitingMsg();

  const video = document.getElementById(`video-${side}`);
  video.currentTime = 0;
  video.play().catch(() => {});
}

function recordChoice(winner) {
  const idx = state.currentIdx;
  const { methodLeft, methodRight } = state.pairs[idx];
  state.answers.push({
    promptIdx:    idx,
    methodLeft,
    methodRight,
    winner,
    winnerMethod: winner === "left" ? methodLeft : methodRight,
  });

  state.currentIdx++;
  if (state.currentIdx < PROMPTS.length) {
    loadComparison(state.currentIdx);
  } else {
    submitSurvey();
  }
}

// ─── Submission ─────────────────────────────────────────────────────────────
async function submitSurvey() {
  showScreen("screen-submitting");

  try {
    await fetch(APPS_SCRIPT_URL, {
      method:  "POST",
      mode:    "no-cors",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ answers: state.answers }),
    });
  } catch (e) {
    console.error("Submission error:", e);
  }

  setTimeout(() => showScreen("screen-done"), 1200);
}

// ─── Entry point ───────────────────────────────────────────────────────────
function init() {
  initSession();

  document.getElementById("btn-start").addEventListener("click", () => {
    showScreen("screen-comparison");
    loadComparison(0);
  });

  document.getElementById("btn-replay-left").addEventListener("click",  () => replayVideo("left"));
  document.getElementById("btn-replay-right").addEventListener("click", () => replayVideo("right"));
  document.getElementById("btn-left").addEventListener("click",  () => recordChoice("left"));
  document.getElementById("btn-right").addEventListener("click", () => recordChoice("right"));
}

document.addEventListener("DOMContentLoaded", init);
