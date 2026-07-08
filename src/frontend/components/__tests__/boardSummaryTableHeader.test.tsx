import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BoardSummaryTableHeader from "../boardSummaryTableHeader";
import type { ISimpleColumn } from "../boardSummaryTable";

const mockColumns: ISimpleColumn[] = [
  {
    id: "expand",
    header: null,
    cell: () => <button>Expand</button>,
    sortable: false,
  },
  {
    id: "boardName",
    header: "Retrospective Name",
    accessor: "boardName",
    cell: (item: any) => item.boardName,
    sortable: true,
  },
  {
    id: "createdDate",
    header: "Created Date",
    accessor: "createdDate",
    cell: (item: any) => new Date(item.createdDate).toLocaleDateString(),
    sortable: true,
  },
];

describe("BoardSummaryTableHeader", () => {
  it("renders table headers correctly", () => {
    const onSort = jest.fn();
    const { container } = render(
      <table>
        <BoardSummaryTableHeader columns={mockColumns} sortColumn="boardName" sortDirection="asc" onSort={onSort} />
      </table>,
    );
    expect(container.querySelectorAll("thead")).toHaveLength(1);
    expect(container.querySelectorAll("tr")).toHaveLength(1);
    expect(container.querySelectorAll("th")).toHaveLength(mockColumns.length);
  });

  it("displays header text for columns with string headers", () => {
    const onSort = jest.fn();
    const { getByText } = render(
      <table>
        <BoardSummaryTableHeader columns={mockColumns} sortColumn="boardName" sortDirection="asc" onSort={onSort} />
      </table>,
    );
    expect(getByText("Retrospective Name")).toBeInTheDocument();
    expect(getByText("Created Date")).toBeInTheDocument();
  });

  it("applies ascending sort class", () => {
    const onSort = jest.fn();
    const { container } = render(
      <table>
        <BoardSummaryTableHeader columns={mockColumns} sortColumn="boardName" sortDirection="asc" onSort={onSort} />
      </table>,
    );
    const headers = container.querySelectorAll("th");
    const boardNameHeader = Array.from(headers).find(h => h.textContent === "Retrospective Name");
    expect(boardNameHeader).toHaveClass("asc");
  });

  it("renders sortable headers as buttons with visible sort icons", () => {
    const onSort = jest.fn();
    render(
      <table>
        <BoardSummaryTableHeader columns={mockColumns} sortColumn="boardName" sortDirection="asc" onSort={onSort} />
      </table>,
    );

    const boardNameButton = screen.getByRole("button", { name: "Retrospective Name" });
    const createdDateButton = screen.getByRole("button", { name: "Created Date" });

    expect(boardNameButton.querySelector(".icon-chevron-up")).toBeInTheDocument();
    expect(createdDateButton.querySelector(".board-summary-sort-icon.unsorted")).toBeInTheDocument();
  });

  it("calls onSort when sortable column header is clicked", () => {
    const onSort = jest.fn();
    const { getByText } = render(
      <table>
        <BoardSummaryTableHeader columns={mockColumns} sortColumn="boardName" sortDirection="asc" onSort={onSort} />
      </table>,
    );
    const boardNameHeader = getByText("Retrospective Name");
    fireEvent.click(boardNameHeader);
    expect(onSort).toHaveBeenCalledWith("boardName");
  });
});
