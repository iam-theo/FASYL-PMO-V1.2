import { getReminders } from "../../../../api"
import { useState, useEffect } from "react";

function OverviewReminderSection({ onNavigate }) {

    const [reminders, setReminders] = useState([]);

    const isClickable = typeof onNavigate === "function";

    useEffect(() => {
        const loadReminders = async () => {
            try {
                const response = await getReminders();
                setReminders(response.data);
            } catch (err) {
                console.error(err);
            }
        };

        loadReminders();

    }, []);

    return (
        <div
            onClick={isClickable ? onNavigate : undefined}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={
                isClickable
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onNavigate();
                          }
                      }
                    : undefined
            }
            className={`flex flex-col gap-4 ${isClickable ? "cursor-pointer" : ""}`}
        >
            <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Reminder</h3>

            <div className='rounded-lg border border-[#0000000D] bg-[#F9FAFB] overflow-x-auto'>
                <table className='w-full border-collapse'>
                    <thead>
                        <tr className='border-b border-[#0000000D]'>
                            <th className='h-11 px-6 text-left font-medium text-[12px]/[18px] text-[#090909]'>Task</th>
                            <th className='h-11 px-6 text-left font-medium text-[12px]/[18px] text-[#090909]'>Due Date</th>
                            <th className='h-11 px-6 text-left font-medium text-[12px]/[18px] text-[#090909]'>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reminders.map((reminder) => (
                            <tr key={reminder.id} className='border-b border-[#0000000D] last:border-b-0'>
                                <td className='h-18 px-6 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap'>{reminder?.task?.title}</td>
                                <td className='h-18 px-6 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap'>{reminder?.task?.dueDate}</td>
                                {/* <td className='h-18 px-6 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap'>{reminder.reminder}</td> */}
                                <td className='h-18 px-6 font-normal text-[14px]/[20px] text-[#F5A200] whitespace-nowrap'>
                                    <button>Dismiss</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default OverviewReminderSection
