import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, type PointerEvent } from "react";
import { CANVAS_W, CANVAS_H } from "../game/canvasSize";
import type { Stroke } from "../game/types";

export interface DrawingCanvasHandle {
  applyRemoteStroke: (stroke: Stroke) => void;
  loadStrokes: (strokes: Stroke[]) => void;
}

interface Props {
  isDrawer: boolean;
  color: string;
  brushSize: number;
  tool: "pen" | "eraser" | "fill";
  onLocalStroke: (stroke: Stroke) => void;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Strokes are drawn anti-aliased, so boundary pixels are a gradient between
// the line color and what's behind it. Matching with a tolerance (instead of
// exact color) stops the fill from leaving a light halo inside every outline.
const FILL_TOLERANCE_SQ = 32 * 32;

function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) {
  const width = CANVAS_W;
  const height = CANVAS_H;
  const x0 = Math.min(width - 1, Math.max(0, Math.round(startX)));
  const y0 = Math.min(height - 1, Math.max(0, Math.round(startY)));
  const img = ctx.getImageData(0, 0, width, height);
  const data = img.data;
  const [fr, fg, fb] = hexToRgb(fillColor);
  const p0 = (y0 * width + x0) * 4;
  const tr = data[p0];
  const tg = data[p0 + 1];
  const tb = data[p0 + 2];
  if (tr === fr && tg === fg && tb === fb) return;

  const matches = (i: number) => {
    const dr = data[i] - tr;
    const dg = data[i + 1] - tg;
    const db = data[i + 2] - tb;
    return dr * dr + dg * dg + db * db <= FILL_TOLERANCE_SQ;
  };

  const visited = new Uint8Array(width * height);
  const stack = [y0 * width + x0];
  visited[y0 * width + x0] = 1;
  while (stack.length) {
    const p = stack.pop()!;
    const i = p * 4;
    data[i] = fr;
    data[i + 1] = fg;
    data[i + 2] = fb;
    data[i + 3] = 255;
    const x = p % width;
    if (x > 0 && !visited[p - 1] && matches((p - 1) * 4)) {
      visited[p - 1] = 1;
      stack.push(p - 1);
    }
    if (x < width - 1 && !visited[p + 1] && matches((p + 1) * 4)) {
      visited[p + 1] = 1;
      stack.push(p + 1);
    }
    if (p >= width && !visited[p - width] && matches((p - width) * 4)) {
      visited[p - width] = 1;
      stack.push(p - width);
    }
    if (p < width * (height - 1) && !visited[p + width] && matches((p + width) * 4)) {
      visited[p + width] = 1;
      stack.push(p + width);
    }
  }
  ctx.putImageData(img, 0, 0);
}

// Removes the most recent complete action -- a pen/eraser stroke (everything
// from its "start" marker on) or a fill.
function undoLastAction(history: Stroke[]): Stroke[] {
  let i = history.length - 1;
  while (i >= 0 && history[i].type !== "start" && history[i].type !== "fill") i--;
  return i >= 0 ? history.slice(0, i) : [];
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { isDrawer, color, brushSize, tool, onLocalStroke },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const history = useRef<Stroke[]>([]);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const curColor = useRef("#000000");
  const curSize = useRef(4);

  const drawSegment = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }, segColor: string, segSize: number) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.beginPath();
      ctx.strokeStyle = segColor;
      ctx.lineWidth = segSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(from.x, from.y);
      // A zero-length segment renders nothing, so nudge to paint the dot.
      if (from.x === to.x && from.y === to.y) ctx.lineTo(to.x + 0.1, to.y + 0.1);
      else ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    []
  );

  const redraw = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    let last: { x: number; y: number } | null = null;
    let segColor = "#000000";
    let segSize = 4;
    for (const s of history.current) {
      if (s.type === "start") {
        segColor = s.color ?? "#000000";
        segSize = s.size ?? 4;
        last = { x: s.x!, y: s.y! };
        drawSegment(last, last, segColor, segSize);
      } else if (s.type === "draw") {
        const point = { x: s.x!, y: s.y! };
        if (last) drawSegment(last, point, segColor, segSize);
        last = point;
      } else if (s.type === "fill") {
        floodFill(ctx, s.x ?? 0, s.y ?? 0, s.color ?? "#ffffff");
      }
    }
    // Keep live-drawing state consistent so a stroke that was mid-flight
    // when we replayed (e.g. after joining) continues from the right place.
    lastPoint.current = last;
    curColor.current = segColor;
    curSize.current = segSize;
  }, [drawSegment]);

  const applyStroke = useCallback(
    (stroke: Stroke) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (stroke.type === "clear") {
        history.current = [];
        lastPoint.current = null;
        redraw();
        return;
      }
      if (stroke.type === "undo") {
        history.current = undoLastAction(history.current);
        redraw();
        return;
      }
      if (stroke.type === "fill") {
        history.current.push(stroke);
        floodFill(ctx, stroke.x ?? 0, stroke.y ?? 0, stroke.color ?? "#ffffff");
        return;
      }
      if (stroke.type === "end") return;

      history.current.push(stroke);
      if (stroke.type === "start") {
        curColor.current = stroke.color ?? "#000000";
        curSize.current = stroke.size ?? 4;
        lastPoint.current = { x: stroke.x!, y: stroke.y! };
        drawSegment(lastPoint.current, lastPoint.current, curColor.current, curSize.current);
      } else if (stroke.type === "draw") {
        const point = { x: stroke.x!, y: stroke.y! };
        if (lastPoint.current) drawSegment(lastPoint.current, point, curColor.current, curSize.current);
        lastPoint.current = point;
      }
    },
    [redraw, drawSegment]
  );

  useImperativeHandle(ref, () => ({
    applyRemoteStroke: applyStroke,
    loadStrokes: (strokes: Stroke[]) => {
      let rebuilt: Stroke[] = [];
      for (const s of strokes) {
        if (s.type === "clear") rebuilt = [];
        else if (s.type === "undo") rebuilt = undoLastAction(rebuilt);
        else if (s.type === "start" || s.type === "draw" || s.type === "fill") rebuilt.push(s);
      }
      history.current = rebuilt;
      redraw();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctxRef.current = canvas.getContext("2d", { willReadFrequently: true });
    redraw();
  }, [redraw]);

  const toLogical = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.round(((e.clientX - rect.left) / rect.width) * CANVAS_W),
      y: Math.round(((e.clientY - rect.top) / rect.height) * CANVAS_H),
    };
  };

  const emit = (stroke: Stroke) => {
    applyStroke(stroke);
    onLocalStroke(stroke);
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    try {
      canvasRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic events (tests) have no active pointer; drawing still works.
    }
    const { x, y } = toLogical(e);
    if (tool === "fill") {
      emit({ type: "fill", x, y, color });
      return;
    }
    drawing.current = true;
    const activeColor = tool === "eraser" ? "#ffffff" : color;
    emit({ type: "start", x, y, color: activeColor, size: brushSize });
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !drawing.current || tool === "fill") return;
    const { x, y } = toLogical(e);
    emit({ type: "draw", x, y });
  };

  const handlePointerUp = () => {
    if (!isDrawer || tool === "fill") return;
    if (drawing.current) emit({ type: "end" });
    drawing.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      className={`drawing-canvas ${isDrawer ? "drawing-canvas-active" : ""}`}
      style={{ cursor: isDrawer ? (tool === "fill" || tool === "eraser") ? "cell" : "crosshair" : "default" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
});
