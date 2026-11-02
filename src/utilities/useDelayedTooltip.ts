import { useCallback, useEffect, useRef } from "react";

const DEFAULT_TOOLTIP_SHOW_DELAY_MS = 500;

type PopoverElement = HTMLElement & {
  showPopover?: (options?: { source?: HTMLElement }) => void;
  hidePopover?: () => void;
};

function isPopoverOpen(popover: HTMLElement): boolean {
  try {
    return popover.matches(":popover-open");
  } catch {
    return false;
  }
}

export function useDelayedTooltip<TTrigger extends HTMLElement, TTooltip extends HTMLElement = HTMLDivElement>(showDelayMs = DEFAULT_TOOLTIP_SHOW_DELAY_MS) {
  const triggerRef = useRef<TTrigger>(null);
  const tooltipRef = useRef<TTooltip>(null);
  const showTimeoutIdRef = useRef<number | undefined>(undefined);

  const clearShowTimeout = useCallback(() => {
    if (showTimeoutIdRef.current === undefined) {
      return;
    }

    window.clearTimeout(showTimeoutIdRef.current);
    showTimeoutIdRef.current = undefined;
  }, []);

  const showTooltip = useCallback(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip || isPopoverOpen(tooltip) || showTimeoutIdRef.current !== undefined) {
      return;
    }

    showTimeoutIdRef.current = window.setTimeout(() => {
      showTimeoutIdRef.current = undefined;

      const currentTooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const showPopover = (currentTooltip as PopoverElement | null)?.showPopover;
      if (!currentTooltip || !trigger || isPopoverOpen(currentTooltip) || !showPopover) {
        return;
      }

      try {
        showPopover.call(currentTooltip, { source: trigger });
      } catch {
        showPopover.call(currentTooltip);
      }
    }, showDelayMs);
  }, [showDelayMs]);

  const hideTooltip = useCallback(() => {
    clearShowTimeout();

    const tooltip = tooltipRef.current;
    const hidePopover = (tooltip as PopoverElement | null)?.hidePopover;
    if (tooltip && isPopoverOpen(tooltip) && hidePopover) {
      hidePopover.call(tooltip);
    }
  }, [clearShowTimeout]);

  useEffect(() => clearShowTimeout, [clearShowTimeout]);

  return { triggerRef, tooltipRef, showTooltip, hideTooltip };
}
