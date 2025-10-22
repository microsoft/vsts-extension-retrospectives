import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import BoardSummaryTableBody from "../boardSummaryTableBody";
import type { IBoardSummaryTableItem, ISimpleColumn } from "../boardSummaryTable";

const mockColumns: ISimpleColumn[] = [
  {
    id: "expand",
    header: null,
    cell: (item: IBoardSummaryTableItem) => <button>Expand {item.id}</button>,
    sortable: false,
  },
  {
    id: "boardName",
    header: "Retrospective Name",
    accessor: "boardName",
    cell: (item: IBoardSummaryTableItem) => item.boardName,
    sortable: true,
  },
  {
    id: "feedbackItemsCount",
    header: "Feedback Items",
    accessor: "feedbackItemsCount",
    cell: (item: IBoardSummaryTableItem) => item.feedbackItemsCount,
    sortable: true,
  },
];

const mockItem: IBoardSummaryTableItem = {
  id: "board-1",
  boardName: "Sprint 1 Retro",
  createdDate: new Date("2023-01-01"),
  isArchived: false,
  archivedDate: null,
  pendingWorkItemsCount: 3,
  totalWorkItemsCount: 10,
  feedbackItemsCount: 15,
  teamId: "team-1",
  ownerId: "owner-1",
};

describe("BoardSummaryTableBody", () => {
  it("renders table body with data correctly", () => {
    const mockSummary = jest.fn(() => <div>Summary</div>);
    const { container } = render(
      <table>
        <BoardSummaryTableBody columns={mockColumns} data={[mockItem]} expandedRows={new Set()} boardRowSummary={mockSummary} />
      </table>,
    );
    expect(container.querySelectorAll("tbody")).toHaveLength(1);
    expect(container.querySelectorAll("tr")).toHaveLength(1);
    expect(container.querySelectorAll("td")).toHaveLength(mockColumns.length);
  });

  it("displays cell content correctly", () => {
    const mockSummary = jest.fn(() => <div>Summary</div>);
    const { getByText } = render(
      <table>
        <BoardSummaryTableBody columns={mockColumns} data={[mockItem]} expandedRows={new Set()} boardRowSummary={mockSummary} />
      </table>,
    );
    expect(getByText("Sprint 1 Retro")).toBeInTheDocument();
    expect(getByText("15")).toBeInTheDocument();
  });

  it("renders expanded row summary when row is expanded", () => {
    const mockSummary = jest.fn(() => <div>Expanded Summary</div>);
    const expandedRows = new Set(["board-1"]);
    const { getByText } = render(
      <table>
        <BoardSummaryTableBody columns={mockColumns} data={[mockItem]} expandedRows={expandedRows} boardRowSummary={mockSummary} />
      </table>,
    );
    expect(getByText("Expanded Summary")).toBeInTheDocument();
    expect(mockSummary).toHaveBeenCalledWith(mockItem);
  });

  it("does not render expanded row when row is not expanded", () => {
    const mockSummary = jest.fn(() => <div>Expanded Summary</div>);
    const { queryByText } = render(
      <table>
        <BoardSummaryTableBody columns={mockColumns} data={[mockItem]} expandedRows={new Set()} boardRowSummary={mockSummary} />
      </table>,
    );
    expect(queryByText("Expanded Summary")).not.toBeInTheDocument();
    expect(mockSummary).not.toHaveBeenCalled();
  });

  it("handles empty data array", () => {
    const mockSummary = jest.fn(() => <div>Summary</div>);
    const { container } = render(
      <table>
        <BoardSummaryTableBody columns={mockColumns} data={[]} expandedRows={new Set()} boardRowSummary={mockSummary} />
      </table>,
    );
    expect(container.querySelectorAll("tbody")).toHaveLength(1);
    expect(container.querySelectorAll("tr")).toHaveLength(0);
  });
});
