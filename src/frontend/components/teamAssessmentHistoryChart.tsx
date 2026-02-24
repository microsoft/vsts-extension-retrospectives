import React from "react";
import { questions } from "../utilities/effectivenessMeasurementQuestionHelper";

export interface IQuestionAverage {
  questionId: number;
  average: number;
}

export interface IBoardAverageScore {
  boardTitle: string;
  boardId: string;
  createdDate: Date;
  questionAverages: IQuestionAverage[];
}

export interface IChartColors {
  lines: string[];
  gridLines: string;
  axis: string;
  axisLabel: string;
  legendText: string;
  legendSubtext: string;
  pointStroke: string;
}

export interface TeamAssessmentHistoryChartProps {
  historyData: IBoardAverageScore[];
  numberFormatter?: (value: number) => string;
  width?: number;
  height?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  colors?: Partial<IChartColors>;
}

export const defaultChartColors: IChartColors = {
  lines: [
    "#0078d4", // Blue
    "#107c10", // Green
    "#d83b01", // Orange-Red
    "#8764b8", // Purple
    "#00b7c3", // Cyan
    "#e81123", // Red
  ],
  gridLines: "#e0e0e0",
  axis: "#666",
  axisLabel: "#333",
  legendText: "#333",
  legendSubtext: "#666",
  pointStroke: "#fff",
};

export const defaultNumberFormatter = (value: number): string => value.toFixed(2);

export const formatAxisDate = (date: Date): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  }).format(date);

export const formatTooltipDate = (date: Date): string =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);

export const calculateYScale = (value: number, chartHeight: number, paddingTop: number, maxValue: number = 10): number => paddingTop + chartHeight - (value / maxValue) * chartHeight;

export const calculateXScale = (date: Date, minDate: number, dateRange: number, chartWidth: number, paddingLeft: number): number => paddingLeft + ((date.getTime() - minDate) / dateRange) * chartWidth;

export const shouldShowDateLabel = (index: number, totalDataPoints: number): boolean => {
  if (index === 0 || index === totalDataPoints - 1) {
    return true;
  }
  if (totalDataPoints <= 5) {
    return true;
  }
  const interval = Math.ceil(totalDataPoints / 5);
  return index % interval === 0;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
};

export const TeamAssessmentHistoryChart: React.FC<TeamAssessmentHistoryChartProps> = ({ historyData, numberFormatter = defaultNumberFormatter, width = 1100, height = 600, padding = { top: 40, right: 230, bottom: 80, left: 80 }, colors = {} }) => {
  const chartColors: IChartColors = { ...defaultChartColors, ...colors };
  if (colors.lines) {
    chartColors.lines = colors.lines;
  }

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const yScale = (value: number): number => calculateYScale(value, chartHeight, padding.top);

  const allDates = historyData.map(board => new Date(board.createdDate).getTime());
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);
  const dateRange = maxDate - minDate || 1; // Avoid division by zero

  const xScale = (date: Date): number => calculateXScale(date, minDate, dateRange, chartWidth, padding.left);

  const yAxisValues = [0, 2, 4, 6, 8, 10];

  return (
    <svg width={width} height={height} className="team-assessment-history-svg" role="img" aria-label="Team assessment history line chart showing scores over time">
      {/* Y-axis grid lines and labels */}
      {yAxisValues.map(value => (
        <g key={value}>
          <line x1={padding.left} y1={yScale(value)} x2={width - padding.right} y2={yScale(value)} stroke={chartColors.gridLines} strokeWidth="1" />
          <text x={padding.left - 10} y={yScale(value)} textAnchor="end" fontSize="14" fill={chartColors.axis} dominantBaseline="middle">
            {value}
          </text>
        </g>
      ))}

      {/* X-axis line */}
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke={chartColors.axis} strokeWidth="2" />

      {/* Y-axis line */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke={chartColors.axis} strokeWidth="2" />

      {/* Data lines for each question */}
      {questions.map((question, qIndex) => {
        const color = chartColors.lines[qIndex % chartColors.lines.length];

        const dataPoints = historyData
          .map(board => {
            const questionData = board.questionAverages.find(qa => qa.questionId === question.id);
            return questionData
              ? {
                  date: new Date(board.createdDate),
                  average: questionData.average,
                  boardTitle: board.boardTitle,
                }
              : null;
          })
          .filter((point): point is { date: Date; average: number; boardTitle: string } => point !== null);

        if (dataPoints.length === 0) {
          return null;
        }

        const linePath = dataPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${xScale(point.date)} ${yScale(point.average)}`).join(" ");

        return (
          <g key={question.id}>
            {/* Line path */}
            <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" opacity="0.8" />

            {/* Data points */}
            {dataPoints.map((point, index) => (
              <circle key={index} cx={xScale(point.date)} cy={yScale(point.average)} r="4" fill={color} stroke={chartColors.pointStroke} strokeWidth="2">
                <title>{`${question.shortTitle}\n${point.boardTitle}\nDate: ${formatTooltipDate(point.date)}\nAverage: ${numberFormatter(point.average)}`}</title>
              </circle>
            ))}
          </g>
        );
      })}

      {/* X-axis date labels */}
      {historyData.map((board, index) => {
        const date = new Date(board.createdDate);

        if (!shouldShowDateLabel(index, historyData.length)) {
          return null;
        }

        return (
          <text key={index} x={xScale(date)} y={height - padding.bottom + 20} textAnchor="end" fontSize="12" fill={chartColors.axis} transform={`rotate(-45 ${xScale(date)} ${height - padding.bottom + 20})`}>
            {formatAxisDate(date)}
          </text>
        );
      })}

      {/* Y-axis label */}
      <text x={padding.left - 50} y={height / 2} textAnchor="middle" fontSize="16" fill={chartColors.axisLabel} fontWeight="600" transform={`rotate(-90 ${padding.left - 50} ${height / 2})`}>
        Average Score
      </text>

      {/* Legend */}
      {questions.map((question, qIndex) => {
        const color = chartColors.lines[qIndex % chartColors.lines.length];
        const legendX = width - padding.right + 15;
        const legendY = padding.top + qIndex * 70;

        return (
          <g key={question.id}>
            {/* Legend line */}
            <line x1={legendX} y1={legendY} x2={legendX + 30} y2={legendY} stroke={color} strokeWidth="2.5" />
            {/* Legend point */}
            <circle cx={legendX + 15} cy={legendY} r="4" fill={color} stroke={chartColors.pointStroke} strokeWidth="2" />
            {/* Legend short title */}
            <text x={legendX + 40} y={legendY - 5} fontSize="13" fill={chartColors.legendText} fontWeight="600">
              <tspan>{question.shortTitle}</tspan>
            </text>
            {/* Legend full title (truncated) */}
            <text x={legendX + 40} y={legendY + 10} fontSize="10" fill={chartColors.legendSubtext}>
              <tspan>{truncateText(question.title, 25)}</tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default TeamAssessmentHistoryChart;
