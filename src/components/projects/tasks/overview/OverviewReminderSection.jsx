import { getReminders, dismissReminder } from "../../../../api"
import { useState, useEffect, useCallback } from "react";
import { useRealtimeModule } from "../../../../realtimeData";

function OverviewReminderSection({ project, onNavigate }) {

    const [reminders, setReminders] = useState([]);
    const [dismissingId, setDismissingId] = useState(null);

    const isClickable = typeof onNavigate === "function";

    const loadReminders = useCallback(async () => {
        try {
            const response = await getReminders();
            const all = Array.isArray(response.data) ? response.data : [];

            // This section lives inside a project's overview, so only reminders
            // belonging to THIS project belong here. /reminders/my returns every
            // reminder for the user across all projects.
            const projectId = project?.projectId;
            const scoped = projectId
                ? all.filter((reminder) => reminder?.project?.projectId === projectId)
                : all;

            setReminders(scoped);
        } catch (err) {
            console.error(err);
        }
    }, [project?.projectId]);

    useEffect(() => {
        loadReminders();
    }, [loadReminders]);

    // Reminders appear/disappear as they're created or dismissed — keep the
    // section in sync with other users (and the scheduler).
    useRealtimeModule("Reminders", loadReminders);

    const handleDismiss = async (id) => {
        setDismissingId(id);
        try {
            await dismissReminder(id);
            setReminders((prev) =>
                Array.isArray(prev) ? prev.filter((r) => r.id !== id) : prev,
            );
        } catch (err) {
            console.error(err);
        } finally {
            setDismissingId(null);
        }
    };

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
                                    <button
                                        type="button"
                                        onClick={() => handleDismiss(reminder.id)}
                                        disabled={dismissingId === reminder.id}
                                        className='font-medium text-[14px]/[20px] text-[#1B3C4A] hover:text-[#228CEE] disabled:opacity-50 cursor-pointer'
                                    >
                                        {dismissingId === reminder.id ? "Dismissing…" : "Dismiss"}
                                    </button>
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
