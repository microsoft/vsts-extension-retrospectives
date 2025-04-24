import React, { useState } from 'react';
import { shallow } from 'enzyme';
import BoardSummaryTable, { IBoardSummaryTableProps } from '../boardSummaryTable';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
}));

const baseProps: IBoardSummaryTableProps = {
  teamId: 'team-1',
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
};

describe('BoardSummaryTable', () => {
  it('renders when no boards exist', () => {
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);
    const component = wrapper.children().dive();

    expect(component.exists()).toBeTruthy();
  });

  it('shows spinner while data is loading', () => {
    // Arrange
    const mockSetState = jest.fn();
    (useState as jest.Mock).mockImplementation(() => [false, mockSetState]); // Mock `allDataLoaded` as false
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);

    // Act & Assert
    expect(wrapper.find('.board-summary-initialization-spinner').exists()).toBeTruthy();
  });

  it('does not show spinner when data is loaded', () => {
    // Arrange
    const mockSetState = jest.fn();
    (useState as jest.Mock).mockImplementation(() => [true, mockSetState]); // Mock `allDataLoaded` as true
    const wrapper = shallow(<BoardSummaryTable {...baseProps} />);

    // Act & Assert
    expect(wrapper.find('.board-summary-initialization-spinner').exists()).toBeFalsy();
  });
});
