import React from "react";
import { shallow, mount } from 'enzyme';
import toJson from "enzyme-to-json";
import { ActionItem, ActionItemProps } from "../actionItem";
import { DocumentCardActions, DocumentCardTitle, DocumentCardPreview, IDocumentCardPreviewProps } from 'office-ui-fabric-react/lib/DocumentCard';
import Dialog from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { itemDataService } from '../../dal/itemDataService';
import { workItemService } from '../../dal/azureDevOpsWorkItemService';
import { IFeedbackItemDocument } from '../../interfaces/feedback';
import { WorkItemType, WorkItem } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTracking';

const mockOnUpdateActionItem = jest.fn(() => { });

const defaultTestProps: ActionItemProps = {
  feedbackItemId: "101",
  boardId: "Test Board Id",
  nonHiddenWorkItemTypes: [],
  allWorkItemTypes: [
    {
      color: "red",
      description: "Test description",
      icon: { id: "1", url: "testUrl" },
      isDisabled: false,
      name: "Test Work Item Type",
      referenceName: "Test Reference Name",
      fieldInstances: [],
      fields: [],
      states: [],
      transitions: {},
      xmlForm: "Test xmlForm",
      _links: {},
      url: "Test url"
    }
  ],
  onUpdateActionItem: mockOnUpdateActionItem,
  actionItem: {
    _links: {},
    url: "Test url",
    id: 1,
    commentVersionRef: { commentId: 1, version: 1, url: "Test url", createdInRevision: 1, isDeleted: false, text: "Test text" },
    relations: [],
    rev: 1,
    fields: {
      "System.Title": "Test Title",
      "System.WorkItemType": "Test Work Item Type",
    },
  },
  areActionIconsHidden: false,
  shouldFocus: false
};

describe("Action Item component", () => {
  it("renders correctly when there are no action items.", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it("renders correctly when action items exist and areActionIconsHidden is true", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} areActionIconsHidden={true} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it("renders correctly when action items exist and shouldFocus is true", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} shouldFocus={true} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it("renders correctly when action items exist and areActionIconsHidden is false", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} areActionIconsHidden={false} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it("renders correctly when action items exist and shouldFocus is false", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} shouldFocus={false} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it("focuses the openWorkItemButton when shouldFocus is true", () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} shouldFocus={true} />);
    const instance = wrapper.instance() as ActionItem;
    const mockFocus = jest.fn();
    instance.openWorkItemButton = { focus: mockFocus } as unknown as HTMLButtonElement;
    instance.componentDidMount();
    expect(mockFocus).toHaveBeenCalled();
  });
});

describe('Behavioral tests for ActionItem', () => {
  it('does not render actions when areActionIconsHidden is true', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} areActionIconsHidden={true} />);
    expect(wrapper.find(DocumentCardActions)).toHaveLength(0);
  });

  it('renders actions when areActionIconsHidden is false', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} areActionIconsHidden={false} />);
    expect(wrapper.find(DocumentCardActions)).toHaveLength(1);
  });

  it('toggles unlink confirmation dialog visibility based on state', () => {
    const wrapper = mount(<ActionItem {...defaultTestProps} />);
    // initially dialog is hidden
    expect(wrapper.find(Dialog)).toHaveLength(0);
    // show dialog
    wrapper.setState({ isUnlinkWorkItemConfirmationDialogHidden: false });
    wrapper.update();
    expect(wrapper.find(Dialog)).toHaveLength(1);
    // hide dialog
    wrapper.setState({ isUnlinkWorkItemConfirmationDialogHidden: true });
    wrapper.update();
    expect(wrapper.find(Dialog)).toHaveLength(0);
  });

  it('truncates titles longer than 25 characters', () => {
    const longTitle = 'A'.repeat(30);
    const modifiedProps = {
      ...defaultTestProps,
      actionItem: {
        ...defaultTestProps.actionItem,
        fields: { ...defaultTestProps.actionItem.fields, 'System.Title': longTitle }
      }
    };
    const wrapper = shallow(<ActionItem {...modifiedProps} />);
    const titleText = wrapper.find(DocumentCardTitle).prop('title');
    expect(titleText.length).toBe(28); // 25 chars + '...'
    expect(titleText.endsWith('...')).toBe(true);
  });
});

