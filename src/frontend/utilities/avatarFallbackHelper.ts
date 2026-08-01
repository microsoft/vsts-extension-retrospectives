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

  // FNV-1a 32-bit for lower collision rate than the previous XOR-shift hash.
  let hashCode = 0x811c9dc5;
  for (let index = 0; index < valueToHash.length; index++) {
    hashCode ^= valueToHash.charCodeAt(index);
    hashCode = Math.imul(hashCode, 0x01000193);
  }

  const normalizedHash = hashCode >>> 0;
  const hue = normalizedHash % 360;
  const saturation = 65 + ((normalizedHash >>> 10) % 16); // 65-80%
  const lightness = 38 + ((normalizedHash >>> 18) % 12); // 38-49%

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
};