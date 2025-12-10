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

    this.state = {
      feedbackColums: this.buildFeedbackColumns(props.feedbackColumnPropsList),
    };
  }

  private buildFeedbackColumns = (feedbackColumnPropsList: FeedbackColumnProps[]): FeedbackColumnProps[] => {
    const columnsList = [...feedbackColumnPropsList];

    if (columnsList.length > 0) {
      const allColumnItems = columnsList.flatMap(col => col.columnItems);
      columnsList.unshift({
        ...columnsList[0],
        columnId: "all-columns",
        columnName: "All",
        columnItems: allColumnItems,
      } as FeedbackColumnProps);
    }

    return columnsList;
  };

  public componentDidUpdate(prevProps: IFeedbackCarouselProps) {
    if (prevProps.feedbackColumnPropsList !== this.props.feedbackColumnPropsList) {
      this.setState({
        feedbackColums: this.buildFeedbackColumns(this.props.feedbackColumnPropsList),
      });
    }
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
      // Get the accent color from the item's current column, falling back to columnProps.accentColor
      const itemAccentColor = columnProps.columns[columnItem.feedbackItem.columnId]?.columnProperties?.accentColor ?? columnProps.accentColor;
      const itemIconClass = columnProps.columns[columnItem.feedbackItem.columnId]?.columnProperties?.iconClass ?? columnProps.iconClass;

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
        accentColor: itemAccentColor,
        iconClass: itemIconClass,
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
        groupCount: columnItem.feedbackItem.childFeedbackItemIds ? columnItem.feedbackItem.childFeedbackItemIds.length : 0,
        groupIds: columnItem.feedbackItem.childFeedbackItemIds ?? [],
        isGroupedCarouselItem: (columnItem.feedbackItem.childFeedbackItemIds?.length ?? 0) > 0,
        isShowingGroupedChildrenTitles: false,
        isFocusModalHidden: this.props.isFocusModalHidden,
        activeTimerFeedbackItemId: columnProps.activeTimerFeedbackItemId,
        requestTimerStart: columnProps.requestTimerStart,
        notifyTimerStopped: columnProps.notifyTimerStopped,
      };

      return (
        <div key={feedbackItemProps.id} className="feedback-carousel-item">
          <FeedbackItem key={feedbackItemProps.id} {...feedbackItemProps} />
        </div>
      );
    });
  };

  public render() {
    const arrowBaseClasses = "absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center cursor-pointer transition-transform duration-200 ease-in-out bg-white/90 border border-gray-300 rounded-full w-10 h-10 shadow-sm no-underline hover:bg-white hover:shadow-md hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";
    const arrowIconClasses = "text-base text-gray-800";

    return (
      <Pivot className="feedback-carousel-pivot">
        {this.state.feedbackColums.map(columnProps => {
          const feedbackCarouselItems = this.renderFeedbackCarouselItems(columnProps);
          const slideIds = feedbackCarouselItems.map((_, index) => `slide-${columnProps.columnId}-${index}`);
          const activeDotCss = slideIds
            .map(slideId => `.carousel-container:has(#${slideId}:target) .carousel-dots a[href="#${slideId}"] { opacity: 1; transform: scale(1.05); }`)
            .join("\n");

          return (
            <PivotItem key={columnProps.columnId} headerText={columnProps.columnName} className="feedback-carousel-pivot-item" {...columnProps}>
              <div className="carousel-container">
                {activeDotCss && <style>{activeDotCss}</style>}
                <ol className="carousel-track" id={`carousel-${columnProps.columnId}`}>
                  {feedbackCarouselItems.map((child, index) => {
                    return (
                      <li className="carousel-slide" id={`slide-${columnProps.columnId}-${index}`} key={child.key}>
                        {index > 0 && (
                          <a href={`#slide-${columnProps.columnId}-${index - 1}`} className={`${arrowBaseClasses} left-2.5`} aria-label="Previous slide">
                            <i className={`fas fa-chevron-left ${arrowIconClasses}`} />
                          </a>
                        )}
                        <div className="carousel-viewport">{child}</div>
                        {index < feedbackCarouselItems.length - 1 && (
                          <a href={`#slide-${columnProps.columnId}-${index + 1}`} className={`${arrowBaseClasses} right-2.5`} aria-label="Next slide">
                            <i className={`fas fa-chevron-right ${arrowIconClasses}`} />
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
  }
}

export default withAITracking(reactPlugin, FeedbackCarousel);
