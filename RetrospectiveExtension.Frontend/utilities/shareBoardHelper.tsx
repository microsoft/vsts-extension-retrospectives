import { IFeedbackItemDocument, IFeedbackBoardDocument, IFeedbackColumn } from "../interfaces/feedback";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { itemDataService } from "../dal/itemDataService";

class ShareBoardHelper {
  /**
   * Builds an email message which lists the given board's
   * feedback and work items.
   */
  public generateEmailText = async (board: IFeedbackBoardDocument, boardUrl: string, sendEmail: boolean): Promise<string> => {
    const feedbackItems: IFeedbackItemDocument[] = await itemDataService.getFeedbackItemsForBoard(board.id);
    let emailBody: string = `Retrospectives Summary\n\nRetrospective: ${board.title}\n`;

    emailBody += await this.getFeedbackBody(feedbackItems, board.columns);
    emailBody += "\n" + await this.getActionItemsBody(feedbackItems);
    emailBody += "\n\nLink to retrospective:\n" + boardUrl + " \n\n";

    if (sendEmail) {
      window.open(`mailto:?subject=Retrospectives Summary for ${board.title}&body=${encodeURIComponent(emailBody)}`);
    }

    return emailBody;
  }

  private async getFeedbackBody(feedbackItems: IFeedbackItemDocument[], columns: IFeedbackColumn[]): Promise<string> {
    const columnContent: { [columnId: string]: string } = {};

    for (const feedbackItem of feedbackItems) {
      if (feedbackItem.parentFeedbackItemId) {
        continue;
      }

      if (!(feedbackItem.columnId in columnContent)) {
        columnContent[feedbackItem.columnId] = "";
      }

      columnContent[feedbackItem.columnId] += ` - ${feedbackItem.title} [${feedbackItem.upvotes.toString()} votes]\n`;

      if (feedbackItem.childFeedbackItemIds && feedbackItem.childFeedbackItemIds.length) {
        // Remove child feedback item that does not exist. This non-existent child feedback item sometimes occurs due to race conditions.
        const childFeedbackItems: IFeedbackItemDocument[] = feedbackItem.childFeedbackItemIds
          .map((childId) => feedbackItems.find(f => f.id === childId))
          .filter((childFeedbackItem) => childFeedbackItem);

        if (childFeedbackItems.length) {
          columnContent[feedbackItem.columnId] += `\t- Grouped feedback items:\n`;
          for (const childId of feedbackItem.childFeedbackItemIds) {
            const child: IFeedbackItemDocument = feedbackItems.find(f => f.id === childId);
            if (child) {
              columnContent[feedbackItem.columnId] += `\t  - ${child.title} [${child.upvotes.toString()} votes]\n`;
            }
          }
        }
      }
    }

    let emailBody: string = '';
    for (const column of columns) {
      if (!columnContent[column.id]) {
        columnContent[column.id] = " - No items\n"
      }

      emailBody += `\n${column.title}:\n${columnContent[column.id]}`;
    }

    return emailBody;
  }

  private async getActionItemsBody(feedbackItems: IFeedbackItemDocument[]): Promise<string> {
    const allActionItems: string[] = [];

    for (const feedbackItem of feedbackItems) {
      if (feedbackItem.associatedActionItemIds && feedbackItem.associatedActionItemIds.length > 0) {
        const workItems = await workItemService.getWorkItemsByIds(feedbackItem.associatedActionItemIds);
        for (const item of workItems) {
          // Format work items into "- Task name [Task type #TaskId]: url"
          const actionItemString = `${item.fields["System.Title"]} [${item.fields["System.WorkItemType"]} #${item.id}]: ${item._links["html"]["href"]}`;
          allActionItems.push(actionItemString);
        }
      }
    }

    let actionItemsBody: string = "Work items:\n";
    if (allActionItems && allActionItems.length > 0) {
      for (const actionItem of allActionItems) {
        actionItemsBody += ` - ${actionItem}\n`;
      }
    }
    else {
      actionItemsBody += " - No work items"
    }

    return actionItemsBody;
  }
}

export const shareBoardHelper = new ShareBoardHelper();