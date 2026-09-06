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
  const { user } = useAuth();
  const [method, setMethod] = useState<MobileMoneyMethod | "Card">("M-Pesa");
  const [phone, setPhone] = useState(user?.phone || "");
  const [anonymous, setAnonymous] = useState(true);
  const [target, setTarget] = useState("Watoto na wasikilizaji wa bure");
  const [phase, setPhase] = useState<"form" | "push" | "done" | "error">("form");
  const [error, setError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    if (open) {
      setPhase("form");
      setError(null);
      setPhone(user?.phone || "");
    }
  }, [open, user?.phone]);

  if (!open) return null;

  const copy =
    mode === "sponsor"
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
      : mode === "bundle"
      ? {
          kicker: lang === "sw" ? "Anza kwa urahisi" : "A gentle start",
          title: lang === "sw" ? "Tatu kwa bei ya mbili" : "Three stories, price of two",
          body:
            lang === "sw"
              ? "Vipindi 3 vya kila hadithi vimeshasikiliza bure. Hiki ni malipo ya mara moja — bila kuisha, bila kushinikiza."
              : "You have already received three free episodes in each story. This is a single, unhurried payment — no expiry, no pressure.",
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
              ? "Asante kwa kusikiliza vipindi vitatu vya kwanza. Ukitaka yaliyobaki, lipa mara moja — hadithi inabaki kwako, bila kuisha."
              : "Thank you for listening to the first three episodes. If you wish to continue, one payment keeps the rest with you — calmly, and for good.",
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

  async function pay() {
    setError(null);
    setPhase("push");
    await new Promise((r) => setTimeout(r, 1600));
    try {
      if (mode === "sponsor") {
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
          kind: mode === "bundle" ? "BUNDLE" : "PURCHASE",
          paymentMethod: method,
          phone,
        });
        setRefCode(res.unlocks[0]?.referenceCode || "");
      }
      setPhase("done");
      onSuccess?.(mode);
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
            <span className="text-sm font-black">{formatTzs(amountTzs)}</span>
            <span className="text-[11px] font-semibold opacity-80">
              {mode === "bundle"
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

              {mode === "sponsor" && (
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
                {mode === "sponsor" ? <HeartHandshake size={16} /> : <Smartphone size={16} />}
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
