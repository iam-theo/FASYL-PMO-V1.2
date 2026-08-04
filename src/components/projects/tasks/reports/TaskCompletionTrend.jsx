import { useMemo } from "react";
import { buildTrend } from "./analytics";

// Plot area inside the 508x195 viewBox.
const PLOT_LEFT = 30;
const PLOT_RIGHT = 480;
const PLOT_TOP = 24;
const PLOT_BOTTOM = 164;
const GRID_LINES_Y = [24, 59, 94, 129, 164];

const toPoints = (values, width, maxValue) =>
  values
    .map((value, index) => {
      const x = width === 1 ? (PLOT_LEFT + PLOT_RIGHT) / 2 : PLOT_LEFT + index * (width / (values.length - 1));
      const y = PLOT_BOTTOM - (value / Math.max(1, maxValue)) * (PLOT_BOTTOM - PLOT_TOP);
      return `${x},${y.toFixed(1)}`;
    })
    .join(" ");

function TaskCompletionTrend({ tasks }) {
  const { months, created, completed } = useMemo(
    () => buildTrend(Array.isArray(tasks) ? tasks : []),
    [tasks],
  );

  const maxValue = Math.max(1, ...created, ...completed);
  const hasActivity = created.some((value) => value > 0) || completed.some((value) => value > 0);
  const width = PLOT_RIGHT - PLOT_LEFT;
  const xPositions = months.map((_, index) =>
    months.length === 1 ? (PLOT_LEFT + PLOT_RIGHT) / 2 : PLOT_LEFT + index * (width / (months.length - 1)),
  );

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold text-[16px]/[20px] text-[#090909]">Task Completion Trend</h3>

      <div className="rounded-lg border border-[#0000000D] bg-white p-4">
        {!hasActivity ? (
          <div className="flex min-h-40 items-center justify-center font-normal text-[14px]/[20px] text-[#636363]">
            No task activity to chart yet.
          </div>
        ) : (
          <>
            <svg viewBox="0 0 508 195" className="h-auto w-full" xmlns="http://www.w3.org/2000/svg">
              {GRID_LINES_Y.map((y) => (
                <path key={y} d={`M17.5679 ${y}H508`} stroke="#01012E" strokeOpacity="0.08" />
              ))}

              {months.map((month, index) => (
                <text
                  key={month.key}
                  x={xPositions[index]}
                  y="187"
                  textAnchor="middle"
                  fill="#60646C"
                  fontFamily="Inter"
                  fontSize="12"
                >
                  {month.label}
                </text>
              ))}

              <polyline
                points={toPoints(created, width, maxValue)}
                stroke="#2A9D90"
                strokeWidth="2"
                fill="none"
              />
              <polyline
                points={toPoints(completed, width, maxValue)}
                stroke="#E76E50"
                strokeWidth="2"
                fill="none"
              />
            </svg>

            <div className="mt-2 flex items-center gap-5">
              <span className="flex items-center gap-1.5 font-normal text-[12px]/[16px] text-[#636363]">
                <span className="h-2 w-2 rounded-sm bg-[#2A9D90]" />
                Created
              </span>
              <span className="flex items-center gap-1.5 font-normal text-[12px]/[16px] text-[#636363]">
                <span className="h-2 w-2 rounded-sm bg-[#E76E50]" />
                Completed
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TaskCompletionTrend;
