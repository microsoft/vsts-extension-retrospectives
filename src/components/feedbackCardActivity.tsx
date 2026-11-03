import React from "react";
import Avatar from "./avatar";

export interface IFeedbackCardActivityProps {
  name: string;
  activity: string;
  profileImageSrc?: string;
}

const FeedbackCardActivity: React.FC<IFeedbackCardActivityProps> = ({ name, activity, profileImageSrc }) => {
  return (
    <div className="feedback-card-activity">
      <Avatar className="feedback-card-activity-avatar" name={name} imageUrl={profileImageSrc} />
      <div className="feedback-card-activity-details">
        <span className="feedback-card-activity-name">{name}</span>
        <span className="feedback-card-activity-date">{activity}</span>
      </div>
    </div>
  );
};

export default FeedbackCardActivity;
