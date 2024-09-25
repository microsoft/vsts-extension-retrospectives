/**
 * Gets the drag and drop id value from the browser's local storage
 */
const getIdValue = (): string => {
  return localStorage.getItem("reflect/dnd/id");
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
