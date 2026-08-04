
function CalendarDayCell({ date, currentMonth, isToday, items }) {
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
                    <span
                        key={`${task.id}-${type}`}
                        title={`${type === "start" ? "Start" : "Due"}: ${task.title}`}
                        className='rounded px-1.5 py-1 font-medium text-[11px]/[14px] text-[#090909] bg-[#EBEBEB] truncate'
                    >
                        {type === "start" ? "Start" : "Due"}: {task.title}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default CalendarDayCell
