import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from "enzyme-to-json";
import NoFeedbackBoardsView, { NoFeedbackBoardsViewProps } from '../noFeedbackBoardsView';

const mockOnCreateBoardClick = jest.fn(() => { });

const defaultTestProps: NoFeedbackBoardsViewProps = {
  onCreateBoardClick: mockOnCreateBoardClick
}

describe('No Feedback Boards View component', () => {
  it ('renders correctly.', () => {
    const wrapper = shallow(<NoFeedbackBoardsView {...defaultTestProps} />);
    const component = wrapper.children().dive();
    expect(toJson(component)).toMatchSnapshot();
  });
});