describe('UI-level integration tests for ActionItem', () => {
  it('renders the correct icon in DocumentCardPreview', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const preview = wrapper.find(DocumentCardPreview);
    const previewImages = preview.prop('previewImages') as IDocumentCardPreviewProps['previewImages'];
    expect(previewImages![0].previewIconProps.imageProps.src).toBe('testUrl');
  });

  it('applies resolved-border-right class when work item state is Completed', () => {
    const modifiedProps = {
      ...defaultTestProps,
      actionItem: {
        ...defaultTestProps.actionItem,
        fields: {
          ...defaultTestProps.actionItem.fields,
          'System.State': 'Completed'
        }
      },
      allWorkItemTypes: [
        { ...defaultTestProps.allWorkItemTypes[0], states: [{ name: 'Completed', category: 'Completed', color: 'blue' }] }
      ]
    };
    const wrapper = shallow(<ActionItem {...modifiedProps} />);
    expect(wrapper.find('.related-task-sub-card').hasClass('resolved-border-right')).toBe(true);
  });

  it('calls onUpdateActionItem when confirming unlink', async () => {
    jest.spyOn(itemDataService, 'removeAssociatedActionItem').mockResolvedValue({} as IFeedbackItemDocument);
    const wrapper = mount(<ActionItem {...defaultTestProps} />);
    // show dialog by setting state
    wrapper.setState({ isUnlinkWorkItemConfirmationDialogHidden: false });
    wrapper.update();
    const removeBtn = wrapper.find(PrimaryButton).filterWhere(b => b.prop('text') === 'Remove');
    removeBtn.simulate('click', { stopPropagation: () => { }, preventDefault: () => { } });
    // Wait for promises to resolve (flush microtasks)
    await Promise.resolve();
    await Promise.resolve();
    expect(defaultTestProps.onUpdateActionItem).toHaveBeenCalled();
  });
});

describe('Accessibility and edge case tests for ActionItem', () => {
  it('opens work item form on Enter key press', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const detailsDiv = wrapper.find('.ms-DocumentCard-details');
    const instance = wrapper.instance() as ActionItem;
    const spy = jest.fn();
    // @ts-expect-error: override private for test
    instance.onActionItemClick = spy;
    detailsDiv.simulate('keyPress', { key: 'Enter', stopPropagation: () => { } });
    expect(spy).toHaveBeenCalledWith(defaultTestProps.actionItem.id);
  });

  it('hides dialog when cancel button is clicked', () => {
    const wrapper = mount(<ActionItem {...defaultTestProps} />);
    wrapper.setState({ isUnlinkWorkItemConfirmationDialogHidden: false });
    wrapper.update();
    const cancelBtn = wrapper.find(DefaultButton).filterWhere(b => b.prop('text') === 'Cancel');
    cancelBtn.simulate('click', { stopPropagation: () => { }, preventDefault: () => { } });
    expect(wrapper.find(Dialog)).toHaveLength(0);
  });

  it('renders without icon if work item type is not found', () => {
    // Provide a stub workItemType with minimal properties to avoid undefined errors
    const props = { ...defaultTestProps, allWorkItemTypes: [{ name: '', icon: { url: '' } }] as WorkItemType[] };
    const wrapper = shallow(<ActionItem {...props} />);
    const preview = wrapper.find(DocumentCardPreview);
    expect(preview.exists()).toBe(true);
  });

  it('does not throw if work item type is missing (allWorkItemTypes empty)', () => {
    const props = { ...defaultTestProps, allWorkItemTypes: [] as WorkItemType[] };
    expect(() => shallow(<ActionItem {...props} />)).not.toThrow();
  });
});

