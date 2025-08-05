import React from 'react';
import { mount, shallow } from 'enzyme';
import { mockUuid } from '../__mocks__/uuid/v4';
import FeedbackBoardMetadataForm, { IFeedbackBoardMetadataFormProps, IFeedbackColumnCard } from '../feedbackBoardMetadataForm';
import { testColumns, testExistingBoard, testTeamId } from '../__mocks__/mocked_components/mockedBoardMetadataForm';
import { Checkbox, DefaultButton, List, TextField } from 'office-ui-fabric-react';

const mockedProps: IFeedbackBoardMetadataFormProps = {
  isNewBoardCreation: true,
  isDuplicatingBoard: false,
  currentBoard: null,
  teamId: testTeamId,
  placeholderText: '',
  maxVotesPerUser: 5,
  availablePermissionOptions: [],
  currentUserId: "mock-user-id",
  onFormSubmit: () => null,
  onFormCancel: () => null
};

jest.mock('uuid', () => ({ v4: () => mockUuid}));

describe('Board Metadata Form', () => {
  it('can be rendered', () => {
    const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
    const component = wrapper.children().dive();
    const textField = component.findWhere(c => c.prop('id') === 'retrospective-title-input').find(TextField);

    expect(textField).toBeDefined();
    expect(textField.prop('value')).toEqual('');
  });

  describe('New Board', () => {
    beforeEach(() => {
      mockedProps.currentBoard = null;
    });

    it('renders the title input with empty value for a new board', () => {
      const wrapper = mount(<FeedbackBoardMetadataForm {...mockedProps} />);
      const titleField = wrapper.find('input#retrospective-title-input');

      expect(titleField.exists()).toBe(true);
      expect(titleField.prop('value')).toBe('');
    });

    it('updates state when max vote counter input changes', () => {
      const wrapper = mount(<FeedbackBoardMetadataForm {...mockedProps} />);
      const input = wrapper.find('input#max-vote-counter');

      input.simulate('change', { target: { value: '10' } });

      const updatedInput = wrapper.find('input#max-vote-counter');
      expect(updatedInput.prop('value')).toBe('10');
    });

    it('should set the title to nothing', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const textField = component.findWhere(c => c.prop('id') === 'retrospective-title-input').find(TextField);

      expect(textField).toBeDefined();
      expect(textField.prop('value')).toEqual("");
    });

    it('should properly set max votes settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const textField = component.findWhere(c => c.prop('id') === 'max-vote-counter').find(TextField);

      expect(textField).toBeDefined();
      expect(textField.prop('value')).toEqual("5");
    });

    it('should properly set include team assessment settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'include-team-assessment-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('checked')).toEqual(true);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set obscure feedback settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'obscure-feedback-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('checked')).toEqual(false);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set display names settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'feedback-display-names-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('checked')).toEqual(false);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set the column list', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const list = component.find(List).first();

      expect(list).toBeDefined();

      const columns: IFeedbackColumnCard[] = list.prop<IFeedbackColumnCard[]>('items');

      expect(columns).toHaveLength(2);
      expect(columns.every(c => c.markedForDeletion === false)).toBeTruthy();
    });

    it('should add a new column when "Add new column" button is clicked', () => {
      const wrapper = mount(<FeedbackBoardMetadataForm {...mockedProps} />);
  
      // Initial column count
      let columnItems = wrapper.find(List).prop<IFeedbackColumnCard[]>('items');
      expect(columnItems).toHaveLength(2); // default length from mock

      // Click "Add new column" button
      wrapper.find('button.create-feedback-column-card-button').simulate('click');

      // Re-fetch updated items after state change
      columnItems = wrapper.find(List).prop<IFeedbackColumnCard[]>('items');
      expect(columnItems).toHaveLength(3);

      // Check new column title
      const newColumn = columnItems[columnItems.length - 1];
      expect(newColumn.column.title).toBe('New Column');
      expect(newColumn.markedForDeletion).toBe(false);
    });

    it('toggles include team assessment checkbox state on change', () => {
      const wrapper = mount(<FeedbackBoardMetadataForm {...mockedProps} />);

      // Find the checkbox by id prop
      const checkbox = wrapper.find(Checkbox).filterWhere(c => c.prop('id') === 'include-team-assessment-checkbox');
      expect(checkbox.exists()).toBe(true);
  
      // The initial checked state should be true (per your test)
      expect(checkbox.prop('checked')).toBe(true);

      // Simulate the change event to toggle checkbox off
      checkbox.find('input').simulate('change', { target: { checked: false } });

      // After change, the component's state or props should reflect unchecked
      const updatedCheckbox = wrapper.find(Checkbox).filterWhere(c => c.prop('id') === 'include-team-assessment-checkbox');
      expect(updatedCheckbox.prop('checked')).toBe(false);
    });

  })

  describe('Existing Board', () => {

    beforeEach(() => {
      mockedProps.isNewBoardCreation = false;
      mockedProps.currentBoard = testExistingBoard;
    })

    it('should set the title', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const textField = component.findWhere(c => c.prop('id') === 'retrospective-title-input').find(TextField);

      expect(textField).toBeDefined();
      expect(textField.prop('value')).toEqual(testExistingBoard.title);
    });

    it('should properly set max votes settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const textField = component.findWhere(c => c.prop('id') === 'max-vote-counter').find(TextField);

      expect(textField).toBeDefined();
      expect(textField.prop('value')).toEqual(testExistingBoard.maxVotesPerUser.toString());
    });

    it('should properly set include team assessment settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'include-team-assessment-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('checked')).toEqual(testExistingBoard.isIncludeTeamEffectivenessMeasurement);
      expect(checkbox.prop('disabled')).toEqual(true);
    });

    it('should properly set obscure feedback settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'obscure-feedback-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('checked')).toEqual(testExistingBoard.shouldShowFeedbackAfterCollect);
      expect(checkbox.prop('disabled')).toEqual(true);
    });

    it('should properly set display names settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'feedback-display-names-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('checked')).toEqual(testExistingBoard.isAnonymous);
      expect(checkbox.prop('disabled')).toEqual(true);
    });

    it('should properly set the column list', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const list = component.find(List).first();

      expect(list).toBeDefined();

      const columns: IFeedbackColumnCard[] = list.prop<IFeedbackColumnCard[]>('items');

      expect(columns).toHaveLength(testColumns.length);
      expect(columns.every(c => c.markedForDeletion === false)).toBeTruthy();
    });
  })

  describe('Duplicate Board', () => {

    beforeEach(() => {
      mockedProps.isNewBoardCreation = true;
      mockedProps.isDuplicatingBoard = true;
      mockedProps.currentBoard = testExistingBoard;
    })

    it('should set the title with the duplicate copy addition', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const textField = component.findWhere(c => c.prop('id') === 'retrospective-title-input').find(TextField);

      expect(textField).toBeDefined();
      expect(textField.prop('value')).toEqual(testExistingBoard.title + ' - copy');
    });

    it('should properly set max votes settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const textField = component.findWhere(c => c.prop('id') === 'max-vote-counter').find(TextField);

      expect(textField).toBeDefined();
      expect(textField.prop('value')).toEqual(testExistingBoard.maxVotesPerUser.toString());
    });

    it('should properly set include team assessment settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'include-team-assessment-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('checked')).toEqual(testExistingBoard.isIncludeTeamEffectivenessMeasurement);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set obscure feedback settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'obscure-feedback-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('checked')).toEqual(testExistingBoard.shouldShowFeedbackAfterCollect);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set display names settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'feedback-display-names-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('checked')).toEqual(testExistingBoard.isAnonymous);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set the column list', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const list = component.find(List).first();

      expect(list).toBeDefined();

      const columns: IFeedbackColumnCard[] = list.prop<IFeedbackColumnCard[]>('items');

      expect(columns).toHaveLength(testColumns.length);
      expect(columns.every(c => c.markedForDeletion === false)).toBeTruthy();
    });
  })
});
