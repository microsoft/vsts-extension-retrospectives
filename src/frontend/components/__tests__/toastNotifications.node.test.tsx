/** @jest-environment node */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ToastContainer, toast } from "../toastNotifications";

describe("toastNotifications server rendering", () => {
  afterEach(() => {
    toast.dismiss();
  });

  it("renders toasts when document is unavailable", () => {
    toast("Server toast", { autoClose: null });

    const markup = renderToStaticMarkup(<ToastContainer />);

    expect(markup).toContain("Server toast");
    expect(markup).toContain("retro-toast-container");
  });
});
