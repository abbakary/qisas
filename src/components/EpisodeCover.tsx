import React, { useEffect, useMemo, useState } from "react";
import { episodeCoverDataUrl } from "../lib/media/episode-cover";

export default function EpisodeCover({
  src,
  order,
  title,
  seriesTitle,
  alt,
  className,
}: {
  src?: string | null;
  mediaUrl?: string | null;
  mediaType?: "AUDIO" | "VIDEO";
  order: number;
  title: string;
  seriesTitle?: string;
  alt: string;
  className?: string;
}) {
  const fallback = useMemo(
    () => episodeCoverDataUrl({ order, title, seriesTitle }),
    [order, title, seriesTitle],
  );
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);
  const showSrc = Boolean(src) && !broken;

  return (
    <img
      src={showSrc ? src! : fallback}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}
