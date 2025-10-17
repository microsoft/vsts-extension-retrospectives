import { WorkflowPhase, FeedbackType, RelationshipType, WorkItemGroup, WorkItemExtended, IRetrospectiveItemCreate, IRetrospectiveItemsQuery } from "../workItem";

describe("workItem interfaces and enums", () => {
  describe("FeedbackType enum", () => {
    it("should have Neutral value", () => {
      expect(FeedbackType.Neutral).toBe("Neutral");
    });

    it("should have Positive value", () => {
      expect(FeedbackType.Positive).toBe("Positive");
    });

    it("should have Negative value", () => {
      expect(FeedbackType.Negative).toBe("Negative");
    });
  });

  describe("RelationshipType enum", () => {
    it("should have ReferencedByForward value", () => {
      expect(RelationshipType.ReferencedByForward).toBe("Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Forward");
    });

    it("should have ReferencedByReverse value", () => {
      expect(RelationshipType.ReferencedByReverse).toBe("Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Reverse");
    });

    it("should have Related value", () => {
      expect(RelationshipType.Related).toBe("System.LinkTypes.Related");
    });
  });

  describe("WorkflowPhase", () => {
    it("should have Collect getter", () => {
      expect(WorkflowPhase.Collect).toBe("Collect");
    });

    it("should have Group getter", () => {
      expect(WorkflowPhase.Group).toBe("Group");
    });

    it("should have Vote getter", () => {
      expect(WorkflowPhase.Vote).toBe("Vote");
    });

    it("should have Discuss getter", () => {
      expect(WorkflowPhase.Discuss).toBe("Discuss");
    });

    it("should have Act getter", () => {
      expect(WorkflowPhase.Act).toBe("Act");
    });

    describe("getState method", () => {
      it("should return Collect for 'Collect' string", () => {
        expect(WorkflowPhase.getState("Collect")).toBe("Collect");
      });

      it("should return Group for 'Group' string", () => {
        expect(WorkflowPhase.getState("Group")).toBe("Group");
      });

      it("should return Vote for 'Vote' string", () => {
        expect(WorkflowPhase.getState("Vote")).toBe("Vote");
      });

      it("should return Discuss for 'Discuss' string", () => {
        expect(WorkflowPhase.getState("Discuss")).toBe("Discuss");
      });

      it("should return Act for 'Act' string", () => {
        expect(WorkflowPhase.getState("Act")).toBe("Act");
      });

      it("should return undefined for invalid string", () => {
        expect(WorkflowPhase.getState("Invalid")).toBeUndefined();
      });

      it("should return undefined for empty string", () => {
        expect(WorkflowPhase.getState("")).toBeUndefined();
      });

      it("should return undefined for lowercase string", () => {
        expect(WorkflowPhase.getState("collect")).toBeUndefined();
      });

      it("should return undefined for partial match", () => {
        expect(WorkflowPhase.getState("Col")).toBeUndefined();
      });
    });
  });

  describe("WorkItemGroup interface", () => {
    it("should create a valid WorkItemGroup object", () => {
      const workItemGroup: WorkItemGroup = {
        name: "Test Group",
        feedbackType: FeedbackType.Positive,
        iconName: "test-icon",
        workItems: [],
      };

      expect(workItemGroup.name).toBe("Test Group");
      expect(workItemGroup.feedbackType).toBe(FeedbackType.Positive);
      expect(workItemGroup.iconName).toBe("test-icon");
      expect(workItemGroup.workItems).toEqual([]);
    });
  });

  describe("WorkItemExtended interface", () => {
    it("should create a valid WorkItemExtended object", () => {
      const mockWorkItem = {
        id: 123,
        fields: {
          "System.Title": "Test Item",
        },
      } as any;

      const workItemExtended: WorkItemExtended = {
        iconName: "test-icon",
        workItem: mockWorkItem,
        upvotes: 5,
        isLinkedForGroup: true,
        isParentForGroup: false,
      };

      expect(workItemExtended.iconName).toBe("test-icon");
      expect(workItemExtended.workItem).toEqual(mockWorkItem);
      expect(workItemExtended.upvotes).toBe(5);
      expect(workItemExtended.isLinkedForGroup).toBe(true);
      expect(workItemExtended.isParentForGroup).toBe(false);
    });
  });

  describe("IRetrospectiveItemCreate interface", () => {
    it("should create a valid IRetrospectiveItemCreate object", () => {
      const item: IRetrospectiveItemCreate = {
        title: "Test Retrospective Item",
        feedbackType: FeedbackType.Negative,
        iteration: "Sprint 1",
        areaPath: "Project\\Team",
        isAnonymous: true,
      };

      expect(item.title).toBe("Test Retrospective Item");
      expect(item.feedbackType).toBe(FeedbackType.Negative);
      expect(item.iteration).toBe("Sprint 1");
      expect(item.areaPath).toBe("Project\\Team");
      expect(item.isAnonymous).toBe(true);
    });
  });

  describe("IRetrospectiveItemsQuery interface", () => {
    it("should create a valid IRetrospectiveItemsQuery object", () => {
      const query: IRetrospectiveItemsQuery = {
        feedbackType: FeedbackType.Neutral,
        iteration: "Sprint 2",
        areaPath: "Project\\Team\\SubTeam",
      };

      expect(query.feedbackType).toBe(FeedbackType.Neutral);
      expect(query.iteration).toBe("Sprint 2");
      expect(query.areaPath).toBe("Project\\Team\\SubTeam");
    });
  });

  describe("Type compatibility", () => {
    it("should allow WorkflowPhase type assignment from getter", () => {
      const phase: WorkflowPhase = WorkflowPhase.Collect;
      expect(phase).toBe("Collect");
    });

    it("should allow WorkflowPhase type assignment from string literal", () => {
      const phase: WorkflowPhase = "Vote";
      expect(phase).toBe("Vote");
    });

    it("should allow WorkflowPhase type assignment from getState", () => {
      const phase: WorkflowPhase = WorkflowPhase.getState("Discuss");
      expect(phase).toBe("Discuss");
    });
  });

  describe("Edge cases", () => {
    it("should handle WorkItemGroup with multiple work items", () => {
      const workItems: WorkItemExtended[] = [
        {
          iconName: "icon1",
          workItem: { id: 1 } as any,
          upvotes: 3,
          isLinkedForGroup: true,
          isParentForGroup: false,
        },
        {
          iconName: "icon2",
          workItem: { id: 2 } as any,
          upvotes: 7,
          isLinkedForGroup: false,
          isParentForGroup: true,
        },
      ];

      const workItemGroup: WorkItemGroup = {
        name: "Multiple Items",
        feedbackType: FeedbackType.Positive,
        iconName: "group-icon",
        workItems,
      };

      expect(workItemGroup.workItems).toHaveLength(2);
      expect(workItemGroup.workItems[0].upvotes).toBe(3);
      expect(workItemGroup.workItems[1].upvotes).toBe(7);
    });

    it("should handle IRetrospectiveItemCreate with special characters", () => {
      const item: IRetrospectiveItemCreate = {
        title: "Test with 'quotes' and \"double quotes\"",
        feedbackType: FeedbackType.Positive,
        iteration: "Sprint 1 - Q4 2025",
        areaPath: "Project\\Team\\Sub-Team",
        isAnonymous: false,
      };

      expect(item.title).toContain("'quotes'");
      expect(item.areaPath).toContain("\\");
    });

    it("should handle empty strings in IRetrospectiveItemsQuery", () => {
      const query: IRetrospectiveItemsQuery = {
        feedbackType: FeedbackType.Neutral,
        iteration: "",
        areaPath: "",
      };

      expect(query.iteration).toBe("");
      expect(query.areaPath).toBe("");
    });
  });
});
