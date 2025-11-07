import React from "react";
import { Pivot, PivotItem } from "@fluentui/react/lib/Pivot";
import FeedbackColumn, { FeedbackColumnProps } from "./feedbackColumn";
import FeedbackItem, { IFeedbackItemProps } from "./feedbackItem";
import { reactPlugin } from "../utilities/telemetryClient";
import { withAITracking } from "@microsoft/applicationinsights-react-js";

export interface IFeedbackCarouselProps {
  feedbackColumnPropsList: FeedbackColumnProps[];
  isFeedbackAnonymous: boolean;
  isFocusModalHidden: boolean;
}

export interface IFeedbackCarouselState {
  feedbackColums: FeedbackColumnProps[];
}

class FeedbackCarousel extends React.Component<IFeedbackCarouselProps, IFeedbackCarouselState> {
  constructor(props: IFeedbackCarouselProps) {
    super(props);

    const feedbackColumnPropsList = [...this.props.feedbackColumnPropsList];

    if (feedbackColumnPropsList.length > 0) {
      const allColumnItems = feedbackColumnPropsList.flatMap(col => col.columnItems);
      feedbackColumnPropsList.unshift({
        ...feedbackColumnPropsList[0],
        columnId: "all-columns",
        columnName: "All",
        columnItems: allColumnItems,
      } as FeedbackColumnProps);
    }

    this.state = {
      feedbackColums: feedbackColumnPropsList,
    };
  }

  private renderFeedbackCarouselItems = (columnProps: FeedbackColumnProps) => {
    const sortedItems = columnProps.columnItems
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
        workflowPhase: columnProps.workflowPhase,
        accentColor: columnProps.accentColor,
        iconClass: columnProps.iconClass,
        createdDate: columnItem.feedbackItem.createdDate.toString(),
        team: columnProps.team,
        columnProps: columnProps,
        columns: columnProps.columns,
        columnIds: columnProps.columnIds,
        columnId: columnItem.feedbackItem.columnId,
        originalColumnId: columnItem.feedbackItem.originalColumnId,
        boardId: columnProps.boardId,
        boardTitle: columnProps.boardTitle,
        defaultActionItemAreaPath: columnProps.defaultActionItemAreaPath,
        defaultActionItemIteration: columnProps.defaultActionItemIteration,
        actionItems: columnItem.actionItems,
        newlyCreated: columnItem.newlyCreated,
        showAddedAnimation: columnItem.showAddedAnimation,
        addFeedbackItems: columnProps.addFeedbackItems,
        removeFeedbackItemFromColumn: columnProps.removeFeedbackItemFromColumn,
        refreshFeedbackItems: columnProps.refreshFeedbackItems,
        moveFeedbackItem: FeedbackColumn.moveFeedbackItem,
        nonHiddenWorkItemTypes: columnProps.nonHiddenWorkItemTypes,
        allWorkItemTypes: columnProps.allWorkItemTypes,
        shouldHaveFocus: columnItem.shouldHaveFocus,
        hideFeedbackItems: columnProps.hideFeedbackItems,
        userIdRef: columnItem.feedbackItem.userIdRef,
        onVoteCasted: columnProps.onVoteCasted,
        groupCount: 0,
        groupIds: [],
        isGroupedCarouselItem: columnItem.feedbackItem.isGroupedCarouselItem,
        isShowingGroupedChildrenTitles: false,
        isFocusModalHidden: this.props.isFocusModalHidden,
      };

      return (
        <div key={feedbackItemProps.id} className="feedback-carousel-item">
          <FeedbackItem key={feedbackItemProps.id} {...feedbackItemProps} />
        </div>
      );
    });
  };

  public render() {
    return (
      <Pivot className="feedback-carousel-pivot">
        {this.state.feedbackColums.map(columnProps => {
          const feedbackCarouselItems = this.renderFeedbackCarouselItems(columnProps);

          return (
            <PivotItem key={columnProps.columnId} headerText={columnProps.columnName} className="feedback-carousel-pivot-item" {...columnProps}>
              <div className="carousel-container">
                <ol className="carousel-track" id={`carousel-${columnProps.columnId}`}>
                  {feedbackCarouselItems.map((child, index) => {
                    return (
                      <li className="carousel-slide" id={`slide-${columnProps.columnId}-${index}`} key={child.key}>
                        {index > 0 && (
                          <a href={`#slide-${columnProps.columnId}-${index - 1}`} className="carousel-arrow carousel-arrow-prev" aria-label="Previous slide">
                            <i className="fas fa-chevron-left" />
                          </a>
                        )}
                        <div className="carousel-viewport">{child}</div>
                        {index < feedbackCarouselItems.length - 1 && (
                          <a href={`#slide-${columnProps.columnId}-${index + 1}`} className="carousel-arrow carousel-arrow-next" aria-label="Next slide">
                            <i className="fas fa-chevron-right" />
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </PivotItem>
          );
        })}
      </Pivot>
    );
  }
}

export default withAITracking(reactPlugin, FeedbackCarousel);
