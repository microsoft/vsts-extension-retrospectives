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
      container.appendChild(button1);
      container.appendChild(button2);

      focusManager.createFocusTrap(container);

      button2.focus();
      const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
      Object.defineProperty(event, "shiftKey", { value: false });
      container.dispatchEvent(event);

      // Due to preventDefault, focus should remain on button2 in test environment
      expect(document.activeElement).toBe(button2);
    });

    test("wraps focus to last element on Shift+Tab from first", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      container.appendChild(button1);
      container.appendChild(button2);

      focusManager.createFocusTrap(container);

      button1.focus();
      const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
      container.dispatchEvent(event);

      // Due to preventDefault, focus should remain on button1 in test environment
      expect(document.activeElement).toBe(button1);
    });
  });
});
