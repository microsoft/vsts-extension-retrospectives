import React from "react";
import FeedbackColumn, { FeedbackColumnProps } from "./feedbackColumn";
import { Pivot, PivotItem } from "@fluentui/react/lib/Pivot";
import FeedbackItem from "./feedbackItem";
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
  currentSlides: Record<string, number>; // Track current slide index per column
}

class FeedbackCarousel extends React.Component<IFeedbackCarouselProps, IFeedbackCarouselState> {
  private carouselRefs: Record<string, React.RefObject<HTMLDivElement>> = {};

  constructor(props: IFeedbackCarouselProps) {
    super(props);
    this.state = {
      currentSlides: {},
    };
  }

  private goToSlide = (columnId: string, slideIndex: number, totalSlides: number) => {
    const clampedIndex = Math.max(0, Math.min(slideIndex, totalSlides - 1));
    this.setState(prevState => ({
      currentSlides: {
        ...prevState.currentSlides,
        [columnId]: clampedIndex,
      },
    }));

    const carousel = this.carouselRefs[columnId]?.current;
    if (carousel) {
      const slideWidth = carousel.scrollWidth / totalSlides;
      carousel.scrollTo({
        left: slideWidth * clampedIndex,
        behavior: "smooth",
      });
    }
  };

  private goToPrevSlide = (columnId: string, totalSlides: number) => {
    const currentIndex = this.state.currentSlides[columnId] || 0;
    this.goToSlide(columnId, currentIndex - 1, totalSlides);
  };

  private goToNextSlide = (columnId: string, totalSlides: number) => {
    const currentIndex = this.state.currentSlides[columnId] || 0;
    this.goToSlide(columnId, currentIndex + 1, totalSlides);
  };

  // Render carousel with grouped feedback items ordered by total votes and created date
  private renderFeedbackCarouselItems = (feedbackColumnProps: FeedbackColumnProps) => {
    const sortedItems = itemDataService.sortItemsByVotesAndDate(feedbackColumnProps.columnItems, feedbackColumnProps.columnItems);

    return (
      sortedItems
        // Carousel only shows main item cards
        .filter(columnItem => !columnItem.feedbackItem.parentFeedbackItemId)
        .map(columnItem => {
          const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(feedbackColumnProps, columnItem, true);
          const isFocusModalHidden = this.props.isFocusModalHidden;

          feedbackItemProps.isGroupedCarouselItem = !isFocusModalHidden && columnItem.feedbackItem.childFeedbackItemIds ? columnItem.feedbackItem.childFeedbackItemIds.length > 0 : false;
          feedbackItemProps.isFocusModalHidden = isFocusModalHidden;

          return (
            <div key={feedbackItemProps.id} className="feedback-carousel-item">
              <FeedbackItem key={feedbackItemProps.id} {...feedbackItemProps} />
            </div>
          );
        })
    );
  };

  public render() {
    // Added an "All" column by default which is a clone of an existing
    // column configuration, but will contain static "All" column data and
    // every feedback card. "All" column gets applied in the carousel so
    // that is does not impact any UI outside of "Focus Mode".
    if (this.props.feedbackColumnPropsList.length > 0) {
      const existingColumn: FeedbackColumnProps = this.props.feedbackColumnPropsList[0];

      const allColumnItems: IColumnItem[] = [...this.props.feedbackColumnPropsList.flatMap(c => c.columnItems)];
      const allColumnId: string = generateUUID();
      const allColumnName: string = "All";
      const allFeedbackColumn: FeedbackColumnProps = {
        ...existingColumn,
        columnId: allColumnId,
        columnIds: [...existingColumn.columnIds, allColumnId],
        columns: {
          ...existingColumn.columns,
          [allColumnId]: {
            columnItems: allColumnItems,
            columnProperties: {
              id: allColumnId,
              title: allColumnName,
              iconClass: "",
              accentColor: "",
            },
            shouldFocusOnCreateFeedback: false,
          },
        },
        columnItems: allColumnItems,
        columnName: allColumnName,
      };

      // Always set the "All" column as the first option
      this.props.feedbackColumnPropsList.unshift(allFeedbackColumn);
    }

    return (
      <Pivot className="feedback-carousel-pivot">
        {this.props.feedbackColumnPropsList.map(columnProps => {
          const mainItems = columnProps.columnItems.filter(columnItem => !columnItem.feedbackItem.parentFeedbackItemId);
          const mainCardCount = mainItems.length;

          // Always call renderFeedbackCarouselItems for consistent item rendering
          const feedbackCarouselItems = this.renderFeedbackCarouselItems(columnProps);
          
          // Initialize ref for this column if needed
          if (!this.carouselRefs[columnProps.columnId]) {
            this.carouselRefs[columnProps.columnId] = React.createRef<HTMLDivElement>();
          }

          const currentSlide = this.state.currentSlides[columnProps.columnId] || 0;

          return (
            <PivotItem key={columnProps.columnId} headerText={columnProps.columnName} className="feedback-carousel-pivot-item" {...columnProps}>
              {mainCardCount > 1 ? (
                <div className="custom-carousel-container">
                  <button 
                    className="carousel-arrow carousel-arrow-prev" 
                    onClick={() => this.goToPrevSlide(columnProps.columnId, mainCardCount)}
                    disabled={currentSlide === 0}
                    aria-label="Previous slide"
                  >
                    <i className="fas fa-chevron-left" />
                  </button>
                  
                  <div className="carousel-viewport">
                    <div 
                      className="carousel-track" 
                      ref={this.carouselRefs[columnProps.columnId]}
                    >
                      {feedbackCarouselItems.map((child: React.ReactElement<typeof FeedbackItem>) => (
                        <div className="carousel-slide" key={child.key}>
                          {child}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    className="carousel-arrow carousel-arrow-next" 
                    onClick={() => this.goToNextSlide(columnProps.columnId, mainCardCount)}
                    disabled={currentSlide === mainCardCount - 1}
                    aria-label="Next slide"
                  >
                    <i className="fas fa-chevron-right" />
                  </button>
                  
                  <div className="carousel-dots">
                    {feedbackCarouselItems.map((_, index) => (
                      <button
                        key={index}
                        className={`carousel-dot ${index === currentSlide ? "active" : ""}`}
                        onClick={() => this.goToSlide(columnProps.columnId, index, mainCardCount)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                feedbackCarouselItems[0] // Render the first (and only) item for single card
              )}
            </PivotItem>
          );
        })}
      </Pivot>
    );
  }
}

export default withAITracking(reactPlugin, FeedbackCarousel);
