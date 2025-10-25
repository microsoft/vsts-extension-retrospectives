import React from "react";
import FeedbackColumn, { FeedbackColumnProps } from "./feedbackColumn";
import { Pivot, PivotItem } from "@fluentui/react/lib/Pivot";
import FeedbackItem, { IFeedbackItemProps } from "./feedbackItem";
import { IColumnItem } from "./feedbackBoard";
import { itemDataService } from "../dal/itemDataService";
import { reactPlugin } from "../utilities/telemetryClient";
import { generateUUID } from "../utilities/random";
import { withAITracking } from "@microsoft/applicationinsights-react-js";

export interface IFeedbackCarouselProps {
  feedbackColumnPropsList: FeedbackColumnProps[];
  isFeedbackAnonymous: boolean;
  isFocusModalHidden: boolean;
}

export interface IFeedbackCarouselState {
  feedbackColums: FeedbackColumnProps[];
  currentColumnId: string;
  currentColumnIndex: number;
}

class FeedbackCarousel extends React.Component<IFeedbackCarouselProps, IFeedbackCarouselState> {
  private carouselRefs: Record<string, React.RefObject<HTMLDivElement>> = {};

  constructor(props: IFeedbackCarouselProps) {
    super(props);

    const feedbackColumnPropsList = JSON.parse(JSON.stringify(this.props.feedbackColumnPropsList)) as FeedbackColumnProps[];

    feedbackColumnPropsList.unshift({
      ...feedbackColumnPropsList[0],
      columnId: "all-columns",
      columnName: "All",
      columnItems: feedbackColumnPropsList.flatMap(col => col.columnItems),
    } as FeedbackColumnProps);

    this.state = {
      feedbackColums: feedbackColumnPropsList,
      currentColumnId: feedbackColumnPropsList.length > 0 ? feedbackColumnPropsList[0].columnId : "",
      currentColumnIndex: 0,
    };

    console.log("Initialized FeedbackCarousel with state:", this.state);
  }

  private goToSlide = (columnId: string, slideIndex: number) => {
    const totalSlides = this.state.feedbackColums.find(col => col.columnId === columnId)?.columnItems.filter(item => !item.feedbackItem.parentFeedbackItemId).length || 0;
    const clampedIndex = Math.max(0, Math.min(slideIndex, totalSlides - 1));
    console.log("Go to slide:", { columnId, slideIndex, clampedIndex, totalSlides });

    this.setState(() => ({
      currentColumnIndex: clampedIndex
    }), () => {
      console.log("Updated currentColumnIndex state:", this.state.currentColumnIndex);
    });

    const carousel = this.carouselRefs[columnId]?.current;
    if (carousel) {
      const slideWidth = carousel.scrollWidth / totalSlides;
      carousel.scrollTo({
        left: slideWidth * clampedIndex,
        behavior: "smooth",
      });
    }
  };

  private goToPrevSlide = (columnId: string) => {
    const currentIndex = this.state.currentColumnIndex || 0;
    this.goToSlide(columnId, currentIndex - 1);
  };

  private goToNextSlide = (columnId: string) => {
    const currentIndex = this.state.currentColumnIndex || 0;
    this.goToSlide(columnId, currentIndex + 1);
  };

  private renderFeedbackCarouselItems = (columnProps: FeedbackColumnProps) => {
    const sortedItems = columnProps.columnItems.sort((a, b) => {
      if (b.feedbackItem.upvotes !== a.feedbackItem.upvotes) {
        return b.feedbackItem.upvotes - a.feedbackItem.upvotes;
      }
      const dateA = new Date(a.feedbackItem.createdDate).getTime();
      const dateB = new Date(b.feedbackItem.createdDate).getTime();
      return dateA - dateB;
    }).filter(columnItem => !columnItem.feedbackItem.parentFeedbackItemId);

    return (
      sortedItems.map(columnItem => {
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
          columnId: columnProps.columnId,
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
          isFocusModalHidden: true,
        };

        return (
          <div key={feedbackItemProps.id} className="feedback-carousel-item">
            <FeedbackItem key={feedbackItemProps.id} {...feedbackItemProps} />
          </div>
        );
      })
    );
  };

  public render() {
    return (
      <Pivot className="feedback-carousel-pivot">
        {this.state.feedbackColums.map(columnProps => {
          const feedbackCarouselItems = this.renderFeedbackCarouselItems(columnProps);

          if (!this.carouselRefs[columnProps.columnId]) {
            this.carouselRefs[columnProps.columnId] = React.createRef<HTMLDivElement>();
          }

          const currentSlide = this.state.currentColumnIndex || 0;

          return (
            <PivotItem key={columnProps.columnId} headerText={columnProps.columnName} className="feedback-carousel-pivot-item" {...columnProps}>
              <div className="custom-carousel-container">
                <button className="carousel-arrow carousel-arrow-prev" onClick={() => this.goToPrevSlide(columnProps.columnId)} disabled={currentSlide === 0} aria-label="Previous slide">
                  <i className="fas fa-chevron-left" />
                </button>

                <div className="carousel-viewport">
                  <div className="carousel-track" ref={this.carouselRefs[columnProps.columnId]}>
                    {feedbackCarouselItems.map((child) => (
                      <div className="carousel-slide" key={child.key}>
                        {child}
                      </div>
                    ))}
                  </div>
                </div>

                <button className="carousel-arrow carousel-arrow-next" onClick={() => this.goToNextSlide(columnProps.columnId)} disabled={currentSlide === feedbackCarouselItems.length - 1} aria-label="Next slide">
                  <i className="fas fa-chevron-right" />
                </button>

                <div className="carousel-dots">
                  {feedbackCarouselItems.map((_, index) => (
                    <button key={index} className={`carousel-dot ${index === currentSlide ? "active" : ""}`} onClick={() => this.goToSlide(columnProps.columnId, index)} aria-label={`Go to slide ${index + 1}`} />
                  ))}
                </div>
              </div>
            </PivotItem>
          );
        })}
      </Pivot>
    );
  }
}

export default withAITracking(reactPlugin, FeedbackCarousel);
