import { closeTopMostDialog, isAnyModalDialogOpen } from "../dialogHelper";

describe("dialogHelper", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("isAnyModalDialogOpen returns false when no dialogs are open", () => {
    expect(isAnyModalDialogOpen()).toBe(false);
  });

  test("isAnyModalDialogOpen returns true for native dialog", () => {
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    document.body.appendChild(dialog);

    expect(isAnyModalDialogOpen()).toBe(true);
  });

  test("isAnyModalDialogOpen returns true for aria-modal dialog", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    document.body.appendChild(dialog);

    expect(isAnyModalDialogOpen()).toBe(true);
  });

  test("closeTopMostDialog returns false when none are open", () => {
    expect(closeTopMostDialog()).toBe(false);
  });

  test("closeTopMostDialog closes the last open dialog", () => {
    const firstDialog = document.createElement("dialog");
    const secondDialog = document.createElement("dialog");

    firstDialog.setAttribute("open", "");
    secondDialog.setAttribute("open", "");

    firstDialog.close = function close() {
      this.removeAttribute("open");
    };
    secondDialog.close = function close() {
      this.removeAttribute("open");
    };

    document.body.appendChild(firstDialog);
    document.body.appendChild(secondDialog);

    expect(closeTopMostDialog()).toBe(true);
    expect(firstDialog.hasAttribute("open")).toBe(true);
    expect(secondDialog.hasAttribute("open")).toBe(false);
  });
});
