import { useState } from "react";
import type { RoomSettings, GameMode } from "../game/types";

const GAME_MODES: { value: GameMode; label: string; hint: string }[] = [
  { value: "normal", label: "Normal", hint: "Word length shown as blanks" },
  { value: "hidden", label: "Hidden", hint: "Word length is hidden" },
  { value: "combination", label: "Combination", hint: "Randomly mixes normal & hidden each turn" },
];

interface Props {
  visible: boolean;
  settings: RoomSettings;
  onClose: () => void;
  onSave: (s: Partial<RoomSettings>) => void;
}

function Stepper({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper-row">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button className="step-btn" onClick={() => onChange(Math.max(min, value - step))}>-</button>
        <span className="step-value">{value}</span>
        <button className="step-btn" onClick={() => onChange(Math.min(max, value + step))}>+</button>
      </div>
    </div>
  );
}

export function RoomSettingsModal({ visible, settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  const [customWordsText, setCustomWordsText] = useState(settings.customWords.join(", "));

  if (!visible) return null;

  const save = () => {
    onSave({ ...draft, customWords: customWordsText.split(",").map((w) => w.trim()).filter(Boolean) });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card settings-card">
        <h2 className="modal-title">Room Settings</h2>
        <Stepper label="Max Players" value={draft.maxPlayers} min={2} max={12} step={1} onChange={(v) => setDraft({ ...draft, maxPlayers: v })} />
        <Stepper label="Draw time" value={draft.drawTimeSec} min={30} max={240} step={10} onChange={(v) => setDraft({ ...draft, drawTimeSec: v })} />
        <Stepper label="Total Rounds" value={draft.rounds} min={1} max={10} step={1} onChange={(v) => setDraft({ ...draft, rounds: v })} />
        <Stepper label="Minimum Word count" value={draft.wordCount} min={1} max={3} step={1} onChange={(v) => setDraft({ ...draft, wordCount: v })} />
        <Stepper label="Hints" value={draft.hints} min={0} max={4} step={1} onChange={(v) => setDraft({ ...draft, hints: v })} />
        <label className="settings-label">Game mode</label>
        <div className="game-mode-row">
          {GAME_MODES.map((m) => (
            <button
              key={m.value}
              className={`game-mode-btn ${draft.gameMode === m.value ? "game-mode-btn-active" : ""}`}
              onClick={() => setDraft({ ...draft, gameMode: m.value })}
              title={m.hint}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="game-mode-hint">{GAME_MODES.find((m) => m.value === draft.gameMode)?.hint}</p>
        <label className="settings-label">Custom words (comma separated)</label>
        <textarea
          className="settings-textarea"
          value={customWordsText}
          onChange={(e) => setCustomWordsText(e.target.value)}
          placeholder="e.g. banana, spaceship, guitar"
        />
        <label className="toggle-row">
          <input type="checkbox" checked={draft.useCustomWordsOnly} onChange={(e) => setDraft({ ...draft, useCustomWordsOnly: e.target.checked })} />
          Use custom words only
        </label>
        <div className="modal-btn-row">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
