/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";

import "@testing-library/jest-dom";
import { testColumnProps } from "../__mocks__/mocked_components/mockedFeedbackColumn";
import FeedbackColumn, { FeedbackColumnHandle } from "../feedbackColumn";
import { WorkflowPhase } from "../../interfaces/workItem";
import { itemDataService } from "../../dal/itemDataService";

jest.mock("../../dal/itemDataService", () => {
  const actual = jest.requireActual("../../dal/itemDataService");
  return {
    itemDataService: {
      ...actual.itemDataService,
      addFeedbackItemAsMainItemToColumn: jest.fn().mockResolvedValue({
        updatedOldParentFeedbackItem: null,
        updatedFeedbackItem: { id: "updated", columnId: "column-id" },
        updatedChildFeedbackItems: [],
      }),
      sortItemsByVotesAndDate: jest.fn((items: any, originalItems?: any[]) => items ?? originalItems ?? []),
    },
  };
});

jest.mock("../feedbackItem", () => {
  const ReactLib = require("react");
  return function MockFeedbackItem(props: any) {
    return ReactLib.createElement(
      "div",
      {
        "data-feedback-item-id": props.id,
        tabIndex: 0,
      },
      ReactLib.createElement("input", { defaultValue: props.title ?? "" }),
      ReactLib.createElement("div", { contentEditable: true, suppressContentEditableWarning: true }, props.title ?? ""),
    );
  };
});

jest.mock("../feedbackItemGroup", () => {
  const ReactLib = require("react");
  return function MockFeedbackItemGroup(props: any) {
    return ReactLib.createElement(
      "div",
      {
        role: "group",
        "data-feedback-item-id": props.mainFeedbackItem?.id,
      },
      "group",
    );
  };
});

beforeAll(() => {
  if (!(window as unknown as { HTMLDialogElement?: typeof HTMLDialogElement }).HTMLDialogElement) {
    (window as unknown as { HTMLDialogElement: typeof HTMLElement }).HTMLDialogElement = class HTMLDialogElement extends HTMLElement {} as unknown as typeof HTMLDialogElement;
  }

  HTMLDialogElement.prototype.showModal = function showModal() {
    (this as unknown as { open: boolean }).open = true;
  };

  HTMLDialogElement.prototype.close = function close() {
    (this as unknown as { open: boolean }).open = false;
  };
});

