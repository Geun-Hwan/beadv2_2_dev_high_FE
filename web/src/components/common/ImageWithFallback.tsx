import { CardMedia, Skeleton } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useEffect, useState } from "react";

type ImageStatus = "loading" | "loaded" | "error";

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  height?: number | string;
  width?: number | string;
  sx?: SxProps<Theme>;
  skeletonSx?: SxProps<Theme>;
  fallbackSrc?: string;
}

const defaultFallback = "/images/no_image.png";

export const ImageWithFallback = ({
  src,
  alt,
  height,
  width,
  sx,
  skeletonSx,
  fallbackSrc = defaultFallback,
}: ImageWithFallbackProps) => {
  const trimmedSrc = src?.trim();
  const resolvedSrc = trimmedSrc && trimmedSrc.length > 0 ? trimmedSrc : "";

  const [status, setStatus] = useState<ImageStatus>(
    resolvedSrc ? "loading" : "loaded"
  );

  useEffect(() => {
    if (!resolvedSrc) {
      setStatus("loaded");
      return;
    }
    let active = true;
    setStatus("loading");
    const img = new Image();
    img.onload = () => {
      if (active) setStatus("loaded");
    };
    img.onerror = () => {
      if (active) setStatus("error");
    };
    img.src = resolvedSrc;
    return () => {
      active = false;
    };
  }, [resolvedSrc]);

  const imageSrc = status === "error" || !resolvedSrc ? fallbackSrc : resolvedSrc;

  if (status === "loading") {
    return (
      <Skeleton
        variant="rectangular"
        height={height}
        width={width}
        sx={skeletonSx}
      />
    );
  }

  return (
    <CardMedia
      component="img"
      height={height}
      image={imageSrc}
      alt={alt}
      sx={sx}
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("error")}
    />
  );
};
