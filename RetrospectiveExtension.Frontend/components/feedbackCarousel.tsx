import * as React from 'react';
import Slider, { Settings } from "react-slick";
import FeedbackColumn, { FeedbackColumnProps } from './feedbackColumn';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import FeedbackItem from './feedbackItem';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/external/telemetryClient';

export interface IFeedbackCarouselProps {
  feedbackColumnPropsList: FeedbackColumnProps[];
  isFeedbackAnonymous: boolean;
  isFocusModalHidden: boolean;
}

export interface IFeedbackCarouselState {
}

class FeedbackCarousel extends React.Component<IFeedbackCarouselProps, IFeedbackCarouselState>{
  private renderFeedbackCarouselItems = (feedbackColumnProps: FeedbackColumnProps) => {
    const columnItems = feedbackColumnProps.columnItems.sort((item1, item2) => item2.feedbackItem.upvotes - item1.feedbackItem.upvotes);

    return columnItems
      // Carousel only shows main item cards.
      .filter((columnItem) => !columnItem.feedbackItem.parentFeedbackItemId)
      .map((columnItem) => {
        const feedbackItemProps =
          FeedbackColumn.createFeedbackItemProps(feedbackColumnProps, columnItem, true);

        const isFocusModalHidden = this.props.isFocusModalHidden;

        feedbackItemProps.isGroupedCarouselItem = !isFocusModalHidden && columnItem.feedbackItem.childFeedbackItemIds ? (columnItem.feedbackItem.childFeedbackItemIds.length > 0 ? true : false) : false;
        feedbackItemProps.isFocusModalHidden = isFocusModalHidden;

        return (
          <div key={feedbackItemProps.id} className="feedback-carousel-item">
            <FeedbackItem
              key={feedbackItemProps.id}
              {...feedbackItemProps}
            />
          </div>
        );
      });
  }

  private renderSingleFeedbackCarouselItem = (feedbackColumnProps: FeedbackColumnProps) => {
    return (
      <div className="feedback-carousel-item">
        <FeedbackItem
          {...FeedbackColumn.createFeedbackItemProps(feedbackColumnProps, feedbackColumnProps.columnItems.filter((columnItem) => !columnItem.feedbackItem.parentFeedbackItemId)[0], true)
          }
        />
      </div>
    );
  }

  public render() {
    const settings: Settings = {
      dots: true,
      infinite: false,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: true,
      arrows: true,
      variableWidth: true,
      accessibility: true,
    };

    // Change this value to adjust what "two lines" is considered
    const childTitleLengthMax = 200;

    return (
      <Pivot
        className="feedback-carousel-pivot">
        {this.props.feedbackColumnPropsList.map((columnProps) => {
          const mainCardCount = columnProps.columnItems.filter((columnItem) => !columnItem.feedbackItem.parentFeedbackItemId).length;

          columnProps.columnItems.forEach(columnItem => {
            const feedbackItemProps = FeedbackColumn.createFeedbackItemProps(columnProps, columnItem, true);

            // Establish whether an item in the column has children feedback grouped beneath it,
            // and therefore will be the parent
            const isGroupedCarouselItem = columnItem.feedbackItem.childFeedbackItemIds ? columnItem.feedbackItem.childFeedbackItemIds.length > 0 : false;

            // Set that property for later
            columnItem.feedbackItem.isGroupedCarouselItem = columnItem.feedbackItem.childFeedbackItemIds ? columnItem.feedbackItem.childFeedbackItemIds.length > 0 : false;

            if (isGroupedCarouselItem) {
              // If an item in the column is a parent, get the title of the children
              // to show in 'Related Feedback' section
              const columnItemChildrenIds = columnItem.feedbackItem.childFeedbackItemIds;
              const childrenTitlesShort: String[] = [];
              columnItemChildrenIds.forEach(childId => {
                // For every child item in the group, limit to 2 lines (~200 characters)
                const childFeedbackItem = columnProps.columnItems.find(childItem => childItem.feedbackItem.id == childId)
                const origTitle = childFeedbackItem.feedbackItem.title
                const shortTitle = origTitle.length > childTitleLengthMax ? origTitle.substring(0, childTitleLengthMax) + '...' : origTitle;
                childrenTitlesShort.push(shortTitle)
              });

              columnItem.feedbackItem.groupTitles = childrenTitlesShort;
            }
          });

          return <PivotItem
            key={columnProps.columnId}
            headerText={columnProps.columnName}
            className="feedback-carousel-pivot-item"
            {...columnProps}
          >
            {mainCardCount === 1 &&
              this.renderSingleFeedbackCarouselItem(columnProps)
            }
            {mainCardCount >= 2 &&
              // @ts-ignore TS2786
              <Slider {...settings}>
                {React.Children.map(this.renderFeedbackCarouselItems(columnProps), (child: React.ReactElement<typeof FeedbackItem>) => {
                  return (
                    <div
                      className="feedback-carousel-item-wrapper"
                      key={child.key}>
                      {child}
                    </div>
                  );
                })}
              </Slider>
            }
          </PivotItem>
        })}
      </Pivot>
    );
  }
}

export default withAITracking(reactPlugin, FeedbackCarousel);