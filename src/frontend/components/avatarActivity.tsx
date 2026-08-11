import React from "react";
import { DocumentCardActivity } from "@fluentui/react/lib/DocumentCard";

export interface IAvatarActivityPerson {
  name: string;
  profileImageSrc: string;
}

export interface IAvatarActivityProps {
  activity: string;
  people?: IAvatarActivityPerson[];
  fallbackText?: string;
  size?: "small" | "large";
  className?: string;
}

const AvatarActivity: React.FC<IAvatarActivityProps> = ({ activity, people, fallbackText = "", size = "small", className }) => {
  if (!people?.length) {
    return <div className={[className, "avatar-activity", `avatar-size-${size}`].filter(Boolean).join(" ")}>{fallbackText || activity}</div>;
  }

  return <DocumentCardActivity activity={activity} people={people} className={[className, "avatar-activity", `avatar-size-${size}`].filter(Boolean).join(" ")} />;
};

export default AvatarActivity;
