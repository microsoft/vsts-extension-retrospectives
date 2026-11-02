// Mock the Azure DevOps API module
jest.mock("azure-devops-extension-api/WorkItemTrackingProcessDefinitions", () => ({
  FieldType: {
    Integer: 2,
  },
  WorkItemTypeClass: {
    Custom: "custom",
  },
}));

import { feedbackType, upvotes, retrospectiveWorkItemTypeModel, feedbackPickList, ExceptionCode, InitialRetrospectiveState } from "../retrospectiveWorkItemType";

describe("retrospectiveWorkItemType", () => {
  describe("feedbackType field", () => {
    it("should have correct name", () => {
      expect(feedbackType.name).toBe("Feedback Type");
    });

    it("should have correct description", () => {
      expect(feedbackType.description).toBe("The type of feedback.");
    });

    it("should have type value of 1", () => {
      expect(feedbackType.type).toBe(1);
    });

    it("should have null id", () => {
      expect(feedbackType.id).toBeNull();
    });

    it("should have null pickList", () => {
      expect(feedbackType.pickList).toBeNull();
    });

    it("should have null url", () => {
      expect(feedbackType.url).toBeNull();
    });
  });

  describe("upvotes field", () => {
    it("should have correct name", () => {
      expect(upvotes.name).toBe("Upvotes");
    });

    it("should have correct description", () => {
      expect(upvotes.description).toBe("Upvote count");
    });

    it("should have Integer type", () => {
      expect(upvotes.type).toBe(2); // FieldType.Integer
    });

    it("should have null id", () => {
      expect(upvotes.id).toBeNull();
    });

    it("should have null pickList", () => {
      expect(upvotes.pickList).toBeNull();
    });

    it("should have null url", () => {
      expect(upvotes.url).toBeNull();
    });
  });

  describe("retrospectiveWorkItemTypeModel", () => {
    it("should have correct name", () => {
      expect(retrospectiveWorkItemTypeModel.name).toBe("Retrospective");
    });

    it("should have correct description", () => {
      expect(retrospectiveWorkItemTypeModel.description).toBe("Tracks retrospective feedback.");
    });

    it("should have Custom class", () => {
      expect(retrospectiveWorkItemTypeModel.class).toBe("custom"); // WorkItemTypeClass.Custom
    });

    it("should have correct color", () => {
      expect(retrospectiveWorkItemTypeModel.color).toBe("60af49");
    });

    it("should have correct icon", () => {
      expect(retrospectiveWorkItemTypeModel.icon).toBe("icon_chat_bubble");
    });

    it("should have empty behaviors array", () => {
      expect(retrospectiveWorkItemTypeModel.behaviors).toEqual([]);
    });

    it("should have empty states array", () => {
      expect(retrospectiveWorkItemTypeModel.states).toEqual([]);
    });

    it("should not be disabled", () => {
      expect(retrospectiveWorkItemTypeModel.isDisabled).toBe(false);
    });

    it("should have null id", () => {
      expect(retrospectiveWorkItemTypeModel.id).toBeNull();
    });

    it("should have null inherits", () => {
      expect(retrospectiveWorkItemTypeModel.inherits).toBeNull();
    });

    it("should have null layout", () => {
      expect(retrospectiveWorkItemTypeModel.layout).toBeNull();
    });

    it("should have null url", () => {
      expect(retrospectiveWorkItemTypeModel.url).toBeNull();
    });
  });

  describe("feedbackPickList", () => {
    it("should have correct name", () => {
      expect(feedbackPickList.name).toBe("picklist_3afce441-2c57-4572-860a-8cf9b942c022");
    });

    it("should have String type", () => {
      expect(feedbackPickList.type).toBe("String");
    });

    it("should not be suggested", () => {
      expect(feedbackPickList.isSuggested).toBe(false);
    });

    it("should have null id", () => {
      expect(feedbackPickList.id).toBeNull();
    });

    it("should have null url", () => {
      expect(feedbackPickList.url).toBeNull();
    });

    it("should have 3 items", () => {
      expect(feedbackPickList.items).toHaveLength(3);
    });

    it("should have Negative item", () => {
      const negativeItem = feedbackPickList.items.find(item => item.value === "Negative");
      expect(negativeItem).toBeDefined();
      expect(negativeItem?.id).toBeNull();
    });

    it("should have Neutral item", () => {
      const neutralItem = feedbackPickList.items.find(item => item.value === "Neutral");
      expect(neutralItem).toBeDefined();
      expect(neutralItem?.id).toBeNull();
    });

    it("should have Positive item", () => {
      const positiveItem = feedbackPickList.items.find(item => item.value === "Positive");
      expect(positiveItem).toBeDefined();
      expect(positiveItem?.id).toBeNull();
    });

    it("should have items in correct order", () => {
      expect(feedbackPickList.items[0].value).toBe("Negative");
      expect(feedbackPickList.items[1].value).toBe("Neutral");
      expect(feedbackPickList.items[2].value).toBe("Positive");
    });
  });

  describe("ExceptionCode enum", () => {
    it("should have Unexpected value as 0", () => {
      expect(ExceptionCode.Unexpected).toBe(0);
    });

    it("should have NotInheritedProcess value as 1", () => {
      expect(ExceptionCode.NotInheritedProcess).toBe(1);
    });
  });

  describe("InitialRetrospectiveState interface", () => {
    it("should allow creating state with all optional properties", () => {
      const state: InitialRetrospectiveState = {
        displayBoard: true,
        isInheritedProcess: true,
        retrospectiveWorkItemType: retrospectiveWorkItemTypeModel,
        exceptionCode: ExceptionCode.Unexpected,
      };

      expect(state.displayBoard).toBe(true);
      expect(state.isInheritedProcess).toBe(true);
      expect(state.retrospectiveWorkItemType).toBe(retrospectiveWorkItemTypeModel);
      expect(state.exceptionCode).toBe(ExceptionCode.Unexpected);
    });

    it("should allow creating state without optional properties", () => {
      const state: InitialRetrospectiveState = {
        displayBoard: false,
        isInheritedProcess: false,
      };

      expect(state.displayBoard).toBe(false);
      expect(state.isInheritedProcess).toBe(false);
      expect(state.retrospectiveWorkItemType).toBeUndefined();
      expect(state.exceptionCode).toBeUndefined();
    });
  });
});