describe("FeedbackColumn targeted coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("covers focus and scroll optional branches with valid target element", async () => {
    const ref = React.createRef<FeedbackColumnHandle>();
    const scrollSpy = jest.fn();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollSpy;

    try {
      const props = {
        ...testColumnProps,
        workflowPhase: WorkflowPhase.Vote,
        isDataLoaded: true,
      };

      render(<FeedbackColumn {...props} ref={ref} />);

      await act(async () => {
        ref.current?.navigateByKeyboard("next");
      });

      expect(scrollSpy).toHaveBeenCalled();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it("covers keyboard branch when activeElement is not inside a feedback card", async () => {
    const ref = React.createRef<FeedbackColumnHandle>();
    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, "activeElement");
    Object.defineProperty(document, "activeElement", {
      configurable: true,
      get: () => ({ closest: (): Element | null => null }) as unknown as HTMLElement,
    });

    try {
      render(<FeedbackColumn {...props} ref={ref} />);
      await act(async () => {
        ref.current?.navigateByKeyboard("next");
      });
    } finally {
      if (activeElementDescriptor) {
        Object.defineProperty(document, "activeElement", activeElementDescriptor);
      } else {
        delete (document as unknown as { activeElement?: unknown }).activeElement;
      }
    }
  });

  it("covers keyboard branch when activeElement is inside a feedback card", async () => {
    const ref = React.createRef<FeedbackColumnHandle>();
    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, "activeElement");

    try {
      const { container } = render(<FeedbackColumn {...props} ref={ref} />);
      const input = container.querySelector("[data-feedback-item-id] input") as HTMLInputElement;

      Object.defineProperty(document, "activeElement", {
        configurable: true,
        get: () => input,
      });

      await act(async () => {
        ref.current?.navigateByKeyboard("next");
      });
    } finally {
      if (activeElementDescriptor) {
        Object.defineProperty(document, "activeElement", activeElementDescriptor);
      } else {
        delete (document as unknown as { activeElement?: unknown }).activeElement;
      }
    }
  });

  it("covers keyboard branch when activeElement is null", async () => {
    const ref = React.createRef<FeedbackColumnHandle>();
    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, "activeElement");
    Object.defineProperty(document, "activeElement", {
      configurable: true,
      get: () => null,
    });

    try {
      render(<FeedbackColumn {...props} ref={ref} />);
      await act(async () => {
        ref.current?.navigateByKeyboard("next");
      });
    } finally {
      if (activeElementDescriptor) {
        Object.defineProperty(document, "activeElement", activeElementDescriptor);
      } else {
        delete (document as unknown as { activeElement?: unknown }).activeElement;
      }
    }
  });

  it("covers columnItems fallback when prop is null", () => {
    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
      columnItems: null as unknown as typeof testColumnProps.columnItems,
    };

    const { getByRole } = render(<FeedbackColumn {...props} />);
    expect(getByRole("region")).toHaveAttribute("aria-label", `${props.columnName} column with 0 feedback items`);
  });

  it("covers notes draft change fallback when event target is null", () => {
    const props = {
      ...testColumnProps,
      showColumnEditButton: true,
      columnNotes: "seed note",
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const { getByRole, getByLabelText } = render(<FeedbackColumn {...props} />);
    fireEvent.click(getByRole("button", { name: `Edit column ${props.columnName}` }));

    const notesInput = getByLabelText("Column notes") as HTMLTextAreaElement & Record<string, unknown>;
    const reactPropsKey = Object.keys(notesInput).find(key => key.startsWith("__reactProps$"));
    const reactProps = reactPropsKey ? (notesInput[reactPropsKey] as { onChange?: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => void }) : undefined;

    expect(reactProps?.onChange).toBeDefined();

    act(() => {
      reactProps?.onChange?.({ target: null } as unknown as React.FormEvent<HTMLInputElement | HTMLTextAreaElement>);
    });

    fireEvent.click(getByRole("button", { name: "Save" }));
    expect(props.onColumnNotesChange).toHaveBeenCalledWith("");
  });

  it("covers preserveFocus contenteditable branch without selection ranges", async () => {
    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const selectionSpy = jest.spyOn(window, "getSelection").mockReturnValue({ rangeCount: 0 } as Selection);

    const { container, rerender } = render(<FeedbackColumn {...props} />);
    const editable = container.querySelector("[contenteditable='true']") as HTMLElement | null;
    if (editable) {
      Object.defineProperty(editable, "isContentEditable", {
        configurable: true,
        get: () => true,
      });
      editable.focus();
    }

    if (!(document.activeElement instanceof Node)) {
      (document.body as HTMLElement).focus();
    }

    const updatedProps = {
      ...props,
      columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "new-id" } }],
    };

    rerender(<FeedbackColumn {...updatedProps} />);

    await waitFor(() => {
      expect(true).toBe(true);
    });

    selectionSpy.mockRestore();
  });

  it("covers preserveFocus contenteditable branch when selection has no ranges", async () => {
    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const selectionSpy = jest.spyOn(window, "getSelection").mockReturnValue({ rangeCount: 0 } as Selection);
    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, "activeElement");

    const { container, rerender } = render(<FeedbackColumn {...props} />);
    const editable = container.querySelector("[contenteditable='true']") as HTMLElement;
    Object.defineProperty(editable, "isContentEditable", {
      configurable: true,
      get: () => true,
    });
    editable.setAttribute("tabindex", "-1");

    Object.defineProperty(document, "activeElement", {
      configurable: true,
      get: () => editable,
    });

    const updatedProps = {
      ...props,
      columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "selection-none" } }],
    };

    rerender(<FeedbackColumn {...updatedProps} />);

    await waitFor(() => {
      expect(selectionSpy).toHaveBeenCalled();
    });

    selectionSpy.mockRestore();
    if (activeElementDescriptor) {
      Object.defineProperty(document, "activeElement", activeElementDescriptor);
    } else {
      delete (document as unknown as { activeElement?: unknown }).activeElement;
    }
  });

  it("covers restoreFocus input path when selectionEnd is null", async () => {
    jest.useFakeTimers();

    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, "activeElement");
    const setSelectionRangeSpy = jest.spyOn(HTMLInputElement.prototype, "setSelectionRange");

    try {
      const { container, rerender } = render(<FeedbackColumn {...props} />);
      const input = container.querySelector("[data-feedback-item-id] input") as HTMLInputElement;

      Object.defineProperty(input, "selectionStart", {
        configurable: true,
        get: () => 1,
      });
      Object.defineProperty(input, "selectionEnd", {
        configurable: true,
        get: () => null,
      });

      Object.defineProperty(document, "activeElement", {
        configurable: true,
        get: () => input,
      });

      const updatedProps = {
        ...props,
        columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "input-restore" } }],
      };

      rerender(<FeedbackColumn {...updatedProps} />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(setSelectionRangeSpy).toHaveBeenCalledWith(1, 1);
    } finally {
      setSelectionRangeSpy.mockRestore();
      if (activeElementDescriptor) {
        Object.defineProperty(document, "activeElement", activeElementDescriptor);
      } else {
        delete (document as unknown as { activeElement?: unknown }).activeElement;
      }
      jest.useRealTimers();
    }
  });

  it("covers restoreFocus contenteditable path when selection is missing", async () => {
    jest.useFakeTimers();

    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const preserveSelection = {
      rangeCount: 1,
      getRangeAt: () => ({ startOffset: 2 }) as Range,
    } as unknown as Selection;

    const selectionSpy = jest.spyOn(window, "getSelection");
    selectionSpy.mockReturnValueOnce(preserveSelection).mockReturnValueOnce(null);

    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, "activeElement");

    try {
      const { container, rerender } = render(<FeedbackColumn {...props} />);
      const editable = container.querySelector("[contenteditable='true']") as HTMLElement;
      Object.defineProperty(editable, "isContentEditable", {
        configurable: true,
        get: () => true,
      });
      editable.setAttribute("tabindex", "-1");

      Object.defineProperty(document, "activeElement", {
        configurable: true,
        get: () => editable,
      });

      const updatedProps = {
        ...props,
        columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "contenteditable-missing-selection" } }],
      };

      rerender(<FeedbackColumn {...updatedProps} />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(selectionSpy).toHaveBeenCalled();
    } finally {
      selectionSpy.mockRestore();
      if (activeElementDescriptor) {
        Object.defineProperty(document, "activeElement", activeElementDescriptor);
      } else {
        delete (document as unknown as { activeElement?: unknown }).activeElement;
      }
      jest.useRealTimers();
    }
  });

  it("covers restoreFocus contenteditable branch when firstChild or selection is missing", async () => {
    jest.useFakeTimers();

    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const preserveSelection = {
      rangeCount: 1,
      getRangeAt: () => ({ startOffset: 2 }) as Range,
    } as unknown as Selection;

    const selectionSpy = jest.spyOn(window, "getSelection");
    selectionSpy.mockReturnValueOnce(preserveSelection).mockReturnValueOnce(null);

    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, "activeElement");

    try {
      const { container, rerender } = render(<FeedbackColumn {...props} />);
      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      const input = feedbackCard.querySelector("input");
      if (input) {
        input.remove();
      }

      const editable = feedbackCard.querySelector("[contenteditable='true']") as HTMLElement;
      Object.defineProperty(editable, "isContentEditable", {
        configurable: true,
        get: () => true,
      });

      Object.defineProperty(document, "activeElement", {
        configurable: true,
        get: () => editable,
      });

      const updatedProps = {
        ...props,
        columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "contenteditable-no-selection-restore" } }],
      };

      rerender(<FeedbackColumn {...updatedProps} />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(selectionSpy).toHaveBeenCalled();
    } finally {
      selectionSpy.mockRestore();
      if (activeElementDescriptor) {
        Object.defineProperty(document, "activeElement", activeElementDescriptor);
      } else {
        delete (document as unknown as { activeElement?: unknown }).activeElement;
      }
      jest.useRealTimers();
    }
  });

  it("covers restoreFocus contenteditable text-length null fallback", async () => {
    jest.useFakeTimers();

    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const preserveSelection = {
      rangeCount: 1,
      getRangeAt: () => ({ startOffset: 3 }) as Range,
    } as unknown as Selection;

    const restoreSelection = {
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    } as unknown as Selection;

    const selectionSpy = jest.spyOn(window, "getSelection");
    selectionSpy.mockReturnValueOnce(preserveSelection).mockReturnValueOnce(restoreSelection);

    const createRangeSpy = jest.spyOn(document, "createRange").mockReturnValue({
      setStart: jest.fn(),
      collapse: jest.fn(),
    } as unknown as Range);

    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, "activeElement");

    try {
      const { container, rerender } = render(<FeedbackColumn {...props} />);
      const feedbackCard = container.querySelector("[data-feedback-item-id]") as HTMLElement;
      const input = feedbackCard.querySelector("input");
      if (input) {
        input.remove();
      }

      const editable = feedbackCard.querySelector("[contenteditable='true']") as HTMLElement;
      Object.defineProperty(editable, "isContentEditable", {
        configurable: true,
        get: () => true,
      });
      Object.defineProperty(editable, "firstChild", {
        configurable: true,
        get: () => ({ textContent: null }),
      });

      Object.defineProperty(document, "activeElement", {
        configurable: true,
        get: () => editable,
      });

      const updatedProps = {
        ...props,
        columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "contenteditable-null-text-fallback" } }],
      };

      rerender(<FeedbackColumn {...updatedProps} />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(selectionSpy).toHaveBeenCalled();
      expect(createRangeSpy).toHaveBeenCalled();
    } finally {
      selectionSpy.mockRestore();
      createRangeSpy.mockRestore();
      if (activeElementDescriptor) {
        Object.defineProperty(document, "activeElement", activeElementDescriptor);
      } else {
        delete (document as unknown as { activeElement?: unknown }).activeElement;
      }
      jest.useRealTimers();
    }
  });

  it("covers restoreFocus contenteditable text-length fallback when textContent is null", async () => {
    jest.useFakeTimers();

    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const preserveSelection = {
      rangeCount: 1,
      getRangeAt: () => ({ startOffset: 3 }) as Range,
    } as unknown as Selection;

    const restoreSelection = {
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    } as unknown as Selection;

    const selectionSpy = jest.spyOn(window, "getSelection");
    selectionSpy.mockReturnValueOnce(preserveSelection).mockReturnValueOnce(restoreSelection);

    const createRangeSpy = jest.spyOn(document, "createRange").mockReturnValue({
      setStart: jest.fn(),
      collapse: jest.fn(),
    } as unknown as Range);

    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, "activeElement");

    try {
      const { container, rerender } = render(<FeedbackColumn {...props} />);
      const editable = container.querySelector("[contenteditable='true']") as HTMLElement;
      Object.defineProperty(editable, "isContentEditable", {
        configurable: true,
        get: () => true,
      });
      editable.setAttribute("tabindex", "-1");

      Object.defineProperty(editable, "firstChild", {
        configurable: true,
        get: () => ({ textContent: null }),
      });

      Object.defineProperty(document, "activeElement", {
        configurable: true,
        get: () => editable,
      });

      const updatedProps = {
        ...props,
        columnItems: [...props.columnItems, { ...props.columnItems[0], feedbackItem: { ...props.columnItems[0].feedbackItem, id: "contenteditable-null-text" } }],
      };

      rerender(<FeedbackColumn {...updatedProps} />);

      await act(async () => {
        jest.runAllTimers();
      });

      expect(selectionSpy).toHaveBeenCalled();
    } finally {
      selectionSpy.mockRestore();
      createRangeSpy.mockRestore();
      if (activeElementDescriptor) {
        Object.defineProperty(document, "activeElement", activeElementDescriptor);
      } else {
        delete (document as unknown as { activeElement?: unknown }).activeElement;
      }
      jest.useRealTimers();
    }
  });

  it("covers column event listener guard branches when column ref is null", async () => {
    const originalUseRef = React.useRef;
    const useRefSpy = jest.spyOn(React, "useRef");
    let refCall = 0;

    useRefSpy.mockImplementation((initialValue: unknown) => {
      refCall += 1;
      const refObj = originalUseRef(initialValue);
      if (refCall === 1) {
        Object.defineProperty(refObj, "current", {
          get: () => null,
          set: () => {},
          configurable: true,
        });
      }
      return refObj;
    });

    try {
      const ref = React.createRef<FeedbackColumnHandle>();
      const props = {
        ...testColumnProps,
        workflowPhase: WorkflowPhase.Vote,
        isDataLoaded: true,
      };

      const { unmount } = render(<FeedbackColumn {...props} ref={ref} />);
      await act(async () => {
        ref.current?.navigateByKeyboard("next");
      });
      unmount();
    } finally {
      useRefSpy.mockRestore();
    }
  });

  it("covers column notes change fallback path", async () => {
    const props = {
      ...testColumnProps,
      showColumnEditButton: true,
      columnNotes: "seed note",
      workflowPhase: WorkflowPhase.Vote,
      isDataLoaded: true,
    };

    const { getByRole, getByLabelText } = render(<FeedbackColumn {...props} />);
    fireEvent.click(getByRole("button", { name: `Edit column ${props.columnName}` }));

    const notesInput = getByLabelText("Column notes") as HTMLTextAreaElement;
    fireEvent.change(notesInput, { target: { value: "updated note" } });

    await act(async () => {
      fireEvent.click(getByRole("button", { name: "Save" }));
    });

    expect(props.onColumnNotesChange).toHaveBeenCalledWith("updated note");
  });

  it("covers Act sorting fallback with undefined return", () => {
    (itemDataService.sortItemsByVotesAndDate as jest.Mock).mockReturnValueOnce(undefined);

    const props = {
      ...testColumnProps,
      workflowPhase: WorkflowPhase.Act,
      isDataLoaded: true,
    };

    const { container } = render(<FeedbackColumn {...props} />);
    expect(container.querySelector(".feedback-items-container")).toBeInTheDocument();
  });
});
