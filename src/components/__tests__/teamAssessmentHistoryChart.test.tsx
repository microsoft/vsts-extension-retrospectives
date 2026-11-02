import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TeamAssessmentHistoryChart, IBoardAverageScore, defaultNumberFormatter, formatAxisDate, formatTooltipDate, calculateYScale, calculateXScale, shouldShowDateLabel, truncateText, defaultChartColors } from "../teamAssessmentHistoryChart";

// Mock the questions from effectivenessMeasurementQuestionHelper
jest.mock("../../utilities/effectivenessMeasurementQuestionHelper", () => ({
  questions: [
    { id: 1, shortTitle: "Clarity", title: "I clearly understand what is expected of me on this team" },
    { id: 2, shortTitle: "Energy", title: "I am energized by the work I do" },
    { id: 3, shortTitle: "Psychological Safety", title: "I feel safe and do not fear making mistakes" },
    { id: 4, shortTitle: "Work-life Balance", title: "My typical workload allows me to achieve balance" },
    { id: 5, shortTitle: "Confidence", title: "I'm confident our team will be successful" },
    { id: 6, shortTitle: "Efficiency", title: "Tools, resources, processes allow me to effectively meet needs" },
  ],
}));

describe("TeamAssessmentHistoryChart", () => {
  // Helper function to create test data
  const createTestData = (count: number): IBoardAverageScore[] => {
    const data: IBoardAverageScore[] = [];
    const baseDate = new Date("2024-01-01");

    for (let i = 0; i < count; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i * 7);

      data.push({
        boardTitle: `Retrospective ${i + 1}`,
        boardId: `board-${i + 1}`,
        createdDate: date,
        questionAverages: [
          { questionId: 1, average: 7 + Math.random() * 2 },
          { questionId: 2, average: 6 + Math.random() * 2 },
          { questionId: 3, average: 8 + Math.random() * 1.5 },
          { questionId: 4, average: 5 + Math.random() * 3 },
          { questionId: 5, average: 7.5 + Math.random() * 2 },
          { questionId: 6, average: 6.5 + Math.random() * 2.5 },
        ],
      });
    }

    return data;
  };

  describe("Utility Functions", () => {
    describe("defaultNumberFormatter", () => {
      it("should format numbers to two decimal places", () => {
        expect(defaultNumberFormatter(7)).toBe("7.00");
        expect(defaultNumberFormatter(7.5)).toBe("7.50");
        expect(defaultNumberFormatter(7.567)).toBe("7.57");
        expect(defaultNumberFormatter(0)).toBe("0.00");
        expect(defaultNumberFormatter(10)).toBe("10.00");
      });
    });

    describe("formatAxisDate", () => {
      it("should format date for x-axis display", () => {
        const date = new Date("2024-03-15");
        const formatted = formatAxisDate(date);
        expect(formatted).toContain("Mar");
        expect(formatted).toContain("15");
        expect(formatted).toContain("24");
      });

      it("should handle different dates correctly", () => {
        const date1 = new Date("2024-01-01");
        const date2 = new Date("2024-12-31");

        expect(formatAxisDate(date1)).toContain("Jan");
        expect(formatAxisDate(date2)).toContain("Dec");
      });
    });

    describe("formatTooltipDate", () => {
      it("should format date for tooltip display", () => {
        const date = new Date("2024-03-15");
        const formatted = formatTooltipDate(date);
        expect(formatted).toContain("Mar");
        expect(formatted).toContain("15");
        expect(formatted).toContain("2024");
      });
    });

    describe("calculateYScale", () => {
      it("should calculate correct Y position for values", () => {
        const chartHeight = 380;
        const paddingTop = 40;

        // Value 0 should be at the bottom (paddingTop + chartHeight)
        expect(calculateYScale(0, chartHeight, paddingTop, 10)).toBe(420);

        // Value 10 should be at the top (paddingTop)
        expect(calculateYScale(10, chartHeight, paddingTop, 10)).toBe(40);

        // Value 5 should be in the middle
        expect(calculateYScale(5, chartHeight, paddingTop, 10)).toBe(230);
      });

      it("should handle custom max values", () => {
        const chartHeight = 400;
        const paddingTop = 50;

        expect(calculateYScale(50, chartHeight, paddingTop, 100)).toBe(250);
      });
    });

    describe("calculateXScale", () => {
      it("should calculate correct X position for dates", () => {
        const chartWidth = 790;
        const paddingLeft = 80;
        const minDate = new Date("2024-01-01").getTime();
        const maxDate = new Date("2024-01-31").getTime();
        const dateRange = maxDate - minDate;

        // First date should be at paddingLeft
        const firstDate = new Date("2024-01-01");
        expect(calculateXScale(firstDate, minDate, dateRange, chartWidth, paddingLeft)).toBe(80);

        // Last date should be at paddingLeft + chartWidth
        const lastDate = new Date("2024-01-31");
        expect(calculateXScale(lastDate, minDate, dateRange, chartWidth, paddingLeft)).toBe(870);
      });

      it("should handle date in the middle", () => {
        const chartWidth = 800;
        const paddingLeft = 100;
        const minDate = new Date("2024-01-01").getTime();
        const maxDate = new Date("2024-01-11").getTime();
        const dateRange = maxDate - minDate;

        const middleDate = new Date("2024-01-06");
        const result = calculateXScale(middleDate, minDate, dateRange, chartWidth, paddingLeft);
        expect(result).toBe(500); // 100 + (5/10 * 800) = 500
      });
    });

    describe("shouldShowDateLabel", () => {
      it("should always show first and last labels", () => {
        expect(shouldShowDateLabel(0, 10)).toBe(true);
        expect(shouldShowDateLabel(9, 10)).toBe(true);
      });

      it("should show all labels when 5 or fewer data points", () => {
        expect(shouldShowDateLabel(0, 3)).toBe(true);
        expect(shouldShowDateLabel(1, 3)).toBe(true);
        expect(shouldShowDateLabel(2, 3)).toBe(true);

        expect(shouldShowDateLabel(2, 5)).toBe(true);
        expect(shouldShowDateLabel(3, 5)).toBe(true);
      });

      it("should show labels at intervals when more than 5 data points", () => {
        // With 10 data points, interval should be ceil(10/5) = 2
        expect(shouldShowDateLabel(0, 10)).toBe(true);
        expect(shouldShowDateLabel(2, 10)).toBe(true);
        expect(shouldShowDateLabel(4, 10)).toBe(true);
        expect(shouldShowDateLabel(1, 10)).toBe(false);
        expect(shouldShowDateLabel(3, 10)).toBe(false);
      });
    });

    describe("truncateText", () => {
      it("should not truncate short text", () => {
        expect(truncateText("Hello", 10)).toBe("Hello");
        expect(truncateText("Test", 4)).toBe("Test");
      });

      it("should truncate long text and add ellipsis", () => {
        expect(truncateText("Hello World", 5)).toBe("Hello...");
        expect(truncateText("This is a very long text", 10)).toBe("This is a ...");
      });

      it("should handle edge cases", () => {
        expect(truncateText("", 5)).toBe("");
        expect(truncateText("A", 0)).toBe("...");
        expect(truncateText("ABC", 3)).toBe("ABC");
      });
    });

    describe("defaultChartColors", () => {
      it("should have all required color properties", () => {
        expect(defaultChartColors.lines).toHaveLength(6);
        expect(defaultChartColors.gridLines).toBeDefined();
        expect(defaultChartColors.axis).toBeDefined();
        expect(defaultChartColors.axisLabel).toBeDefined();
        expect(defaultChartColors.legendText).toBeDefined();
        expect(defaultChartColors.legendSubtext).toBeDefined();
        expect(defaultChartColors.pointStroke).toBeDefined();
      });

      it("should have valid hex color values", () => {
        // Matches both 3-digit and 6-digit hex colors
        const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

        defaultChartColors.lines.forEach(color => {
          expect(color).toMatch(hexColorRegex);
        });
        expect(defaultChartColors.gridLines).toMatch(hexColorRegex);
        expect(defaultChartColors.axis).toMatch(hexColorRegex);
      });
    });
  });

  describe("Component Rendering", () => {
    it("should render SVG element with correct dimensions", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("width", "1100");
      expect(svg).toHaveAttribute("height", "600");
    });

    it("should render with custom dimensions", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} width={800} height={400} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "800");
      expect(svg).toHaveAttribute("height", "400");
    });

    it("should render Y-axis grid lines for all scale values", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      // Should have 6 Y-axis grid lines (0, 2, 4, 6, 8, 10)
      const gridLines = container.querySelectorAll("line[stroke='#e0e0e0']");
      expect(gridLines.length).toBe(6);
    });

    it("should render Y-axis labels", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const textElements = container.querySelectorAll("text");
      const labelTexts = Array.from(textElements).map(el => el.textContent);

      expect(labelTexts).toContain("0");
      expect(labelTexts).toContain("2");
      expect(labelTexts).toContain("4");
      expect(labelTexts).toContain("6");
      expect(labelTexts).toContain("8");
      expect(labelTexts).toContain("10");
    });

    it("should render Y-axis title", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const textElements = container.querySelectorAll("text");
      const labelTexts = Array.from(textElements).map(el => el.textContent);

      expect(labelTexts).toContain("Average Score");
    });

    it("should render axis lines", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      // X-axis and Y-axis lines with stroke-width 2
      const axisLines = container.querySelectorAll("line[stroke-width='2']");
      expect(axisLines.length).toBeGreaterThanOrEqual(2);
    });

    it("should render data lines (paths) for each question with data", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const paths = container.querySelectorAll("path");
      // Should have paths for questions with data
      expect(paths.length).toBeGreaterThan(0);
    });

    it("should render data points (circles) for each data point", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const circles = container.querySelectorAll("circle");
      // Each question has 3 data points, and legend also has circles
      // 6 questions * 3 points = 18 + 6 legend circles = 24
      expect(circles.length).toBe(24);
    });

    it("should render legend entries for all questions", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const textElements = container.querySelectorAll("text");
      const labelTexts = Array.from(textElements).map(el => el.textContent);

      expect(labelTexts).toContain("Clarity");
      expect(labelTexts).toContain("Energy");
      expect(labelTexts).toContain("Psychological Safety");
      expect(labelTexts).toContain("Work-life Balance");
      expect(labelTexts).toContain("Confidence");
      expect(labelTexts).toContain("Efficiency");
    });

    it("should have accessible aria-label on SVG", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("aria-label");
      expect(svg?.getAttribute("aria-label")).toContain("Team assessment history");
    });

    it("should have role=img on SVG", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("role", "img");
    });
  });

  describe("Data Handling", () => {
    it("should handle empty history data", () => {
      const { container } = render(<TeamAssessmentHistoryChart historyData={[]} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();

      // Should have no data paths or circles (except legend circles)
      const paths = container.querySelectorAll("path");
      expect(paths.length).toBe(0);
    });

    it("should handle single data point", () => {
      const historyData = createTestData(1);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      // Should render without crashing
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();

      // Should have circles for the single data point
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBeGreaterThan(0);
    });

    it("should handle data with missing question averages", () => {
      const historyData: IBoardAverageScore[] = [
        {
          boardTitle: "Retrospective 1",
          boardId: "board-1",
          createdDate: new Date("2024-01-01"),
          questionAverages: [
            { questionId: 1, average: 7 },
            // Missing other questions
          ],
        },
        {
          boardTitle: "Retrospective 2",
          boardId: "board-2",
          createdDate: new Date("2024-01-08"),
          questionAverages: [
            { questionId: 1, average: 8 },
            { questionId: 3, average: 9 },
          ],
        },
      ];

      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should handle data with no question averages", () => {
      const historyData: IBoardAverageScore[] = [
        {
          boardTitle: "Empty Board",
          boardId: "board-empty",
          createdDate: new Date("2024-01-01"),
          questionAverages: [],
        },
      ];

      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render tooltips with correct data", () => {
      const historyData: IBoardAverageScore[] = [
        {
          boardTitle: "Test Retro",
          boardId: "board-1",
          createdDate: new Date("2024-03-15"),
          questionAverages: [{ questionId: 1, average: 7.5 }],
        },
      ];

      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const titles = container.querySelectorAll("title");
      const tooltipTexts = Array.from(titles).map(el => el.textContent);

      // Find the tooltip for the data point
      const dataTooltip = tooltipTexts.find(text => text?.includes("Clarity"));
      expect(dataTooltip).toContain("Test Retro");
      expect(dataTooltip).toContain("7.50");
    });
  });

  describe("Custom Props", () => {
    it("should use custom number formatter", () => {
      const customFormatter = (value: number) => `${Math.round(value)}`;
      const historyData: IBoardAverageScore[] = [
        {
          boardTitle: "Test Retro",
          boardId: "board-1",
          createdDate: new Date("2024-03-15"),
          questionAverages: [{ questionId: 1, average: 7.567 }],
        },
      ];

      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} numberFormatter={customFormatter} />);

      const titles = container.querySelectorAll("title");
      const tooltipTexts = Array.from(titles).map(el => el.textContent);

      const dataTooltip = tooltipTexts.find(text => text?.includes("Clarity"));
      expect(dataTooltip).toContain("8"); // Rounded from 7.567
    });

    it("should apply custom padding", () => {
      const historyData = createTestData(3);
      const customPadding = { top: 60, right: 200, bottom: 100, left: 100 };

      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} padding={customPadding} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should apply custom colors", () => {
      const historyData = createTestData(3);
      const customColors = {
        gridLines: "#cccccc",
        axis: "#333333",
      };

      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} colors={customColors} />);

      const gridLines = container.querySelectorAll("line[stroke='#cccccc']");
      expect(gridLines.length).toBe(6);
    });

    it("should apply custom line colors", () => {
      const historyData = createTestData(3);
      const customColors = {
        lines: ["#ff0000", "#00ff00", "#0000ff"],
      };

      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} colors={customColors} />);

      // Check that at least one path uses the custom red color
      const redPaths = container.querySelectorAll("path[stroke='#ff0000']");
      expect(redPaths.length).toBeGreaterThan(0);
    });
  });

  describe("Date Scaling", () => {
    it("should handle dates on the same day", () => {
      const sameDate = new Date("2024-03-15");
      const historyData: IBoardAverageScore[] = [
        {
          boardTitle: "Morning Retro",
          boardId: "board-1",
          createdDate: sameDate,
          questionAverages: [{ questionId: 1, average: 7 }],
        },
        {
          boardTitle: "Afternoon Retro",
          boardId: "board-2",
          createdDate: sameDate,
          questionAverages: [{ questionId: 1, average: 8 }],
        },
      ];

      // Should not crash with same dates (dateRange = 0, handled by || 1)
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should correctly order data points by date", () => {
      const historyData: IBoardAverageScore[] = [
        {
          boardTitle: "Later Retro",
          boardId: "board-2",
          createdDate: new Date("2024-03-20"),
          questionAverages: [{ questionId: 1, average: 8 }],
        },
        {
          boardTitle: "Earlier Retro",
          boardId: "board-1",
          createdDate: new Date("2024-03-10"),
          questionAverages: [{ questionId: 1, average: 7 }],
        },
      ];

      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      // Component should render both data points
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBeGreaterThan(0);
    });
  });

  describe("X-axis Labels", () => {
    it("should show all labels for 5 or fewer data points", () => {
      const historyData = createTestData(5);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      // Find rotated text elements (x-axis labels)
      const rotatedTexts = container.querySelectorAll("text[transform]");
      const xAxisLabels = Array.from(rotatedTexts).filter(el => el.getAttribute("transform")?.includes("rotate(-45"));

      expect(xAxisLabels.length).toBe(5);
    });

    it("should show limited labels for many data points", () => {
      const historyData = createTestData(10);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      // Find rotated text elements (x-axis labels)
      const rotatedTexts = container.querySelectorAll("text[transform]");
      const xAxisLabels = Array.from(rotatedTexts).filter(el => el.getAttribute("transform")?.includes("rotate(-45"));

      // Should show fewer labels than data points
      expect(xAxisLabels.length).toBeLessThan(10);
      expect(xAxisLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Legend Truncation", () => {
    it("should truncate long question titles in legend", () => {
      const historyData = createTestData(3);
      const { container } = render(<TeamAssessmentHistoryChart historyData={historyData} />);

      const textElements = container.querySelectorAll("text");
      const allTexts = Array.from(textElements).map(el => el.textContent);

      // The full title "I clearly understand what is expected of me on this team"
      // should be truncated to 25 chars + "..."
      const truncatedTitles = allTexts.filter(text => text?.includes("..."));
      expect(truncatedTitles.length).toBeGreaterThan(0);
    });
  });
});
