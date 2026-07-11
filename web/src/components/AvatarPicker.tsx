import { type Avatar, AVATAR_COLORS, AVATAR_FACES, AVATAR_HATS, FACE_COUNT, HAT_COUNT } from "../game/types";

const FACES = AVATAR_FACES;
const HATS = AVATAR_HATS;

interface Props {
  avatar: Avatar;
  onChange: (a: Avatar) => void;
}

export function AvatarPicker({ avatar, onChange }: Props) {
  return (
    <div className="avatar-picker">
      <div className="avatar-preview" style={{ backgroundColor: avatar.color }}>
        <span className="avatar-face">{FACES[avatar.face % FACE_COUNT]}</span>
        {avatar.hat > 0 && <span className="avatar-hat">{HATS[avatar.hat % HAT_COUNT]}</span>}
      </div>
      <p className="avatar-label">Face</p>
      <div className="avatar-row">
        {FACES.map((f, i) => (
          <button key={i} className={`avatar-opt ${avatar.face === i ? "avatar-opt-active" : ""}`} onClick={() => onChange({ ...avatar, face: i })}>
            {f}
          </button>
        ))}
      </div>
      <p className="avatar-label">Hat</p>
      <div className="avatar-row">
        {HATS.map((h, i) => (
          <button key={i} className={`avatar-opt ${avatar.hat === i ? "avatar-opt-active" : ""}`} onClick={() => onChange({ ...avatar, hat: i })}>
            {h || "—"}
          </button>
        ))}
      </div>
      <p className="avatar-label">Color</p>
      <div className="avatar-row">
        {AVATAR_COLORS.map((c) => (
          <button
            key={c}
            className={`avatar-swatch ${avatar.color === c ? "avatar-swatch-active" : ""}`}
            style={{ backgroundColor: c }}
            onClick={() => onChange({ ...avatar, color: c })}
          />
        ))}
      </div>
    </div>
  );
}
