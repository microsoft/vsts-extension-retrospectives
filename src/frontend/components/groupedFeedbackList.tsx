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
  const columnItemsById = new Map(columnItems?.map(columnItem => [columnItem.feedbackItem.id, columnItem]) ?? []);
  const sortedChildrenIds = [...childrenIds];

  if (workflowPhase === WorkflowPhase.Act) {
    sortedChildrenIds.sort((leftId, rightId) => {
      const left = columnItemsById.get(leftId)?.feedbackItem;
      const right = columnItemsById.get(rightId)?.feedbackItem;

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
          const childCard: IColumnItem | undefined = columnItemsById.get(id);
          const originalColumn = childCard ? columns[childCard.feedbackItem.originalColumnId] : null;
          const childItemHidden = !!childCard && hideFeedbackItems && childCard.feedbackItem.userIdRef !== currentUserId;
          const visualTitle = childCard?.feedbackItem.title;
          const accessibleTitle = childItemHidden ? "Hidden feedback" : childCard?.feedbackItem.title;
          const titleText = childItemHidden ? "Hidden feedback" : childCard?.feedbackItem.title;

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
                <div className="related-feedback-title" aria-label={`Related feedback: ${accessibleTitle}`} title={titleText}>
                  <span className={childItemHidden ? "hidden-related-feedback-title" : undefined} aria-hidden={childItemHidden || undefined}>
                    {visualTitle}
                  </span>
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
