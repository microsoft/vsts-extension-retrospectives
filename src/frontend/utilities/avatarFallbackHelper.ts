export type IdentityAvatarReference = {
  displayName?: string;
  imageUrl?: string;
  _links?: {
    avatar?: {
      href?: string;
    };
  };
};

const FLUENT_PERSONA_COLOR_SWATCHES = ["#4F6BED", "#0078D4", "#004E8C", "#038387", "#498205", "#0B6A0B", "#C239B3", "#E3008C", "#881798", "#5C2E91", "#CA5010", "#D13438", "#A4262C", "#8764B8", "#986F0B", "#750B1C", "#7A7574", "#005B70", "#8E562E", "#69797E"];

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

  return FLUENT_PERSONA_COLOR_SWATCHES[Math.abs(hashCode) % FLUENT_PERSONA_COLOR_SWATCHES.length];
};