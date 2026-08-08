import { OverallProgressIcon, TasksCompletedIcon, ResourcesAllocatedIcon, DaysRemainingIcon } from './icons'

const STATS = [
    { key: 'progress', value: '68%', label: 'Overall Progress', icon: OverallProgressIcon },
    { key: 'tasks', value: '42/68', label: 'Tasks Completed', icon: TasksCompletedIcon },
    { key: 'resources', value: '12', label: 'Resources Allocated', icon: ResourcesAllocatedIcon },
    { key: 'days', value: '62', label: 'Days Remaining', icon: DaysRemainingIcon },
]

function ReportStatCards() {
    return (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            {STATS.map(({ key, value, label, icon: Icon }) => (
                <div
                    key={key}
                    className='flex flex-col gap-3 rounded-lg border border-[#0000000D] bg-[#F3F3F3] p-4'
                >
                    <div className='flex items-center justify-between'>
                        <span className='font-semibold text-[20px]/[24px] text-[#090909]'>{value}</span>
                        <Icon />
                    </div>
                    <span className='font-normal text-[14px]/[20px] text-[#636363]'>{label}</span>
                </div>
            ))}
        </div>
    )
}

export default ReportStatCards
