import React, { useState } from "react";

export interface IFeedbackCardActivityProps {
  name: string;
  activity: string;
  profileImageSrc?: string;
}

// Mirrors the cleanup Fluent's Persona applied: "Jane Smith (Contoso)" and "Jane Smith 🚀" are both shown as "JS".
// Built with the constructor because the ES5 test tsconfig rejects the "u" flag on regex literals.
const ENCLOSED_TEXT = /[([{<][^)\]}>]*[)\]}>]/g;
const NON_ALPHANUMERIC = new RegExp("[^\\p{L}\\p{N}\\s]", "gu");

export const getInitials = (name: string): string => {
  const words = name.replace(ENCLOSED_TEXT, "").replace(NON_ALPHANUMERIC, "").split(/\s+/).filter(Boolean);
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

const FeedbackCardActivity: React.FC<IFeedbackCardActivityProps> = ({ name, activity, profileImageSrc }) => {
  const [failedImageSrc, setFailedImageSrc] = useState<string | undefined>();
  const showImage = !!profileImageSrc && profileImageSrc !== failedImageSrc;

  return (
    <div className="feedback-card-activity">
      <div className="feedback-card-activity-avatar" aria-hidden="true">
        {showImage ? (
          <img src={profileImageSrc} alt="" onError={() => setFailedImageSrc(profileImageSrc)} />
        ) : (
          <span className="feedback-card-activity-initials" style={{ backgroundColor: getAvatarColor(name) }}>
            {getInitials(name)}
          </span>
        )}
      </div>
      <div className="feedback-card-activity-details">
        <span className="feedback-card-activity-name">{name}</span>
        <span className="feedback-card-activity-date">{activity}</span>
      </div>
    </div>
  );
};

export default FeedbackCardActivity;
