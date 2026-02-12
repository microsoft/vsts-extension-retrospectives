import React from "react";
import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useKeyboardNavigation, useGlobalKeyboardShortcuts, useRovingTabIndex, KeyboardNavigationOptions } from "../useKeyboardNavigation";
import { WorkflowPhase } from "../../interfaces/workItem";

describe("useKeyboardNavigation", () => {
  let elementRef: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    elementRef = { current: document.createElement("div") };
    document.body.appendChild(elementRef.current!);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    if (elementRef.current) {
      document.body.removeChild(elementRef.current);
    }
  });

  it("should call onArrowUp when ArrowUp is pressed", () => {
    const onArrowUp = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowUp };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowUp).toHaveBeenCalledTimes(1);
  });

  it("should call onArrowDown when ArrowDown is pressed", () => {
    const onArrowDown = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowDown };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowDown).toHaveBeenCalledTimes(1);
  });

  it("should call onArrowLeft when ArrowLeft is pressed", () => {
    const onArrowLeft = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowLeft };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowLeft" });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowLeft).toHaveBeenCalledTimes(1);
  });

  it("should call onArrowRight when ArrowRight is pressed", () => {
    const onArrowRight = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowRight };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowRight).toHaveBeenCalledTimes(1);
  });

  it("should call onEnter when Enter is pressed on non-button elements", () => {
    const onEnter = jest.fn();
    const options: KeyboardNavigationOptions = { onEnter };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
      Object.defineProperty(event, "target", { value: elementRef.current, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("should not call onEnter when Enter is pressed on a button", () => {
    const onEnter = jest.fn();
    const options: KeyboardNavigationOptions = { onEnter };
    const button = document.createElement("button");
    elementRef.current!.appendChild(button);

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
      Object.defineProperty(event, "target", { value: button, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onEnter).not.toHaveBeenCalled();
  });

  it("should not call onEnter when Enter is pressed on an anchor element", () => {
    const onEnter = jest.fn();
    const options: KeyboardNavigationOptions = { onEnter };
    const anchor = document.createElement("a");
    elementRef.current!.appendChild(anchor);

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
      Object.defineProperty(event, "target", { value: anchor, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onEnter).not.toHaveBeenCalled();
  });

  it("should call onSpace when Space is pressed on non-button elements", () => {
    const onSpace = jest.fn();
    const options: KeyboardNavigationOptions = { onSpace };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: " ", bubbles: true });
      Object.defineProperty(event, "target", { value: elementRef.current, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onSpace).toHaveBeenCalledTimes(1);
  });

  it("should not call onSpace when Space is pressed on a button", () => {
    const onSpace = jest.fn();
    const options: KeyboardNavigationOptions = { onSpace };
    const button = document.createElement("button");
    elementRef.current!.appendChild(button);

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: " ", bubbles: true });
      Object.defineProperty(event, "target", { value: button, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onSpace).not.toHaveBeenCalled();
  });

  it("should call onDelete when Delete is pressed", () => {
    const onDelete = jest.fn();
    const options: KeyboardNavigationOptions = { onDelete };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Delete", bubbles: true });
      Object.defineProperty(event, "target", { value: elementRef.current, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("should call onDelete when Backspace is pressed", () => {
    const onDelete = jest.fn();
    const options: KeyboardNavigationOptions = { onDelete };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Backspace", bubbles: true });
      Object.defineProperty(event, "target", { value: elementRef.current, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("should not call onDelete when Delete is pressed on an input", () => {
    const onDelete = jest.fn();
    const options: KeyboardNavigationOptions = { onDelete };
    const input = document.createElement("input");
    elementRef.current!.appendChild(input);

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Delete", bubbles: true });
      Object.defineProperty(event, "target", { value: input, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onDelete).not.toHaveBeenCalled();
  });

  it("should not call onDelete when Backspace is pressed on a textarea", () => {
    const onDelete = jest.fn();
    const options: KeyboardNavigationOptions = { onDelete };
    const textarea = document.createElement("textarea");
    elementRef.current!.appendChild(textarea);

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Backspace", bubbles: true });
      Object.defineProperty(event, "target", { value: textarea, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onDelete).not.toHaveBeenCalled();
  });

  it("should call onPageUp when PageUp is pressed", () => {
    const onPageUp = jest.fn();
    const options: KeyboardNavigationOptions = { onPageUp };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "PageUp" });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onPageUp).toHaveBeenCalledTimes(1);
  });

  it("should call onPageDown when PageDown is pressed", () => {
    const onPageDown = jest.fn();
    const options: KeyboardNavigationOptions = { onPageDown };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "PageDown" });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onPageDown).toHaveBeenCalledTimes(1);
  });

  it("should not handle events when enabled is false", () => {
    const onArrowUp = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowUp, enabled: false };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowUp).not.toHaveBeenCalled();
  });

  it("should not handle events on input fields", () => {
    const onArrowUp = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowUp };
    const input = document.createElement("input");
    elementRef.current!.appendChild(input);

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true });
      Object.defineProperty(event, "target", { value: input, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowUp).not.toHaveBeenCalled();
  });

  it("should not preventDefault when no handlers match", () => {
    const options: KeyboardNavigationOptions = {};
    renderHook(() => useKeyboardNavigation(elementRef, options));

    const event = new KeyboardEvent("keydown", { key: "ArrowUp", cancelable: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");

    act(() => {
      elementRef.current!.dispatchEvent(event);
    });

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("skips arrow and escape keys when handlers are missing", () => {
    const options: KeyboardNavigationOptions = {};
    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      elementRef.current!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
      elementRef.current!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
      elementRef.current!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
      elementRef.current!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
  });

  it("returns early when disabled", () => {
    const capturedCallbacks: Array<(event: KeyboardEvent) => void> = [];
    const useCallbackSpy = jest.spyOn(React, "useCallback").mockImplementation((fn: any) => {
      capturedCallbacks.push(fn);
      return fn;
    });

    renderHook(() => useKeyboardNavigation(elementRef, { enabled: false }));

    const handler = capturedCallbacks[0];
    const event = new KeyboardEvent("keydown", { key: "ArrowUp", cancelable: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");

    act(() => {
      handler(event);
    });

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    useCallbackSpy.mockRestore();
  });

  it("should ignore keys without handlers (Delete/PageUp/PageDown)", () => {
    const options: KeyboardNavigationOptions = {};
    renderHook(() => useKeyboardNavigation(elementRef, options));

    const deleteEvent = new KeyboardEvent("keydown", { key: "Delete", cancelable: true });
    const preventDefaultDelete = jest.spyOn(deleteEvent, "preventDefault");
    act(() => {
      elementRef.current!.dispatchEvent(deleteEvent);
    });
    expect(preventDefaultDelete).not.toHaveBeenCalled();

    const pageUpEvent = new KeyboardEvent("keydown", { key: "PageUp", cancelable: true });
    const preventDefaultPageUp = jest.spyOn(pageUpEvent, "preventDefault");
    act(() => {
      elementRef.current!.dispatchEvent(pageUpEvent);
    });
    expect(preventDefaultPageUp).not.toHaveBeenCalled();

    const pageDownEvent = new KeyboardEvent("keydown", { key: "PageDown", cancelable: true });
    const preventDefaultPageDown = jest.spyOn(pageDownEvent, "preventDefault");
    act(() => {
      elementRef.current!.dispatchEvent(pageDownEvent);
    });
    expect(preventDefaultPageDown).not.toHaveBeenCalled();
  });

  it("should not register listeners when disabled", () => {
    const options: KeyboardNavigationOptions = { enabled: false };
    const addEventListenerSpy = jest.spyOn(elementRef.current!, "addEventListener");

    renderHook(() => useKeyboardNavigation(elementRef, options));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("should not handle events on textarea fields", () => {
    const onArrowDown = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowDown };
    const textarea = document.createElement("textarea");
    elementRef.current!.appendChild(textarea);

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true });
      Object.defineProperty(event, "target", { value: textarea, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowDown).not.toHaveBeenCalled();
  });

  it("should not handle events on contentEditable elements", () => {
    const onArrowLeft = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowLeft };
    const div = document.createElement("div");
    div.contentEditable = "true";
    elementRef.current!.appendChild(div);

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true });
      const mockTarget = { ...div, isContentEditable: true, tagName: div.tagName };
      Object.defineProperty(event, "target", { value: mockTarget, enumerable: true });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowLeft).not.toHaveBeenCalled();
  });

  it("should preventDefault when preventDefault option is true", () => {
    const onArrowUp = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowUp, preventDefault: true };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    const event = new KeyboardEvent("keydown", { key: "ArrowUp", cancelable: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");
    const stopPropagationSpy = jest.spyOn(event, "stopPropagation");

    act(() => {
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowUp).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it("should not preventDefault when preventDefault option is false", () => {
    const onArrowUp = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowUp, preventDefault: false };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    const event = new KeyboardEvent("keydown", { key: "ArrowUp", cancelable: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");

    act(() => {
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowUp).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("should not add event listener when element is not available", () => {
    const onArrowUp = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowUp };
    const nullRef: React.RefObject<HTMLDivElement> = { current: null };

    renderHook(() => useKeyboardNavigation(nullRef, options));

    // Should not throw any errors
    expect(onArrowUp).not.toHaveBeenCalled();
  });

  it("should cleanup event listener on unmount", () => {
    const onArrowUp = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowUp };
    const removeEventListenerSpy = jest.spyOn(elementRef.current!, "removeEventListener");

    const { unmount } = renderHook(() => useKeyboardNavigation(elementRef, options));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("should accept workflowPhase in options without errors", () => {
    const onArrowUp = jest.fn();
    const options: KeyboardNavigationOptions = { onArrowUp, workflowPhase: WorkflowPhase.Act };

    renderHook(() => useKeyboardNavigation(elementRef, options));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
      elementRef.current!.dispatchEvent(event);
    });

    expect(onArrowUp).toHaveBeenCalledTimes(1);
  });
});

describe("useGlobalKeyboardShortcuts", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call handler for single key shortcut", () => {
    const handler = jest.fn();
    const shortcuts = { k: handler };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", bubbles: true });
      Object.defineProperty(event, "target", { value: document.body, enumerable: true });
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should call handler for ctrl+key shortcut", () => {
    const handler = jest.fn();
    const shortcuts = { "ctrl+s": handler };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: document.body, enumerable: true });
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should call handler for shift+key shortcut", () => {
    const handler = jest.fn();
    const shortcuts = { "shift+k": handler };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", shiftKey: true, bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: document.body, enumerable: true });
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should call handler for alt+key shortcut", () => {
    const handler = jest.fn();
    const shortcuts = { "alt+k": handler };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", altKey: true, bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: document.body, enumerable: true });
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should call handler for meta+key shortcut (Mac)", () => {
    const handler = jest.fn();
    const shortcuts = { "ctrl+s": handler };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "s", metaKey: true, bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: document.body, enumerable: true });
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should not preventDefault when no shortcut matches", () => {
    const handler = jest.fn();
    const shortcuts = { x: handler };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent("keydown", { key: "z", bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: document.body, enumerable: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");

    act(() => {
      document.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("does not add listeners when disabled", () => {
    const handler = jest.fn();
    const shortcuts = { k: handler };
    const addEventListenerSpy = jest.spyOn(document, "addEventListener");

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts, false));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("should call handler for complex ctrl+shift+key shortcut", () => {
    const handler = jest.fn();
    const shortcuts = { "ctrl+shift+k": handler };

    const addEventListenerSpy = jest.spyOn(document, "addEventListener");

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    const registeredHandler = addEventListenerSpy.mock.calls[0]?.[1] as (event: KeyboardEvent) => void;

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: document.body, enumerable: true });
      registeredHandler(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should not call handler when enabled is false", () => {
    const handler = jest.fn();
    const shortcuts = { k: handler };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts, false));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", bubbles: true });
      Object.defineProperty(event, "target", { value: document.body, enumerable: true });
      document.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should not call handler on input fields", () => {
    const handler = jest.fn();
    const shortcuts = { k: handler };
    const input = document.createElement("input");
    document.body.appendChild(input);

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", bubbles: true });
      Object.defineProperty(event, "target", { value: input, enumerable: true });
      document.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("should not call handler on textarea fields", () => {
    const handler = jest.fn();
    const shortcuts = { k: handler };
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", bubbles: true });
      Object.defineProperty(event, "target", { value: textarea, enumerable: true });
      document.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it("should not call handler on contentEditable elements", () => {
    const handler = jest.fn();
    const shortcuts = { k: handler };
    const div = document.createElement("div");
    div.contentEditable = "true";
    document.body.appendChild(div);

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "k", bubbles: true });
      const mockTarget = { ...div, isContentEditable: true, tagName: div.tagName };
      Object.defineProperty(event, "target", { value: mockTarget, enumerable: true });
      document.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it("should preventDefault and stopPropagation when handler is found", () => {
    const handler = jest.fn();
    const shortcuts = { k: handler };

    const addEventListenerSpy = jest.spyOn(document, "addEventListener");

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    const registeredHandler = addEventListenerSpy.mock.calls[0]?.[1] as (event: KeyboardEvent) => void;

    const event = new KeyboardEvent("keydown", { key: "k", bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: document.body, enumerable: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");
    const stopPropagationSpy = jest.spyOn(event, "stopPropagation");

    act(() => {
      registeredHandler(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it("should cleanup event listener on unmount", () => {
    const handler = jest.fn();
    const shortcuts = { k: handler };
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("should handle lowercase key conversion", () => {
    const handler = jest.fn();
    const shortcuts = { k: handler };

    const addEventListenerSpy = jest.spyOn(document, "addEventListener");

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts));

    const registeredHandler = addEventListenerSpy.mock.calls[0]?.[1] as (event: KeyboardEvent) => void;

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "K", bubbles: true, cancelable: true });
      Object.defineProperty(event, "target", { value: document.body, enumerable: true });
      registeredHandler(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("useRovingTabIndex", () => {
  it("should set tabindex correctly for current item", () => {
    const items = [document.createElement("div"), document.createElement("div"), document.createElement("div")];
    const itemsRef: React.RefObject<HTMLElement[]> = { current: items };
    const setCurrentIndex = jest.fn();

    renderHook(() => useRovingTabIndex(itemsRef, 1, setCurrentIndex));

    expect(items[0].getAttribute("tabindex")).toBe("-1");
    expect(items[1].getAttribute("tabindex")).toBe("0");
    expect(items[2].getAttribute("tabindex")).toBe("-1");
  });

  it("should navigate to next item", () => {
    const items = [document.createElement("div"), document.createElement("div"), document.createElement("div")];
    const itemsRef: React.RefObject<HTMLElement[]> = { current: items };
    const setCurrentIndex = jest.fn();

    const { result } = renderHook(() => useRovingTabIndex(itemsRef, 0, setCurrentIndex));

    act(() => {
      result.current("next");
    });

    expect(setCurrentIndex).toHaveBeenCalledWith(1);
  });

  it("should navigate to previous item", () => {
    const items = [document.createElement("div"), document.createElement("div"), document.createElement("div")];
    const itemsRef: React.RefObject<HTMLElement[]> = { current: items };
    const setCurrentIndex = jest.fn();

    const { result } = renderHook(() => useRovingTabIndex(itemsRef, 1, setCurrentIndex));

    act(() => {
      result.current("prev");
    });

    expect(setCurrentIndex).toHaveBeenCalledWith(0);
  });

  it("should wrap to last item when going prev from first item", () => {
    const items = [document.createElement("div"), document.createElement("div"), document.createElement("div")];
    const itemsRef: React.RefObject<HTMLElement[]> = { current: items };
    const setCurrentIndex = jest.fn();

    const { result } = renderHook(() => useRovingTabIndex(itemsRef, 0, setCurrentIndex));

    act(() => {
      result.current("prev");
    });

    expect(setCurrentIndex).toHaveBeenCalledWith(2);
  });

  it("should wrap to first item when going next from last item", () => {
    const items = [document.createElement("div"), document.createElement("div"), document.createElement("div")];
    const itemsRef: React.RefObject<HTMLElement[]> = { current: items };
    const setCurrentIndex = jest.fn();

    const { result } = renderHook(() => useRovingTabIndex(itemsRef, 2, setCurrentIndex));

    act(() => {
      result.current("next");
    });

    expect(setCurrentIndex).toHaveBeenCalledWith(0);
  });

  it("should focus the new item when navigating", () => {
    const items = [document.createElement("div"), document.createElement("div"), document.createElement("div")];
    items.forEach(item => document.body.appendChild(item));
    const itemsRef: React.RefObject<HTMLElement[]> = { current: items };
    const setCurrentIndex = jest.fn();
    const focusSpy = jest.spyOn(items[1], "focus");

    const { result } = renderHook(() => useRovingTabIndex(itemsRef, 0, setCurrentIndex));

    act(() => {
      result.current("next");
    });

    expect(focusSpy).toHaveBeenCalled();

    items.forEach(item => document.body.removeChild(item));
  });

  it("should handle empty items array", () => {
    const itemsRef: React.RefObject<HTMLElement[]> = { current: [] };
    const setCurrentIndex = jest.fn();

    const { result } = renderHook(() => useRovingTabIndex(itemsRef, 0, setCurrentIndex));

    act(() => {
      result.current("next");
    });

    expect(setCurrentIndex).not.toHaveBeenCalled();
  });

  it("should handle null items ref", () => {
    const itemsRef: React.RefObject<HTMLElement[]> = { current: null as unknown as HTMLElement[] };
    const setCurrentIndex = jest.fn();

    const { result } = renderHook(() => useRovingTabIndex(itemsRef, 0, setCurrentIndex));

    act(() => {
      result.current("next");
    });

    expect(setCurrentIndex).not.toHaveBeenCalled();
  });

  it("should handle items with null elements", () => {
    const items = [document.createElement("div"), null as unknown as HTMLElement, document.createElement("div")];
    const itemsRef: React.RefObject<HTMLElement[]> = { current: items };
    const setCurrentIndex = jest.fn();

    // Should not throw
    renderHook(() => useRovingTabIndex(itemsRef, 0, setCurrentIndex));

    expect(items[0].getAttribute("tabindex")).toBe("0");
    expect(items[2].getAttribute("tabindex")).toBe("-1");
  });

  it("should handle navigation when next item is null", () => {
    const items = [null as unknown as HTMLElement];
    const itemsRef: React.RefObject<HTMLElement[]> = { current: items };
    const setCurrentIndex = jest.fn();

    const { result } = renderHook(() => useRovingTabIndex(itemsRef, 0, setCurrentIndex));

    act(() => {
      result.current("next");
    });

    expect(setCurrentIndex).toHaveBeenCalledWith(0);
  });
});
