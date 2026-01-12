import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { ToastContainer, toast } from "../toastNotifications";

describe("toastNotifications", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    act(() => toast.dismiss());
  });

  afterEach(() => {
    act(() => toast.dismiss());
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders nothing when there are no toasts", () => {
    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it("renders toasts and allows manual dismissal", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { container } = render(<ToastContainer />);

    act(() => {
      toast(<span>Manual toast</span>, { autoClose: null });
    });

    expect(container.querySelectorAll(".retro-toast").length).toBe(1);

    await user.click(screen.getByLabelText("Dismiss notification"));

    expect(container.querySelectorAll(".retro-toast").length).toBe(0);
  });

  it("auto-dismisses toasts after the configured timeout", () => {
    const { container } = render(<ToastContainer />);

    act(() => {
      toast(<span>Auto toast</span>, { autoClose: 1000 });
    });

    expect(container.querySelectorAll(".retro-toast").length).toBe(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(container.querySelectorAll(".retro-toast").length).toBe(0);
  });

  it("supports updates, custom classes, and disabling progress bars", () => {
    const { container } = render(<ToastContainer className="custom-container" toastClassName="custom-toast" progressClassName="custom-progress" />);

    let toastId = "";
    act(() => {
      toastId = toast("Initial", { autoClose: 2000 });
    });

    act(() => {
      toast.update(toastId, { render: <span data-testid="updated">Updated toast</span>, intent: "success", autoClose: null });
    });

    const wrapper = container.querySelector(".retro-toast-container");
    expect(wrapper).toHaveClass("custom-container");

    const toastElement = container.querySelector(".retro-toast");
    expect(toastElement).toHaveClass("custom-toast");

    expect(container.querySelector(".custom-progress")).toBeNull();
  });

  it("dismisses every toast when called without an identifier", () => {
    const { container } = render(<ToastContainer />);

    act(() => {
      toast(<span>First</span>, { autoClose: null });
      toast(<span>Second</span>, { autoClose: null });
    });

    expect(container.querySelectorAll(".retro-toast").length).toBe(2);

    act(() => {
      toast.dismiss();
    });

    expect(container.querySelectorAll(".retro-toast").length).toBe(0);
  });

  describe("toast intents", () => {
    it("renders warning toast correctly", () => {
      const { container } = render(<ToastContainer />);

      act(() => {
        toast("Warning message", { intent: "warning", autoClose: null });
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);
    });

    it("renders error toast correctly", () => {
      const { container } = render(<ToastContainer />);

      act(() => {
        toast("Error message", { intent: "error", autoClose: null });
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);
    });

    it("renders info toast by default", () => {
      const { container } = render(<ToastContainer />);

      act(() => {
        toast("Info message", { intent: "info", autoClose: null });
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);
    });

    it("renders success toast correctly", () => {
      const { container } = render(<ToastContainer />);

      act(() => {
        toast("Success message", { intent: "success", autoClose: null });
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);
    });
  });

  describe("update functionality", () => {
    it("ignores update if toast id does not exist", () => {
      const { container } = render(<ToastContainer />);

      let existingId = "";
      act(() => {
        existingId = toast("Existing toast", { autoClose: null });
      });

      // Try to update a non-existent toast
      act(() => {
        toast.update("non-existent-id", { render: "Updated" });
      });

      // Original toast should still be there
      expect(container.querySelectorAll(".retro-toast").length).toBe(1);
    });

    it("updates only render when only render is passed", () => {
      const { container } = render(<ToastContainer />);

      let toastId = "";
      act(() => {
        toastId = toast("Initial", { autoClose: null });
      });

      act(() => {
        toast.update(toastId, { render: <span>Updated content</span> });
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);
      expect(container.textContent).toContain("Updated content");
    });

    it("updates only intent when only intent is passed", () => {
      const { container } = render(<ToastContainer />);

      let toastId = "";
      act(() => {
        toastId = toast("Test message", { autoClose: null });
      });

      act(() => {
        toast.update(toastId, { intent: "error" });
      });

      expect(container.querySelector(".retro-message-bar--error")).toBeTruthy();
    });

    it("updates only autoClose when only autoClose is passed", () => {
      const { container } = render(<ToastContainer />);

      let toastId = "";
      act(() => {
        toastId = toast("Test", { autoClose: null });
      });

      act(() => {
        toast.update(toastId, { autoClose: 500 });
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(0);
    });
  });

  describe("toast options defaults", () => {
    it("uses all defaults when no options are specified", () => {
      const { container } = render(<ToastContainer />);

      act(() => {
        toast("No options at all");
      });

      // Should use default intent (info)
      expect(container.querySelector(".retro-message-bar--info")).toBeTruthy();
      // Should have toast visible
      expect(container.querySelectorAll(".retro-toast").length).toBe(1);

      // Default is 5000ms - should auto dismiss
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(0);
    });

    it("uses default autoClose when autoClose is not specified", () => {
      const { container } = render(<ToastContainer />);

      act(() => {
        toast("Default auto close");
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);

      // Default is 5000ms
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(0);
    });

    it("uses default intent (info) when intent is not specified", () => {
      const { container } = render(<ToastContainer />);

      act(() => {
        toast("No intent specified", { autoClose: null });
      });

      expect(container.querySelector(".retro-message-bar--info")).toBeTruthy();
    });

    it("uses custom id when provided", () => {
      render(<ToastContainer />);

      let returnedId = "";
      act(() => {
        returnedId = toast("Custom ID toast", { id: "my-custom-id", autoClose: null });
      });

      expect(returnedId).toBe("my-custom-id");
    });

    it("uses default autoClose when options object exists but autoClose is not set", () => {
      const { container } = render(<ToastContainer />);

      act(() => {
        // Pass options object with intent only, autoClose not specified
        toast("With partial options", { intent: "success" });
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);
      expect(container.querySelector(".retro-message-bar--success")).toBeTruthy();

      // Default is 5000ms
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(0);
    });

    it("uses explicit autoClose value when provided", () => {
      const { container } = render(<ToastContainer />);

      act(() => {
        toast("Explicit auto close", { autoClose: 2000 });
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);

      // Should not dismiss before 2000ms
      act(() => {
        jest.advanceTimersByTime(1999);
      });
      expect(container.querySelectorAll(".retro-toast").length).toBe(1);

      // Should dismiss at 2000ms
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(container.querySelectorAll(".retro-toast").length).toBe(0);
    });
  });

  describe("dismiss functionality", () => {
    it("dismisses a specific toast by id", () => {
      const { container } = render(<ToastContainer />);

      let firstId = "";
      let secondId = "";
      act(() => {
        firstId = toast(<span>First</span>, { autoClose: null });
        secondId = toast(<span>Second</span>, { autoClose: null });
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(2);

      act(() => {
        toast.dismiss(firstId);
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);
      expect(container.textContent).toContain("Second");
      expect(container.textContent).not.toContain("First");
    });

    it("does nothing when dismissing a non-existent toast id", () => {
      const { container } = render(<ToastContainer />);

      act(() => {
        toast("Existing toast", { autoClose: null });
      });

      expect(container.querySelectorAll(".retro-toast").length).toBe(1);

      act(() => {
        toast.dismiss("non-existent-id");
      });

      // Toast should still be there
      expect(container.querySelectorAll(".retro-toast").length).toBe(1);
    });
  });
});
