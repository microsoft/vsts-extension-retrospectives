import React from "react";
import { IColumn, IColumnItem } from "./feedbackBoard";
import { getIconElement } from "./icons";
import { getUserIdentity } from "../utilities/userIdentityHelper";
import { WorkflowPhase } from "../interfaces/workItem";

export interface IGroupedFeedbackListProps {
  childrenIds: string[];
  columnItems: IColumnItem[] | undefined;
  columns: { [id: string]: IColumn };
  currentColumnId: string;
  workflowPhase: WorkflowPhase;
  hideFeedbackItems: boolean;
  isFocusModalHidden: boolean;
}

const GroupedFeedbackList: React.FC<IGroupedFeedbackListProps> = ({ childrenIds, columnItems, columns, currentColumnId, workflowPhase, hideFeedbackItems, isFocusModalHidden }) => {
  const currentUserId = getUserIdentity().id;
  const sortedChildrenIds = [...childrenIds];

  if (workflowPhase === WorkflowPhase.Act) {
    sortedChildrenIds.sort((leftId, rightId) => {
      const left = columnItems?.find(c => c.feedbackItem.id === leftId)?.feedbackItem;
      const right = columnItems?.find(c => c.feedbackItem.id === rightId)?.feedbackItem;

      if (!left && !right) {
        return 0;
      }
      if (!left) {
        return 1;
      }
      if (!right) {
        return -1;
      }

      if (right.upvotes !== left.upvotes) {
        return right.upvotes - left.upvotes;
      }

      return new Date(right.createdDate).getTime() - new Date(left.createdDate).getTime();
    });
  }

  return (
    <div className="group-child-feedback-stack">
      <div className="grouped-feedback-header">{getIconElement("forum")} Grouped Feedback</div>
      <ul aria-label="List of Grouped Feedback" role="list">
        {sortedChildrenIds.map((id: string) => {
          const childCard: IColumnItem | undefined = columnItems?.find(c => c.feedbackItem.id === id);
          const originalColumn = childCard ? columns[childCard.feedbackItem.originalColumnId] : null;
          const childItemHidden = !!childCard && hideFeedbackItems && childCard.feedbackItem.userIdRef !== currentUserId;
          const childDisplayTitle = childItemHidden ? "[Hidden Feedback]" : childCard?.feedbackItem.title;

          return (
            childCard && (
              <li key={id} role="listitem">
                <div
                  className="icon"
                  style={{
                    borderRightColor: originalColumn?.columnProperties?.accentColor,
                  }}
                >
                  {getIconElement("sms")}
                </div>
                <div className="related-feedback-title" aria-label={`Related feedback: ${childDisplayTitle}`} aria-hidden={childItemHidden || undefined} title={childDisplayTitle}>
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
