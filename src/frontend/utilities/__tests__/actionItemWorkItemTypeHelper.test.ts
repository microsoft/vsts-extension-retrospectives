import { WorkItemType } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { getActionItemWorkItemTypes } from "../actionItemWorkItemTypeHelper";

const workItemType = (name: string): WorkItemType =>
  ({
    name,
    referenceName: name,
    icon: { url: `${name}.png` },
  }) as WorkItemType;

describe("getActionItemWorkItemTypes", () => {
  const availableWorkItemTypes = [workItemType("Bug"), workItemType("Task"), workItemType("User Story"), workItemType("Feature")];

  it("uses requirement backlog work item types by default", () => {
    const result = getActionItemWorkItemTypes(availableWorkItemTypes, ["Bug", "User Story"], []);

    expect(result.map(type => type.name)).toEqual(["Bug", "User Story"]);
  });

  it("uses selected work item types when configuration has selections", () => {
    const result = getActionItemWorkItemTypes(availableWorkItemTypes, ["Bug", "User Story"], ["Task", "Feature"]);

    expect(result.map(type => type.name)).toEqual(["Task", "Feature"]);
  });

  it("keeps the add menu usable when no requirement backlog types are available", () => {
    const result = getActionItemWorkItemTypes(availableWorkItemTypes, [], []);

    expect(result.map(type => type.name)).toEqual(["Bug", "Task", "User Story", "Feature"]);
  });

  it("handles large work item type lists", () => {
    const manyWorkItemTypes = Array.from({ length: 75 }, (_, index) => workItemType(`Custom Type ${index}`));
    const selectedNames = ["Custom Type 3", "Custom Type 44", "Custom Type 72"];

    const result = getActionItemWorkItemTypes(manyWorkItemTypes, [], selectedNames);

    expect(result.map(type => type.name)).toEqual(selectedNames);
  });
});
