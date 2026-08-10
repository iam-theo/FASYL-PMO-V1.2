import { ChevronDownIcon, TrashOutlineIcon } from '../icons'
import { ChevronLeftIcon, ChevronRightIcon } from './kanbanIcons'
import { TASK_PRIORITY_OPTIONS, PRIORITY_BADGE_COLORS } from '../tasks/taskConstants'
import { formatDueDate } from './kanbanConstants'

function KanbanTaskCard({ 
    task, 
    canMoveLeft, 
    canMoveRight, 
    onMove, 
    updatePriority, 
    onDelete 
}) {
    return (
        <div className='rounded-lg border border-[#0000000D] bg-[#F3F3F3] p-3 flex flex-col gap-5.5'>
            <div className='flex flex-col gap-4'>
                <div className='flex items-center justify-between gap-2'>
                    <span
                        className='font-semibold text-[16px]/[20px] text-[#090909] truncate'
                        title={task.title}
                    >
                        {task.title}
                    </span>
                    <button
                        type="button"
                        onClick={() => onDelete(task)}
                        aria-label="Delete task"
                        className='shrink-0 cursor-pointer'
                    >
                        <TrashOutlineIcon className='w-5 h-5' />
                    </button>
                </div>

                <div className='rounded bg-[#FFFFFF] p-3 flex flex-col gap-4'>
                    <div className='flex items-start justify-between gap-2'>
                        <span className='font-normal text-[14px]/[20px] text-[#636363]'>Assigned To</span>
                        <span className='font-normal text-[14px]/[20px] text-[#636363] text-right'>{task.assignedTo}</span>
                    </div>
                    <div className='flex items-start justify-between gap-2'>
                        <span className='font-normal text-[14px]/[20px] text-[#636363]'>Due Date</span>
                        <span className='font-normal text-[14px]/[20px] text-[#636363] text-right'>{formatDueDate(task.dueDate)}</span>
                    </div>
                    {task.documents?.length > 0 && (
                        <div className='flex flex-col gap-1.5'>
                            {task.documents.map((doc, index) => (
                                <a
                                    key={index}
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={doc.fileName}
                                    className='inline-flex items-center gap-1.5 font-normal text-[14px]/[20px] text-[#1B3C4A] hover:underline'
                                >
                                    <i className="fa-solid fa-paperclip"></i>
                                    <span className='truncate'>{doc.fileName}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className='flex items-center justify-between'>
                <div
                    className='relative inline-flex items-center gap-1 rounded-2xl px-2 py-1'
                    style={{ backgroundColor: PRIORITY_BADGE_COLORS[task.priority] ?? "#949494" }}
                >
                    <select
                        value={task.priority}
                        onChange={(e) => updatePriority(task.id, e.target.value)}
                        aria-label="Change priority"
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                    >
                        {TASK_PRIORITY_OPTIONS.map((option) => (
                            <option 
                                key={option} 
                                value={option}
                                className='text-[#667085]'>
                                    {option}
                            </option>
                        ))}
                    </select>
                    <span className='font-medium text-[14px]/[20px] text-[#FFFFFF] pointer-events-none'>{task.priority}</span>
                    <ChevronDownIcon stroke='white' className='pointer-events-none' />
                </div>

                <div className='flex items-center gap-2'>
                    <button
                        type="button"
                        onClick={() => onMove(task.id, -1)}
                        disabled={!canMoveLeft}
                        aria-label="Move to previous status"
                        className='cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'
                    >
                        <ChevronLeftIcon />
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove(task.id, 1)}
                        disabled={!canMoveRight}
                        aria-label="Move to next status"
                        className='cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'
                    >
                        <ChevronRightIcon />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default KanbanTaskCard
