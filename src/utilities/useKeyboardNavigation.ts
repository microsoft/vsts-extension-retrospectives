import { useEffect, useCallback, useRef } from "react";
import { WorkflowPhase } from "../interfaces/workItem";

export interface KeyboardNavigationOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onDelete?: () => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
  workflowPhase?: WorkflowPhase;
}

/**
 * Custom hook for handling keyboard navigation
 * Provides consistent keyboard event handling across components
 */
export function useKeyboardNavigation(elementRef: React.RefObject<HTMLElement>, options: KeyboardNavigationOptions) {
  const { onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onSpace, onDelete, onPageUp, onPageDown, enabled = true, preventDefault = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't interfere with input fields
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      let handled = false;

      switch (event.key) {
        case "ArrowUp":
          if (onArrowUp) {
            onArrowUp();
            handled = true;
          }
          break;
        case "ArrowDown":
          if (onArrowDown) {
            onArrowDown();
            handled = true;
          }
          break;
        case "ArrowLeft":
          if (onArrowLeft) {
            onArrowLeft();
            handled = true;
          }
          break;
        case "ArrowRight":
          if (onArrowRight) {
            onArrowRight();
            handled = true;
          }
          break;
        case "Enter":
          if (onEnter && target.tagName !== "BUTTON" && target.tagName !== "A") {
            onEnter();
            handled = true;
          }
          break;
        case " ":
          if (onSpace && target.tagName !== "BUTTON") {
            onSpace();
            handled = true;
          }
          break;
        case "Delete":
        case "Backspace":
          if (onDelete && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
            onDelete();
            handled = true;
          }
          break;
        case "PageUp":
          if (onPageUp) {
            onPageUp();
            handled = true;
          }
          break;
        case "PageDown":
          if (onPageDown) {
            onPageDown();
            handled = true;
          }
          break;
      }

      if (handled && preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [enabled, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onSpace, onDelete, onPageUp, onPageDown, preventDefault],
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return undefined;

    element.addEventListener("keydown", handleKeyDown);

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, [elementRef, handleKeyDown, enabled]);
}

/**
 * Hook for handling global keyboard shortcuts
 */
export function useGlobalKeyboardShortcuts(shortcuts: { [key: string]: () => void }, enabled = true) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with input fields
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Check for modifier + key combinations
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Build shortcut string
      let shortcutKey = "";
      if (ctrl) shortcutKey += "ctrl+";
      if (shift) shortcutKey += "shift+";
      if (alt) shortcutKey += "alt+";
      shortcutKey += key;

      // Also check for single key
      const handler = shortcutsRef.current[shortcutKey] || shortcutsRef.current[key];

      if (handler) {
        event.preventDefault();
        event.stopPropagation();
        handler();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
}

/**
 * Hook for handling roving tabindex pattern
 * Only one item in a list should be tabbable at a time
 */
export function useRovingTabIndex(itemsRef: React.RefObject<HTMLElement[]>, currentIndex: number, setCurrentIndex: (index: number) => void) {
  useEffect(() => {
    const items = itemsRef.current;
    if (!items) return;

    items.forEach((item, index) => {
      if (item) {
        item.setAttribute("tabindex", index === currentIndex ? "0" : "-1");
      }
    });
  }, [itemsRef, currentIndex]);

  const handleNavigation = useCallback(
    (direction: "next" | "prev") => {
      const items = itemsRef.current;
      if (!items || items.length === 0) return;

      let newIndex = currentIndex;

      switch (direction) {
        case "next":
          newIndex = (currentIndex + 1) % items.length;
          break;
        case "prev":
          newIndex = (currentIndex - 1 + items.length) % items.length;
          break;
      }

      setCurrentIndex(newIndex);
      items[newIndex]?.focus();
    },
    [itemsRef, currentIndex, setCurrentIndex],
  );

  return handleNavigation;
}
