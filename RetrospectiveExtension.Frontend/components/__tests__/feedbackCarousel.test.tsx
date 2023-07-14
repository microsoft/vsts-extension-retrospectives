import React from 'react';
import { shallow } from 'enzyme';
import FeedbackCarousel from '../../components/feedbackCarousel';
import FeedbackItem from '../../components/feedbackItem';
import { testGroupColumnProps, testColumnProps, testGroupFeedbackItemTwo } from '../__mocks__/mocked_components/mockedFeedbackColumn';

const mockedProps = {
  feedbackColumnPropsList: [testColumnProps],
  isFeedbackAnonymous: true,
  isFocusModalHidden: false
};

const mockedGroupProps = {
  feedbackColumnPropsList: [testGroupColumnProps],
  isFeedbackAnonymous: true,
  isFocusModalHidden: false
};

describe('Feedback Carousel ', () => {
  it('can be rendered', () => {
    const wrapper = shallow(<FeedbackCarousel {...mockedProps} />);
    const component = wrapper.children().dive();
    expect(component.prop('className')).toBe('feedback-carousel-pivot');
    expect(component.findWhere(c => c.prop('headerText') === testColumnProps.columnName)).toHaveLength(1);
  });

  test('that groupIds are empty when there are no children', () => {
    const wrapper = shallow(<FeedbackCarousel {...mockedProps} />);
    const component = wrapper.children().dive();

    const feedbackItem = component.findWhere(c => c.prop('className') === 'feedback-carousel-item').find(FeedbackItem);

    expect(feedbackItem.prop('groupIds')).toEqual([]);
  })

  test('that groupIds are populate when there are children', () => {
    const wrapper = shallow(<FeedbackCarousel {...mockedGroupProps} />);
    const component = wrapper.children().dive();

    const feedbackItem = component.findWhere(c => c.prop('className') === 'feedback-carousel-item').find(FeedbackItem);

    expect(feedbackItem.prop('groupIds')).toEqual([testGroupFeedbackItemTwo.id]);
  })
});
