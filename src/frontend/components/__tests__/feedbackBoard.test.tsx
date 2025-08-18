import React from "react";
import { IFeedbackBoardDocument } from "../../interfaces/feedback";
import { shallow } from "enzyme";
import { mocked } from "jest-mock";
import FeedbackBoard, { FeedbackBoardProps } from "../../components/feedbackBoard";
import { testColumnProps } from "../__mocks__/mocked_components/mockedFeedbackColumn";
import { IdentityRef } from "azure-devops-extension-api/WebApi";

jest.mock("../feedbackBoardMetadataForm", () => mocked({}));

jest.mock("azure-devops-extension-api/Work/WorkClient", () => {
  const getTeamIterationsMock = () => {
    return [
      mocked({
        attributes: mocked({
          finishDate: new Date(),
          startDate: new Date(),
          timeFrame: 1,
        }),
        id: "iterationId",
        name: "iteration name",
        path: "default path",
        _links: [],
        url: "https://teamfieldvaluesurl",
      }),
    ];
  };

  const getTeamFieldValuesMock = () => {
    return [
      mocked({
        defaultValue: "default field value",
        field: mocked({
          referenceName: "default reference name",
          url: "https://fieldurl",
        }),
        values: [
          mocked({
            includeChildren: false,
            value: "default team field value",
          }),
        ],
        links: [],
        url: "https://teamfieldvaluesurl",
      }),
    ];
  };

  const workRestClientMock = jest.fn().mockImplementation(() => ({
    getTeamIterations: getTeamIterationsMock,
    getTeamFieldValues: getTeamFieldValuesMock,
  }));

  return { WorkRestClient: workRestClientMock };
});

jest.mock("azure-devops-extension-api/Common", () => ({
  getClient: () => ({
    getIdentities: jest.fn().mockResolvedValue([]),
    getUserInfo: jest.fn().mockResolvedValue({ displayName: "Mock User" }),
  }),
}));

const mockedIdentity: IdentityRef = {
  directoryAlias: "",
  id: "",
  imageUrl: "",
  inactive: false,
  isAadIdentity: false,
  isContainer: false,
  isDeletedInOrigin: false,
  profileUrl: "",
  uniqueName: "",
  _links: undefined,
  descriptor: "",
  displayName: "",
  url: "",
};

const mockedBoard: IFeedbackBoardDocument = {
  id: testColumnProps.boardId,
  title: testColumnProps.boardTitle,
  teamId: testColumnProps.team.id,
  createdBy: mockedIdentity,
  createdDate: new Date(),
  columns: testColumnProps.columnIds.map(columnId => testColumnProps.columns[columnId].columnProperties),
  activePhase: "Vote",
  maxVotesPerUser: 5,
  boardVoteCollection: {},
  teamEffectivenessMeasurementVoteCollection: [],
};

const mockedProps: FeedbackBoardProps = {
  displayBoard: true,
  board: mockedBoard,
  team: testColumnProps.team,
  workflowPhase: "Vote",
  nonHiddenWorkItemTypes: testColumnProps.nonHiddenWorkItemTypes,
  allWorkItemTypes: testColumnProps.allWorkItemTypes,
  isAnonymous: testColumnProps.isBoardAnonymous,
  hideFeedbackItems: testColumnProps.hideFeedbackItems,
  isCarouselDialogHidden: false,
  hideCarouselDialog: jest.fn(() => {}),
  userId: "",
};

it(`can be rendered`, () => {
  const wrapper = shallow(<FeedbackBoard {...mockedProps} />);
  const component = wrapper.children().dive();
  expect(component.prop("className")).toBe("feedback-board");
});

it(`shows correct vote counts`, () => {
  const wrapper = shallow(<FeedbackBoard {...mockedProps} />);
  const component = wrapper.children().dive();
  expect(component.findWhere(child => child.prop("className") === "feedback-maxvotes-per-user").text()).toBe("Votes Used: 0 / 5");
});
