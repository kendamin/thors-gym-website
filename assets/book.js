/* Book a trial session: shared by Option A and Option B.
   Any element with [data-book] opens #bookDialog; data-book="pilates" preselects a service.
   The page stays static: we only write the message for the visitor, then hand it to
   SMS (pre-filled body) or Messenger (copied, because m.me links can't pre-fill text). */
(() => {
  const dlg = document.getElementById("bookDialog");
  if (!dlg) return;
  const PHONE = "+639629662218", PAGE_ID = "100087479229671";
  const form = dlg.querySelector(".book-form");
  const svc = form.elements.svc, day = form.elements.day, when = form.elements.when, name = form.elements.name;
  const priceEl = dlg.querySelector("#bookPrice"), warnEl = dlg.querySelector("#bookWarn");
  const preview = dlg.querySelector("#bookPreview"), sms = dlg.querySelector("#bookSms");
  const fbBtn = dlg.querySelector("#bookFb"), toast = dlg.querySelector("#bookToast");
  const isPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  const inFacebookApp = /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram/i.test(navigator.userAgent);

  // earliest selectable day = today in the Philippines
  const todayPH = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
  day.min = todayPH;

  const dayLabel = () => {
    if (!day.value) return "";
    const d = new Date(day.value + "T12:00:00+08:00");
    return new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", weekday: "long", month: "short", day: "numeric" }).format(d);
  };
  const isSunday = () => day.value && new Date(day.value + "T12:00:00+08:00").getUTCDay() === 0;

  function message() {
    const opt = svc.selectedOptions[0];
    const what = opt.dataset.say;
    const dl = dayLabel();
    const time = when.value.toLowerCase();
    const who = name.value.trim();
    return `Hi Thor's Gym! I'd like to book a trial: ${what}` +
      (dl ? ` on ${dl}, in the ${time}.` : `, any day this week, in the ${time}.`) +
      (who ? ` My name is ${who}.` : "") +
      " Is there a slot available? Thank you!";
  }

  function render() {
    priceEl.textContent = svc.selectedOptions[0].dataset.price;
    const sundayMorning = isSunday() && when.value === "Morning";
    const sundayEvening = isSunday() && when.value === "Evening";
    warnEl.hidden = !(sundayMorning || sundayEvening);
    warnEl.textContent = "Heads up: on Sundays the gym is open 1 PM to 7 PM only.";
    const text = message();
    preview.textContent = text;
    if (sms) sms.href = `sms:${PHONE}?&body=${encodeURIComponent(text)}`;
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", e => e.preventDefault());

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      dlg.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch {}
      ta.remove(); return ok;
    }
  }

  fbBtn.addEventListener("click", async () => {
    const ok = await copy(message());
    toast.textContent = ok ? "Message copied. Paste it in the chat and send." : "Couldn't copy automatically. Long-press the message above to copy it.";
    if (isPhone && !inFacebookApp) location.href = `fb-messenger://user-thread/${PAGE_ID}`;
    else window.open(`https://m.me/${PAGE_ID}`, "_blank", "noopener");
  });

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-book]");
    if (!t) return;
    e.preventDefault();
    const key = t.dataset.book;
    if (key) { const o = [...svc.options].find(o => o.value === key); if (o) svc.value = key; }
    toast.textContent = "";
    render();
    dlg.showModal();
    svc.focus();
  });

  if (!("closedBy" in HTMLDialogElement.prototype)) {          // Safari: tap outside to close
    let downOutside = false;
    const outside = e => { const r = dlg.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
    dlg.addEventListener("pointerdown", e => { downOutside = outside(e); });
    dlg.addEventListener("pointerup", e => { if (downOutside && outside(e)) dlg.close(); });
  }
  render();
})();
