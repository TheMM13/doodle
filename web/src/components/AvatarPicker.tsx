import { useMemo } from "react";
import { type Avatar, AVATAR_COLORS } from "../game/types";
import { FACES } from "../game/faces";
import { FaceIcon } from "./FaceIcon";

interface Props {
  avatar: Avatar;
  onChange: (a: Avatar) => void;
}

export function AvatarPicker({ avatar, onChange }: Props) {
  const currentIndex = useMemo(
    () => FACES.findIndex((f) => f.id === avatar.face),
    [avatar.face]
  );

  const previous = () => {
    const index = (currentIndex - 1 + FACES.length) % FACES.length;
    onChange({
      ...avatar,
      face: FACES[index].id,
    });
  };

  const next = () => {
    const index = (currentIndex + 1) % FACES.length;
    onChange({
      ...avatar,
      face: FACES[index].id,
    });
  };

  return (
    <div className="avatar-picker">
      <p className="avatar-label">Choose Avatar</p>

      <div className="avatar-selector">
        <button
          type="button"
          className="avatar-arrow"
          onClick={previous}
        >
          ‹
        </button>

        <div
          className="avatar-preview"
          style={{ backgroundColor: avatar.color }}
        >
          <FaceIcon
            faceId={avatar.face}
            size={90}
            animate
          />
        </div>

        <button
          type="button"
          className="avatar-arrow"
          onClick={next}
        >
          ›
        </button>
      </div>

      <p className="avatar-count">
        {currentIndex + 1} / {FACES.length}
      </p>

      <p className="avatar-label">Background Color</p>

      <div className="avatar-row">
        {AVATAR_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`avatar-swatch ${
              avatar.color === c ? "avatar-swatch-active" : ""
            }`}
            style={{ backgroundColor: c }}
            onClick={() =>
              onChange({
                ...avatar,
                color: c,
              })
            }
          />
        ))}
      </div>
    </div>
  );
}