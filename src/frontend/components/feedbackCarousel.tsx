import React, { useState, useEffect, useCallback } from "react";
import { Pivot, PivotItem } from "@fluentui/react/lib/Pivot";
import { moveFeedbackItem } from "./feedbackColumn";
import FeedbackItem, { IFeedbackItemProps } from "./feedbackItem";
import { reactPlugin } from "../utilities/telemetryClient";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { WebApiTeam } from "azure-devops-extension-api/Core";
import { WorkflowPhase } from "../interfaces/workItem";
import { IFeedbackItemDocument } from "../interfaces/feedback";
import { type IColumn, type IColumnItem } from "./feedbackBoard";
import { getIconElement } from "./icons";

export interface FocusModeModel {
  columns: { [id: string]: IColumn };
  columnIds: string[];
  workflowPhase: WorkflowPhase;
  team: WebApiTeam;
  boardId: string;
  boardTitle: string;
  defaultActionItemAreaPath: string;
  defaultActionItemIteration: string;
  nonHiddenWorkItemTypes: WorkItemType[];
  allWorkItemTypes: WorkItemType[];
  hideFeedbackItems: boolean;
  activeTimerFeedbackItemId: string | null;
  onVoteCasted: () => void;
  requestTimerStart: (feedbackItemId: string) => void;
  notifyTimerStopped: (feedbackItemId: string) => void;

  addFeedbackItems: (columnId: string, columnItems: IFeedbackItemDocument[], shouldBroadcast: boolean, newlyCreated: boolean, showAddedAnimation: boolean, shouldHaveFocus: boolean, hideFeedbackItems: boolean) => void;
  removeFeedbackItemFromColumn: (columnIdToDeleteFrom: string, feedbackItemIdToDelete: string, shouldSetFocusOnFirstAvailableItem: boolean) => void;
  refreshFeedbackItems: (feedbackItems: IFeedbackItemDocument[], shouldBroadcast: boolean) => void;
}

interface FocusModeColumn {
  columnId: string;
  columnName: string;
  accentColor: string;
  icon: React.ReactElement;
  columnItems: IColumnItem[];
}

export interface IFeedbackCarouselProps {
  focusModeModel: FocusModeModel;
  isFocusModalHidden: boolean;
}

const buildFeedbackColumns = (focusModeModel: FocusModeModel): FocusModeColumn[] => {
  const columnsList: FocusModeColumn[] = focusModeModel.columnIds
    .map(columnId => {
      const column = focusModeModel.columns[columnId];
      if (!column) {
        return null;
      }
      return {
        columnId,
        columnName: column.columnProperties.title,
        accentColor: column.columnProperties.accentColor,
        icon: getIconElement(column.columnProperties.iconClass),
        columnItems: column.columnItems,
      };
    })
    .filter((col): col is FocusModeColumn => !!col);

  if (columnsList.length > 0) {
    const allColumnItems = columnsList.flatMap(col => col.columnItems);
    columnsList.unshift({
      columnId: "all-columns",
      columnName: "All",
      accentColor: columnsList[0].accentColor,
      icon: columnsList[0].icon,
      columnItems: allColumnItems,
    });
  }

  return columnsList;
};

