import { useMemo, useState } from 'react'
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
    setDeleteTarget,
    tasksEnabled = true,
    readOnly = false,
    completed = false
}) {

    const tasksByStatus = useMemo(() => {
        const grouped = {}
        STATUS_COLUMNS.forEach((column) => {
            grouped[column.key] = filteredTasks.filter((task) => task.status === column.key)
        })
        return grouped
    }, [filteredTasks])

    const [draggingTaskId, setDraggingTaskId] = useState(null)

    // Shared status-change core: optimistic update, persist, roll back on failure.
    // Used by both the arrow buttons and drag-and-drop.
    const moveTaskToStatus = async (taskId, newStatus) => {
        const task = tasks.find((t) => t.id === taskId);

        if (!task || task.status === newStatus) return;

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

    const handleMove = (taskId, direction) => {
        const task = tasks.find((t) => t.id === taskId);

        if (!task) return;

        const currentIndex = STATUS_COLUMNS.findIndex(
            (column) => column.key === task.status
        );

        const nextIndex = currentIndex + direction;

        if (nextIndex < 0 || nextIndex >= STATUS_COLUMNS.length) return;

        moveTaskToStatus(taskId, STATUS_COLUMNS[nextIndex].key);
    };

    const handleDropTask = (columnKey) => {
        if (!draggingTaskId) return;

        const taskId = draggingTaskId;
        setDraggingTaskId(null);

        moveTaskToStatus(taskId, columnKey);
    };

    return (
        <div className='flex flex-col h-full'>

            <div className='flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4'>
                {tasks.length === 0 ? (
                    <KanbanEmptyState onCreateTask={() => openModal(true)} tasksEnabled={tasksEnabled} readOnly={readOnly} completed={completed} />
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
                                onDropTask={handleDropTask}
                                onDragStart={setDraggingTaskId}
                                onDragEnd={() => setDraggingTaskId(null)}
                                readOnly={readOnly}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function KanbanEmptyState({ onCreateTask, tasksEnabled = true, readOnly = false, completed = false }) {
    const heading = completed
        ? 'This project has been completed'
        : readOnly
            ? 'No tasks assigned to you'
            : tasksEnabled
                ? 'You have not created any tasks'
                : 'Tasks are locked for this stage';

    const description = completed
        ? 'No new tasks can be created.'
        : readOnly
            ? 'Tasks assigned to you will appear here.'
            : tasksEnabled
                ? 'Click the buttton below to create a new task.'
                : 'Task assignment opens once the project reaches Planning (stage 4).';

    return (
        <div className='flex items-center justify-center py-20 px-4'>
            <div className='w-full max-w-88 flex flex-col items-center gap-6 text-center'>
                <div className='flex flex-col items-center gap-4'>
                    <div className='w-15.5 h-15.5 rounded-lg border border-[#0000000D] bg-[#F3F3F3] flex items-center justify-center'>
                        <i className="fa-solid fa-table-columns fa-xl text-[#DBDBDB]"></i>
                    </div>
                    <div className='flex flex-col items-center gap-1'>
                        <h3 className='font-medium text-[16px]/[24px] text-[#090909]'>{heading}</h3>
                        <p className='font-normal text-[14px]/[20px] text-[#636363]'>{description}</p>
                    </div>
                </div>
                {!completed && !readOnly && tasksEnabled && (
                    <button
                        type="button"
                        onClick={onCreateTask}
                        className='w-full rounded-lg border border-[#0000000D] bg-[#1B3C4A] px-4 py-2.5 flex items-center justify-center gap-2 cursor-pointer'
                    >
                        <PlusCircleIcon />
                        <span className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>Create Task</span>
                    </button>
                )}
            </div>
        </div>
    )
}

export default KanbanTab
