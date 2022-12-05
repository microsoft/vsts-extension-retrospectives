/**
 * Gets and removes the drag and drop id value from the browser's local storage
 */
const getIdValue = (andRemove: boolean = false): string => {
  const value = localStorage.getItem("reflect/dnd/id");
  if (andRemove) {
    localStorage.removeItem("reflect/dnd/id");
  }
  return value;
}

/**
 * Sets the drag and drop id value in the browser's local storage
 */
const setIdValue = (value: string) => {
  localStorage.setItem("reflect/dnd/id", value);
}

export default {
  getIdValue,
  setIdValue
}
