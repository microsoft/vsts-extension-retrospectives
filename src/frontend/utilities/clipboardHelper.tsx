/**
 * Copy text to clipboard using the copy-event interception approach.
 * navigator.clipboard is blocked by ADO's Permissions-Policy, so we intercept
 * the browser's own copy event and inject data via clipboardData.setData().
 * @param text The text to copy to the clipboard
 * @returns Promise<boolean> True if the copy operation succeeded, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    const onCopy = (e: ClipboardEvent) => {
      e.clipboardData?.setData("text/plain", text);
      e.preventDefault();
    };
    document.addEventListener("copy", onCopy, { once: true });
    const succeeded = document.execCommand("copy");
    if (!succeeded) {
      document.removeEventListener("copy", onCopy);
      console.warn("execCommand('copy') returned false - clipboard not updated.");
    }
    return succeeded;
  } catch (err) {
    console.error("Copy-event approach failed:", err);
    return false;
  }
};
