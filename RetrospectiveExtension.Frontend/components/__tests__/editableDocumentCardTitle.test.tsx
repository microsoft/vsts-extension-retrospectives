import * as React from 'react';
import { shallow } from 'enzyme';
import { mocked } from 'jest-mock';
import EditableDocumentCardTitle from '../../components/editableDocumentCardTitle';

const mockedProps = mocked({
  isDisabled: true,
  isMultiline: false,
  maxLength: 50,
  title: "Mocked Title",
  isChangeEventRequired: true,
  onSave: jest.fn(() => {})
});

describe('Editable Document Card Title ', () => {
  it('can be rendered when enabled.', () => {
    mockedProps.isDisabled = true;
    const wrapper = shallow(<EditableDocumentCardTitle {...mockedProps} />);
    const component = wrapper.children().dive();

    expect(component.prop('className')).toBe('editable-document-card-title');
  });
});