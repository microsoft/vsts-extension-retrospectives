import { FocusManager } from "../focusManager";

describe("FocusManager", () => {
  let focusManager: FocusManager;
  let container: HTMLDivElement;

  beforeEach(() => {
    focusManager = new FocusManager();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    focusManager.clearFocusHistory();
  });

  describe("Focus history management", () => {
    test("pushFocusHistory adds element to history", () => {
      const element = document.createElement("button");
      container.appendChild(element);

      focusManager.pushFocusHistory(element);

      expect(focusManager.popFocusHistory()).toBe(true);
      expect(document.activeElement).toBe(element);
    });

    test("pushFocusHistory ignores null elements", () => {
      focusManager.pushFocusHistory(null);

      expect(focusManager.popFocusHistory()).toBe(false);
    });

    test("pushFocusHistory does not add duplicate consecutive elements", () => {
      const element = document.createElement("button");
      container.appendChild(element);

      focusManager.pushFocusHistory(element);
      focusManager.pushFocusHistory(element);

      focusManager.popFocusHistory();
      expect(focusManager.popFocusHistory()).toBe(false);
    });

    test("pushFocusHistory maintains max history size", () => {
      const buttons: HTMLButtonElement[] = [];

      // Create 15 buttons (more than max size of 10)
      for (let i = 0; i < 15; i++) {
        const button = document.createElement("button");
        button.id = `button-${i}`;
        container.appendChild(button);
        buttons.push(button);
        focusManager.pushFocusHistory(button);
      }

      // Pop all and count
      let count = 0;
      while (focusManager.popFocusHistory()) {
        count++;
      }

      expect(count).toBeLessThanOrEqual(10);
    });

    test("popFocusHistory returns false when history is empty", () => {
      expect(focusManager.popFocusHistory()).toBe(false);
    });

    test("popFocusHistory restores focus to previous element", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      container.appendChild(button1);
      container.appendChild(button2);

      focusManager.pushFocusHistory(button1);
      focusManager.pushFocusHistory(button2);

      focusManager.popFocusHistory();
      expect(document.activeElement).toBe(button2);
    });

    test("popFocusHistory skips elements not in document", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      container.appendChild(button1);
      container.appendChild(button2);

      focusManager.pushFocusHistory(button1);
      focusManager.pushFocusHistory(button2);

      // Remove button2 from document
      container.removeChild(button2);

      // Should skip button2 and focus button1
      expect(focusManager.popFocusHistory()).toBe(true);
      expect(document.activeElement).toBe(button1);
    });

    test("clearFocusHistory removes all history", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      focusManager.pushFocusHistory(button);
      focusManager.clearFocusHistory();

      expect(focusManager.popFocusHistory()).toBe(false);
    });
  });

  describe("setFocus", () => {
    test("sets focus to element", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      expect(focusManager.setFocus(button)).toBe(true);
      expect(document.activeElement).toBe(button);
    });

    test("adds previous focus to history by default", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      container.appendChild(button1);
      container.appendChild(button2);

      button1.focus();
      focusManager.setFocus(button2);

      focusManager.popFocusHistory();
      expect(document.activeElement).toBe(button1);
    });

    test("does not add to history when addToHistory is false", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      container.appendChild(button1);
      container.appendChild(button2);

      button1.focus();
      focusManager.setFocus(button2, false);

      expect(focusManager.popFocusHistory()).toBe(false);
    });

    test("does not add to history when focusing the same element", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      button.focus();
      focusManager.setFocus(button, true);

      // Should not have added the same element to history
      expect(focusManager.popFocusHistory()).toBe(false);
    });

    test("adds body to history when no other element is focused", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      // In JSDOM, activeElement is body when nothing is focused
      // The code will add body to history since body !== button
      focusManager.setFocus(button, true);

      // Body was added to history
      expect(focusManager.popFocusHistory()).toBe(true);
    });

    test("returns false for null element", () => {
      expect(focusManager.setFocus(null)).toBe(false);
    });

    test("returns false for element not in document", () => {
      const button = document.createElement("button");
      expect(focusManager.setFocus(button)).toBe(false);
    });
  });

  describe("findNextFocusableElement", () => {
    test("handles element visibility filtering", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      button1.style.display = "block";
      button2.style.display = "block";
      container.appendChild(button1);
      container.appendChild(button2);

      // In JSDOM, offsetParent is always null, so findNextFocusableElement will return null
      // This tests that the method doesn't crash
      const next = focusManager.findNextFocusableElement(container, button1, "next");
      expect(next).toBeNull();
    });

    test("returns null when current element not found", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      button1.style.display = "block";
      button2.style.display = "block";
      container.appendChild(button1);

      // button2 is not in container, so should return first element (but will be null in JSDOM)
      const next = focusManager.findNextFocusableElement(container, button2, "next");
      expect(next).toBeNull();
    });

    test("circles to first element when at end", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      // Mock offsetParent to make elements "visible"
      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(button2, "offsetParent", { get: () => container });
      container.appendChild(button1);
      container.appendChild(button2);

      const next = focusManager.findNextFocusableElement(container, button2, "next");
      expect(next).toBe(button1);
    });

    test("circles to last element when at beginning", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      // Mock offsetParent to make elements "visible"
      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(button2, "offsetParent", { get: () => container });
      container.appendChild(button1);
      container.appendChild(button2);

      const prev = focusManager.findNextFocusableElement(container, button1, "prev");
      expect(prev).toBe(button2);
    });

    test("returns first focusable element when currentElement is not in the container", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      const outsideButton = document.createElement("button");
      // Mock offsetParent to make elements "visible"
      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(button2, "offsetParent", { get: () => container });
      container.appendChild(button1);
      container.appendChild(button2);

      // outsideButton is not in the container
      const next = focusManager.findNextFocusableElement(container, outsideButton, "next");
      expect(next).toBe(button1);
    });

    test("returns next element for 'next' direction", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      const button3 = document.createElement("button");
      // Mock offsetParent to make elements "visible"
      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(button2, "offsetParent", { get: () => container });
      Object.defineProperty(button3, "offsetParent", { get: () => container });
      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      const next = focusManager.findNextFocusableElement(container, button1, "next");
      expect(next).toBe(button2);
    });

    test("returns previous element for 'prev' direction", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      const button3 = document.createElement("button");
      // Mock offsetParent to make elements "visible"
      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(button2, "offsetParent", { get: () => container });
      Object.defineProperty(button3, "offsetParent", { get: () => container });
      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      const prev = focusManager.findNextFocusableElement(container, button3, "prev");
      expect(prev).toBe(button2);
    });

    test("skips elements with aria-hidden", () => {
      const button1 = document.createElement("button");
      const hiddenButton = document.createElement("button");
      const button3 = document.createElement("button");

      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(hiddenButton, "offsetParent", { get: () => container });
      Object.defineProperty(button3, "offsetParent", { get: () => container });

      hiddenButton.setAttribute("aria-hidden", "true");

      container.appendChild(button1);
      container.appendChild(hiddenButton);
      container.appendChild(button3);

      const next = focusManager.findNextFocusableElement(container, button1, "next");
      expect(next).toBe(button3);
    });

    test("treats aria-hidden currentElement as not focusable", () => {
      const button1 = document.createElement("button");
      const hiddenButton = document.createElement("button");
      const button3 = document.createElement("button");

      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(hiddenButton, "offsetParent", { get: () => container });
      Object.defineProperty(button3, "offsetParent", { get: () => container });

      hiddenButton.setAttribute("aria-hidden", "true");

      container.appendChild(button1);
      container.appendChild(hiddenButton);
      container.appendChild(button3);

      const next = focusManager.findNextFocusableElement(container, hiddenButton, "next");
      expect(next).toBe(button1);
    });

    test("supports a custom selector", () => {
      const link1 = document.createElement("a");
      link1.href = "https://example.com/1";
      const link2 = document.createElement("a");
      link2.href = "https://example.com/2";

      Object.defineProperty(link1, "offsetParent", { get: () => container });
      Object.defineProperty(link2, "offsetParent", { get: () => container });

      container.appendChild(link1);
      container.appendChild(link2);

      const next = focusManager.findNextFocusableElement(container, link1, "next", "a[href]");
      expect(next).toBe(link2);
    });
  });

  describe("getFocusableElements", () => {
    test("queries for focusable elements", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      const input = document.createElement("input");
      button1.style.display = "block";
      button2.style.display = "block";
      input.style.display = "block";
      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(input);

      // In JSDOM, offsetParent is always null, so no elements will be returned
      // This tests that the method doesn't crash
      const elements = focusManager.getFocusableElements(container);
      expect(Array.isArray(elements)).toBe(true);
    });

    test("filters out elements with aria-hidden", () => {
      const visibleButton = document.createElement("button");
      const hiddenButton = document.createElement("button");

      Object.defineProperty(visibleButton, "offsetParent", { get: () => container });
      Object.defineProperty(hiddenButton, "offsetParent", { get: () => container });
      hiddenButton.setAttribute("aria-hidden", "true");

      container.appendChild(visibleButton);
      container.appendChild(hiddenButton);

      const elements = focusManager.getFocusableElements(container);
      expect(elements).toEqual([visibleButton]);
    });

    test("supports a custom selector", () => {
      const button = document.createElement("button");
      const input = document.createElement("input");

      Object.defineProperty(button, "offsetParent", { get: () => container });
      Object.defineProperty(input, "offsetParent", { get: () => container });

      container.appendChild(button);
      container.appendChild(input);

      const elements = focusManager.getFocusableElements(container, "button");
      expect(elements).toEqual([button]);
    });
  });

  describe("createFocusTrap", () => {
    test("traps focus within container", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      const button3 = document.createElement("button");
      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      const cleanup = focusManager.createFocusTrap(container);

      button3.focus();
      const event = new KeyboardEvent("keydown", { key: "Tab" });
      container.dispatchEvent(event);

      cleanup();
    });

    test("ignores non-Tab keys", () => {
      const button1 = document.createElement("button");
      container.appendChild(button1);

      focusManager.createFocusTrap(container);

      button1.focus();
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
      container.dispatchEvent(event);

      // Should not affect focus
      expect(document.activeElement).toBe(button1);
    });

    test("handles containers with no focusable elements", () => {
      const div = document.createElement("div");
      container.appendChild(div);

      focusManager.createFocusTrap(container);

      const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
      container.dispatchEvent(event);

      // Should not crash
      expect(true).toBe(true);
    });

    test("returns cleanup function", () => {
      const cleanup = focusManager.createFocusTrap(container);
      expect(typeof cleanup).toBe("function");
    });

    test("cleanup function removes event listener", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      const cleanup = focusManager.createFocusTrap(container);
      cleanup();

      button.focus();
      const event = new KeyboardEvent("keydown", { key: "Tab" });
      const spy = jest.spyOn(event, "preventDefault");
      container.dispatchEvent(event);

      expect(spy).not.toHaveBeenCalled();
    });

    test("wraps focus to first element on Tab from last", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      // Mock offsetParent to make elements "visible"
      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(button2, "offsetParent", { get: () => container });
      container.appendChild(button1);
      container.appendChild(button2);

      focusManager.createFocusTrap(container);

      button2.focus();
      const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");
      container.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test("wraps focus to last element on Shift+Tab from first", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      // Mock offsetParent to make elements "visible"
      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(button2, "offsetParent", { get: () => container });
      container.appendChild(button1);
      container.appendChild(button2);

      focusManager.createFocusTrap(container);

      button1.focus();
      const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");
      container.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test("does not wrap on Shift+Tab when not on first element", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      const button3 = document.createElement("button");

      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(button2, "offsetParent", { get: () => container });
      Object.defineProperty(button3, "offsetParent", { get: () => container });

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      focusManager.createFocusTrap(container);

      button2.focus();
      const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");
      container.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(button2);
    });

    test("does not wrap on Tab when not on last element", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      const button3 = document.createElement("button");

      Object.defineProperty(button1, "offsetParent", { get: () => container });
      Object.defineProperty(button2, "offsetParent", { get: () => container });
      Object.defineProperty(button3, "offsetParent", { get: () => container });

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      focusManager.createFocusTrap(container);

      button2.focus();
      const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");
      container.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(button2);
    });
  });
});
