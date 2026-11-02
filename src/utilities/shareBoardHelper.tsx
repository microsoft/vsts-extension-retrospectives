import { IFeedbackItemDocument, IFeedbackBoardDocument, IFeedbackColumn } from "../interfaces/feedback";
import { workItemService } from "../dal/azureDevOpsWorkItemService";
import { itemDataService } from "../dal/itemDataService";
import { getBoardUrl } from "../utilities/boardUrlHelper";

// Native browser download function to replace file-saver
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

class ShareBoardHelper {
  private compareFeedbackItemsByVotesAndDate(itemA: IFeedbackItemDocument, itemB: IFeedbackItemDocument): number {
    if (itemB.upvotes !== itemA.upvotes) {
      return itemB.upvotes - itemA.upvotes;
    }

    const itemADate: number = itemA.createdDate ? new Date(itemA.createdDate).getTime() : 0;
    const itemBDate: number = itemB.createdDate ? new Date(itemB.createdDate).getTime() : 0;
    return itemBDate - itemADate;
  }

  private getSortedParentFeedbackItems(feedbackItems: IFeedbackItemDocument[]): IFeedbackItemDocument[] {
    return feedbackItems.filter(item => !item.parentFeedbackItemId).sort((itemA, itemB) => this.compareFeedbackItemsByVotesAndDate(itemA, itemB));
  }

  private getSortedChildFeedbackItems(parentFeedbackItem: IFeedbackItemDocument, feedbackItems: IFeedbackItemDocument[]): IFeedbackItemDocument[] {
    if (!parentFeedbackItem.childFeedbackItemIds?.length) {
      return [];
    }

    return parentFeedbackItem.childFeedbackItemIds.map(childId => feedbackItems.find(feedbackItem => feedbackItem.id === childId)).filter(childFeedbackItem => childFeedbackItem).sort((itemA, itemB) => this.compareFeedbackItemsByVotesAndDate(itemA, itemB));
  }

  // Builds CSV content which lists the given board's feedback and work items
  public generateCSVContent = async (board: IFeedbackBoardDocument) => {
    const feedbackItems: IFeedbackItemDocument[] = await itemDataService.getFeedbackItemsForBoard(board.id);
    const boardUrl = await getBoardUrl(board.teamId, board.id, board.activePhase);

    /* eslint-disable  no-useless-escape */
    let content: string = `\"Retrospectives Summary for '${board.title}' (${boardUrl})\"\n`;
    content += "\n\nFeedback Items\nType,Description,Votes,CreatedDate,CreatedBy\n";

    const contentList: { type: string; description: string; votes: number; createdDate: Date; createdBy: string }[] = [];
    const sortedParentFeedbackItems: IFeedbackItemDocument[] = this.getSortedParentFeedbackItems(feedbackItems);

    for (const feedbackItem of sortedParentFeedbackItems) {
      const columnTitle: string = board.columns.find(e => e.id === feedbackItem.columnId).title;

      contentList.push({
        type: columnTitle,
        description: feedbackItem.title,
        votes: feedbackItem.upvotes,
        createdDate: feedbackItem.createdDate,
        createdBy: feedbackItem.createdBy?.displayName,
      });

      for (const childFeedbackItem of this.getSortedChildFeedbackItems(feedbackItem, feedbackItems)) {
        contentList.push({
          type: columnTitle,
          description: childFeedbackItem.title,
          votes: childFeedbackItem.upvotes,
          createdDate: childFeedbackItem.createdDate,
          createdBy: childFeedbackItem.createdBy?.displayName,
        });
      }
    }

    contentList.forEach(item => {
      content += `\"${item.type}\",\"${item.description}\",${item.votes},${item.createdDate},\"${item.createdBy}\"\n`;
    });

    content += `\n\nWork Items\nFeedback Description,Work Item Title,Work Item Type,Work Item Id,Url\n`;

    for (const feedbackItem of feedbackItems) {
      if (feedbackItem.associatedActionItemIds && feedbackItem.associatedActionItemIds.length > 0) {
        const workItems = await workItemService.getWorkItemsByIds(feedbackItem.associatedActionItemIds);

        for (const item of workItems) {
          content += `\"${feedbackItem.title}\",\"${item.fields["System.Title"]}\",${item.fields["System.WorkItemType"]},${item.id},${item._links["html"]["href"]}\n`;
        }
      }
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    downloadFile(blob, "retro.csv");
  };

  public generateEmailText = async (board: IFeedbackBoardDocument, boardUrl: string, sendEmail: boolean): Promise<string> => {
    const feedbackItems: IFeedbackItemDocument[] = await itemDataService.getFeedbackItemsForBoard(board.id);
    let emailBody: string = `Retrospectives Summary\n\nRetrospective: ${board.title}\n`;

    emailBody += await this.getFeedbackBody(feedbackItems, board.columns);
    emailBody += "\n" + (await this.getActionItemsBody(feedbackItems));
    emailBody += "\n\nLink to retrospective:\n" + boardUrl;

    if (sendEmail) {
      window.open(`mailto:?subject=Retrospectives Summary for ${board.title}&body=${encodeURIComponent(emailBody)}`);
    }

    return emailBody;
  };

  private async getFeedbackBody(feedbackItems: IFeedbackItemDocument[], columns: IFeedbackColumn[]): Promise<string> {
    const columnContent: { [columnId: string]: string } = {};

    for (const feedbackItem of this.getSortedParentFeedbackItems(feedbackItems)) {
      if (!(feedbackItem.columnId in columnContent)) {
        columnContent[feedbackItem.columnId] = "";
      }

      columnContent[feedbackItem.columnId] += ` - ${feedbackItem.title} [${feedbackItem.upvotes.toString()} votes]\n`;

      const childFeedbackItems: IFeedbackItemDocument[] = this.getSortedChildFeedbackItems(feedbackItem, feedbackItems);
      if (childFeedbackItems.length) {
        columnContent[feedbackItem.columnId] += `\t- Grouped feedback items:\n`;
        for (const childFeedbackItem of childFeedbackItems) {
          columnContent[feedbackItem.columnId] += `\t\t- ${childFeedbackItem.title} [${childFeedbackItem.upvotes.toString()} votes]\n`;
        }
      }
    }

    let emailBody: string = "";
    for (const column of columns) {
      if (!columnContent[column.id]) {
        columnContent[column.id] = " - No items\n";
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
    } else {
      actionItemsBody += " - No work items";
    }

    return actionItemsBody;
  }
}

export const shareBoardHelper = new ShareBoardHelper();
