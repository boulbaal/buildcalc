/* BuildCalc shared helpers. No dependencies, no build step, works offline. */
"use strict";

/* ===== Donation config: fill these in once, all pages update. Leave empty to hide. ===== */
const DONATE = {
  paypal: "",   /* e.g. "https://paypal.me/yourname" */
  kofi: ""      /* e.g. "https://ko-fi.com/yourname" */
};

/* Format a number: max `dec` decimals, no trailing zeros, US locale. */
function fmt(n, dec = 2) {
  if (!isFinite(n)) return "–";
  return Number(n.toFixed(dec)).toLocaleString("en-US", { maximumFractionDigits: dec });
}

function debounce(fn, ms = 150) {
  let t;
  return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

/* Read a positive number from an input. Marks the field invalid + shows message.
   Returns NaN when invalid/empty; allowZero permits 0. */
function readNum(input, { allowZero = false, required = true } = {}) {
  const errEl = document.getElementById(input.id + "-error");
  const raw = input.value.trim();
  let msg = "";
  let v = NaN;
  if (raw === "") {
    if (required) msg = "Enter a value.";
  } else {
    v = Number(raw.replace(",", "."));
    if (!isFinite(v)) msg = "Enter a valid number.";
    else if (v < 0) msg = "Must be positive.";
    else if (v === 0 && !allowZero) msg = "Must be greater than zero.";
  }
  input.setAttribute("aria-invalid", msg ? "true" : "false");
  if (errEl) errEl.textContent = msg;
  return msg ? NaN : v;
}

/* Unit toggle: buttons with data-units inside .units; body gets data-units attr.
   onSwitch(units) is called after switching. */
function initUnits(onSwitch) {
  const group = document.querySelector(".units");
  if (!group) return;
  const btns = group.querySelectorAll("button[data-units]");
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      document.body.dataset.units = b.dataset.units;
      onSwitch(b.dataset.units);
    });
  });
}
function currentUnits() { return document.body.dataset.units || "imperial"; }

/* Show/hide unit-specific labels: elements with data-if-units="imperial|metric". */
function applyUnitVisibility() {
  const u = currentUnits();
  document.querySelectorAll("[data-if-units]").forEach((el) => {
    el.hidden = el.dataset.ifUnits !== u;
  });
}

/* Reveal the donation block after a first successful result. */
let donateShown = false;
function showDonate() {
  if (donateShown) return;
  const box = document.getElementById("donate");
  if (!box) return;
  if (!DONATE.paypal && !DONATE.kofi) return; /* not configured yet: stay hidden */
  const pp = box.querySelector("[data-donate=paypal]");
  const kf = box.querySelector("[data-donate=kofi]");
  if (pp) { if (DONATE.paypal) pp.href = DONATE.paypal; else pp.remove(); }
  if (kf) { if (DONATE.kofi) kf.href = DONATE.kofi; else kf.remove(); }
  box.hidden = false;
  donateShown = true;
}

/* Wire every input/select in the calc card to a recompute function. */
function bindInputs(compute) {
  const run = debounce(compute, 120);
  document.querySelectorAll(".calc input, .calc select").forEach((el) => {
    el.addEventListener("input", run);
    el.addEventListener("change", run);
  });
}
