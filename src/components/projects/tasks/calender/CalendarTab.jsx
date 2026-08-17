import { useState } from "react";
import { PlusCircleIcon } from "../icons";
import CreateTaskModal from "../tasks/CreateTaskModal";
import CalendarGrid from "./CalendarGrid";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { getMonthLabel } from "./calendarUtils";
import ExportMenu from "../ExportMenu";
import { taskExportColumns } from "../exportConfig";

function CalendarTab({ tasks, setTasks, viewOnly = false, onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const goToPrevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const handleCreateTask = (newTask) => {
    setTasks((prev) => [{ id: `task-${Date.now()}`, ...newTask }, ...prev]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-50 max-w-100 rounded-lg border border-[#0000001A] bg-[#FFFFFF] px-3.5 py-2.5 flex items-center gap-2">
            <i className="fa-solid fa-magnifying-glass text-[#090909]"></i>
            <input
              type="text"
              placeholder="Search"
              className="flex-1 outline-none font-normal text-[14px]/[24px] text-[#636363] bg-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <ExportMenu
              filename="calendar-tasks"
              title="Tasks Calendar"
              columns={taskExportColumns}
              rows={tasks}
            />

            {!viewOnly && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#1B3C4A] flex items-center gap-2 cursor-pointer"
              >
                <PlusCircleIcon />
                <span className="font-medium text-[14px]/[20px] text-[#FFFFFF]">
                  New Task
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[18px]/[24px] text-[#090909]">
            {getMonthLabel(currentDate)}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPrevMonth}
              aria-label="Previous month"
              className="w-8 h-8 rounded-md border border-[#0000000D] bg-[#E8E8E8] flex items-center justify-center cursor-pointer"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Next month"
              className="w-8 h-8 rounded-md border border-[#0000000D] bg-[#E8E8E8] flex items-center justify-center cursor-pointer"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>

        <CalendarGrid currentDate={currentDate} tasks={tasks} onTaskClick={onTaskClick} />
      </div>

      {isCreateModalOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  );
}

export default CalendarTab;
