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

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { isDrawer, color, brushSize, tool, onLocalStroke },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const backgroundColor = useRef("#ffffff");
  const history = useRef<Stroke[]>([]);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const redraw = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = backgroundColor.current;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    let last: { x: number; y: number } | null = null;
    for (const s of history.current) {
      if (s.type === "start") {
        last = { x: s.x!, y: s.y! };
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(last.x + 0.01, last.y + 0.01);
        ctx.strokeStyle = s.color ?? "#000";
        ctx.lineWidth = s.size ?? 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      } else if (s.type === "draw" && last) {
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(s.x!, s.y!);
        ctx.stroke();
        last = { x: s.x!, y: s.y! };
      }
    }
  }, []);

  const applyStroke = useCallback(
    (stroke: Stroke) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (stroke.type === "clear") {
        history.current = [];
        backgroundColor.current = "#ffffff";
        redraw();
        return;
      }
      if (stroke.type === "fill") {
        backgroundColor.current = stroke.color ?? "#ffffff";
        history.current = [];
        redraw();
        return;
      }
      if (stroke.type === "undo") {
        // Drop strokes back to (and including) the previous "start" marker.
        let i = history.current.length - 1;
        while (i >= 0 && history.current[i].type !== "start") i--;
        history.current = history.current.slice(0, i);
        redraw();
        return;
      }
      if (stroke.type === "end") return;

      history.current.push(stroke);
      if (stroke.type === "start") {
        lastPoint.current = { x: stroke.x!, y: stroke.y! };
        ctx.beginPath();
        ctx.moveTo(stroke.x!, stroke.y!);
        ctx.strokeStyle = stroke.color ?? "#000";
        ctx.lineWidth = stroke.size ?? 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      } else if (stroke.type === "draw" && lastPoint.current) {
        ctx.lineTo(stroke.x!, stroke.y!);
        ctx.stroke();
        lastPoint.current = { x: stroke.x!, y: stroke.y! };
      }
    },
    [redraw]
  );

  useImperativeHandle(ref, () => ({
    applyRemoteStroke: applyStroke,
    loadStrokes: (strokes: Stroke[]) => {
      history.current = [];
      backgroundColor.current = "#ffffff";
      strokes.forEach((s) => {
        if (s.type === "clear") history.current = [];
        else if (s.type === "fill") backgroundColor.current = s.color ?? "#ffffff";
        else if (s.type === "start" || s.type === "draw") history.current.push(s);
      });
      redraw();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctxRef.current = canvas.getContext("2d");
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
    canvasRef.current?.setPointerCapture(e.pointerId);
    const { x, y } = toLogical(e);
    if (tool === "fill") {
      emit({ type: "fill", color });
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
      className="drawing-canvas"
      style={{ cursor: isDrawer ? (tool === "fill" ? "cell" : "crosshair") : "default" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
});
