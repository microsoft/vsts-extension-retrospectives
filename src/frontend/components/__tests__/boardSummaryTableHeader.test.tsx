import React from "react";
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom";
import BoardSummaryTableHeader from "../boardSummaryTableHeader";

const resizeHandler = jest.fn();

const mockHeader: any = {
  id: "column-1",
  isPlaceholder: false,
  depth: 1,
  headerGroup: {} as any,
  colSpan: 1,
  getSize: () => 150,
  getResizeHandler: () => resizeHandler,
  column: {
    columnDef: { header: () => <span>Board Name</span> },
    getIsSorted: () => "asc",
    getCanResize: () => true,
    getIsResizing: () => true,
    getToggleSortingHandler: jest.fn(),
  },
  getContext: () => ({}),
  getLeafHeaders: (): any[] => [],
} as any;

const mockHeaderGroup: any = {
  id: "header-group-1",
  depth: 0,
  headers: [mockHeader],
} as any;

describe("BoardSummaryTableHeader", () => {
  it("renders table headers correctly", () => {
    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />
      </table>
    );
    expect(container.querySelectorAll("thead")).toHaveLength(1);
    expect(container.querySelectorAll("tr")).toHaveLength(1);
    expect(container.querySelectorAll("th")).toHaveLength(mockHeaderGroup.headers.length);
  });

  it("applies correct sorting properties to headers", () => {
    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />
      </table>
    );
    const headerElement = container.querySelector("th")!;

    expect(headerElement).toHaveAttribute("aria-sort", "ascending");
    expect(headerElement).toHaveClass("asc");
  });

  it("applies correct sorting properties when sorting is descending", () => {
    const mockDescendingHeader = {
      ...mockHeader,
      column: {
        ...mockHeader.column,
        getIsSorted: () => "desc",
      },
    } as any;

    const mockDescendingHeaderGroup = {
      ...mockHeaderGroup,
      headers: [mockDescendingHeader],
    } as any;

    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[mockDescendingHeaderGroup]} />
      </table>
    );
    const headerElement = container.querySelector("th")!;

    expect(headerElement).toHaveAttribute("aria-sort", "descending");
    expect(headerElement).toHaveClass("desc");
  });

  it("calls sorting handler when header is clicked", () => {
    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />
      </table>
    );
    const headerElement = container.querySelector("th")!;
    fireEvent.click(headerElement);
    expect(mockHeaderGroup.headers[0].column.getToggleSortingHandler).toHaveBeenCalled();
  });

  it("renders empty <thead> when no headers exist", () => {
    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[]} />
      </table>
    );
    expect(container.querySelectorAll("thead")).toHaveLength(1);
    expect(container.querySelectorAll("th")).toHaveLength(0);
  });

  it("renders header content and resizer with correct classes", () => {
    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />
      </table>
    );
    const th = container.querySelector("th")!;

    expect(th.textContent).toContain("Board Name");

    const resizerDiv = th.querySelector("div")!;
    expect(resizerDiv).toBeInTheDocument();
    expect(resizerDiv).toHaveClass("resizer");
    expect(resizerDiv).toHaveClass("isResizing");
  });

  it("calls resize handler on mouse down and touch start", () => {
    const resizeFn = jest.fn();
    const resizableHeader = {
      ...mockHeader,
      getResizeHandler: () => resizeFn,
    } as any;

    const resizableHeaderGroup = {
      ...mockHeaderGroup,
      headers: [resizableHeader],
    } as any;

    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[resizableHeaderGroup]} />
      </table>
    );
    const resizerDiv = container.querySelector("div")!;

    fireEvent.mouseDown(resizerDiv);
    fireEvent.touchStart(resizerDiv);

    expect(resizeFn).toHaveBeenCalledTimes(2);
  });

  it("renders header content using flexRender", () => {
    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[mockHeaderGroup]} />
      </table>
    );
    expect(container.querySelector("th")!.textContent).toContain("Board Name");
  });

  it("renders resizer div with correct classes and triggers resize handlers", () => {
    const resizeFn = jest.fn();
    const resizableHeader = {
      ...mockHeader,
      getResizeHandler: () => resizeFn,
    } as any;

    const resizableHeaderGroup = {
      ...mockHeaderGroup,
      headers: [resizableHeader],
    } as any;

    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[resizableHeaderGroup]} />
      </table>
    );
    const resizerDiv = container.querySelector("div")!;

    expect(resizerDiv).toHaveClass("resizer");
    expect(resizerDiv).toHaveClass("isResizing");

    fireEvent.mouseDown(resizerDiv);
    fireEvent.touchStart(resizerDiv);

    expect(resizeFn).toHaveBeenCalledTimes(2);
  });

  it("renders placeholder header without content", () => {
    const placeholderHeader = {
      ...mockHeader,
      isPlaceholder: true,
    } as any;

    const placeholderHeaderGroup = {
      ...mockHeaderGroup,
      headers: [placeholderHeader],
    } as any;

    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[placeholderHeaderGroup]} />
      </table>
    );
    const th = container.querySelector("th")!;

    expect(th.textContent).not.toContain("Board Name");
    expect(th.querySelectorAll("span")).toHaveLength(0);
  });

  it("renders resizer div without resizer class when column cannot resize", () => {
    const nonResizableHeader = {
      ...mockHeader,
      column: {
        ...mockHeader.column,
        getCanResize: () => false,
        getIsResizing: () => false,
      },
    } as any;

    const nonResizableHeaderGroup = {
      ...mockHeaderGroup,
      headers: [nonResizableHeader],
    } as any;

    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[nonResizableHeaderGroup]} />
      </table>
    );
    const resizerDiv = container.querySelector("div")!;

    expect(resizerDiv).not.toHaveClass("resizer");
    expect(resizerDiv).not.toHaveClass("isResizing");
  });

  it("renders resizer div with resizer class but without isResizing class when column can resize but is not currently resizing", () => {
    const resizableNotResizingHeader = {
      ...mockHeader,
      column: {
        ...mockHeader.column,
        getCanResize: () => true,
        getIsResizing: () => false,
      },
    } as any;

    const resizableNotResizingHeaderGroup = {
      ...mockHeaderGroup,
      headers: [resizableNotResizingHeader],
    } as any;

    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[resizableNotResizingHeaderGroup]} />
      </table>
    );
    const resizerDiv = container.querySelector("div")!;

    expect(resizerDiv).toHaveClass("resizer");
    expect(resizerDiv).not.toHaveClass("isResizing");
  });

  it("applies correct sorting properties when no sorting is applied", () => {
    const unsortedHeader = {
      ...mockHeader,
      column: {
        ...mockHeader.column,
        getIsSorted: () => false,
      },
    } as any;

    const unsortedHeaderGroup = {
      ...mockHeaderGroup,
      headers: [unsortedHeader],
    } as any;

    const { container } = render(
      <table>
        <BoardSummaryTableHeader headerGroups={[unsortedHeaderGroup]} />
      </table>
    );
    const headerElement = container.querySelector("th")!;

    expect(headerElement).toHaveAttribute("aria-sort", "none");
    expect(headerElement.className).toBe("");
  });
});
