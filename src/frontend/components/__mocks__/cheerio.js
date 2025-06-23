/* global jest */

const mockCheerioInstance = {
  html: () => '<div></div>',
  text: () => 'mock text',
  find: () => ({
    length: 0,
    each: () => {},
    text: () => 'mock text',
    html: () => '<div></div>'
  }),
  each: () => {},
  attr: () => {},
  prop: () => {},
  val: () => {}
};

const mockCheerio = {
  load: () => mockCheerioInstance,
  contains: () => false,
  merge: () => {}
};

module.exports = mockCheerio;
module.exports.default = mockCheerio;
