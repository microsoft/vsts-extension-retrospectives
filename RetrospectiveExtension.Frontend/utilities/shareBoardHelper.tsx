import { IFeedbackItemDocument, IFeedbackBoardDocument, IFeedbackColumn } from "../interfaces/feedback";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { itemDataService } from "../dal/itemDataService";
import { getBoardUrl } from '../utilities/boardUrlHelper';
import { saveAs } from 'file-saver';

class ShareBoardHelper {

  // Builds CSV content which lists the given board's feedback and work items
  public generateCSVContent = async (board: IFeedbackBoardDocument) => {
    const feedbackItems: IFeedbackItemDocument[] = await itemDataService.getFeedbackItemsForBoard(board.id);
    const boardUrl = await getBoardUrl(board.teamId, board.id);

    let content: string = `Retrospectives Summary for "${board.title}" (${boardUrl})\n`;
    content += "\n\nFeedback Items\nType,Description,Votes,CreatedDate,CreatedBy\n"

    const contentList: {type: string, description: string, votes: number, createdDate: Date, createdBy: string}[] = [];

    for (const feedbackItem of feedbackItems) {
      if (feedbackItem.parentFeedbackItemId) {
        continue;
      }

      contentList.push({
        type: board.columns.find(e => e.id === feedbackItem.columnId).title,
        description: feedbackItem.title,
        votes: feedbackItem.upvotes,
        createdDate: feedbackItem.createdDate,
        createdBy: feedbackItem.createdBy?.displayName
      });

      if (feedbackItem.childFeedbackItemIds && feedbackItem.childFeedbackItemIds.length) {
        // Remove child feedback item that does not exist. This non-existent child feedback item sometimes occurs due to race conditions.
        const childFeedbackItems: IFeedbackItemDocument[] = feedbackItem.childFeedbackItemIds
          .map((childId) => feedbackItems.find(f => f.id === childId))
          .filter((childFeedbackItem) => childFeedbackItem);

        if (childFeedbackItems.length) {
          for (const childId of feedbackItem.childFeedbackItemIds) {
            const child: IFeedbackItemDocument = feedbackItems.find(f => f.id === childId);
            if (child) {
              contentList.push({
                type: board.columns.find(e => e.id === feedbackItem.columnId).title,
                description: child.title,
                votes: child.upvotes,
                createdDate: child.createdDate,
                createdBy: child.createdBy?.displayName
              });
            }
          }
        }
      }
    }

    contentList.forEach(item => {
      content += `${item.type},${item.description},${item.votes},${item.createdDate},${item.createdBy}\n`;
    });

    content += `\n\nWork Items\nFeedback Description,Work Item Title,Work Item Type,Work Item Id,Url\n`;

    for (const feedbackItem of feedbackItems) {
      if (feedbackItem.associatedActionItemIds && feedbackItem.associatedActionItemIds.length > 0) {
        const workItems = await workItemService.getWorkItemsByIds(feedbackItem.associatedActionItemIds);

        for (const item of workItems) {
          content += `${feedbackItem.title},${item.fields["System.Title"]},${item.fields["System.WorkItemType"]},${item.id},${item._links["html"]["href"]}\n`;
        }
      }
    }

    const blob = new Blob([content], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "retro.csv");
  }

  // Builds an email message which lists the given board's feedback and work items
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
              columnContent[feedbackItem.columnId] += `\t\t- ${child.title} [${child.upvotes.toString()} votes]\n`;
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
