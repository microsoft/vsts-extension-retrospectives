import * as React from 'react';
import { shallow } from 'enzyme';
import { mocked } from 'jest-mock';
import WorkflowStage from '../../components/workflowStage';
import { WorkflowPhase } from '../../interfaces/workItem';

const mockedProps = mocked({
  display: "Sample Workflow Stage Text",
  value: WorkflowPhase.Collect,
  isActive: true,
  clickEventCallback: jest.fn(() => {})
});

describe('Workflow Stage ', () => {
  it('can be rendered when active.', () => {
    mockedProps.isActive = true;
    const wrapper = shallow(<WorkflowStage {...mockedProps} />);
    const component = wrapper.children().dive();
    expect(component.prop('aria-label')).toBe(`Selected ${mockedProps.display} workflow stage`);
  });

  it('can be rendered when inactive.', () => {
    mockedProps.isActive = false;
    const wrapper = shallow(<WorkflowStage {...mockedProps} />);
    const component = wrapper.children().dive();

    expect(component.prop('aria-label')).toBe(`Not selected ${mockedProps.display} workflow stage`);
  });

  it('calls clickEventCallback when the Enter key is pressed.', () => {
    mockedProps.isActive = true;
    const wrapper = shallow(<WorkflowStage {...mockedProps} />);
    const component = wrapper.children().dive();

    component.simulate('keydown', { keyCode: 13 });

    expect(mockedProps.clickEventCallback).toBeCalledTimes(1);
  });

  it('calls clickEventCallback when the component is clicked.', () => {
    mockedProps.isActive = true;
    const wrapper = shallow(<WorkflowStage {...mockedProps} />);
    const component = wrapper.children().dive();

    component.simulate('click');

    expect(mockedProps.clickEventCallback).toBeCalledTimes(1);
  });
});
