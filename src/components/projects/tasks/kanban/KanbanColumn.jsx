import KanbanTaskCard from './KanbanTaskCard'
import { STATUS_COLUMNS } from './kanbanConstants'

function KanbanColumn({ 
    column, 
    tasks, 
    onMove, 
    updatePriority, 
    onDelete 
}) {
    
    const columnIndex = STATUS_COLUMNS.findIndex((c) => c.key === column.key)

    return (
        <div className='flex-1 min-w-70 flex flex-col gap-4 rounded-lg border border-[#0000000D] bg-[#FFFFFF80] p-4'>
            <div className='flex items-center justify-between'>
                <h3 className='font-medium text-[16px]/[24px] text-[#090909]'>{column.label}</h3>
                <span className='inline-flex items-center justify-center rounded-2xl bg-[#F2F4F7] px-2 py-0.5 font-medium text-[14px]/[18px] text-black'>
                    +{tasks.length}
                </span>
            </div>

            <div className='flex flex-col gap-3 overflow-y-auto no-scrollbar'>
                {tasks.map((task) => (
                    <KanbanTaskCard
                        key={task.id}
                        task={task}
                        canMoveLeft={columnIndex > 0}
                        canMoveRight={columnIndex < STATUS_COLUMNS.length - 1}
                        onMove={onMove}
                        updatePriority={updatePriority}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    )
}

export default KanbanColumn
