export const isAnyModalDialogOpen = (): boolean => {
  // Native <dialog> uses the `open` attribute when displayed.
  // Fluent UI / other dialog implementations typically set aria-modal="true".
  return !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]');
};

export const closeTopMostDialog = (): boolean => {
  const openDialogs = Array.from(document.querySelectorAll<HTMLDialogElement>("dialog[open]"));
  const topDialog = openDialogs[openDialogs.length - 1];
  if (topDialog) {
    topDialog.close();
    return true;
  }

  return false;
};
