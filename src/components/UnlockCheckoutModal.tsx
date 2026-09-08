import React, { useEffect, useState } from "react";
import { Check, HeartHandshake, Smartphone, X } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/mock/db";
import { formatTzs } from "../lib/entitlements";
import type { MobileMoneyMethod } from "../lib/mock/types";

const MOBILE: MobileMoneyMethod[] = ["M-Pesa", "Tigo Pesa", "Airtel Money"];

export type CheckoutMode = "unlock" | "bundle" | "sponsor";

type Props = {
  open: boolean;
  mode: CheckoutMode;
  seriesId?: string;
  seriesTitle?: string;
  amountTzs: number;
  onClose: () => void;
  onSuccess?: (mode: CheckoutMode) => void;
};

export default function UnlockCheckoutModal({
  open,
  mode,
  seriesId,
  seriesTitle,
  amountTzs,
  onClose,
  onSuccess,
}: Props) {
  const { lang } = useLang();
  const { user, checkPhoneExists, loginWithPhone, registerWithPhone } = useAuth();
  const [method, setMethod] = useState<MobileMoneyMethod | "Card">("M-Pesa");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [newAccount, setNewAccount] = useState(false);
  const [anonymous, setAnonymous] = useState(true);
  const [target, setTarget] = useState("Watoto na wasikilizaji wa bure");
  const [phase, setPhase] = useState<"form" | "push" | "done" | "error">("form");
  const [error, setError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState("");
  const [localMode, setLocalMode] = useState<CheckoutMode>(mode);
  const bundle = db.monetize.starterBundle();
  const firstPurchase = db.unlocks.mine().filter((u) => u.kind !== "SPONSORED_GRANT").length === 0;

  useEffect(() => {
    if (open) {
      setPhase("form");
      setError(null);
      setPassword("");
      setPhone(user?.phone || "");
      setLocalMode(mode);
      setNewAccount(false);
    }
  }, [open, user?.phone, mode]);

  if (!open) return null;

  const copy =
    localMode === "sponsor"
      ? {
          kicker: "Sadaqah",
          title: lang === "sw" ? "Wape wengine pia" : "Share this blessing",
          body:
            lang === "sw"
              ? "Ikiwa hadithi hii imekunufaisha, unaweza kufungua ufikiaji kwa mwingine — kwa bei ileile, bila kujitangaza."
              : "If this story has helped you, you may open it for someone else — same amount, quietly, without display.",
          done:
            lang === "sw"
              ? "Allah akubali. Zawadi yako itafika kwa wasikilizaji wanaohitaji."
              : "May Allah accept it. Your gift will reach listeners who need it.",
          cta:
            method === "Card"
              ? lang === "sw"
                ? "Toa kwa kadi"
                : "Give by card"
              : lang === "sw"
              ? `Thibitisha sadaqah (${method})`
              : `Confirm sadaqah (${method})`,
        }
      : localMode === "bundle"
      ? {
          kicker: lang === "sw" ? "Anza kwa urahisi" : "A gentle start",
          title: lang === "sw" ? "Tatu kwa bei ya mbili" : "Three stories, price of two",
          body:
            lang === "sw"
              ? "Vipindi vya kwanza vimeshasikiliza bure. Hiki ni malipo ya mara moja — bila kuisha, bila kushinikiza."
              : "You have already received the free opening episodes. This is a single payment — no expiry, no pressure.",
          done:
            lang === "sw"
              ? "Barakallah feek. Hadithi hizi ziko mikononi mwako."
              : "Barakallah feek. These stories are now with you.",
          cta:
            method === "Card"
              ? lang === "sw"
                ? "Thibitisha kwa kadi"
                : "Confirm by card"
              : lang === "sw"
              ? `Thibitisha kwa ${method}`
              : `Confirm with ${method}`,
        }
      : {
          kicker: lang === "sw" ? "Karibu kuendelea" : "You are welcome to continue",
          title: lang === "sw" ? "Endelea kwa utulivu" : "Continue in ease",
          body:
            lang === "sw"
              ? "Kipindi cha kwanza ni bure daima. Vipindi 2 na 3 ni zawadi ya kuingia. Ukitaka kutoka kipindi cha 4, lipa mara moja — hadithi inabaki kwako."
              : "Episode 1 is free forever. Episodes 2 and 3 are the welcome gift. From episode 4, one payment keeps the rest with you."
          done:
            lang === "sw"
              ? "Barakallah feek. Hadithi iko mikononi mwako."
              : "Barakallah feek. This story is now yours.",
          cta:
            method === "Card"
              ? lang === "sw"
                ? "Thibitisha kwa kadi"
                : "Confirm by card"
              : lang === "sw"
              ? `Thibitisha kwa ${method}`
              : `Confirm with ${method}`,
        };

  async function ensureSession() {
    if (user) return true;
    const clean = phone.trim();
    if (clean.length < 8) {
      setError(lang === "sw" ? "Weka namba ya simu kuendelea." : "Enter your phone number to continue.");
      return false;
    }
    if (password.length < 6) {
      setError(
        lang === "sw"
          ? "Weka nywila (angalau herufi 6) — tunaiomba tu wakati wa kufungua."
          : "Enter a password (at least 6 characters) — we only ask at unlock.",
      );
      return false;
    }
    const check = await checkPhoneExists(clean);
    if (check.error) {
      setError(check.error);
      return false;
    }
    if (check.exists) {
      const res = await loginWithPhone(clean, password);
      if (!res.ok) {
        setError(res.error || (lang === "sw" ? "Nywila si sahihi." : "Incorrect password."));
        setNewAccount(false);
        return false;
      }
      return true;
    }
    const res = await registerWithPhone(
      (fullName || "Msikilizaji").trim(),
      clean,
      password,
      lang,
    );
    if (!res.ok) {
      setError(res.error || (lang === "sw" ? "Imeshindikana kufungua akaunti." : "Could not create account."));
      setNewAccount(true);
      return false;
    }
    return true;
  }

  async function pay() {
    setError(null);
    setPhase("push");
    try {
      const ok = await ensureSession();
      if (!ok) {
        setPhase("form");
        return;
      }
      if (localMode === "sponsor") {
        if (!seriesId) throw new Error("Missing series");
        const gift = await db.sponsorships.create({
          seriesId,
          paymentMethod: method,
          anonymous,
          targetLabel: target,
        });
        setRefCode(gift.referenceCode);
      } else {
        const res = await db.unlocks.request({
          seriesId,
          kind: localMode === "bundle" ? "BUNDLE" : "PURCHASE",
          paymentMethod: method,
          phone,
        });
        setRefCode(res.unlocks[0]?.referenceCode || "");
      }
      try {
        sessionStorage.removeItem("qisas.pendingUnlock");
      } catch {
        /* ignore */
      }
      setPhase("done");
      onSuccess?.(localMode);
    } catch (err: any) {
      setError(err?.message || (lang === "sw" ? "Tafadhali jaribu tena, kwa utulivu." : "Please try again when you are ready."));
      setPhase("error");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-warm-white shadow-2xl overflow-hidden">
        <div className="bg-deep-green px-5 pt-5 pb-6 text-warm-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-light/90">
                {copy.kicker}
              </div>
              <h3 className="font-display text-[22px] font-bold mt-1 leading-snug">{copy.title}</h3>
              {seriesTitle && (
                <p className="text-sm text-gold-light/90 mt-1.5 line-clamp-2">{seriesTitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label={lang === "sw" ? "Funga" : "Close"}
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 inline-flex items-baseline gap-2 rounded-full bg-gold/95 px-3.5 py-1.5 text-deep-green">
            <span className="text-sm font-black">
              {formatTzs(localMode === "bundle" ? bundle?.amountTzs || 2000 : amountTzs)}
            </span>
            <span className="text-[11px] font-semibold opacity-80">
              {localMode === "bundle"
                ? lang === "sw"
                  ? "mara moja"
                  : "one time"
                : lang === "sw"
                ? "mara moja, milele"
                : "once, forever"}
            </span>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          {phase === "done" ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 text-center">
              <Check className="mx-auto text-emerald-700" size={26} />
              <p className="mt-3 font-display text-[17px] text-deep-green leading-snug">{copy.done}</p>
              {refCode && <p className="mt-2 text-[11px] text-muted font-mono">{refCode}</p>}
              <button type="button" onClick={onClose} className="btn-primary mt-5 w-full">
                {lang === "sw" ? "Alhamdulillah, endelea" : "Alhamdulillah — continue"}
              </button>
            </div>
          ) : phase === "push" ? (
            <div className="rounded-2xl border border-line bg-white p-6 text-center">
              <Smartphone className="mx-auto text-gold" size={28} />
              <p className="mt-3 font-display text-lg text-deep-green">
                {method === "Card"
                  ? lang === "sw"
                    ? "Tafadhali subiri kidogo…"
                    : "A moment, please…"
                  : lang === "sw"
                  ? `Angalia simu yako — ${method}`
                  : `Please check your phone — ${method}`}
              </p>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                {lang === "sw"
                  ? "Thibitisha kwa utulivu kwenye simu. Baada ya hapo, ufikiaji hautaisha."
                  : "Confirm gently on your phone. After that, access does not expire."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-[13px] text-ink/80 leading-relaxed">{copy.body}</p>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                  {lang === "sw" ? "Njia unayopendelea" : "A way that is easy for you"}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MOBILE.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`rounded-xl border px-2 py-2.5 text-[11px] font-bold ${
                        method === m ? "border-gold bg-gold/15 text-deep-green" : "border-line bg-white text-ink"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMethod("Card")}
                  className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-[11px] text-left ${
                    method === "Card" ? "border-gold bg-gold/10 text-deep-green" : "border-dashed border-line text-muted"
                  }`}
                >
                  {lang === "sw" ? "Kadi — ikiwa ni rahisi zaidi" : "Card — if that is easier"}
                </button>
              </div>

              {method !== "Card" && (
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {lang === "sw" ? "Namba ya simu" : "Phone number"}
                  </span>
                  <input
                    className="field-box mt-1"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                  />
                </label>
              )}

              {!user && (
                <div className="space-y-2 rounded-2xl border border-gold/30 bg-gold/5 p-3">
                  <p className="text-[11px] text-muted leading-relaxed">
                    {lang === "sw"
                      ? "Simu inaombwa tu unapotaka kufungua. Unaweza kuvinjari bila kuingia."
                      : "We only ask for your phone when you unlock. Browsing stays open."}
                  </p>
                  {method === "Card" && (
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        {lang === "sw" ? "Namba ya simu" : "Phone number"}
                      </span>
                      <input
                        className="field-box mt-1"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0712 345 678"
                      />
                    </label>
                  )}
                  {newAccount && (
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        {lang === "sw" ? "Jina" : "Name"}
                      </span>
                      <input
                        className="field-box mt-1"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={lang === "sw" ? "Jina lako" : "Your name"}
                      />
                    </label>
                  )}
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {lang === "sw" ? "Nywila" : "Password"}
                    </span>
                    <input
                      type="password"
                      className="field-box mt-1"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={lang === "sw" ? "Angalau herufi 6" : "At least 6 characters"}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewAccount((v) => !v)}
                    className="text-[11px] font-bold text-deep-green hover:underline"
                  >
                    {newAccount
                      ? lang === "sw"
                        ? "Nina akaunti tayari"
                        : "I already have an account"
                      : lang === "sw"
                        ? "Ni mara yangu ya kwanza — unda akaunti"
                        : "First time — create an account"}
                  </button>
                </div>
              )}

              {firstPurchase && localMode !== "sponsor" && (
                <button
                  type="button"
                  onClick={() => setLocalMode(localMode === "bundle" ? "unlock" : "bundle")}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-[12px] ${
                    localMode === "bundle"
                      ? "border-gold bg-gold/15 text-deep-green"
                      : "border-line bg-white text-ink"
                  }`}
                >
                  <span className="font-bold">
                    {lang === "sw" ? "Kifurushi cha kuanza" : "Starter bundle"}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {lang === "sw"
                      ? `Hadithi 3 kwa bei ya 2 — ${formatTzs(bundle?.amountTzs || 2000)}, mara moja.`
                      : `3 stories for the price of 2 — ${formatTzs(bundle?.amountTzs || 2000)}, once.`}
                  </span>
                </button>
              )}

              {localMode === "sponsor" && (
                <>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {lang === "sw" ? "Nani afaidike" : "Who should receive it"}
                    </span>
                    <select
                      className="field-box mt-1"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      <option value="Watoto na wasikilizaji wa bure">
                        {lang === "sw" ? "Watoto na wasikilizaji wa bure" : "Children and free listeners"}
                      </option>
                      <option value="Watoto wa Tanzania">
                        {lang === "sw" ? "Watoto wa Tanzania" : "Children in Tanzania"}
                      </option>
                      <option value="Madrasa">Madrasa</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-ink">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="accent-gold"
                    />
                    {lang === "sw" ? "Toa bila jina — hii ndiyo kawaida" : "Give without a name — this is the default"}
                  </label>
                </>
              )}

              {error && <p className="text-xs text-red-700 bg-red-50 rounded-xl p-2.5">{error}</p>}

              <button type="button" onClick={pay} className="btn-primary w-full flex items-center justify-center gap-2">
                {localMode === "sponsor" ? <HeartHandshake size={16} /> : <Smartphone size={16} />}
                {copy.cta}
              </button>
              <p className="text-[11px] text-center text-muted leading-relaxed">
                {lang === "sw"
                  ? "Hakuna kufanya upya. Unaweza kufunga dirisha hili wakati wowote."
                  : "No renewal. You may close this whenever you wish."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
