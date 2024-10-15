import React from 'react';
import { shallow } from 'enzyme';
import { mockUuid } from '../__mocks__/uuid/v4';
import FeedbackBoardMetadataForm, { IFeedbackBoardMetadataFormProps, IFeedbackColumnCard } from '../feedbackBoardMetadataForm';
import { testColumns, testExistingBoard, testTeamId } from '../__mocks__/mocked_components/mockedBoardMetadataForm';
import { Checkbox, List, TextField } from 'office-ui-fabric-react';

const mockedProps: IFeedbackBoardMetadataFormProps = {
  isNewBoardCreation: true,
  isDuplicatingBoard: false,
  currentBoard: null,
  teamId: testTeamId,
  placeholderText: '',
  maxvotesPerUser: 5,
  availablePermissionOptions: [],
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
    })

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
      expect(checkbox.prop('defaultChecked')).toEqual(true);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set obscure feedback settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'obscure-feedback-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('defaultChecked')).toEqual(false);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set prime directive setting', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'display-prime-directive').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('defaultChecked')).toEqual(true);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set display names settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'feedback-display-names-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('defaultChecked')).toEqual(true);
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
      expect(checkbox.prop('defaultChecked')).toEqual(testExistingBoard.isIncludeTeamEffectivenessMeasurement);
      expect(checkbox.prop('disabled')).toEqual(true);
    });

    it('should properly set obscure feedback settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'obscure-feedback-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('defaultChecked')).toEqual(testExistingBoard.shouldShowFeedbackAfterCollect);
      expect(checkbox.prop('disabled')).toEqual(true);
    });

    it('should properly set prime directive setting', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'display-prime-directive').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('defaultChecked')).toEqual(testExistingBoard.displayPrimeDirective);
      expect(checkbox.prop('disabled')).toEqual(true);
    });

    it('should properly set display names settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'feedback-display-names-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('defaultChecked')).toEqual(testExistingBoard.isAnonymous);
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
      expect(checkbox.prop('defaultChecked')).toEqual(testExistingBoard.isIncludeTeamEffectivenessMeasurement);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set obscure feedback settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'obscure-feedback-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('defaultChecked')).toEqual(testExistingBoard.shouldShowFeedbackAfterCollect);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set prime directive setting', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'display-prime-directive').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('defaultChecked')).toEqual(testExistingBoard.displayPrimeDirective);
      expect(checkbox.prop('disabled')).toEqual(false);
    });

    it('should properly set display names settings', () => {
      const wrapper = shallow(<FeedbackBoardMetadataForm {...mockedProps} />);
      const component = wrapper.children().dive();
      const checkbox = component.findWhere(c => c.prop('id') === 'feedback-display-names-checkbox').find(Checkbox);

      expect(checkbox).toBeDefined();
      expect(checkbox.prop('defaultChecked')).toEqual(testExistingBoard.isAnonymous);
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
