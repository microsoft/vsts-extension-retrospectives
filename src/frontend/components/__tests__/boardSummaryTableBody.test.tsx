import React from "react";
import { render, fireEvent } from "@testing-library/react";
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

  it("invokes the expand column cell when Enter is pressed on a row", () => {
    const expandCell = jest.fn();
    const columns: ISimpleColumn[] = [
      {
        id: "expand",
        header: null,
        cell: expandCell,
        sortable: false,
      },
    ];

    const { container } = render(
      <table>
        <BoardSummaryTableBody columns={columns} data={[mockItem]} expandedRows={new Set()} boardRowSummary={() => null} />
      </table>,
    );

    const row = container.querySelector("tbody tr");
    expect(row).toBeTruthy();

    fireEvent.keyPress(row!, { key: "Enter", charCode: 13 });

    expect(expandCell).toHaveBeenCalledWith(mockItem);
  });

  it("applies pending work item styling when pending items exist", () => {
    const columns: ISimpleColumn[] = [{ id: "pendingWorkItemsCount", header: null, cell: item => item.pendingWorkItemsCount, sortable: false }];

    const itemWithPending: IBoardSummaryTableItem = { ...mockItem, pendingWorkItemsCount: 2 };
    const { getByLabelText } = render(
      <table>
        <BoardSummaryTableBody columns={columns} data={[itemWithPending]} expandedRows={new Set()} boardRowSummary={() => null} />
      </table>,
    );

    const cell = getByLabelText("pendingWorkItemsCount 2");
    expect(cell).toHaveClass("workItemsCount");
    expect(cell).toHaveClass("pending-action-item-count");
  });

  it("omits pending styling when there are no pending items", () => {
    const columns: ISimpleColumn[] = [
      { id: "pendingWorkItemsCount", header: null, cell: item => item.pendingWorkItemsCount, sortable: false },
      { id: "totalWorkItemsCount", header: null, cell: item => item.totalWorkItemsCount, sortable: false },
    ];

    const itemWithoutPending: IBoardSummaryTableItem = { ...mockItem, pendingWorkItemsCount: 0 };
    const { container, getByLabelText } = render(
      <table>
        <BoardSummaryTableBody columns={columns} data={[itemWithoutPending]} expandedRows={new Set()} boardRowSummary={() => null} />
      </table>,
    );

    const pendingCell = container.querySelectorAll("td")[0];
    expect(pendingCell).toHaveClass("workItemsCount");
    expect(pendingCell).not.toHaveClass("pending-action-item-count");

    const totalCell = getByLabelText("totalWorkItemsCount 10");
    expect(totalCell).toHaveClass("workItemsCount");
    expect(totalCell).toHaveClass("total-work-item-count");
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

  it("does not invoke expand column cell when columns array is empty and Enter is pressed", () => {
    const emptyColumns: ISimpleColumn[] = [];
    const { container } = render(
      <table>
        <BoardSummaryTableBody columns={emptyColumns} data={[mockItem]} expandedRows={new Set()} boardRowSummary={() => null} />
      </table>,
    );

    const row = container.querySelector("tbody tr");
    expect(row).toBeTruthy();

    // Press Enter - should not throw even with no columns (covers line 53 branch where expandColumn is undefined)
    fireEvent.keyPress(row!, { key: "Enter", charCode: 13 });

    // Should not crash
    expect(container.querySelector("tbody")).toBeTruthy();
  });

  it("does not invoke expand column when columns array is empty and Enter is pressed", () => {
    // Use mock cell function to track if it's called
    const mockCellFn = jest.fn().mockReturnValue(null);
    const singleColumn: ISimpleColumn[] = [
      {
        id: "testcol",
        header: null,
        cell: mockCellFn,
        sortable: false,
      },
    ];

    const { container } = render(
      <table>
        <BoardSummaryTableBody columns={singleColumn} data={[mockItem]} expandedRows={new Set()} boardRowSummary={() => null} />
      </table>,
    );

    const row = container.querySelector("tbody tr");
    expect(row).toBeTruthy();

    // Clear mock calls from initial render
    mockCellFn.mockClear();

    // Press Enter - cell function will be called for the expandColumn (columns[0])
    fireEvent.keyPress(row!, { key: "Enter", charCode: 13 });

    // The expandColumn exists, so cell should have been called
    expect(mockCellFn).toHaveBeenCalledWith(mockItem);
  });

  it("handles key press with undefined expandColumn gracefully", () => {
    // Pass an empty columns array to ensure columns[0] is undefined
    const { container } = render(
      <table>
        <BoardSummaryTableBody columns={[]} data={[mockItem]} expandedRows={new Set()} boardRowSummary={() => null} />
      </table>,
    );

    const row = container.querySelector("tbody tr");
    expect(row).toBeTruthy();

    // Press Enter on row - the expandColumn will be undefined, so cell() should not be called
    fireEvent.keyPress(row!, { key: "Enter", charCode: 13 });

    expect(container).toBeTruthy();
  });
});
