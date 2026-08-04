import { useMemo } from 'react'
import { CalendarIcon } from '../icons'
import { WEEKDAYS, formatDateKey, getMonthMatrix, getMonthLabel } from '../calender/calendarUtils'

function OverviewCalendarSection({ tasks = [] }) {
    const currentDate = useMemo(() => new Date(), [])

    const cells = useMemo(
        () => getMonthMatrix(currentDate.getFullYear(), currentDate.getMonth()),
        [currentDate]
    )

    const itemsByDate = useMemo(() => {
        const map = {}

        tasks.forEach((task) => {
            if (task.startDate) {
                const key = formatDateKey(task.startDate)
                map[key] = map[key] || []
                map[key].push({ task, type: "start" })
            }

            if (task.dueDate) {
                const key = formatDateKey(task.dueDate)
                map[key] = map[key] || []
                map[key].push({ task, type: "due" })
            }
        })

        return map
    }, [tasks])

    const todayKey = formatDateKey(new Date())

    return (
        <div className='flex flex-col gap-4'>
            <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Calendar</h3>

            <div className='flex flex-col gap-2.5'>
                <div className='flex items-center gap-2'>
                    <CalendarIcon />
                    <span className='font-semibold text-[14px] text-[#000000]'>{getMonthLabel(currentDate)}</span>
                </div>

                <div className='rounded-lg border border-[#E8E8E8] overflow-hidden bg-[#FFFFFF]'>
                    <div className='grid grid-cols-7 bg-[#FAFAFA]'>
                        {WEEKDAYS.map((weekday) => (
                            <div
                                key={weekday}
                                className='p-1 border border-[#E8E8E8] bg-[#FFFFFF] font-medium text-[10px] text-[#969696] text-center truncate'
                            >
                                {weekday}
                            </div>
                        ))}
                    </div>

                    <div className='grid grid-cols-7'>
                        {cells.map(({ date, currentMonth }) => {
                            const key = formatDateKey(date)
                            const items = itemsByDate[key] ?? []

                            return (
                                <div
                                    key={key}
                                    className={`flex flex-col gap-1 min-h-15 p-1 border border-[#E8E8E8] overflow-hidden ${
                                        currentMonth ? "bg-[#FFFFFF]" : "bg-[#F8F8F8]"
                                    }`}
                                >
                                    <span
                                        className={`inline-flex items-center justify-center w-4.5 h-4.5 rounded-full font-medium text-[11px] ${
                                            key === todayKey
                                                ? "bg-[#1B3C4A] text-[#FFFFFF]"
                                                : currentMonth
                                                ? "text-[#000000]"
                                                : "text-[#000000] opacity-40"
                                        }`}
                                    >
                                        {date.getDate()}
                                    </span>

                                    <div className='flex flex-col gap-0.5'>
                                        {items.slice(0, 1).map(({ task, type }) => (
                                            <span
                                                key={`${task.id}-${type}`}
                                                title={`${type === "start" ? "Start" : "Due"}: ${task.title}`}
                                                className='rounded px-1 py-0.5 font-medium text-[9px]/[11px] text-[#090909] bg-[#EBEBEB] truncate'
                                            >
                                                {type === "start" ? "Start" : "Due"}: {task.title}
                                            </span>
                                        ))}
                                        {items.length > 1 && (
                                            <span className='font-medium text-[9px] text-[#636363]'>+{items.length - 1} more</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OverviewCalendarSection
