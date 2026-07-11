import { PALETTE, BRUSH_SIZES } from "../game/canvasSize";

interface Props {
  color: string;
  setColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  tool: "pen" | "eraser" | "fill";
  setTool: (t: "pen" | "eraser" | "fill") => void;
  onUndo: () => void;
  onClear: () => void;
  disabled: boolean;
}

export function Toolbar({ color, setColor, brushSize, setBrushSize, tool, setTool, onUndo, onClear, disabled }: Props) {
  return (
    <div className={`toolbar ${disabled ? "toolbar-disabled" : ""}`}>
      <div className="palette">
        {PALETTE.map((c) => (
          <button
            key={c}
            className={`swatch ${color === c && tool !== "eraser" ? "swatch-active" : ""}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
            disabled={disabled}
          />
        ))}
      </div>
      <div className="toolbar-row">
        {(["small", "medium", "large"] as const).map((s) => (
          <button
            key={s}
            className={`size-btn ${brushSize === BRUSH_SIZES[s] ? "size-btn-active" : ""}`}
            onClick={() => setBrushSize(BRUSH_SIZES[s])}
            disabled={disabled}
          >
            <span className="size-dot" style={{ width: BRUSH_SIZES[s], height: BRUSH_SIZES[s] }} />
          </button>
        ))}
        <button className={`tool-btn ${tool === "eraser" ? "tool-btn-active" : ""}`} onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")} disabled={disabled}>
          Eraser
        </button>
        <button className={`tool-btn ${tool === "fill" ? "tool-btn-active" : ""}`} onClick={() => setTool(tool === "fill" ? "pen" : "fill")} disabled={disabled}>
          Fill
        </button>
        <button className="tool-btn" onClick={onUndo} disabled={disabled}>
          Undo
        </button>
        <button className="tool-btn" onClick={onClear} disabled={disabled}>
          Clear
        </button>
      </div>
    </div>
  );
}
