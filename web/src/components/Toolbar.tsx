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

const SIZE_ORDER: number[] = [BRUSH_SIZES.small, BRUSH_SIZES.medium, BRUSH_SIZES.large];

export function Toolbar({ color, setColor, brushSize, setBrushSize, tool, setTool, onUndo, onClear, disabled }: Props) {
  const cycleBrushSize = () => {
    const idx = SIZE_ORDER.indexOf(brushSize);
    setBrushSize(SIZE_ORDER[(idx + 1) % SIZE_ORDER.length]);
  };

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
        <button className="size-cycle-btn" onClick={cycleBrushSize} disabled={disabled} title="Brush size">
          <span className="size-dot" style={{ width: brushSize, height: brushSize }} />
        </button>
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
