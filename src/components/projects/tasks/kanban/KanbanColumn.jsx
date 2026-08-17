import { useRef, useState } from 'react'
import KanbanTaskCard from './KanbanTaskCard'
import { STATUS_COLUMNS } from './kanbanConstants'

function KanbanColumn({ 
    column, 
    tasks, 
    onMove, 
    updatePriority, 
    onDelete,
    onDropTask,
    onDragStart,
    onDragEnd,
    readOnly = false,
    completed = false
}) {
    
    const columnIndex = STATUS_COLUMNS.findIndex((c) => c.key === column.key)
    const theme = column.theme

    // Depth counter keeps the highlight stable while the pointer moves over
    // nested children (each child crossing pairs an enter with a leave).
    const dragDepth = useRef(0)
    const [isDragOver, setIsDragOver] = useState(false)

    const handleDragEnter = (e) => {
        e.preventDefault()
        dragDepth.current += 1
        setIsDragOver(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        dragDepth.current -= 1
        if (dragDepth.current <= 0) {
            dragDepth.current = 0
            setIsDragOver(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        dragDepth.current = 0
        setIsDragOver(false)
        onDropTask(column.key)
    }

    return (
        <div
            className={`flex-1 min-w-70 flex flex-col rounded-2xl border bg-[#FFFFFF] overflow-hidden transition-all duration-200 ${
                isDragOver ? 'border-transparent scale-[1.01]' : 'border-[#0000000D]'
            }`}
            style={{
                boxShadow: isDragOver
                    ? `0 0 0 2px ${theme.ring}, 0 16px 32px -12px rgba(16, 24, 40, 0.18)`
                    : '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
            }}
            {...(!readOnly && !completed
                ? {
                      onDragEnter: handleDragEnter,
                      onDragOver: (e) => e.preventDefault(),
                      onDragLeave: handleDragLeave,
                      onDrop: handleDrop,
                  }
                : {})}
        >
            {/* Accent strip */}
            <div
                className='h-1.5 w-full shrink-0'
                style={{ background: `linear-gradient(90deg, ${theme.from}, ${theme.to})` }}
            />

            {/* Header */}
            <div className='flex items-center justify-between gap-2 px-4 pt-3.5 pb-3'>
                <div className='flex items-center gap-2.5 min-w-0'>
                    <span
                        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'
                        style={{ backgroundColor: theme.soft, color: theme.text }}
                    >
                        <i className={`${column.icon} text-[13px]`}></i>
                    </span>
                    <div className='min-w-0'>
                        <h3 className='truncate font-semibold text-[15px]/[20px] text-[#090909]'>
                            {column.label}
                        </h3>
                        <p className='truncate text-[11px]/[14px] text-[#667085]'>{theme.hint}</p>
                    </div>
                </div>
                <span
                    className='inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 font-semibold text-[13px]/[18px]'
                    style={{ backgroundColor: theme.soft, color: theme.text }}
                >
                    {tasks.length}
                </span>
            </div>

            {/* Body */}
            <div
                className='mx-2 mb-2 flex flex-1 flex-col gap-3 overflow-y-auto no-scrollbar rounded-xl px-2.5 py-2.5'
                style={{ backgroundColor: theme.body }}
            >
                {tasks.length === 0 && (
                    <div
                        className='flex flex-col items-center gap-1.5 rounded-xl border border-dashed py-7 text-center transition-opacity duration-200'
                        style={{
                            borderColor: theme.ring,
                            color: theme.text,
                            opacity: isDragOver ? 1 : 0.55,
                        }}
                    >
                        <i className={`${column.icon} text-[15px]`}></i>
                        <p className='text-[11px]/[15px] font-medium'>
                            {isDragOver ? 'Release to move here' : 'No tasks yet'}
                        </p>
                    </div>
                )}
                {tasks.map((task) => (
                    <KanbanTaskCard
                        key={task.id}
                        task={task}
                        theme={theme}
                        canMoveLeft={columnIndex > 0}
                        canMoveRight={columnIndex < STATUS_COLUMNS.length - 1}
                        onMove={onMove}
                        updatePriority={updatePriority}
                        onDelete={onDelete}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        readOnly={readOnly}
                        completed={completed}
                    />
                ))}
            </div>
        </div>
    )
}

export default KanbanColumn
