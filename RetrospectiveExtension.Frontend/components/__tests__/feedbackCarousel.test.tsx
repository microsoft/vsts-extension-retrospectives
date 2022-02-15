import * as React from 'react';
import { shallow } from 'enzyme';
import FeedbackCarousel from '../../components/feedbackCarousel';
import { testColumnProps } from '../__mocks__/mocked_components/mockedFeedbackColumn';

const mockedProps = {
  feedbackColumnPropsList: [testColumnProps],
  isFeedbackAnonymous: true,
};

describe('Feedback Carousel ', () => {
  it('can be rendered', () => {
    const wrapper = shallow(<FeedbackCarousel {...mockedProps}/>);
    const component = wrapper.children().dive();
    expect(component.prop('className')).toBe('feedback-carousel-pivot');
    expect(component.findWhere(c => c.prop('headerText') === testColumnProps.columnName)).toHaveLength(1);
  });
});

