import React, { useEffect, useState } from "react";

export interface IAvatarProps {
  imageUrl?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export interface IAvatarActivityProps {
  activity: string;
  imageUrl?: string | null;
  name: string;
  avatarSize?: "small" | "medium" | "large";
  className?: string;
}

// Replicates the azure-devops-ui Coin initials and fallback color behavior locally
// because that package is not compatible with the React version used by this app.
const DEFAULT_COIN_COLOR = { red: 79, green: 107, blue: 237 };
const COIN_COLOR_PALETTE = [
  { red: 117, green: 11, blue: 28 },
  { red: 164, green: 38, blue: 44 },
  { red: 209, green: 52, blue: 56 },
  { red: 202, green: 80, blue: 16 },
  { red: 152, green: 111, blue: 11 },
  { red: 73, green: 130, blue: 5 },
  { red: 11, green: 106, blue: 11 },
  { red: 3, green: 131, blue: 135 },
  { red: 0, green: 91, blue: 112 },
  { red: 0, green: 120, blue: 212 },
  DEFAULT_COIN_COLOR,
  { red: 92, green: 46, blue: 145 },
  { red: 135, green: 100, blue: 184 },
  { red: 136, green: 23, blue: 152 },
  { red: 194, green: 57, blue: 179 },
  { red: 227, green: 0, blue: 140 },
  { red: 142, green: 86, blue: 46 },
  { red: 122, green: 117, blue: 116 },
  { red: 105, green: 121, blue: 126 },
];
const LETTERS_REGEX = "[0-9]|[A-Z]|[Ѐ-Я]|[a-z]|[ά-ώ]|[ǅ]|[ῼ]|[ʰ-ˁ]|[ᴬ-ᵡ]|[א-ת]|[ء-غ]|[一-鿃]|[À-ÿ]|[Ā-ſ]|[ƀ-ɏ]";
const AVATAR_SIZE_BY_VARIANT: Record<NonNullable<IAvatarActivityProps["avatarSize"]>, number> = {
  small: 24,
  medium: 32,
  large: 36,
};

function formatCoinColor(color: { red: number; green: number; blue: number }): string {
  return `rgb(${color.red}, ${color.green}, ${color.blue})`;
}

export function getAvatarBackgroundColor(name?: string | null): string {
  if (!name) {
    return formatCoinColor(DEFAULT_COIN_COLOR);
  }

  let hash = 0;
  for (let index = name.length - 1; index >= 0; index -= 1) {
    const characterCode = name.charCodeAt(index);
    const shift = index % 8;
    hash ^= (characterCode << shift) + (characterCode >> (8 - shift));
  }

  return formatCoinColor(COIN_COLOR_PALETTE[hash % COIN_COLOR_PALETTE.length]);
}

export function getAvatarInitials(name?: string | null): string {
  if (!name) {
    return "";
  }

  const words = name.split(" ").filter(word => word !== "");

  if (words.length === 0) {
    return "";
  }

  let firstInitial = "";
  let secondInitial = "";

  words.forEach(word => {
    const firstCharacter = word[0];
    if (firstCharacter && firstCharacter.match(LETTERS_REGEX)) {
      if (firstInitial.length === 0) {
        firstInitial = firstCharacter;
      } else {
        secondInitial = firstCharacter;
      }
    }
  });

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function Avatar(props: Readonly<IAvatarProps>): React.JSX.Element {
  const { className, imageUrl, name, size = 24 } = props;
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  const initials = getAvatarInitials(name);
  const avatarClassName = ["avatar", className].filter(Boolean).join(" ");
  const fallbackStyle = { backgroundColor: getAvatarBackgroundColor(name) };

  return (
    <div className={avatarClassName} style={{ width: size, height: size }} title={name ?? undefined} role="img" aria-label={name ? `${name} avatar` : "User avatar"}>
      {imageUrl && !hasImageError ? (
        <img className="avatar-image" src={imageUrl} alt="" onError={() => setHasImageError(true)} />
      ) : (
        <div className="avatar-fallback" style={fallbackStyle}>
          <span className="avatar-initials" style={{ fontSize: Math.max(10, Math.floor(size * 0.42)) }} aria-hidden="true">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

export function AvatarActivity(props: Readonly<IAvatarActivityProps>): React.JSX.Element {
  const { activity, avatarSize = "small", className, imageUrl, name } = props;
  const resolvedSize = AVATAR_SIZE_BY_VARIANT[avatarSize];
  const rootClassName = ["avatar-activity", className].filter(Boolean).join(" ");

  return (
    <div className={rootClassName}>
      <Avatar className="avatar-activity-avatar" imageUrl={imageUrl} name={name} size={resolvedSize} />
      <div className="avatar-activity-details">
        <div className="avatar-activity-name">{name}</div>
        <div className="avatar-activity-meta">{activity}</div>
      </div>
    </div>
  );
}

export default Avatar;