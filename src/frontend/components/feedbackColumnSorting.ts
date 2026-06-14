import { itemDataService } from "../dal/itemDataService";
import { WorkflowPhase } from "../interfaces/workItem";
import { type IColumnItem } from "./feedbackBoard";

export type FeedbackColumnSortMode = "time" | "votes";

export const sortFeedbackColumnItems = (columnItems: IColumnItem[], workflowPhase: WorkflowPhase, sortMode: FeedbackColumnSortMode, allColumnItems: IColumnItem[] = columnItems): IColumnItem[] => {
  const sortedByTime = [...columnItems].sort((item1, item2) => new Date(item2.feedbackItem.createdDate).getTime() - new Date(item1.feedbackItem.createdDate).getTime());

  if (workflowPhase === WorkflowPhase.Act && sortMode === "votes") {
    return itemDataService.sortItemsByVotesAndDate(columnItems, allColumnItems) ?? [];
  }

  return sortedByTime;
};