import React from 'react';
import { shallow, mount } from 'enzyme';
import { mockUuid } from '../__mocks__/uuid/v4';
import FeedbackBoardMetadataForm, { IFeedbackBoardMetadataFormProps, IFeedbackColumnCard } from '../feedbackBoardMetadataForm';
import { testColumns, testExistingBoard, testTeamId } from '../__mocks__/mocked_components/mockedBoardMetadataForm';
import { Checkbox, List, TextField } from 'office-ui-fabric-react';

jest.mock('../../dal/boardDataService', () => ({
  __esModule: true,
  default: {
    checkIfBoardNameIsTaken: jest.fn().mockResolvedValue(false),
    saveSetting: jest.fn().mockResolvedValue(undefined),
    getSetting: jest.fn().mockResolvedValue(undefined),
  },
}));

// Utility: Wait for component state to initialize
const waitForColumnCards = async (wrapper: any) => {
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    wrapper.update();
    const state = wrapper.state();
    if (state?.columnCards && state.columnCards.length > 0) {
      return;
    }
  }
  throw new Error("columnCards never initialized");
};

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

describe('Board Metadata Form - Simulate Defect', () => {
  it('removes marked column and closes dialog when Confirm is clicked', async () => {
    const onFormSubmit = jest.fn();
    const testUserId = 'test-user-id-123';

    const wrapper = mount(
      <FeedbackBoardMetadataForm
        currentBoard={testExistingBoard}
        teamId={testTeamId}
        currentUserId={testUserId}
        placeholderText=""
        maxVotesPerUser={10}
        availablePermissionOptions={[]}
        isNewBoardCreation={false}
        isDuplicatingBoard={false}
        onFormSubmit={onFormSubmit}
        onFormCancel={() => {}}
      />
    );

    // Wait for component state to initialize
    await waitForColumnCards(wrapper);

    // Mark the first column for deletion
    const initialColumns = wrapper.state('columnCards') as IFeedbackColumnCard[];
    const deletedColumnId = initialColumns[0].column.id;
    const updatedColumns = initialColumns.map((col, idx) =>
      idx === 0 ? { ...col, markedForDeletion: true } : col
    );
    wrapper.setState({ columnCards: updatedColumns });

    // Show the delete confirmation dialog
    wrapper.setState({ isDeleteColumnConfirmationDialogHidden: false });
    wrapper.update();

    // Simulate click on Confirm button
    const confirmButton = wrapper.find('PrimaryButton').filterWhere(btn => btn.prop('text') === 'Confirm');
    expect(confirmButton.exists()).toBe(true);

    const mockEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as React.MouseEvent;

    confirmButton.prop('onClick')?.(mockEvent);
    wrapper.update();

    // Verify dialog was closed
    expect(wrapper.state('isDeleteColumnConfirmationDialogHidden')).toBe(true);

    // Verify column was removed and onFormSubmit was called correctly
    const submittedColumns = onFormSubmit.mock.calls[0][2];
    expect(submittedColumns.length).toBe(testExistingBoard.columns.length - 1);
    expect(submittedColumns.some((col: IFeedbackColumnCard) => col.column.id === deletedColumnId)).toBe(false);
  });
});

});
