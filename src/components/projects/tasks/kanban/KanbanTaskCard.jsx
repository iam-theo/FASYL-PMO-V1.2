import { useState } from 'react'
import { ChevronDownIcon, TrashOutlineIcon } from '../icons'
import { ChevronLeftIcon, ChevronRightIcon } from './kanbanIcons'
import { TASK_PRIORITY_OPTIONS, PRIORITY_BADGE_COLORS } from '../tasks/taskConstants'
import { formatDueDate } from './kanbanConstants'

function KanbanTaskCard({ 
    task, 
    theme,
    canMoveLeft, 
    canMoveRight, 
    onMove, 
    updatePriority, 
    onDelete,
    onDragStart,
    onDragEnd,
    readOnly = false
}) {

    const [isDragging, setIsDragging] = useState(false)

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
        setIsDragging(true)
        onDragStart?.(task.id)
    }

    const handleDragEnd = () => {
        setIsDragging(false)
        onDragEnd?.()
    }

    const assigneeNames = (Array.isArray(task.assignees) ? task.assignees : [])
        .map((person) => person.fullName)
        .filter(Boolean)

    const primaryAssignee = assigneeNames[0] ?? 'Unassigned'
    const extraCount = assigneeNames.length - 1

    return (
        <div
            draggable={!readOnly}
            onDragStart={!readOnly ? handleDragStart : undefined}
            onDragEnd={!readOnly ? handleDragEnd : undefined}
            className={`group flex select-none gap-3 rounded-xl border bg-[#FFFFFF] p-3 transition-all duration-200 ${readOnly ? "" : "cursor-grab active:cursor-grabbing"} ${
                isDragging
                    ? 'rotate-1 scale-[0.98] border-[#D0D5DD] opacity-60 shadow-[0_16px_32px_-12px_rgba(16,24,40,0.3)]'
                    : 'border-[#0000000D] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(16,24,40,0.18)]'
            }`}
        >
            {/* Status accent strip */}
            <span
                className='w-1 shrink-0 self-stretch rounded-full'
                style={{ background: `linear-gradient(180deg, ${theme.from}, ${theme.to})` }}
            />

            <div className='min-w-0 flex-1 flex flex-col gap-4'>
                <div className='flex flex-col gap-4'>
                    <div className='flex items-center justify-between gap-2'>
                        <span
                            className='font-semibold text-[15px]/[20px] text-[#090909] truncate'
                            title={task.title}
                        >
                            {task.title}
                        </span>
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={() => onDelete(task)}
                                aria-label="Delete task"
                                className='shrink-0 cursor-pointer opacity-40 transition-opacity group-hover:opacity-100'
                            >
                                <TrashOutlineIcon className='w-5 h-5' />
                            </button>
                        )}
                    </div>

                    <div className='rounded-lg bg-[#F9FAFB] p-3 flex flex-col gap-4'>
                        <div className='flex items-start justify-between gap-2'>
                            <span className='font-normal text-[14px]/[20px] text-[#636363]'>Assigned To</span>
                            <span className='font-normal text-[14px]/[20px] text-[#636363] text-right'>
                                {primaryAssignee}
                                {extraCount > 0 ? ` +${extraCount}` : ''}
                            </span>
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
                    {readOnly ? (
                        <span
                            className='inline-flex items-center rounded-2xl px-2 py-1 font-medium text-[14px]/[20px] text-[#FFFFFF]'
                            style={{ backgroundColor: PRIORITY_BADGE_COLORS[task.priority] ?? "#949494" }}
                        >
                            {task.priority}
                        </span>
                    ) : (
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
                    )}

                    {!readOnly && (
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
                    )}
                </div>
            </div>
        </div>
    )
}

export default KanbanTaskCard
