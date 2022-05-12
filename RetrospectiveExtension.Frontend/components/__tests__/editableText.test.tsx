import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from "enzyme-to-json";
import EditableText, { EditableTextProps } from '../editableText';

const mockOnSave = jest.fn(() => { });

const mockedTestProps: EditableTextProps = {
  text: '',
  isChangeEventRequired: false,
  onSave: mockOnSave
}

describe('Editable Text Component', () => {

  it('renders correctly.', () => {
    const wrapper = shallow(<EditableText {...mockedTestProps} />);
    const component = wrapper.children().dive();
    expect(toJson(component)).toMatchSnapshot();
  });

  it('updates text appropriately.', () => {
    mockedTestProps.text = 'Test Text';

    const wrapper = shallow(<EditableText {...mockedTestProps} />);
    const component = wrapper.children().dive();
    expect(toJson(component)).toMatchSnapshot();
  });
});