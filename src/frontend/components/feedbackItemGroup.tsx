import React from "react";

import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { WorkflowPhase } from "../interfaces/workItem";
import localStorageHelper from "../utilities/localStorageHelper";
import { reactPlugin } from "../utilities/telemetryClient";
import FeedbackItem, { FeedbackItemHelper, IFeedbackItemProps } from "./feedbackItem";

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
  private groupRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: IFeedbackItemGroupProps) {
    super(props);
    this.state = {
      isBeingDragged: false,
      isGroupExpanded: false,
      itemCardsStackHeight: 0,
    };
  }

  public componentDidMount() {
    if (this.groupRef.current) {
      this.groupRef.current.addEventListener("keydown", this.handleGroupKeyDown);
    }
  }

  public componentWillUnmount() {
    if (this.groupRef.current) {
      this.groupRef.current.removeEventListener("keydown", this.handleGroupKeyDown);
    }
  }

  private handleGroupKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;

    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    if (e.key === " " && target.tagName !== "BUTTON") {
      e.preventDefault();
      this.toggleGroupExpand();
    }
  };

  private dragFeedbackItemOverFeedbackItemGroup = (e: React.DragEvent<HTMLDivElement>) => {
    // Allow if the item being dragged is not from this group.
    if (!this.state.isBeingDragged) {
      e.preventDefault();
    }
    e.stopPropagation();
    e.dataTransfer.dropEffect = "link";
  };

  private dropFeedbackItemOnFeedbackItemGroup = (e: React.DragEvent<HTMLDivElement>) => {
    // Using localStorage as a temporary solution for Edge issue
    // Bug 19016440: Edge drag and drop dataTransfer protocol is bugged
    // const droppedItemId = e.dataTransfer.getData('id');
    const droppedItemId = localStorageHelper.getIdValue();
    FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(this.props.mainFeedbackItem, droppedItemId, this.props.mainFeedbackItem.id);
    e.stopPropagation();
  };

  private toggleGroupExpand = () => {
    this.setState(previousState => ({ isGroupExpanded: !previousState.isGroupExpanded }));
  };

  private setIsGroupBeingDragged = (isBeingDragged: boolean) => {
    this.setState({ isBeingDragged });
  };

  public render(): React.JSX.Element {
    return (
      <div ref={this.groupRef} className={`feedback-item-group ${this.state.isGroupExpanded ? "feedback-item-group-expanded" : ""}`} onDragOver={this.dragFeedbackItemOverFeedbackItemGroup} onDrop={this.dropFeedbackItemOnFeedbackItemGroup} role="group" aria-label={`Feedback group with ${this.props.groupedWorkItems.length + 1} items${this.state.isGroupExpanded ? ", expanded" : ", collapsed"}`}>
        <div className="item-cards" aria-label="Group Feedback Items">
          <FeedbackItem
            {...this.props.mainFeedbackItem}
            groupedItemProps={{
              groupedCount: this.props.groupedWorkItems.length,
              isGroupExpanded: this.state.isGroupExpanded,
              isMainItem: true,
              parentItemId: undefined,
              setIsGroupBeingDragged: this.setIsGroupBeingDragged,
              toggleGroupExpand: this.toggleGroupExpand,
            }}
          />
          {this.state.isGroupExpanded &&
            this.props.groupedWorkItems.map(itemProps => (
              <FeedbackItem
                key={itemProps.id}
                {...itemProps}
                groupedItemProps={{
                  groupedCount: undefined,
                  isGroupExpanded: undefined,
                  isMainItem: false,
                  parentItemId: this.props.mainFeedbackItem.id,
                  setIsGroupBeingDragged: this.setIsGroupBeingDragged,
                  toggleGroupExpand: undefined,
                }}
              />
            ))}
          <div className="item-cards-stack hide-mobile" style={{ height: this.state.itemCardsStackHeight - 2, marginTop: 5 - this.state.itemCardsStackHeight }} />
        </div>
      </div>
    );
  }
}

export default withAITracking(reactPlugin, FeedbackItemGroup);
