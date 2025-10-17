import { ExceptionCode, InitialRetrospectiveState } from "../retrospectiveState";
import { WorkItemTypeModel } from "azure-devops-extension-api/WorkItemTrackingProcessDefinitions";

describe("retrospectiveState", () => {
  describe("ExceptionCode enum", () => {
    it("should have Unexpected value as 0", () => {
      expect(ExceptionCode.Unexpected).toBe(0);
    });

    it("should have NotInheritedProcess value as 1", () => {
      expect(ExceptionCode.NotInheritedProcess).toBe(1);
    });

    it("should have exactly 2 values", () => {
      const values = Object.values(ExceptionCode).filter(v => typeof v === "number");
      expect(values).toHaveLength(2);
    });

    it("should map string keys to numeric values", () => {
      expect(ExceptionCode["Unexpected"]).toBe(0);
      expect(ExceptionCode["NotInheritedProcess"]).toBe(1);
    });

    it("should have correct reverse mapping", () => {
      expect(ExceptionCode[0]).toBe("Unexpected");
      expect(ExceptionCode[1]).toBe("NotInheritedProcess");
    });
  });

  describe("InitialRetrospectiveState interface", () => {
    it("should allow creating a state with displayBoard true", () => {
      const state: InitialRetrospectiveState = {
        displayBoard: true,
        isInheritedProcess: true,
      };
      expect(state.displayBoard).toBe(true);
      expect(state.isInheritedProcess).toBe(true);
    });

    it("should allow creating a state with displayBoard false", () => {
      const state: InitialRetrospectiveState = {
        displayBoard: false,
        isInheritedProcess: false,
      };
      expect(state.displayBoard).toBe(false);
      expect(state.isInheritedProcess).toBe(false);
    });

    it("should allow optional exceptionCode", () => {
      const stateWithException: InitialRetrospectiveState = {
        displayBoard: false,
        exceptionCode: ExceptionCode.NotInheritedProcess,
        isInheritedProcess: false,
      };
      expect(stateWithException.exceptionCode).toBe(ExceptionCode.NotInheritedProcess);
    });

    it("should allow state without exceptionCode", () => {
      const stateWithoutException: InitialRetrospectiveState = {
        displayBoard: true,
        isInheritedProcess: true,
      };
      expect(stateWithoutException.exceptionCode).toBeUndefined();
    });

    it("should allow different ExceptionCode values", () => {
      const unexpectedState: InitialRetrospectiveState = {
        displayBoard: false,
        exceptionCode: ExceptionCode.Unexpected,
        isInheritedProcess: true,
      };
      expect(unexpectedState.exceptionCode).toBe(ExceptionCode.Unexpected);

      const notInheritedState: InitialRetrospectiveState = {
        displayBoard: false,
        exceptionCode: ExceptionCode.NotInheritedProcess,
        isInheritedProcess: false,
      };
      expect(notInheritedState.exceptionCode).toBe(ExceptionCode.NotInheritedProcess);
    });

    it("should allow optional retrospectiveWorkItemType", () => {
      const mockWorkItemType = {
        name: "Retrospective",
        referenceName: "Custom.Retrospective",
        description: "Retrospective work item type",
      } as unknown as WorkItemTypeModel;

      const state: InitialRetrospectiveState = {
        displayBoard: true,
        isInheritedProcess: true,
        retrospectiveWorkItemType: mockWorkItemType,
      };
      expect(state.retrospectiveWorkItemType).toEqual(mockWorkItemType);
    });

    it("should allow state without retrospectiveWorkItemType", () => {
      const state: InitialRetrospectiveState = {
        displayBoard: true,
        isInheritedProcess: true,
      };
      expect(state.retrospectiveWorkItemType).toBeUndefined();
    });

    it("should allow creating a complete state with all properties", () => {
      const mockWorkItemType = {
        name: "Retrospective",
        referenceName: "Custom.Retrospective",
      } as unknown as WorkItemTypeModel;

      const completeState: InitialRetrospectiveState = {
        displayBoard: true,
        exceptionCode: ExceptionCode.Unexpected,
        isInheritedProcess: true,
        retrospectiveWorkItemType: mockWorkItemType,
      };

      expect(completeState.displayBoard).toBe(true);
      expect(completeState.exceptionCode).toBe(ExceptionCode.Unexpected);
      expect(completeState.isInheritedProcess).toBe(true);
      expect(completeState.retrospectiveWorkItemType).toEqual(mockWorkItemType);
    });

    it("should handle state for error scenarios", () => {
      const errorState: InitialRetrospectiveState = {
        displayBoard: false,
        exceptionCode: ExceptionCode.NotInheritedProcess,
        isInheritedProcess: false,
      };

      expect(errorState.displayBoard).toBe(false);
      expect(errorState.exceptionCode).toBe(ExceptionCode.NotInheritedProcess);
      expect(errorState.isInheritedProcess).toBe(false);
    });

    it("should handle state for success scenarios", () => {
      const mockWorkItemType = {
        name: "Retrospective",
      } as unknown as WorkItemTypeModel;

      const successState: InitialRetrospectiveState = {
        displayBoard: true,
        isInheritedProcess: true,
        retrospectiveWorkItemType: mockWorkItemType,
      };

      expect(successState.displayBoard).toBe(true);
      expect(successState.isInheritedProcess).toBe(true);
      expect(successState.retrospectiveWorkItemType).toBeDefined();
    });
  });
});
