export const isAnyModalDialogOpen = (): boolean => {
  // Native <dialog> uses the `open` attribute when displayed.
  // Fluent UI / other dialog implementations typically set aria-modal="true".
  return !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]');
};
