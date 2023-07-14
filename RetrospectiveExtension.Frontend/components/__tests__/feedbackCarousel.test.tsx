import React from 'react';
import { shallow } from 'enzyme';
import FeedbackCarousel from '../../components/feedbackCarousel';
import { testColumnProps } from '../__mocks__/mocked_components/mockedFeedbackColumn';
import { mockUuid } from '../__mocks__/uuid/v4';

const mockedProps = {
  feedbackColumnPropsList: [testColumnProps],
  isFeedbackAnonymous: true,
  isFocusModalHidden: false
};

jest.mock('uuid', () => ({ v4: () => mockUuid}));

describe('Feedback Carousel ', () => {
  it('can be rendered', () => {
    const wrapper = shallow(<FeedbackCarousel {...mockedProps} />);
    const component = wrapper.children().dive();
    expect(component.prop('className')).toBe('feedback-carousel-pivot');
    expect(component.findWhere(c => c.prop('headerText') === testColumnProps.columnName)).toHaveLength(1);
  });

  describe("'All' column", () => {
    it("should be set by default in the first position", () => {
      const wrapper = shallow(<FeedbackCarousel {...mockedProps} />);
      const component = wrapper.children().dive();
  
      const allColumn = component.findWhere(c => c.prop('headerText')).first();
  
      expect(allColumn.prop('headerText')).toEqual('All');
    });

    it("should not exist when there are no feedback columns", () => {
      const wrapper = shallow(<FeedbackCarousel feedbackColumnPropsList={[]} isFeedbackAnonymous={true} isFocusModalHidden={false} />);
      const component = wrapper.children().dive();
  
      const allColumn = component.findWhere(c => c.prop('headerText')).first();
  
      expect(allColumn).toHaveLength(0);
    });
  })
});
