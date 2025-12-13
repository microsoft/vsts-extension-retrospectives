import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import KeyboardShortcutsDialog from "../keyboardShortcutsDialog";
import { WorkflowPhase } from "../../interfaces/workItem";

describe("KeyboardShortcutsDialog", () => {
  describe("Dialog visibility", () => {
    test("is hidden when isOpen is false", () => {
      const { container } = render(<KeyboardShortcutsDialog isOpen={false} onClose={jest.fn()} />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeNull();
    });

    test("is visible when isOpen is true", () => {
      const { getByRole } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      const dialog = getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });

    test("displays correct title", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });

    test("displays subtitle with description", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText(/Use these keyboard shortcuts to navigate/i)).toBeInTheDocument();
    });
  });

  describe("Close functionality", () => {
    test("calls onClose when Close button is clicked", () => {
      const onClose = jest.fn();
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={onClose} />);

      const closeButton = getByText("Close");
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Global shortcuts", () => {
    test("displays global shortcuts category", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Global")).toBeInTheDocument();
    });

    test("displays keyboard shortcut help", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Show keyboard shortcuts")).toBeInTheDocument();
    });

    test("displays Esc shortcut", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Close dialogs or cancel actions")).toBeInTheDocument();
    });

    test("displays column navigation shortcut", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Jump to column by number")).toBeInTheDocument();
    });
  });

  describe("Navigation shortcuts", () => {
    test("displays navigation category", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Navigation")).toBeInTheDocument();
    });

    test("displays arrow navigation shortcuts", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Navigate between feedback items")).toBeInTheDocument();
      expect(getByText("Navigate between columns")).toBeInTheDocument();
    });

    test("displays page navigation shortcuts", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Scroll up in column")).toBeInTheDocument();
      expect(getByText("Scroll down in column")).toBeInTheDocument();
    });

    test("displays tab navigation", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Move focus to next element")).toBeInTheDocument();
    });
  });

  describe("Workflow phase-specific shortcuts", () => {
    test("displays Collect phase shortcuts", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Create new feedback item")).toBeInTheDocument();
    });

    test("does not display Group shortcuts in Collect phase", () => {
      const { queryByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(queryByText("Group feedback items")).toBeNull();
    });

    test("does not display Vote shortcuts in Collect phase", () => {
      const { queryByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(queryByText("Cast/Remove vote")).toBeNull();
    });
  });

  describe("Column action shortcuts", () => {
    test("displays column category", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Column")).toBeInTheDocument();
    });

    test("displays edit column notes shortcut", () => {
      const { getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByText("Edit column notes")).toBeInTheDocument();
    });
  });

  describe("Keyboard key rendering", () => {
    test("renders kbd elements for shortcuts", () => {
      const { getByRole } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      // Ensure dialog is open
      const dialog = getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // Find kbd elements within the dialog
      const kbdElements = dialog.querySelectorAll("kbd");
      expect(kbdElements.length).toBeGreaterThan(0);
    });

    test("renders multiple keys with separator for combinations", () => {
      const { getByRole, getByText } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      // Find the row with "Move focus to previous element" which has Shift + Tab
      const dialog = getByRole("dialog");
      getByText("Move focus to previous element");
      const kbdElements = dialog.querySelectorAll("kbd");
      const hasShift = Array.from(kbdElements).some(kbd => kbd.textContent === "Shift");
      const hasTab = Array.from(kbdElements).some(kbd => kbd.textContent === "Tab");

      expect(hasShift).toBe(true);
      expect(hasTab).toBe(true);
    });
  });

  describe("Accessibility", () => {
    test("dialog has proper role", () => {
      const { getByRole } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      expect(getByRole("dialog")).toBeInTheDocument();
    });

    test("close button is accessible", () => {
      const { getByRole } = render(<KeyboardShortcutsDialog isOpen={true} onClose={jest.fn()} />);

      const closeButton = getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });
});
