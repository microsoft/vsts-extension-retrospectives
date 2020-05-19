import { DragAndDropKeys } from '../config/constants';

const getItemAndRemoveIfRequired = (key: string, andRemove: boolean): string => {
  const value = localStorage.getItem(key);
  if (andRemove) {
    localStorage.removeItem(key);
  }
  return value;
}

/**
 * Gets and removes the drag and drop id value from the browser's local storage
 */
const getIdValue = (andRemove: boolean = false): string => {
  return getItemAndRemoveIfRequired(DragAndDropKeys.Id, andRemove);
}

/**
 * Sets the drag and drop id value in the browser's local storage
 */
const setIdValue = (value: string) => {
  localStorage.setItem(DragAndDropKeys.Id, value);
}

export default {
  getIdValue,
  setIdValue
}