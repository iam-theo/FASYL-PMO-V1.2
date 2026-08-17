
function CalendarDayCell({ date, currentMonth, isToday, items, onTaskClick }) {
    const handleTaskClick = (task) => {
        if (typeof onTaskClick === "function") onTaskClick(task);
    };

    return (
        <div
            className={`flex flex-col gap-1.5 min-h-37 p-2.5 border border-[#E8E8E8] overflow-hidden ${
                currentMonth ? "bg-[#FFFFFF]" : "bg-[#F8F8F8]"
            }`}
        >
            <span
                className={`inline-flex items-center justify-center w-6.5 h-6.5 rounded-full font-medium text-[16px] ${
                    isToday
                        ? "bg-[#1B3C4A] text-[#FFFFFF]"
                        : currentMonth
                        ? "text-[#000000]"
                        : "text-[#000000] opacity-40"
                }`}
            >
                {date.getDate()}
            </span>

            <div className='flex flex-col gap-1 overflow-y-auto no-scrollbar'>
                {items.map(({ task, type }) => (
                    <button
                        key={`${task.id}-${type}`}
                        type="button"
                        title={`${type === "start" ? "Start" : "Due"}: ${task.title}`}
                        onClick={() => handleTaskClick(task)}
                        className={`rounded px-1.5 py-1 font-medium text-[11px]/[14px] bg-[#EBEBEB] truncate text-left cursor-pointer hover:bg-[#E0E0E0] transition-colors ${type === "start" ? "text-[#12B76A]" : "text-[#F5A200]"}`}
                    >
                        {type === "start" ? "Start" : "Due"}: {task.title}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default CalendarDayCell
