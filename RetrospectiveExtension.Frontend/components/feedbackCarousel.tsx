import React from 'react';
import Slider, { Settings } from "react-slick";
import FeedbackColumn, { FeedbackColumnProps } from './feedbackColumn';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import FeedbackItem from './feedbackItem';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/telemetryClient';

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

    return (
      <Pivot
        className="feedback-carousel-pivot">
        {this.props.feedbackColumnPropsList.map((columnProps) => {
          const mainCardCount = columnProps.columnItems.filter((columnItem) => !columnItem.feedbackItem.parentFeedbackItemId).length;

          columnProps.columnItems.forEach(columnItem => {
            // Establish whether an item in the column has children feedback grouped beneath it,
            // and therefore will be the parent
            const isGroupedCarouselItem = columnItem.feedbackItem.childFeedbackItemIds ? columnItem.feedbackItem.childFeedbackItemIds.length > 0 : false;

            // Set that property for later
            columnItem.feedbackItem.isGroupedCarouselItem = columnItem.feedbackItem.childFeedbackItemIds ? columnItem.feedbackItem.childFeedbackItemIds.length > 0 : false;

            if (isGroupedCarouselItem) {
              // If an item in the column is a parent, set the children ids so we can show data
              // in the 'Related Feedback' section
              columnItem.feedbackItem.groupIds  = columnItem.feedbackItem.childFeedbackItemIds;
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
