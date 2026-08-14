import { useMemo, useState } from 'react'
import { ChevronDownIcon, CheckboxCheckIcon, MoreVerticalIcon, TrashIcon, PlusCircleIcon } from '../icons'
import CreateTaskModal from './CreateTaskModal'
import DeleteTaskModal from './DeleteTaskModal'
import SubmitProofModal from './SubmitProofModal'
import KanbanTab from '../kanban/KanbanTab'
import {
    TASK_STATUS_OPTIONS,
    TASK_PRIORITY_OPTIONS,
    PRIORITY_BADGE_COLORS,
    TASK_STATUS_LABELS,
    areTasksEnabledForProject,
} from './taskConstants'
import { DUE_DATE_FILTERS, matchesDueDateFilter } from './dueDateFilters'
import { createTask, deleteTask, updateTask } from '../../../../api'
import { useNotification } from '../../../NotificationContext'

const ITEMS_PER_PAGE = 5

function TasksTab({ 
    tasks, 
    setTasks, 
    resources, 
    loggedInUser,
    projectManagers,
    project, 
    // setProject 
    readOnly = false,
    viewOnly = false,
}) {

    // console.log(project)

    //this is a comment

    const { showNotification } = useNotification();

    const effectiveReadOnly = readOnly || viewOnly;

    const tasksEnabled = areTasksEnabledForProject(project);

    const [view, setView] = useState('list')
    const [selectedIds, setSelectedIds] = useState([])
    const [isEditing, setIsEditing] = useState(false)
    // const [editingTask, setEditingTask] = useState(null)
    const [editValues, setEditValues] = useState(null);
    const [currentPage, setCurrentPage] = useState(1)
    const [openMenuId, setOpenMenuId] = useState(null)

    const [statusFilter, setStatusFilter] = useState("All Status")
    const [priorityFilter, setPriorityFilter] = useState("All Priorities")
    const [assigneeFilter, setAssigneeFilter] = useState("All Team Members")
    const [dueDateFilter, setDueDateFilter] = useState("Due Date")

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null) // { ids: [...] } | null
    const [proofTarget, setProofTarget] = useState(null) // task awaiting proof upload

    const assigneeOptions = useMemo(() => {
        const members = [...resources, ...tasks.map(t => t.assignedTo)]
            .filter(Boolean);

        const unique = members.filter(
            (member, index, self) =>
                index === self.findIndex(
                    m => m.recordId === member.recordId
                )
        );

        return unique.map(member => ({
            value: member.recordId,
            label: `${member.firstName} ${member.lastName}`
        }));
    }, [resources, tasks]);

    // console.log(tasks);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (statusFilter !== "All Status" && task.status !== statusFilter) return false

            if (priorityFilter !== "All Priorities" && task.priority !== priorityFilter) return false

            if (
                assigneeFilter !== "All Team Members" &&
                !(
                    task.assignee?.id === assigneeFilter ||
                    (Array.isArray(task.assignees) &&
                        task.assignees.some((assignee) => assignee.id === assigneeFilter))
                )
            ) {
                return false;
            }

            if (!matchesDueDateFilter(task.dueDate, dueDateFilter)) return false

            return true
        })
    }, [tasks, statusFilter, priorityFilter, assigneeFilter, dueDateFilter])


    const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE))


    const paginatedTasks = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredTasks.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredTasks, currentPage])

    const allOnPageSelected = paginatedTasks.length > 0 && paginatedTasks.every((t) => selectedIds.includes(t.id))

    const toggleSelectAllOnPage = () => {
        if (allOnPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !paginatedTasks.some((t) => t.id === id)))
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...paginatedTasks.map((t) => t.id)])))
        }
    }


    const toggleSelectTask = (taskId) => {
        setSelectedIds((prev) =>
            prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
        )
    }

    const handleEditTask = (task) => {

        setIsEditing(true);

        // setEditingTask(task);

        setEditValues({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            startDate: task.startDate?.split("T")[0] ?? "",
            dueDate: task.dueDate?.split("T")[0] ?? "",
            assignee: task.assignee,
            assignees: task.assignees,
        });

        setIsCreateModalOpen(true);
    };


    const applyUpdatedTask = (updatedTask) => {
        setTasks((prevTasks) =>
            prevTasks
                .map((task) =>
                    task.id === updatedTask.id ? updatedTask : task
                )
                .sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )
        );
    };

    const isStaffUser = loggedInUser?.role === "STAFF";

    const handleStatusChange = async (taskId, newStatus) => {

        // Staff cannot mark a task done directly — they must attach proof of
        // completion, which lands the task in PENDING_CONFIRMATION.
        if (isStaffUser && (newStatus === "DONE" || newStatus === "PENDING_CONFIRMATION")) {
            const task = tasks.find((t) => t.id === taskId);
            if (task) setProofTarget(task);
            return;
        }

        try {

            const response = await updateTask(taskId, {status: newStatus});

            const updatedTask = response.data;

            console.log("updatedTask", updatedTask);

            applyUpdatedTask(updatedTask);

        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmitProof = async (task, file) => {
        try {
            const response = await updateTask(task.id, {
                status: "PENDING_CONFIRMATION",
                file,
            });

            const updatedTask = response.data;

            applyUpdatedTask(updatedTask);

            setProofTarget(null);

            showNotification({
                type: "success",
                title: "Proof Submitted",
                message: "Task submitted for project manager confirmation."
            });

        } catch (err) {
            console.error(err);

            showNotification({
                type: "error",
                title: "Submission Failed",
                message: "Unable to submit proof of completion."
            });
        }
    };

    const handlePriorityChange = async (taskId, newPriority) => {
        
        try {

            const response = await updateTask(taskId, {priority: newPriority});

            const updatedTask = response.data;

            console.log("updatedTask", updatedTask);

            setTasks((prevTasks) =>
                prevTasks
                    .map((task) =>
                        task.id === updatedTask.id ? updatedTask : task
                    )
                    .sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    )
            );

        } catch (err) {
            console.error(err);
        }
    }

    // const handleDueDateChange = async (taskId, dueDate) => {

    //     try {

    //         const response = await updateTask(taskId, {
    //             dueDate
    //         });

    //         const updatedTask = response.data;

    //         setTasks(prev =>
    //             prev.map(task =>
    //                 task.id === updatedTask.id
    //                     ? updatedTask
    //                     : task
    //             )
    //         );

    //     } catch (err) {
    //         console.error(err);
    //     }
    // };

    // const handleAssigneeChange = async (taskId, assignedResourceId) => {

    //     try {

    //         const response = await updateTask(taskId, {
    //             assignedResourceId
    //         });

    //         const updatedTask = response.data;

    //         setTasks(prev =>
    //             prev.map(task =>
    //                 task.id === updatedTask.id
    //                     ? updatedTask
    //                     : task
    //             )
    //         );

    //     } catch (err) {
    //         console.error(err);
    //     }
    // };

    const handleSaveTask = async (taskId, editTask) => {

        try {

            const response = await updateTask(
                taskId,
                editTask
            );

            console.log(response);

            const updatedTask = response.data;

            // console.log("updatedTask", updatedTask);

            setTasks((prevTasks) =>
                prevTasks
                    .map((task) =>
                        task.id === updatedTask.id ? updatedTask : task
                    )
                    .sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    )
            );

            setIsCreateModalOpen(false);
            // setEditingTask(null);
            setIsEditing(false);

            showNotification({
                type: "success",
                title: "Task Updated!",
                message: `You have successfully updated a task`
            });

        } catch (err) {
            console.error(err);

            showNotification({
                type: "error",
                title: "Failed To Update A Task!",
                message: "Unable to update a task"
            });
        }
    };


    const handleCreateTask = async (newTask) => {

        console.log("Received", newTask);

        try {
            const response = await createTask(newTask);

            console.log(response);

            const createdTask = response.data;

            // console.log("createdTask", createdTask)

            setTasks((prevTasks) =>
                [createdTask, ...prevTasks].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )
            );

            setIsCreateModalOpen(false);
            setCurrentPage(1);

            showNotification({
                type: "success",
                title: "Task Created!",
                message: `You have successfully assigned a task`
            });

        } catch(err) {
            console.error(err)

            
            showNotification({
                type: "error",
                title: "Failed To Create A Task!",
                message: "Unable to assign a task"
            });
        }
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {

            const responses = await Promise.all(
                deleteTarget.ids.map((id) => deleteTask(id))
            );

            const deletedTasks = responses.map((response) => response.data);

            const deletedTaskIds = responses.map((response) => response.data.id);

            console.log("deleted tasks:", deletedTasks);

            setTasks((prev) =>
                prev.filter((task) => !deletedTaskIds.includes(task.id))
            );

            setSelectedIds((prev) =>
                prev.filter((id) => !deleteTarget.ids.includes(id))
            );

            setDeleteTarget(null);
            setOpenMenuId(null);

            showNotification({
                type: "success",
                title: "Task Deleted",
                message:
                    deleteTarget.ids.length === 1
                        ? "Task deleted successfully."
                        : `${deleteTarget.ids.length} tasks deleted successfully.`
            });
        } catch (err) {
            console.error(err);

            showNotification({
                type: "error",
                title: "Delete Failed",
                message: "Unable to delete the selected task(s)."
            });
        }
    };

    // console.log(tasks);

    return (
        <div className='flex flex-col h-full'>
            <div className='px-4 pt-4 flex flex-col gap-4'>
                <div className='flex items-center justify-between gap-3 flex-wrap'>
                    <div className='flex-1 min-w-50 max-w-100 rounded-lg border border-[#0000001A] bg-[#FFFFFF] px-3.5 py-2.5 flex items-center gap-2'>
                        <i className="fa-solid fa-magnifying-glass text-[#090909]"></i>
                        <input
                            type="text"
                            placeholder='Search'
                            className='flex-1 outline-none font-normal text-[14px]/[24px] text-[#636363] bg-transparent'
                        />
                    </div>

                    <div className='flex items-center gap-3'>
                        {!effectiveReadOnly && tasksEnabled && <ViewToggle view={view} onChange={setView} />}

                        {!effectiveReadOnly && tasksEnabled && (
                            <button
                                type="button"
                                className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#E8E8E8] flex items-center gap-2 cursor-pointer'
                            >
                                <i className="fa-solid fa-file-export text-[#090909]"></i>
                                <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Export</span>
                            </button>
                        )}

                        {!effectiveReadOnly && tasksEnabled && (
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#1B3C4A] flex items-center gap-2 cursor-pointer'
                            >
                                <PlusCircleIcon />
                                <span className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>New Task</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                    <FilterSelect
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={["All Status", ...TASK_STATUS_OPTIONS]}
                    />
                    <FilterSelect
                        value={priorityFilter}
                        onChange={setPriorityFilter}
                        options={["All Priorities", ...TASK_PRIORITY_OPTIONS]}
                    />
                    <FilterSelect
                        value={assigneeFilter}
                        onChange={setAssigneeFilter}
                        options={["All Team Members", ...assigneeOptions]}
                    />
                    <FilterSelect
                        value={dueDateFilter}
                        onChange={setDueDateFilter}
                        options={DUE_DATE_FILTERS}
                    />
                </div>

                {!tasksEnabled && !effectiveReadOnly && (
                    <div className='rounded-lg border border-[#0000000D] bg-[#FFF4E5] p-4 flex items-center gap-3'>
                        <i className="fa-solid fa-lock text-[#B54708]"></i>
                        <p className='font-normal text-[14px]/[20px] text-[#7A2E0E]'>
                            Task assignment is not enabled yet. Stages 1-3 (Client ID, Engagement, Initiation) must be signed off before the project reaches Planning (stage 4).
                        </p>
                    </div>
                )}

                {!effectiveReadOnly && selectedIds.length > 0 && (
                    <div className='rounded-lg border border-[#0000000D] bg-[#FFFFFF80] p-4 flex items-center justify-between flex-wrap gap-3'>
                        <p className='font-medium text-[12px]/[18px] text-[#090909]'>{selectedIds.length} Selected</p>
                        <div className='flex items-center gap-3 flex-wrap'>
                            {/* <button
                                type="button"
                                disabled
                                className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#E8E8E8] flex items-center gap-2 cursor-not-allowed opacity-70'
                            >
                                <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Set Status</span>
                                <ChevronDownIcon />
                            </button>
                            <button
                                type="button"
                                disabled
                                className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#E8E8E8] flex items-center gap-2 cursor-not-allowed opacity-70'
                            >
                                <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Priority</span>
                                <ChevronDownIcon />
                            </button>
                            <button
                                type="button"
                                onClick={handleApplyChanges}
                                className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#1B3C4A] flex items-center gap-2 cursor-pointer'
                            >
                                <span className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>Apply Changes</span>
                            </button> */}
                            <button
                                type="button"
                                disabled={selectedIds.length === 0}
                                onClick={() => setDeleteTarget({ ids: [...selectedIds] })}
                                className='h-10 px-4.5 rounded-lg border border-[#D92D20] bg-[#D92D20] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <TrashIcon />
                                <span className='font-medium text-[16px]/[24px] text-[#FFFFFF]'>Delete Selected ({selectedIds.length})</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {
                !effectiveReadOnly && view === 'kanban' &&
                    (
                        <KanbanTab
                            tasks={tasks}
                            setTasks={setTasks}
                            resources={resources}
                            filteredTasks={filteredTasks}
                            openModal={setIsCreateModalOpen}
                            updatePriority={handlePriorityChange}
                            // viewToggle={<ViewToggle view={view} onChange={setView} />}
                            setDeleteTarget={setDeleteTarget}
                            tasksEnabled={tasksEnabled}
                        />
                    )
            }

            {
                view === 'list' && 
                    (
                        <div className='flex-1 min-h-0 w-full overflow-y-auto no-scrollbar px-4 py-4'>
                            {tasks.length === 0 ? (
                                <TasksEmptyState
                                    readOnly={effectiveReadOnly}
                                    locked={!tasksEnabled && !effectiveReadOnly}
                                    onCreateTask={() => setIsCreateModalOpen(true)}
                                />
                            ) : (
                                <div className='rounded-lg border border-[#0000000D] bg-[#F9FAFB] w-full overflow-x-auto'>
                                    <table className='border-collapse table-auto min-w-max'>
                                        <thead>
                                            <tr className='border-b border-[#0000000D]'>
                                                {!effectiveReadOnly && (
                                                    <th className='w-16 px-6 py-4 text-left'>
                                                        <TaskCheckbox checked={allOnPageSelected} onChange={toggleSelectAllOnPage} />
                                                    </th>
                                                )}
                                                <th className='px-6 py-4 text-left font-medium text-[12px]/[18px] text-[#636363]'>Task</th>
                                                <th className='px-6 py-4 text-left font-medium text-[12px]/[18px] text-[#636363]'>Assigned To</th>
                                                <th className='px-6 py-4 text-left font-medium text-[12px]/[18px] text-[#636363]'>Priority</th>
                                                <th className='px-6 py-4 text-left font-medium text-[12px]/[18px] text-[#636363]'>Status</th>
                                                <th className='px-6 py-4 text-left font-medium text-[12px]/[18px] text-[#636363]'>Due Date</th>
                                                {!effectiveReadOnly && (
                                                    <th className='px-6 py-4 text-right font-medium text-[12px]/[18px] text-[#636363]'>Actions</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedTasks.length === 0 && (
                                                <tr>
                                                    <td colSpan={effectiveReadOnly ? 6 : 7} className='px-6 py-10 text-center font-normal text-[14px]/[20px] text-[#636363]'>
                                                        No tasks match the selected filters.
                                                    </td>
                                                </tr>
                                            )}
                                            {paginatedTasks.map((task) => (
                                                <tr 
                                                    key={task.id} 
                                                    onClick={effectiveReadOnly ? undefined : () => handleEditTask(task)}
                                                    className={`border-b border-[#0000000D] last:border-b-0 ${effectiveReadOnly ? "" : "cursor-pointer"}`}>
                                                    {!effectiveReadOnly && (
                                                        <td className='px-6 py-4'>
                                                            <TaskCheckbox
                                                                checked={selectedIds.includes(task.id)}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleSelectTask(task.id)
                                                                }}
                                                            />
                                                        </td>
                                                    )}
                                                    <td className='px-6 py-4 font-medium text-[14px]/[20px] text-[#090909] whitespace-nowrap'>
                                                        {task.title}
                                                        {task.documents?.length > 0 && (
                                                            <div className='mt-1.5 flex flex-col gap-1'>
                                                                {task.documents.map((doc, index) => (
                                                                    <a
                                                                        key={index}
                                                                        href={doc.fileUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        title={doc.fileName}
                                                                        className='inline-flex items-center gap-1.5 font-normal text-[12px]/[18px] text-[#1B3C4A] hover:underline'
                                                                    >
                                                                        <i className="fa-solid fa-paperclip"></i>
                                                                        {doc.fileName}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className='px-6 py-4 whitespace-nowrap'>
                                                        {(Array.isArray(task.assignees) && task.assignees.length > 0
                                                            ? task.assignees
                                                            : task.assignee
                                                                ? [task.assignee]
                                                                : []
                                                        ).map((assignee) => (
                                                            <span
                                                                key={assignee.id}
                                                                className='inline-flex items-center rounded-full border border-[#0000000D] bg-[#FFFFFF] px-2.5 py-1 mr-1.5 mb-1 font-normal text-[12px]/[18px] text-[#344054]'
                                                            >
                                                                {assignee.fullName}
                                                            </span>
                                                        ))}
                                                        {(Array.isArray(task.assignees) && task.assignees.length === 0) && !task.assignee && (
                                                            <span className='font-normal text-[14px]/[20px] text-[#636363]'>
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className='px-6 py-4'>
                                                        {effectiveReadOnly ? (
                                                            <span
                                                                className="inline-flex items-center rounded-2xl px-4 py-1.5 text-white font-normal text-[12px]/[24px]"
                                                                style={{
                                                                    backgroundColor:
                                                                        PRIORITY_BADGE_COLORS[task.priority] ?? "#949494",
                                                                }}
                                                            >
                                                                {task.priority}
                                                            </span>
                                                        ) : (
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="relative inline-flex items-center rounded-2xl px-2 py-1"
                                                            style={{
                                                                backgroundColor:
                                                                    PRIORITY_BADGE_COLORS[task.priority] ?? "#949494",
                                                            }}
                                                        >
                                                            <select
                                                                value={task?.priority}
                                                                onChange={(e) =>
                                                                    handlePriorityChange(task.id, e.target.value)
                                                                }
                                                                className="w-full appearance-none bg-transparent text-white font-normal text-[12px]/[24px] px-3 py-1 pr-8 rounded-2xl cursor-pointer outline-none"
                                                            >
                                                                {TASK_PRIORITY_OPTIONS.map((option) => (
                                                                    <option
                                                                        key={option}
                                                                        value={option}
                                                                        className='text-[#667085]'
                                                                    >
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            <ChevronDownIcon
                                                                stroke="white"
                                                                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                                                            />
                                                        </div>
                                                        )}
                                                    </td>
                                                    <td className='px-6 py-4'>
                                                        {viewOnly ? (
                                                            <span className='inline-flex items-center rounded-lg px-3.5 py-2.5 font-normal text-[12px]/[24px] text-[#667085] bg-[#F2F4F7]'>
                                                                {TASK_STATUS_LABELS[task.status] ?? task.status}
                                                            </span>
                                                        ) : task.status === "PENDING_CONFIRMATION" && loggedInUser?.role === "PROJECTMANAGER" ? (
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            className='flex items-center gap-2'
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStatusChange(task.id, "DONE")}
                                                                className='rounded-lg bg-[#1B3C4A] px-3.5 py-2 font-medium text-[12px]/[24px] text-[#FFFFFF] cursor-pointer'
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                                                                className='rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] px-3.5 py-2 font-medium text-[12px]/[24px] text-[#344054] cursor-pointer'
                                                            >
                                                                Send Back
                                                            </button>
                                                        </div>
                                                        ) : (
                                                        <div 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className='relative w-36.5 rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]'>
                                                            <select
                                                                value={task.status}
                                                                onChange={(e) => 
                                                                    handleStatusChange(task.id, e.target.value)
                                                                }
                                                                className='w-full appearance-none px-3.5 py-2.5 pr-9 rounded-lg outline-none font-normal text-[12px]/[24px] text-[#667085] bg-transparent cursor-pointer'
                                                            >
                                                                {TASK_STATUS_OPTIONS.map((option, index) => (
                                                                    <option 
                                                                        key={index} 
                                                                        value={option}>
                                                                        {TASK_STATUS_LABELS[option] ?? option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <ChevronDownIcon className='pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2' />
                                                        </div>
                                                        )}
                                                    </td>
                                                    <td className='px-6 py-4 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap'>
                                                        {new Date(task.dueDate).toISOString().split("T")[0]}
                                                    </td>
                                                    {!effectiveReadOnly && (
                                                    <td className='px-6 py-4 text-right relative'>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId((prev) => (prev === task.id ? null : task.id))}
                                                            }
                                                            className='w-5 h-5 inline-flex items-center justify-center cursor-pointer'
                                                            aria-label="Task actions"
                                                        >
                                                            <MoreVerticalIcon stroke='#344054' />
                                                        </button>
                                                        {openMenuId === task.id && (
                                                            <div className='absolute right-6 top-12 z-10 w-32 rounded-lg border border-[#0000000D] bg-[#FFFFFF] shadow-[0_4px_6px_-2px_rgba(16,24,40,0.03),0_12px_16px_-4px_rgba(16,24,40,0.08)] overflow-hidden'>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenMenuId(null);
                                                                        setDeleteTarget({ ids: [task.id] })}
                                                                    }
                                                                    className='w-full px-4 py-2.5 text-left font-medium text-[14px]/[20px] text-[#D92D20] hover:bg-[#FEF3F2] cursor-pointer'
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )
            }

            {
                view === 'list' && 
                    (
                        tasks.length > 0 && (
                            <div className='border-t border-[#0000000D] bg-[#F2F2F2] px-6 py-4 flex items-center justify-between'>
                                <p className='font-medium text-[14px]/[20px] text-[#636363]'>Page {currentPage} of {totalPages}</p>
                                <div className='flex items-center gap-2'>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                        disabled={currentPage === 1}
                                        className='rounded-md border border-[#0000000D] shadow-[2px] shadow-[#1018280D] py-2.25 px-4.25 bg-[#E8E8E8] hover:bg-[#1B3C4A] font-medium text-[14px]/[20px] text-[#1B3C4A] hover:text-[#FFFFFF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#E8E8E8] disabled:hover:text-[#1B3C4A]'
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className='rounded-md border border-[#0000000D] shadow-[2px] shadow-[#1018280D] py-2.25 px-4.25 bg-[#E8E8E8] hover:bg-[#1B3C4A] font-medium text-[14px]/[20px] text-[#1B3C4A] hover:text-[#FFFFFF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#E8E8E8] disabled:hover:text-[#1B3C4A]'
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )
                    )
            }

            {isCreateModalOpen && (
                <CreateTaskModal
                    onClose={() => {
                        setIsCreateModalOpen(false),
                        setIsEditing(false),
                        setEditValues(null)
                    }}
                    onCreate={handleCreateTask}
                    loggedInUser={loggedInUser}
                    project={project}
                    resources={resources}
                    projectManagers={projectManagers}

                    key={isEditing === true ? editValues.id : "create"}
                    isEditing={isEditing}
                    editValues={editValues}
                    onEdit={handleSaveTask}
                />
            )}

            {deleteTarget && (
                <DeleteTaskModal
                    count={deleteTarget.ids.length}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}

            {proofTarget && (
                <SubmitProofModal
                    task={proofTarget}
                    onCancel={() => setProofTarget(null)}
                    onSubmit={handleSubmitProof}
                />
            )}
        </div>
    )
}

function TaskCheckbox({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={onChange}
            aria-pressed={checked}
            className={`w-5 h-5 flex items-center justify-center rounded-md border cursor-pointer ${
                checked ? "border-[#7F56D9] bg-[#F9F5FF]" : "border-[#D0D5DD] bg-[#FFFFFF]"
            }`}
        >
            {checked && <CheckboxCheckIcon />}
        </button>
    )
}

function FilterSelect({ value, onChange, options }) {
    return (
        <div className='relative rounded-lg border border-[#0000000D] bg-[#E8E8E8]'>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className='w-full appearance-none px-4 py-2.5 pr-10 rounded-lg outline-none font-medium text-[14px]/[20px] text-[#1B3C4A] bg-transparent cursor-pointer'
            >
                {options.map((option) => {
                    if (typeof option === "string") {
                        return (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        );
                    }

                    return (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    );
                })}
            </select>
            <ChevronDownIcon className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2' />
        </div>
    )
}

function TasksEmptyState({ onCreateTask, readOnly = false, locked = false }) {
    return (
        <div className='flex items-center justify-center py-20 px-4'>
            <div className='w-full max-w-88 flex flex-col items-center gap-6 text-center'>
                <div className='flex flex-col items-center gap-4'>
                    <div className='w-15.5 h-15.5 rounded-lg border border-[#0000000D] bg-[#F3F3F3] flex items-center justify-center'>
                        <i className="fa-solid fa-list-check fa-xl text-[#DBDBDB]"></i>
                    </div>
                    <div className='flex flex-col items-center gap-1'>
                        <h3 className='font-medium text-[16px]/[24px] text-[#090909]'>{locked ? 'Tasks are locked for this stage' : readOnly ? 'No tasks assigned to you' : 'You have not created any tasks'}</h3>
                        <p className='font-normal text-[14px]/[20px] text-[#636363]'>{locked ? 'Task assignment opens once the project reaches Planning (stage 4).' : readOnly ? 'Tasks assigned to you will appear here.' : 'Click the buttton below to create a new task.'}</p>
                    </div>
                </div>
                {!readOnly && !locked && (
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

function ListViewIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.60059 4.1665H17.6006" stroke="black" strokeWidth="1.25" strokeLinecap="round" />
            <path d="M7.60059 10H17.6006" stroke="black" strokeWidth="1.25" strokeLinecap="round" />
            <path d="M7.60059 15.8335H17.6006" stroke="black" strokeWidth="1.25" strokeLinecap="round" />
            <path d="M2.70508 4.16683H2.60091M2.80924 4.16683C2.80924 4.28189 2.71597 4.37516 2.60091 4.37516C2.48585 4.37516 2.39258 4.28189 2.39258 4.16683C2.39258 4.05177 2.48585 3.9585 2.60091 3.9585C2.71597 3.9585 2.80924 4.05177 2.80924 4.16683Z" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.70508 9.99984H2.60091M2.80924 9.99984C2.80924 10.1149 2.71597 10.2082 2.60091 10.2082C2.48585 10.2082 2.39258 10.1149 2.39258 9.99984C2.39258 9.88475 2.48585 9.7915 2.60091 9.7915C2.71597 9.7915 2.80924 9.88475 2.80924 9.99984Z" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.70508 15.8333H2.60091M2.80924 15.8333C2.80924 15.9484 2.71597 16.0417 2.60091 16.0417C2.48585 16.0417 2.39258 15.9484 2.39258 15.8333C2.39258 15.7182 2.48585 15.625 2.60091 15.625C2.71597 15.625 2.80924 15.7182 2.80924 15.8333Z" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function KanbanViewIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.757 3.24286C17.9163 4.40224 17.9163 6.26821 17.9163 10.0002C17.9163 13.7321 17.9163 15.5981 16.757 16.7575C15.5976 17.9168 13.7316 17.9168 9.99967 17.9168C6.26772 17.9168 4.40175 17.9168 3.24237 16.7575C2.08301 15.5981 2.08301 13.7321 2.08301 10.0002C2.08301 6.26821 2.08301 4.40224 3.24237 3.24286C4.40175 2.0835 6.26772 2.0835 9.99967 2.0835C13.7316 2.0835 15.5976 2.0835 16.757 3.24286Z" fill="#C6C6C6" fillOpacity="0.8" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.08301 2.0835V17.9168" stroke="black" strokeWidth="1.25" />
            <path d="M12.917 2.0835V17.9168" stroke="black" strokeWidth="1.25" />
        </svg>
    )
}

function ViewToggle({ view, onChange }) {
    return (
        <div className='flex h-10 items-center gap-2 rounded-lg border border-[#0000000D] bg-[#FFFFFF] px-2 py-3'>
            <button
                type="button"
                onClick={() => onChange('list')}
                className={`flex items-center justify-center gap-2 rounded px-2 py-2.5 h-6.5 cursor-pointer ${
                    view === 'list' ? 'border border-[#0000000D] bg-[#E8E8E8]' : ''
                }`}
            >
                <ListViewIcon />
                <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>List</span>
            </button>
            <button
                type="button"
                onClick={() => onChange('kanban')}
                className={`flex items-center justify-center gap-2 rounded px-2 py-3 h-5 cursor-pointer ${
                    view === 'kanban' ? 'border border-[#0000000D] bg-[#E8E8E8]' : ''
                }`}
            >
                <KanbanViewIcon />
                <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Kanban</span>
            </button>
        </div>
    )
}

export default TasksTab