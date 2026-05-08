import React from "react";
import { IColumn, IColumnItem } from "./feedbackBoard";
import { getIconElement } from "./icons";
import { getUserIdentity } from "../utilities/userIdentityHelper";

export interface IGroupedFeedbackListProps {
  childrenIds: string[];
  columnItems: IColumnItem[] | undefined;
  columns: { [id: string]: IColumn };
  currentColumnId: string;
  hideFeedbackItems: boolean;
  isFocusModalHidden: boolean;
}

const GroupedFeedbackList: React.FC<IGroupedFeedbackListProps> = ({ childrenIds, columnItems, columns, currentColumnId, hideFeedbackItems, isFocusModalHidden }) => {
  const currentUserId = getUserIdentity().id;

  return (
    <div className="group-child-feedback-stack">
      <div className="grouped-feedback-header">{getIconElement("forum")} Grouped Feedback</div>
      <ul aria-label="List of Grouped Feedback" role="list">
        {childrenIds.map((id: string) => {
          const childCard: IColumnItem | undefined = columnItems?.find(c => c.feedbackItem.id === id);
          const originalColumn = childCard ? columns[childCard.feedbackItem.originalColumnId] : null;
          const childItemHidden = !!childCard && hideFeedbackItems && childCard.feedbackItem.userIdRef !== currentUserId;
          const childDisplayTitle = childCard?.feedbackItem.title ?? "";
          const childScreenReaderTitle = childItemHidden ? "Hidden feedback" : childDisplayTitle;

          return (
            childCard && (
              <li key={id} role="listitem" aria-label={`Related feedback: ${childScreenReaderTitle}`}>
                <div
                  className="icon"
                  style={{
                    borderRightColor: originalColumn?.columnProperties?.accentColor,
                  }}
                >
                  {getIconElement("sms")}
                </div>
                <div className={`related-feedback-title${childItemHidden ? " hidden-related-feedback-title" : ""}`} aria-hidden={childItemHidden || undefined} title={childScreenReaderTitle}>
                  {childDisplayTitle}
                </div>
                {isFocusModalHidden && currentColumnId !== originalColumn?.columnProperties?.id && originalColumn && <div className="original-column-info">Original Column: {originalColumn.columnProperties.title}</div>}
              </li>
            )
          );
        })}
      </ul>
    </div>
  );
};

GroupedFeedbackList.displayName = "GroupedFeedbackList";

export default GroupedFeedbackList;
