import { PALETTE, BRUSH_SIZES } from "../game/canvasSize";
import { PenIcon, FillIcon, EraserIcon, UndoIcon, ClearIcon } from "./ToolIcons";

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
            className={`swatch ${color === c && tool === "pen" ? "swatch-active" : ""}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
            disabled={disabled}
          />
        ))}
      </div>
      <div className="toolbar-tools">
        <button
          className={`tool-icon-btn tool-pen ${tool === "pen" ? "tool-active" : ""}`}
          onClick={() => setTool("pen")}
          disabled={disabled}
          title="Pen"
        >
          <PenIcon />
        </button>
        <button className="size-cycle-btn" onClick={cycleBrushSize} disabled={disabled} title="Brush size">
        <span className="size-dot" style={{ width: brushSize, height: brushSize }} />
      </button>
        <button
          className={`tool-icon-btn tool-fill ${tool === "fill" ? "tool-active" : ""}`}
          onClick={() => setTool(tool === "fill" ? "pen" : "fill")}
          disabled={disabled}
          title="Fill"
        >
          <FillIcon />
        </button>
        <button
          className={`tool-icon-btn tool-eraser ${tool === "eraser" ? "tool-active" : ""}`}
          onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")}
          disabled={disabled}
          title="Eraser"
        >
          <EraserIcon />
        </button>
        <button className="tool-icon-btn tool-undo" onClick={onUndo} disabled={disabled} title="Undo">
          <UndoIcon />
        </button>
        <button className="tool-icon-btn tool-clear" onClick={onClear} disabled={disabled} title="Clear">
          <ClearIcon />
        </button>
      </div>
    </div>
  );
}
