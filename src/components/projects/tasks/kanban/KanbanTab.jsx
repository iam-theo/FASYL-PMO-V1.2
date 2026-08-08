import { useMemo } from 'react'
import {  PlusCircleIcon } from '../icons'
import KanbanColumn from './KanbanColumn'
import { STATUS_COLUMNS } from './kanbanConstants'
import { updateTask } from '../../../../api'

function KanbanTab({ 
    tasks, 
    setTasks, 
    filteredTasks, 
    openModal,
    updatePriority,
    setDeleteTarget
}) {

    const tasksByStatus = useMemo(() => {
        const grouped = {}
        STATUS_COLUMNS.forEach((column) => {
            grouped[column.key] = filteredTasks.filter((task) => task.status === column.key)
        })
        return grouped
    }, [filteredTasks])

    const handleMove = async (taskId, direction) => {
        const task = tasks.find((t) => t.id === taskId);

        if (!task) return;

        const currentIndex = STATUS_COLUMNS.findIndex(
            (column) => column.key === task.status
        );

        const nextIndex = currentIndex + direction;

        if (nextIndex < 0 || nextIndex >= STATUS_COLUMNS.length) return;

        const newStatus = STATUS_COLUMNS[nextIndex].key;

        // Save current state
        const previousTasks = tasks;

        // Optimistic update
        setTasks((prev) =>
            prev.map((task) =>
                task.id === taskId
                    ? { ...task, status: newStatus }
                    : task
            )
        );

        try {
            const response = await updateTask(taskId, {
                status: newStatus,
            });

            const updatedTask = response.data;

            console.log("updatedTask", updatedTask);

            setTasks((prev) =>
                prev.map((task) =>
                    task.id === updatedTask.id ? updatedTask : task
                )
            );
        } catch (err) {
            console.error(err);

            // Roll back if the request failed
            setTasks(previousTasks);
        }
    };

    return (
        <div className='flex flex-col h-full'>

            <div className='flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4'>
                {tasks.length === 0 ? (
                    <KanbanEmptyState onCreateTask={() => openModal(true)} />
                ) : (
                    <div className='flex items-start gap-3 h-full overflow-x-auto no-scrollbar'>
                        {STATUS_COLUMNS.map((column) => (
                            <KanbanColumn
                                key={column.key}
                                column={column}
                                tasks={tasksByStatus[column.key] ?? []}
                                onMove={handleMove}
                                updatePriority={updatePriority}
                                onDelete={(task) => setDeleteTarget({ ids: [task.id] })}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function KanbanEmptyState({ onCreateTask }) {
    return (
        <div className='flex items-center justify-center py-20 px-4'>
            <div className='w-full max-w-88 flex flex-col items-center gap-6 text-center'>
                <div className='flex flex-col items-center gap-4'>
                    <div className='w-15.5 h-15.5 rounded-lg border border-[#0000000D] bg-[#F3F3F3] flex items-center justify-center'>
                        <i className="fa-solid fa-table-columns fa-xl text-[#DBDBDB]"></i>
                    </div>
                    <div className='flex flex-col items-center gap-1'>
                        <h3 className='font-medium text-[16px]/[24px] text-[#090909]'>You have not created any tasks</h3>
                        <p className='font-normal text-[14px]/[20px] text-[#636363]'>Click the buttton below to create a new task.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onCreateTask}
                    className='w-full rounded-lg border border-[#0000000D] bg-[#1B3C4A] px-4 py-2.5 flex items-center justify-center gap-2 cursor-pointer'
                >
                    <PlusCircleIcon />
                    <span className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>Create Task</span>
                </button>
            </div>
        </div>
    )
}

export default KanbanTab
