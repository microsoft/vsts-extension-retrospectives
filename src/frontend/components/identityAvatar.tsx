import React from "react";

import { getIdentityColor, getIdentityInitials } from "../utilities/avatarFallbackHelper";

type IdentityAvatarProps = {
  name?: string;
  imageUrl?: string;
  forceInitialsFallback?: boolean;
  className?: string;
};

export default function IdentityAvatar({ name, imageUrl, forceInitialsFallback = true, className = "" }: IdentityAvatarProps) {
  const [showImage, setShowImage] = React.useState(!forceInitialsFallback && Boolean(imageUrl));
  const fallbackColor = React.useMemo(() => getIdentityColor(name), [name]);

  React.useEffect(() => {
    setShowImage(!forceInitialsFallback && Boolean(imageUrl));
  }, [forceInitialsFallback, imageUrl]);

  const mergedClassName = ["identity-avatar", className].filter(Boolean).join(" ");

  return (
    <span className={mergedClassName} aria-label={name || "Unknown user"}>
      {showImage && imageUrl ? <img className="avatar" src={imageUrl} alt={name} onError={() => setShowImage(false)} /> : <span className="avatar-fallback" style={{ backgroundColor: fallbackColor }}>{getIdentityInitials(name)}</span>}
    </span>
  );
}