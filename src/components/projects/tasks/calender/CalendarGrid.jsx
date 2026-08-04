import { useMemo } from 'react'
import CalendarDayCell from './CalendarDayCell'
import { WEEKDAYS, formatDateKey, getMonthMatrix } from './calendarUtils'

function CalendarGrid({ currentDate, tasks }) {

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
        <div className='rounded-lg border border-[#E8E8E8] overflow-x-auto bg-[#FFFFFF]'>
            <div className='min-w-187.5'>
                <div className='grid grid-cols-7 bg-[#FAFAFA]'>
                    {WEEKDAYS.map((weekday) => (
                        <div
                            key={weekday}
                            className='p-2.5 border border-[#E8E8E8] bg-[#FFFFFF] font-medium text-[12px] text-[#969696]'
                        >
                            {weekday}
                        </div>
                    ))}
                </div>

                <div className='grid grid-cols-7'>
                    {cells.map(({ date, currentMonth }) => {
                        const key = formatDateKey(date)
                        return (
                            <CalendarDayCell
                                key={key}
                                date={date}
                                currentMonth={currentMonth}
                                isToday={key === todayKey}
                                items={itemsByDate[key] ?? []}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default CalendarGrid
