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
});