export const FeedbackCarousel: React.FC<IFeedbackCarouselProps> = ({ focusModeModel, isFocusModalHidden }) => {
  const trackActivity = useTrackMetric(reactPlugin, "FeedbackCarousel");

  const [feedbackColumns, setFeedbackColumns] = useState<FocusModeColumn[]>(() => buildFeedbackColumns(focusModeModel));

  useEffect(() => {
    setFeedbackColumns(buildFeedbackColumns(focusModeModel));
  }, [focusModeModel]);

  const renderFeedbackCarouselItems = useCallback(
    (column: FocusModeColumn) => {
      const sortedItems = column.columnItems
        .sort((a, b) => {
          if (b.feedbackItem.upvotes !== a.feedbackItem.upvotes) {
            return b.feedbackItem.upvotes - a.feedbackItem.upvotes;
          }
          const dateA = new Date(a.feedbackItem.createdDate).getTime();
          const dateB = new Date(b.feedbackItem.createdDate).getTime();
          return dateA - dateB;
        })
        .filter(columnItem => !columnItem.feedbackItem.parentFeedbackItemId);

      return sortedItems.map(columnItem => {
        const itemAccentColor = focusModeModel.columns[columnItem.feedbackItem.columnId]?.columnProperties?.accentColor ?? column.accentColor;
        const itemIcon = getIconElement(focusModeModel.columns[columnItem.feedbackItem.columnId]?.columnProperties?.iconClass) ?? column.icon;

        const feedbackItemProps: IFeedbackItemProps = {
          id: columnItem.feedbackItem.id,
          title: columnItem.feedbackItem.title,
          createdBy: columnItem.feedbackItem.createdBy ? columnItem.feedbackItem.createdBy.displayName : null,
          createdByProfileImage: columnItem.feedbackItem.createdBy ? columnItem.feedbackItem.createdBy._links.avatar.href : null,
          lastEditedDate: columnItem.feedbackItem.modifiedDate ? columnItem.feedbackItem.modifiedDate.toString() : "",
          upvotes: columnItem.feedbackItem.upvotes,
          timerSecs: columnItem.feedbackItem.timerSecs,
          timerState: columnItem.feedbackItem.timerState,
          timerId: columnItem.feedbackItem.timerId,
          workflowPhase: focusModeModel.workflowPhase,
          accentColor: itemAccentColor,
          icon: itemIcon,
          createdDate: columnItem.feedbackItem.createdDate.toString(),
          team: focusModeModel.team,
          columnProps: undefined,
          columns: focusModeModel.columns,
          columnIds: focusModeModel.columnIds,
          columnId: columnItem.feedbackItem.columnId,
          originalColumnId: columnItem.feedbackItem.originalColumnId,
          boardId: focusModeModel.boardId,
          boardTitle: focusModeModel.boardTitle,
          defaultActionItemAreaPath: focusModeModel.defaultActionItemAreaPath,
          defaultActionItemIteration: focusModeModel.defaultActionItemIteration,
          actionItems: columnItem.actionItems,
          newlyCreated: columnItem.newlyCreated,
          showAddedAnimation: columnItem.showAddedAnimation,
          addFeedbackItems: focusModeModel.addFeedbackItems,
          removeFeedbackItemFromColumn: focusModeModel.removeFeedbackItemFromColumn,
          refreshFeedbackItems: focusModeModel.refreshFeedbackItems,
          moveFeedbackItem: moveFeedbackItem,
          nonHiddenWorkItemTypes: focusModeModel.nonHiddenWorkItemTypes,
          allWorkItemTypes: focusModeModel.allWorkItemTypes,
          shouldHaveFocus: columnItem.shouldHaveFocus,
          hideFeedbackItems: focusModeModel.hideFeedbackItems,
          userIdRef: columnItem.feedbackItem.userIdRef,
          onVoteCasted: focusModeModel.onVoteCasted,
          groupCount: columnItem.feedbackItem.childFeedbackItemIds ? columnItem.feedbackItem.childFeedbackItemIds.length : 0,
          groupIds: columnItem.feedbackItem.childFeedbackItemIds ?? [],
          isGroupedCarouselItem: (columnItem.feedbackItem.childFeedbackItemIds?.length ?? 0) > 0,
          isShowingGroupedChildrenTitles: false,
          isFocusModalHidden: isFocusModalHidden,
          activeTimerFeedbackItemId: focusModeModel.activeTimerFeedbackItemId,
          requestTimerStart: focusModeModel.requestTimerStart,
          notifyTimerStopped: focusModeModel.notifyTimerStopped,
        };

        return (
          <div key={feedbackItemProps.id} className="feedback-carousel-item">
            <FeedbackItem key={feedbackItemProps.id} {...feedbackItemProps} />
          </div>
        );
      });
    },
    [focusModeModel, isFocusModalHidden],
  );

  return (
    <Pivot className="feedback-carousel-pivot" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      {feedbackColumns.map(column => {
        const feedbackCarouselItems = renderFeedbackCarouselItems(column);
        const slideIds = feedbackCarouselItems.map((_, index) => `slide-${column.columnId}-${index}`);
        const activeDotCss = slideIds.map(slideId => `.carousel-container:has(#${slideId}:target) .carousel-dots a[href="#${slideId}"] { opacity: 1; transform: scale(1.05); }`).join("\n");

        return (
          <PivotItem key={column.columnId} headerText={column.columnName} className="feedback-carousel-pivot-item" {...column}>
            <div className="carousel-container">
              {activeDotCss && <style>{activeDotCss}</style>}
              <ol className="carousel-track" id={`carousel-${column.columnId}`}>
                {feedbackCarouselItems.map((child, index) => {
                  return (
                    <li className="carousel-slide" id={`slide-${column.columnId}-${index}`} key={child.key}>
                      {index > 0 && (
                        <a href={`#slide-${column.columnId}-${index - 1}`} className="back-button" aria-label="Previous slide">
                          {getIconElement("chevron-left")}
                        </a>
                      )}
                      <div className="carousel-viewport">{child}</div>
                      {index < feedbackCarouselItems.length - 1 && (
                        <a href={`#slide-${column.columnId}-${index + 1}`} className="next-button" aria-label="Next slide">
                          {getIconElement("chevron-right")}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ol>
              <ul className="carousel-dots" aria-label="Focus mode pagination">
                {slideIds.map((slideId, index) => (
                  <li key={slideId}>
                    <a href={`#${slideId}`} className="carousel-dot" aria-label={`Go to card ${index + 1} of ${slideIds.length}`} />
                  </li>
                ))}
              </ul>
            </div>
          </PivotItem>
        );
      })}
    </Pivot>
  );
};

export default FeedbackCarousel;
