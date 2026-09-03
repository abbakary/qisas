import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  EPISODE_MAX_SEC,
  EPISODE_MIN_SEC,
  SERIES_MAX_EPISODES,
  SERIES_MIN_EPISODES,
  checkDuration,
  fmtDuration,
} from "../../lib/content-rules";
import { db } from "../../lib/mock/db";

export default function NewEpisodePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectSlug = searchParams.get("series");

  const seriesList = useMemo(() => {
    return db.series.findMany().map((s) => ({
      ...s,
      orders: db.episodes.findBySeries(s.id).map((e) => e.order),
    }));
  }, []);

  const [seriesId, setSeriesId] = useState(() => {
    if (preselectSlug) {
      const match = seriesList.find((s) => s.slug === preselectSlug);
      if (match) return match.id;
    }
    return seriesList[0]?.id ?? "";
  });

  const sel = seriesList.find((s) => s.id === seriesId);
  const nextOrder = useMemo(() => {
    const max = sel?.orders.length ? Math.max(...sel.orders) : 0;
    return max + 1;
  }, [sel]);

  const [order, setOrder] = useState(nextOrder);
  const [title, setTitle] = useState("");
  const [titleSw, setTitleSw] = useState("");
  const [mediaType, setMediaType] = useState<"AUDIO" | "VIDEO">("AUDIO");
  const [file, setFile] = useState<File | null>(null);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; warnings?: string[] } | null>(null);
  const [orderEdited, setOrderEdited] = useState(false);

  const count = sel?.orders.length ?? 0;
  const atMax = count >= SERIES_MAX_EPISODES;
  const belowMin = count + 1 < SERIES_MIN_EPISODES;
  const effectiveOrder = orderEdited ? order : nextOrder;
  const orderClash = sel?.orders.includes(effectiveOrder) ?? false;

  const durCheck = duration != null ? checkDuration(duration) : null;

  function onSeriesChange(id: string) {
    setSeriesId(id);
    setOrderEdited(false);
    setMsg(null);
  }

  function onFile(f: File | null) {
    setFile(f);
    setDuration(null);
    setMsg(null);
    if (!f) {
      setMediaBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(f);
    setMediaBlobUrl(url);

    const isVid = f.type.startsWith("video");
    const el = document.createElement(isVid ? "video" : "audio");
    el.preload = "metadata";
    el.src = url;
    el.onloadedmetadata = () => {
      setDuration(el.duration);
    };
    if (isVid) setMediaType("VIDEO");
    else setMediaType("AUDIO");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !sel) return;
    if (atMax) {
      setMsg({ ok: false, text: `"${sel.titleSw}" already has ${SERIES_MAX_EPISODES} episodes — the maximum.` });
      return;
    }

    setProgress(15);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (!p || p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 25;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);

      const warnings: string[] = [];
      if (durCheck && !durCheck.ok && durCheck.message) {
        warnings.push(durCheck.message);
      }

      const created = db.episodes.create({
        seriesId: sel.id,
        order: effectiveOrder,
        title: title || `Episode ${effectiveOrder}`,
        titleSw: titleSw || `Kipindi ${effectiveOrder}`,
        durationSec: duration ? Math.round(duration) : 120,
        mediaUrl: mediaBlobUrl || "/media/seed/placeholder.wav",
        mediaType,
        published: true,
      });

      setTimeout(() => {
        setProgress(null);
        setMsg({
          ok: true,
          text: `Episode ${created.order} (${created.titleSw}) uploaded successfully.`,
          warnings,
        });
        setTitle("");
        setTitleSw("");
        setFile(null);
        setDuration(null);
        setOrderEdited(false);
      }, 300);
    }, 800);
  }

  if (seriesList.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        Create a series first — <Link className="font-bold text-teal" to="/admin/series/new">add one</Link>.
      </p>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl text-deep-green">Upload episode</h1>
      <p className="mt-1 text-[12px] text-muted">
        Target length {EPISODE_MIN_SEC}–{EPISODE_MAX_SEC}s (1.5–3 min). Series cap:{" "}
        {SERIES_MAX_EPISODES} episodes.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="field-label">Series</span>
          <select className="field-box" value={seriesId} onChange={(e) => onSeriesChange(e.target.value)}>
            {seriesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titleSw} / {s.title} ({s.orders.length} ep)
              </option>
            ))}
          </select>
        </label>

        {sel && (
          <div className="rounded-lg bg-sand/60 px-3 py-2 text-[11px] text-muted">
            {count} / {SERIES_MAX_EPISODES} episodes.{" "}
            {atMax && <span className="font-bold text-red-700">At maximum — cannot add more.</span>}
            {!atMax && belowMin && (
              <span className="font-bold text-amber-700">
                Will be {count + 1} — a series needs ≥ {SERIES_MIN_EPISODES} to publish well.
              </span>
            )}
            {!atMax && !belowMin && <span className="text-teal font-semibold">Room for {SERIES_MAX_EPISODES - count} more.</span>}
          </div>
        )}

        <label className="block">
          <span className="field-label">Episode number</span>
          <input
            type="number"
            className="field-box"
            value={effectiveOrder}
            min={1}
            onChange={(e) => {
              setOrderEdited(true);
              setOrder(Number(e.target.value));
            }}
          />
          {orderClash && (
            <span className="text-[11px] font-semibold text-red-700">
              Episode {effectiveOrder} already exists in this series.
            </span>
          )}
        </label>

        <label className="block">
          <span className="field-label">Swahili title</span>
          <input className="field-box" value={titleSw} onChange={(e) => setTitleSw(e.target.value)} required />
        </label>
        <label className="block">
          <span className="field-label">English title</span>
          <input className="field-box" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label className="block">
          <span className="field-label">Media type</span>
          <select
            className="field-box"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as "AUDIO" | "VIDEO")}
          >
            <option value="AUDIO">Audio</option>
            <option value="VIDEO">Video</option>
          </select>
        </label>

        <label className="block">
          <span className="field-label">Audio / video file</span>
          <input
            type="file"
            accept="audio/*,video/*"
            className="field-box"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>

        {file && (
          <div className="rounded-lg bg-sand/60 px-3 py-2 text-[11px]">
            <div className="text-muted">
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </div>
            {duration == null ? (
              <div className="text-muted">Reading duration…</div>
            ) : (
              <div
                className={
                  durCheck?.ok ? "font-semibold text-teal" : "font-semibold text-amber-700"
                }
              >
                Duration {fmtDuration(duration)} ({Math.round(duration)}s) —{" "}
                {durCheck?.ok ? "within target." : durCheck?.message}
              </div>
            )}
          </div>
        )}

        {progress != null && (
          <div className="h-2 w-full overflow-hidden rounded bg-line">
            <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        {msg && (
          <div className={`text-[12px] font-semibold ${msg.ok ? "text-teal" : "text-red-700"}`}>
            {msg.text}
            {msg.warnings && msg.warnings.length > 0 && (
              <ul className="mt-1 list-disc pl-4 font-normal text-amber-700">
                {msg.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          disabled={atMax || orderClash || progress != null || !file}
          className="btn-primary disabled:opacity-50"
        >
          {progress != null ? `Uploading ${progress}%` : "Upload episode"}
        </button>
      </form>
    </div>
  );
}
