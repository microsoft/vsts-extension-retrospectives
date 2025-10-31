/**
 * Focus Manager Utility
 * Provides centralized focus management for keyboard navigation
 */

export interface FocusableElement {
  element: HTMLElement;
  id: string;
  columnId?: string;
}

export class FocusManager {
  private focusHistory: HTMLElement[] = [];
  private maxHistorySize = 10;

  /**
   * Store current focused element in history
   */
  public pushFocusHistory(element: HTMLElement | null): void {
    if (element && element !== this.focusHistory[this.focusHistory.length - 1]) {
      this.focusHistory.push(element);
      if (this.focusHistory.length > this.maxHistorySize) {
        this.focusHistory.shift();
      }
    }
  }

  /**
   * Restore focus to previous element
   */
  public popFocusHistory(): boolean {
    if (this.focusHistory.length > 0) {
      const previousElement = this.focusHistory.pop();
      if (previousElement && document.contains(previousElement)) {
        previousElement.focus();
        return true;
      }
      // If element no longer exists, try the next one
      return this.popFocusHistory();
    }
    return false;
  }

  /**
   * Clear focus history
   */
  public clearFocusHistory(): void {
    this.focusHistory = [];
  }

  /**
   * Set focus to an element and add to history
   */
  public setFocus(element: HTMLElement | null, addToHistory = true): boolean {
    if (element && document.contains(element)) {
      if (addToHistory) {
        const currentFocus = document.activeElement as HTMLElement;
        if (currentFocus && currentFocus !== element) {
          this.pushFocusHistory(currentFocus);
        }
      }
      element.focus();
      return true;
    }
    return false;
  }

  /**
   * Find the next focusable element in a container
   */
  public findNextFocusableElement(container: HTMLElement, currentElement: HTMLElement, direction: "next" | "prev", selector = '[tabindex="0"], [tabindex="-1"], button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'): HTMLElement | null {
    const focusableElements = Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(el => el.offsetParent !== null && !el.hasAttribute("aria-hidden"));

    const currentIndex = focusableElements.indexOf(currentElement);
    if (currentIndex === -1) return focusableElements[0] || null;

    if (direction === "next") {
      return focusableElements[currentIndex + 1] || focusableElements[0] || null;
    } else {
      return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1] || null;
    }
  }

  /**
   * Get all focusable elements in a container
   */
  public getFocusableElements(container: HTMLElement, selector = '[tabindex="0"], [tabindex="-1"], button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(el => el.offsetParent !== null && !el.hasAttribute("aria-hidden"));
  }

  /**
   * Trap focus within a container (for dialogs/modals)
   */
  public createFocusTrap(container: HTMLElement): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = this.getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }
}

// Export singleton instance
export const focusManager = new FocusManager();
