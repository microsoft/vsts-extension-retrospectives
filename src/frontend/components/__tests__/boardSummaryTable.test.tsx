
/*
import React from 'react';
import { shallow } from 'enzyme';
import BoardSummaryTable, { IBoardSummaryTableProps } from '../boardSummaryTable';

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
});
*/
import React from 'react';
import { render, screen } from '@testing-library/react';
import BoardSummaryTable, { IBoardSummaryTableProps } from '../boardSummaryTable';

const baseProps: IBoardSummaryTableProps = {
  teamId: 'team-1',
  supportedWorkItemTypes: [],
  onArchiveToggle: jest.fn(),
};

describe('BoardSummaryTable', () => {
  it('shows spinner while data is loading', () => {
    // Mock the state for allDataLoaded
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => [{ allDataLoaded: false }, jest.fn()]);

    // Render the component
    render(<BoardSummaryTable {...baseProps} />);

    // Assert: Spinner should be visible
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not show spinner when data is loaded', () => {
    // Mock the state for allDataLoaded
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => [{ allDataLoaded: true }, jest.fn()]);

    // Render the component
    render(<BoardSummaryTable {...baseProps} />);

    // Assert: Spinner should not be visible
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
