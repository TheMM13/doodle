import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { faceUrl } from "../game/faces";

// Cache parsed animation JSON across all icon instances so switching
// screens or scrolling the picker never re-fetches the same face twice.
const dataCache = new Map<number, Promise<unknown>>();

function loadFaceData(id: number): Promise<unknown> {
  let cached = dataCache.get(id);
  if (!cached) {
    cached = fetch(faceUrl(id)).then((r) => r.json());
    dataCache.set(id, cached);
  }
  return cached;
}

interface Props {
  faceId: number;
  size?: number;
  /** Play the animation on loop instead of showing a still frame. */
  animate?: boolean;
  className?: string;
}

export function FaceIcon({ faceId, size = 32, animate = false, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    loadFaceData(faceId).then((animationData) => {
      if (cancelled || !el) return;
      el.innerHTML = "";
      const anim = lottie.loadAnimation({
        container: el,
        renderer: "svg",
        loop: animate,
        autoplay: animate,
        animationData: animationData as object,
      });
      animRef.current = anim;
      if (!animate) {
        // Show a representative still frame rather than frame 0, which is
        // often a blank/neutral pose for these icons.
        anim.goToAndStop(Math.round(anim.totalFrames * 0.4), true);
      }
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [faceId, animate]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: size, height: size, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}