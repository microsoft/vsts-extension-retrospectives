import React, { useState } from "react";

export interface IAvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  className?: string;
}

const OPENING_BRACKETS = "([{<";
const CLOSING_BRACKETS = ")]}>";

// Built with the constructor because the ES5 test tsconfig rejects the "u" flag on regex literals.
const NON_ALPHANUMERIC = new RegExp("[^\\p{L}\\p{N}\\s]", "gu");

// Drops bracketed text such as "(Contoso)" or "<jane@contoso.com>": any closing bracket ends it, and an opening bracket that is never closed is kept.
// A loop instead of a regex replace, because CodeQL reports removing "<...>" with a regex as an incomplete HTML sanitizer.
const removeEnclosedText = (name: string): string => {
  let kept = "";
  let enclosureStart = -1;

  for (let index = 0; index < name.length; index++) {
    const character = name[index];

    if (enclosureStart === -1 && OPENING_BRACKETS.includes(character)) {
      enclosureStart = index;
    } else if (enclosureStart === -1) {
      kept += character;
    } else if (CLOSING_BRACKETS.includes(character)) {
      enclosureStart = -1;
    }
  }

  return enclosureStart === -1 ? kept : kept + name.slice(enclosureStart);
};

// Mirrors the cleanup Fluent's Persona applied: "Jane Smith (Contoso)" and "Jane Smith 🚀" are both shown as "JS".
export const getInitials = (name: string): string => {
  const words = removeEnclosedText(name).replace(NON_ALPHANUMERIC, "").split(/\s+/).filter(Boolean);
  const initialsSource = words.length > 1 ? [words[0], words[words.length - 1]] : words;

  return initialsSource
    .map(word => Array.from(word)[0])
    .join("")
    .toUpperCase();
};

// Dark enough for white initials to keep at least a 4.5:1 contrast ratio at any hue.
export const getAvatarColor = (name: string): string => {
  const hue = Array.from(name).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) % 360, 0);

  return `hsl(${hue}, 50%, 30%)`;
};

const Avatar: React.FC<IAvatarProps> = ({ name, imageUrl, className }) => {
  const [failedImageUrl, setFailedImageUrl] = useState<string | undefined>();
  const showImage = !!imageUrl && imageUrl !== failedImageUrl;
  const displayName = name ?? "";

  return (
    <span className={["avatar", className].filter(Boolean).join(" ")} aria-hidden="true">
      {showImage ? (
        <img src={imageUrl} alt="" onError={() => setFailedImageUrl(imageUrl)} />
      ) : (
        <span className="avatar-initials" style={{ backgroundColor: getAvatarColor(displayName) }}>
          {getInitials(displayName)}
        </span>
      )}
    </span>
  );
};

export default Avatar;
