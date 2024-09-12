import React from 'react';

import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { WorkflowPhase } from '../interfaces/workItem';
import localStorageHelper from '../utilities/localStorageHelper';
import { reactPlugin } from '../utilities/telemetryClient';
import FeedbackItem, { FeedbackItemHelper, IFeedbackItemProps } from './feedbackItem';

export interface IFeedbackItemGroupProps {
  groupedWorkItems: IFeedbackItemProps[];
  mainFeedbackItem: IFeedbackItemProps;
  workflowState: WorkflowPhase;
}

export interface RetrospectiveItemGroupState {
  isBeingDragged: boolean;
  isGroupExpanded: boolean;
  itemCardsStackHeight: number;
}

class FeedbackItemGroup extends React.Component<IFeedbackItemGroupProps, RetrospectiveItemGroupState> {
  constructor(props: IFeedbackItemGroupProps) {
    super(props);
    this.state = {
      isBeingDragged: false,
      isGroupExpanded: false,
      itemCardsStackHeight: 0,
    };
  }

  private dragFeedbackItemOverFeedbackItemGroup = (e: React.DragEvent<HTMLDivElement>) => {
    // Allow if the item being dragged is not from this group.
    if (!this.state.isBeingDragged) {
      e.preventDefault();
    }
    e.stopPropagation();
    e.dataTransfer.dropEffect = "link";
  }

  private dropFeedbackItemOnFeedbackItemGroup = (e: React.DragEvent<HTMLDivElement>) => {
    // Using localStorage as a temporary solution for Edge issue
    // Bug 19016440: Edge drag and drop dataTransfer protocol is bugged
    // const droppedItemId = e.dataTransfer.getData('id');
    const droppedItemId = localStorageHelper.getIdValue();
    FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(this.props.mainFeedbackItem, droppedItemId, this.props.mainFeedbackItem.id);
    e.stopPropagation();
  }

  private toggleGroupExpand = () => {
    this.setState((previousState) => ({ isGroupExpanded: !previousState.isGroupExpanded }));
  }

  private setIsGroupBeingDragged = (isBeingDragged: boolean) => {
    this.setState({ isBeingDragged });
  }

  public render(): JSX.Element {
    return (
      <div
        className={`feedback-item-group ${this.state.isGroupExpanded ? "feedback-item-group-expanded" : ""}`}
        onDragOver={this.dragFeedbackItemOverFeedbackItemGroup}
        onDrop={this.dropFeedbackItemOnFeedbackItemGroup}>
        <div className="item-cards"
          aria-label="Group Feedback Items">
          <FeedbackItem
            {...this.props.mainFeedbackItem}
            groupedItemProps={{
              groupedCount: this.props.groupedWorkItems.length,
              isGroupExpanded: this.state.isGroupExpanded,
              isMainItem: true,
              parentItemId: undefined,
              setIsGroupBeingDragged: this.setIsGroupBeingDragged,
              toggleGroupExpand: this.toggleGroupExpand
            }}
          />
          {this.state.isGroupExpanded &&
            this.props.groupedWorkItems.map((itemProps) =>
              <FeedbackItem
                key={itemProps.id}
                {...itemProps}
                groupedItemProps={{
                  groupedCount: undefined,
                  isGroupExpanded: undefined,
                  isMainItem: false,
                  parentItemId: this.props.mainFeedbackItem.id,
                  setIsGroupBeingDragged: this.setIsGroupBeingDragged,
                  toggleGroupExpand: undefined
                }}
              />
            )
          }
          <div
            className="item-cards-stack hide-mobile"
            style={{ height: this.state.itemCardsStackHeight - 2, marginTop: 5 - this.state.itemCardsStackHeight }}
          />
        </div>
      </div>
    );
  }
}

export default withAITracking(reactPlugin, FeedbackItemGroup);