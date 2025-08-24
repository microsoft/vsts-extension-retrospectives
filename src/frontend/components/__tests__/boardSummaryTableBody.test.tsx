import React from "react";
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom";
import BoardSummaryTableBody from "../boardSummaryTableBody";
import type { IBoardSummaryTableItem } from "../boardSummaryTable";

const mockSummary = jest.fn().mockReturnValue(<div>Mock summary</div>);

const createMockCell = (id: string, value: any): any => {
  const column = {
    id,
    columnDef: {
      id,
      accessorFn: () => value,
      cell: () => <span>{value}</span>,
    },
  };

  const cell = {
    id: `cell-${id}`,
    column: column,
    getContext: jest.fn(),
    getValue: () => value,
  };

  return cell;
};

const createMockRow = ({
  id = "row-1",
  visibleCells = [],
  isExpanded = false,
  toggleExpanded = jest.fn(),
  original = {} as IBoardSummaryTableItem,
}: {
  id?: string;
  visibleCells?: any[];
  isExpanded?: boolean;
  toggleExpanded?: () => void;
  original?: IBoardSummaryTableItem;
} = {}): any => {
  const row = {
    id,
    getVisibleCells: () => visibleCells,
    getIsExpanded: () => isExpanded,
    toggleExpanded,
    original,
  };

  visibleCells.forEach((cell: any) => {
    cell.row = row;
  });

  return row;
};

describe("BoardSummaryTableBody", () => {
  it("renders rows and their cells", () => {
    const cell1 = createMockCell("totalWorkItemsCount", 2);
    const cell2 = createMockCell("pendingWorkItemsCount", 1);
    const row = createMockRow({
      visibleCells: [cell1, cell2],
      original: {
        feedbackItemsCount: 10,
        totalWorkItemsCount: 2,
        pendingWorkItemsCount: 1,
      } as IBoardSummaryTableItem,
    });

    const { container } = render(
      <table>
        <BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />
      </table>,
    );

    expect(container.querySelectorAll("tr")).toHaveLength(1);
    expect(container.querySelectorAll("td")).toHaveLength(2);
  });

  it("applies correct classes and ARIA attributes to <td>", () => {
    const cell = createMockCell("pendingWorkItemsCount", 2);
    const row = createMockRow({
      visibleCells: [cell],
      original: {
        pendingWorkItemsCount: 2,
      } as IBoardSummaryTableItem,
    });

    const { container } = render(
      <table>
        <BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />
      </table>,
    );

    const td = container.querySelector("td");
    expect(td).toHaveClass("pending-action-item-count");
    expect(td).toHaveAttribute("aria-label", "pendingWorkItemsCount 2");
  });

  it("expands row when first cell is clicked", () => {
    const toggleExpanded = jest.fn();
    const cell = createMockCell("totalWorkItemsCount", 2);
    const row = createMockRow({
      visibleCells: [cell],
      toggleExpanded,
      original: {
        totalWorkItemsCount: 2,
        pendingWorkItemsCount: 0,
      } as IBoardSummaryTableItem,
    });

    const { container } = render(
      <table>
        <BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />
      </table>,
    );

    const tr = container.querySelector("tr")!;
    const firstTd = container.querySelector("td")!;

    Object.defineProperty(tr, "cells", {
      value: [firstTd],
      configurable: true,
    });

    firstTd.closest = jest.fn(() => firstTd);

    fireEvent.click(firstTd);

    expect(toggleExpanded).toHaveBeenCalled();
  });

  it("does not expand row when a cell other than the first is clicked", () => {
    const toggleExpanded = jest.fn();
    const cells = [createMockCell("totalWorkItemsCount", 2), createMockCell("pendingWorkItemsCount", 1)];
    const row = createMockRow({ visibleCells: cells, toggleExpanded });

    const { container } = render(
      <table>
        <BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />
      </table>,
    );

    const tr = container.querySelector("tr")!;
    const tds = container.querySelectorAll("td");
    const firstTd = tds[0];
    const secondTd = tds[1];

    Object.defineProperty(tr, "cells", {
      value: [firstTd, secondTd],
      configurable: true,
    });

    secondTd.closest = jest.fn(() => secondTd);

    fireEvent.click(secondTd);

    expect(toggleExpanded).not.toHaveBeenCalled();
  });

  it("expands row when Enter key is pressed", () => {
    const toggleExpanded = jest.fn();
    const cells = [createMockCell("totalWorkItemsCount", 2)];
    const row = createMockRow({ visibleCells: cells, toggleExpanded });

    const { container } = render(
      <table>
        <BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />
      </table>,
    );

    const tr = container.querySelector("tr")!;

    fireEvent.keyPress(tr, { key: "Enter", code: "Enter", charCode: 13 });

    expect(toggleExpanded).toHaveBeenCalled();
  });

  it("renders boardRowSummary when row is expanded", () => {
    const row = {
      id: "row1",
      getIsExpanded: () => true,
      toggleExpanded: jest.fn(),
      original: {
        id: "board1",
        boardName: "Board A",
        feedbackItemsCount: 10,
        totalWorkItemsCount: 2,
        pendingWorkItemsCount: 1,
        createdDate: new Date(),
        teamId: "team1",
        ownerId: "owner1",
      } as IBoardSummaryTableItem,
    } as any;

    const mockCells = [createMockCell("boardName", "Board A"), createMockCell("totalWorkItemsCount", 2)];

    mockCells.forEach((cell: any) => {
      cell.row = row;
    });

    (row as any).getVisibleCells = () => mockCells;

    const mockSummary = jest.fn(() => <div>Mock summary</div>);

    const { container } = render(
      <table>
        <BoardSummaryTableBody rows={[row]} boardRowSummary={mockSummary} />
      </table>,
    );

    expect(container.textContent).toContain("Mock summary");

    const trs = container.querySelectorAll("tr");
    const lastTr = trs[trs.length - 1];
    const expandedTd = lastTr.querySelector("td");
    expect(expandedTd).toHaveAttribute("colSpan", mockCells.length.toString());
  });

  it("renders nothing when rows is empty", () => {
    const { container } = render(
      <table>
        <BoardSummaryTableBody rows={[]} boardRowSummary={mockSummary} />
      </table>,
    );
    expect(container.querySelectorAll("tr")).toHaveLength(0);
  });
});
