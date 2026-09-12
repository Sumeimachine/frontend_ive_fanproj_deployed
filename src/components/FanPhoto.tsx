import { useState } from "react";
import type { FanPhotoEntry } from "../content/grantsor";

interface FanPhotoProps {
  photo: FanPhotoEntry;
  priority?: boolean;
  sizes?: string;
  fullSize?: boolean;
}

export default function FanPhoto({
  photo,
  priority = false,
  sizes = "100vw",
  fullSize = false,
}: FanPhotoProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = `${photo.src}-${fullSize ? 1600 : 960}.webp`;

  if (failedSource === source) {
    return (
      <span className="fan-photo-fallback" role="img" aria-label={photo.alt}>
        <span>Photo unavailable</span>
        <span>See the original photo using the source post link below.</span>
      </span>
    );
  }

  return (
    <img
      className="fan-photo"
      src={source}
      srcSet={`${photo.src}-480.webp 480w, ${photo.src}-960.webp 960w, ${photo.src}-1600.webp 1600w`}
      sizes={sizes}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => setFailedSource(source)}
    />
  );
}
