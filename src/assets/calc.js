/* BuildCalc shared helpers. No dependencies, no build step at runtime, works offline.
   Page scripts read translated strings through t(key, vars); the build injects
   window.T (page strings + common strings) before this file loads. */
"use strict";

/* ===== Donation config (same PayPal.me as Whenly). Empty = donation block hidden. =====
   Amount buttons link to paypal.com/paypalme/<name>/<amount><CUR>, so PayPal opens
   with the amount already filled in. Currency per language: data-currency on <html>. */
const PAYPAL_ME = "ABoullbahaiem";

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

/* Reveal the donation block after the first successful result (Whenly-style amounts). */
let donateShown = false;
function showDonate() {
  if (donateShown) return;
  const box = document.getElementById("donate");
  if (!box || !PAYPAL_ME) return;
  const cur = document.documentElement.dataset.currency || "EUR";
  const base = "https://www.paypal.com/paypalme/" + PAYPAL_ME;
  let money;
  try { money = new Intl.NumberFormat(LOCALE, { style: "currency", currency: cur, maximumFractionDigits: 0, numberingSystem: "latn" }); }
  catch (e) { money = new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }); }
  box.querySelectorAll(".amounts[data-amounts]").forEach((row) => {
    row.innerHTML = "";
    row.dataset.amounts.split(",").forEach((n) => {
      const a = document.createElement("a");
      a.className = "amount";
      a.href = base + "/" + n + cur;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = money.format(Number(n));
      row.appendChild(a);
    });
  });
  const free = box.querySelector("[data-donate-free]");
  if (free) free.href = base;
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
