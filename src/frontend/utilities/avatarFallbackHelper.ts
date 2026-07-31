export type IdentityAvatarReference = {
  displayName?: string;
  imageUrl?: string;
  _links?: {
    avatar?: {
      href?: string;
    };
  };
};

export const getAvatarImageUrl = (identity?: IdentityAvatarReference | null): string | undefined => {
  return identity?._links?.avatar?.href || identity?.imageUrl || undefined;
};

export const getIdentityInitials = (name?: string): string => {
  if (!name) {
    return "?";
  }

  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return "?";
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
};

export const getIdentityColor = (seed?: string, nameFallback?: string): string => {
  const valueToHash = seed || nameFallback || "";
  if (!valueToHash) {
    return "#0078D4";
  }

  let hashCode = 0;
  for (let index = valueToHash.length - 1; index >= 0; index--) {
    const characterCode = valueToHash.charCodeAt(index);
    const shift = index % 8;
    hashCode ^= (characterCode << shift) + (characterCode >> (8 - shift));
  }

  const normalizedHash = hashCode >>> 0;
  const hue = normalizedHash % 360;
  const saturation = 62 + ((normalizedHash >>> 9) % 16); // 62-77%
  const lightness = 36 + ((normalizedHash >>> 17) % 14); // 36-49%

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
};