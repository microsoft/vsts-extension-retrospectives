import { ViewMode } from '../constants';

describe('ViewMode', () => {
  it('should have the correct values', () => {
    expect(ViewMode.Desktop).toBe('desktop-mode');
    expect(ViewMode.Mobile).toBe('mobile-mode');
  });
});
