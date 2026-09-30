/* BuildCalc shared helpers. No dependencies, no build step at runtime, works offline.
   Page scripts read translated strings through t(key, vars); the build injects
   window.T (page strings + common strings) before this file loads. */
"use strict";

/* ===== Donation config: all pages and languages use this. Empty = hidden. ===== */
const DONATE = {
  paypal: "https://paypal.me/ABoullbahaiem",
  kofi: ""
};

const LOCALE = document.documentElement.dataset.locale || "en-US";

/* Translated string with {name} placeholders. Missing key shows the key (never crashes). */
function t(key, vars) {
  const T = window.T || {};
  let s = Object.prototype.hasOwnProperty.call(T, key) ? T[key] : key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}

/* Format a number in the page language: max `dec` decimals, Latin digits. */
const _nf = {};
function fmt(n, dec = 2) {
  if (!isFinite(n)) return "–";
  const key = dec;
  if (!_nf[key]) {
    try {
      _nf[key] = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: dec, numberingSystem: "latn" });
    } catch (e) {
      _nf[key] = new Intl.NumberFormat("en-US", { maximumFractionDigits: dec });
    }
  }
  return _nf[key].format(Number(n.toFixed(dec)));
}

function debounce(fn, ms = 150) {
  let tm;
  return function (...args) { clearTimeout(tm); tm = setTimeout(() => fn.apply(this, args), ms); };
}

/* Read a positive number from an input (accepts comma or dot as decimal separator).
   Marks the field invalid and shows a translated message. Returns NaN when invalid. */
function readNum(input, { allowZero = false, required = true } = {}) {
  const errEl = document.getElementById(input.id + "-error");
  const raw = input.value.trim();
  let msg = "";
  let v = NaN;
  if (raw === "") {
    if (required) msg = t("err_empty");
  } else {
    v = Number(raw.replace(",", "."));
    if (!isFinite(v)) msg = t("err_nan");
    else if (v < 0) msg = t("err_negative");
    else if (v === 0 && !allowZero) msg = t("err_zero");
  }
  input.setAttribute("aria-invalid", msg ? "true" : "false");
  if (errEl) errEl.textContent = msg;
  return msg ? NaN : v;
}

function currentUnits() { return document.body.dataset.units || "imperial"; }

/* Show/hide unit-specific elements: data-if-units="imperial|metric". */
function applyUnitVisibility() {
  const u = currentUnits();
  document.querySelectorAll("[data-if-units]").forEach((el) => {
    el.hidden = el.dataset.ifUnits !== u;
  });
}

/* Unit toggle. Inputs with data-imperial / data-metric get the other system's
   default when switching, but only while the user has not changed the value. */
function initUnits(onSwitch) {
  const group = document.querySelector(".units");
  const btns = group ? group.querySelectorAll("button[data-units]") : [];
  const sync = () => btns.forEach((x) => x.setAttribute("aria-pressed", x.dataset.units === currentUnits() ? "true" : "false"));
  sync();
  applyUnitVisibility();
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      const from = currentUnits();
      const to = b.dataset.units;
      if (from === to) return;
      document.querySelectorAll("input[data-imperial][data-metric]").forEach((inp) => {
        if (inp.value.trim() === inp.dataset[from]) inp.value = inp.dataset[to];
      });
      document.body.dataset.units = to;
      sync();
      applyUnitVisibility();
      if (onSwitch) onSwitch(to);
    });
  });
}

/* Reveal the donation block after the first successful result. */
let donateShown = false;
function showDonate() {
  if (donateShown) return;
  const box = document.getElementById("donate");
  if (!box) return;
  if (!DONATE.paypal && !DONATE.kofi) return;
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

/* Language switcher: <select id="lang"> with option values = target URLs. */
(function () {
  const sel = document.getElementById("lang");
  if (sel) sel.addEventListener("change", () => { if (sel.value) location.href = sel.value; });
})();
