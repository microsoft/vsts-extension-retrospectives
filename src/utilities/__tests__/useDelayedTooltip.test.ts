import { act, renderHook } from "@testing-library/react";
import { useDelayedTooltip } from "../useDelayedTooltip";

type TooltipElement = HTMLDivElement & {
  showPopover?: jest.Mock;
  hidePopover?: jest.Mock;
};

function setupTooltip(showDelayMs?: number) {
  const hook = renderHook(() => useDelayedTooltip<HTMLButtonElement>(showDelayMs));
  const trigger = document.createElement("button");
  const tooltip = document.createElement("div") as TooltipElement;
  const showPopover = jest.fn();
  const hidePopover = jest.fn();

  tooltip.showPopover = showPopover;
  tooltip.hidePopover = hidePopover;
  hook.result.current.triggerRef.current = trigger;
  hook.result.current.tooltipRef.current = tooltip;

  return { ...hook, trigger, tooltip, showPopover, hidePopover };
}

describe("useDelayedTooltip", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("shows after the default delay and hides an open tooltip", () => {
    const { result, trigger, tooltip, showPopover, hidePopover } = setupTooltip();
    let isOpen = false;

    jest.spyOn(tooltip, "matches").mockImplementation(selector => selector === ":popover-open" && isOpen);
    showPopover.mockImplementation(() => {
      isOpen = true;
    });
    hidePopover.mockImplementation(() => {
      isOpen = false;
    });

    act(() => {
      result.current.showTooltip();
      jest.advanceTimersByTime(499);
    });
    expect(showPopover).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(showPopover).toHaveBeenCalledWith({ source: trigger });

    act(() => {
      result.current.hideTooltip();
    });
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it("uses a custom delay and ignores duplicate show requests", () => {
    const { result, tooltip, showPopover } = setupTooltip(100);
    jest.spyOn(tooltip, "matches").mockReturnValue(false);

    act(() => {
      result.current.showTooltip();
      result.current.showTooltip();
      jest.advanceTimersByTime(99);
    });
    expect(showPopover).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(showPopover).toHaveBeenCalledTimes(1);
  });

  it("does not schedule a show without a tooltip or when it is already open", () => {
    const { result } = renderHook(() => useDelayedTooltip<HTMLButtonElement>());

    act(() => {
      result.current.showTooltip();
    });
    expect(jest.getTimerCount()).toBe(0);

    const tooltip = document.createElement("div");
    result.current.tooltipRef.current = tooltip;
    jest.spyOn(tooltip, "matches").mockReturnValue(true);

    act(() => {
      result.current.showTooltip();
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each(["tooltip", "trigger", "open tooltip", "showPopover API"])("stops showing when the %s is unavailable after scheduling", unavailablePart => {
    const { result, tooltip, showPopover } = setupTooltip();
    const matchesSpy = jest.spyOn(tooltip, "matches").mockReturnValue(false);

    act(() => {
      result.current.showTooltip();
    });

    if (unavailablePart === "tooltip") {
      result.current.tooltipRef.current = null;
    } else if (unavailablePart === "trigger") {
      result.current.triggerRef.current = null;
    } else if (unavailablePart === "open tooltip") {
      matchesSpy.mockReturnValue(true);
    } else {
      delete tooltip.showPopover;
    }

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(showPopover).not.toHaveBeenCalled();
  });

  it("retries showPopover without source options when the overload is unsupported", () => {
    const { result, trigger, tooltip, showPopover } = setupTooltip();
    jest.spyOn(tooltip, "matches").mockReturnValue(false);
    showPopover.mockImplementationOnce(() => {
      throw new TypeError("Source options are unsupported");
    });

    act(() => {
      result.current.showTooltip();
      jest.advanceTimersByTime(500);
    });

    expect(showPopover).toHaveBeenNthCalledWith(1, { source: trigger });
    expect(showPopover).toHaveBeenNthCalledWith(2);
  });

  it("treats an unsupported popover selector as closed", () => {
    const { result, trigger, tooltip, showPopover } = setupTooltip();
    jest.spyOn(tooltip, "matches").mockImplementation(() => {
      throw new DOMException("Unsupported selector");
    });

    act(() => {
      result.current.showTooltip();
      jest.advanceTimersByTime(500);
    });

    expect(showPopover).toHaveBeenCalledWith({ source: trigger });
  });

  it("cancels a pending show when hidden", () => {
    const { result, tooltip, showPopover, hidePopover } = setupTooltip();
    jest.spyOn(tooltip, "matches").mockReturnValue(false);

    act(() => {
      result.current.showTooltip();
      result.current.hideTooltip();
      jest.advanceTimersByTime(500);
    });

    expect(showPopover).not.toHaveBeenCalled();
    expect(hidePopover).not.toHaveBeenCalled();
  });

  it("cancels a pending show when unmounted", () => {
    const { result, unmount, tooltip, showPopover } = setupTooltip();
    jest.spyOn(tooltip, "matches").mockReturnValue(false);

    act(() => {
      result.current.showTooltip();
    });
    unmount();

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(showPopover).not.toHaveBeenCalled();
  });

  it("does not hide a missing or closed tooltip or call an unavailable hidePopover API", () => {
    const { result } = renderHook(() => useDelayedTooltip<HTMLButtonElement>());

    expect(() => {
      act(() => result.current.hideTooltip());
    }).not.toThrow();

    const tooltip = document.createElement("div") as TooltipElement;
    const hidePopover = jest.fn();
    tooltip.hidePopover = hidePopover;
    result.current.tooltipRef.current = tooltip;
    const matchesSpy = jest.spyOn(tooltip, "matches").mockReturnValue(false);

    act(() => result.current.hideTooltip());
    expect(hidePopover).not.toHaveBeenCalled();

    matchesSpy.mockReturnValue(true);
    delete tooltip.hidePopover;
    expect(() => {
      act(() => result.current.hideTooltip());
    }).not.toThrow();
  });
});
