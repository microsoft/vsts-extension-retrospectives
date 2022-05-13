import * as React from 'react';
import moment from 'moment';
import { shallow } from 'enzyme';
import FeedbackItem from '../feedbackItem';
import FeedbackColumn from '../feedbackColumn';
import EditableDocumentCardTitle from '../editableDocumentCardTitle';
import Dialog from 'office-ui-fabric-react/lib/Dialog';
import { DefaultButton } from 'office-ui-fabric-react';
import ActionItemDisplay from '../actionItemDisplay';
import {
  testColumnProps,
  testColumnItem,
  testColumnTwoTitle,
  testUpvotes,
  testFeedbackItem,
  testColumns,
  testBoardId,
  testColumnUuidOne
} from '../__mocks__/mocked_components/mockedFeedbackColumn';

// Base render constants, these may change if the FeedbackItem component is changed.
const childDialogCount = 5;
const voteButtonCount = 2;

describe('Feedback Item', () => {
  test('Render a Feedback Item with no child Feedback Items.', () => {
    const testProps = FeedbackColumn.createFeedbackItemProps(
      testColumnProps, testColumnItem, true);

    const wrapper = shallow(<FeedbackItem {...testProps} />);
    const component = wrapper.children().dive();

    // Expect all child Dialogs to be hidden.
    const childDialogs = component.find(Dialog);
    expect(childDialogs).toHaveLength(childDialogCount);
    expect(childDialogs.findWhere((child) =>
      child.prop("hidden") === true)).toHaveLength(childDialogCount);

    /* Expect Default buttons for actions for each child dialog.
       Expect the Move Feedback Button to only exist for the second column. */
    const defaultButtons = component.findWhere((child) => child.type() === DefaultButton);
    expect(defaultButtons).toHaveLength(childDialogCount);
    expect(defaultButtons.findWhere((child) =>
      child.prop("className") === "move-feedback-item-column-button").
      html()).toContain(testColumnTwoTitle);

    // Expect the vote count to be propagated in multiple areas of the rendered component.
    const voteButtons = component.findWhere((child) =>
      child.prop("className") === "feedback-action-button feedback-add-vote");
    expect(voteButtons).toHaveLength(voteButtonCount);
    voteButtons.forEach((voteNode) => {
      expect(voteNode.html()).toContain(`Current vote count is ${testUpvotes}`);
    });
    expect(component.findWhere((child) =>
      child.prop("title") === "Vote").
      findWhere((nestedChild) =>
        nestedChild.prop("className") === "feedback-upvote-count").text()).
      toEqual(` ${testUpvotes}`);

    // Expect basic values of the Feedback Item to be propagated in multiple areas of the rendered component.
    expect(component.findWhere((child) =>
      child.prop("className") === "anonymous-created-date").text()).
      toEqual(moment(testFeedbackItem.createdDate).format('MMM Do, YYYY h:mm a'));

    expect(component.findWhere((child) =>
      child.prop("className") === "card-id").text()).
      toEqual(`#${testColumns[testColumnUuidOne].columnItems.findIndex(
        (columnItem: { feedbackItem: { id: string; }; }) =>
          columnItem.feedbackItem.id === testFeedbackItem.id)}`);

    expect(component.findWhere((child) =>
      child.type() === EditableDocumentCardTitle).prop("title")).
      toEqual(testFeedbackItem.title);

    const actionItemDisplay = component.findWhere((child) =>
      child.type() === ActionItemDisplay);
    expect(actionItemDisplay.prop("feedbackItemId")).toEqual(testFeedbackItem.id);
    expect(actionItemDisplay.prop("feedbackItemTitle")).toEqual(testFeedbackItem.title);
    expect(actionItemDisplay.prop("boardId")).toEqual(testBoardId);
    expect(actionItemDisplay.prop("boardTitle")).toEqual(testColumnProps.boardTitle);

    // Same formating function
    const timerMinutes = Math.floor(testFeedbackItem.timerSecs / 60);
    const timerSeconds = testFeedbackItem.timerSecs % 60;
    const showLeadingZeroInSeconds = timerSeconds < 10;
    const formatTimer = showLeadingZeroInSeconds ? (timerMinutes + ':0' + timerSeconds) : (timerMinutes + ':' + timerSeconds);

    expect(component.findWhere((child) =>
      child.prop("title") === "Timer").html()).toContain(`${formatTimer} elapsed`);
  });
});