describe('Private method coverage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('showUnlinkWorkItemConfirmationDialog sets state correctly', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const instance = wrapper.instance() as ActionItem;

    // @ts-expect-error: accessing private method for test
    instance.showUnlinkWorkItemConfirmationDialog();

    expect(wrapper.state('isUnlinkWorkItemConfirmationDialogHidden')).toBe(false);
  });

  it('hideUnlinkWorkItemConfirmationDialog sets state correctly', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    wrapper.setState({ isUnlinkWorkItemConfirmationDialogHidden: false });
    const instance = wrapper.instance() as ActionItem;

    // @ts-expect-error: accessing private method for test
    instance.hideUnlinkWorkItemConfirmationDialog();

    expect(wrapper.state('isUnlinkWorkItemConfirmationDialogHidden')).toBe(true);
  });

  it('onConfirmUnlinkWorkItem calls onUnlinkWorkItemClick and hides dialog', async () => {
    jest.spyOn(itemDataService, 'removeAssociatedActionItem').mockResolvedValue({} as IFeedbackItemDocument);
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const instance = wrapper.instance() as ActionItem;

    wrapper.setState({ isUnlinkWorkItemConfirmationDialogHidden: false });

    // @ts-expect-error: accessing private method for test
    await instance.onConfirmUnlinkWorkItem(defaultTestProps.actionItem.id);

    expect(defaultTestProps.onUpdateActionItem).toHaveBeenCalled();
    expect(wrapper.state('isUnlinkWorkItemConfirmationDialogHidden')).toBe(true);
  });

  it('updateLinkedItem updates state when linkedWorkItem matches ID', async () => {
    const mockUpdatedWorkItem = {
      id: 123,
      fields: { 'System.Title': 'Updated' },
      commentVersionRef: { commentId: 1, version: 1, url: "test", createdInRevision: 1, isDeleted: false, text: "test" },
      relations: [],
      rev: 1,
      _links: {},
      url: "test"
    } as WorkItem;
    jest.spyOn(workItemService, 'getWorkItemsByIds').mockResolvedValue([mockUpdatedWorkItem]);

    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const instance = wrapper.instance() as ActionItem;

    wrapper.setState({ linkedWorkItem: { id: 123 } });

    // @ts-expect-error: accessing private method for test
    await instance.updateLinkedItem(123);

    expect(wrapper.state('linkedWorkItem')).toEqual(mockUpdatedWorkItem);
  });

  it('updateLinkedItem does not update when linkedWorkItem ID does not match', async () => {
    const mockUpdatedWorkItem = {
      id: 456,
      fields: { 'System.Title': 'Updated' },
      commentVersionRef: { commentId: 1, version: 1, url: "test", createdInRevision: 1, isDeleted: false, text: "test" },
      relations: [],
      rev: 1,
      _links: {},
      url: "test"
    } as WorkItem;
    jest.spyOn(workItemService, 'getWorkItemsByIds').mockResolvedValue([mockUpdatedWorkItem]);

    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const instance = wrapper.instance() as ActionItem;
    const originalLinkedItem = { id: 123 };

    wrapper.setState({ linkedWorkItem: originalLinkedItem });

    // @ts-expect-error: accessing private method for test
    await instance.updateLinkedItem(456);

    expect(wrapper.state('linkedWorkItem')).toEqual(originalLinkedItem);
  });

  it('handleKeyPressSelectorButton calls showUnlinkWorkItem on Enter key', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const instance = wrapper.instance() as ActionItem;
    const spy = jest.fn();

    // @ts-expect-error: override private method for test
    instance.showUnlinkWorkItem = spy;

    const event = { key: 'Enter', preventDefault: jest.fn(), stopPropagation: jest.fn() };

    // @ts-expect-error: accessing private method for test
    instance.handleKeyPressSelectorButton(event);

    expect(spy).toHaveBeenCalledWith(event);
  });

  it('handleKeyPressSelectorButton does not call showUnlinkWorkItem on other keys', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const instance = wrapper.instance() as ActionItem;
    const spy = jest.fn();

    // @ts-expect-error: override private method for test
    instance.showUnlinkWorkItem = spy;

    const event = { key: 'Space', preventDefault: jest.fn(), stopPropagation: jest.fn() };

    // @ts-expect-error: accessing private method for test
    instance.handleKeyPressSelectorButton(event);

    expect(spy).not.toHaveBeenCalled();
  });

  it('showUnlinkWorkItem prevents default and stops propagation', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const instance = wrapper.instance() as ActionItem;

    const event = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };

    // @ts-expect-error: accessing private method for test
    instance.showUnlinkWorkItem(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(wrapper.state('isUnlinkWorkItemConfirmationDialogHidden')).toBe(false);
  });

  it('showWorkItemForm stops propagation and calls onActionItemClick', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const instance = wrapper.instance() as ActionItem;
    const spy = jest.fn();

    // @ts-expect-error: override private method for test
    instance.onActionItemClick = spy;

    const event = { stopPropagation: jest.fn() };

    // @ts-expect-error: accessing private method for test
    instance.showWorkItemForm(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(defaultTestProps.actionItem.id);
  });

  it('showWorkItemForm handles null/undefined event', () => {
    const wrapper = shallow(<ActionItem {...defaultTestProps} />);
    const instance = wrapper.instance() as ActionItem;
    const spy = jest.fn();

    // @ts-expect-error: override private method for test
    instance.onActionItemClick = spy;

    // @ts-expect-error: accessing private method for test
    instance.showWorkItemForm(null);

    expect(spy).toHaveBeenCalledWith(defaultTestProps.actionItem.id);
  });
});
