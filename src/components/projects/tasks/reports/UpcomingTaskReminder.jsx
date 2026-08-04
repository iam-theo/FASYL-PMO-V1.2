import { useMemo } from "react";
import { buildUpcoming } from "./analytics";

function UpcomingTaskReminder({ tasks }) {
  const reminders = useMemo(() => buildUpcoming(tasks), [tasks]);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold text-[16px]/[20px] text-[#090909]">Upcoming Task Reminder</h3>

      {reminders.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-[#0000000D] bg-[#F9FAFB] font-normal text-[14px]/[20px] text-[#636363]">
          No upcoming tasks in this stage.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#0000000D] bg-[#F9FAFB]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#0000000D]">
                <th className="h-11 px-6 text-left font-medium text-[12px]/[18px] text-[#090909]">Task</th>
                <th className="h-11 px-6 text-left font-medium text-[12px]/[18px] text-[#090909]">Due Date</th>
                <th className="h-11 px-6 text-left font-medium text-[12px]/[18px] text-[#090909]">Reminder</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((reminder) => (
                <tr key={reminder.id} className="border-b border-[#0000000D] last:border-b-0">
                  <td className="h-18 px-6 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap">{reminder.task}</td>
                  <td className="h-18 px-6 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap">{reminder.dueDate}</td>
                  <td className="h-18 px-6 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap">{reminder.reminder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UpcomingTaskReminder;
