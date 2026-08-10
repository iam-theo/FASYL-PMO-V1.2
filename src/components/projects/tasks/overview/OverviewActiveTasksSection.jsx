import { ChevronDownIcon } from '../icons'
import { ChevronRightIcon } from './icons'
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, PRIORITY_BADGE_COLORS, TASK_STATUS_LABELS } from '../tasks/taskConstants'
import { updateTask } from '../../../../api'
import SubmitProofModal from '../tasks/SubmitProofModal'
import { useState } from 'react'

const PREVIEW_COUNT = 5

function OverviewActiveTasksSection({ tasks = [], setTasks, onSeeAll, onNavigate, readOnly = false, viewOnly = false }) {
    const previewTasks = tasks.slice(0, PREVIEW_COUNT)
    const effectiveReadOnly = readOnly || viewOnly
    const isClickable = typeof onNavigate === "function";

    const [proofTarget, setProofTarget] = useState(null)

    const applyUpdatedTask = (updatedTask) => {
        setTasks((prevTasks) =>
            prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
        )
    }

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const response = await updateTask(taskId, { status: newStatus })
            const updatedTask = response.data

            applyUpdatedTask(updatedTask)
        } catch (err) {
            console.error(err)
        }
    }

    const handleSubmitProof = async (task, file) => {
        try {
            const response = await updateTask(task.id, {
                status: "PENDING_CONFIRMATION",
                file,
            })
            const updatedTask = response.data

            applyUpdatedTask(updatedTask)
            setProofTarget(null)
        } catch (err) {
            console.error(err)
        }
    }

    const handleStaffStatusChange = (taskId, newStatus) => {
        if (newStatus === "DONE" || newStatus === "PENDING_CONFIRMATION") {
            const task = tasks.find((t) => t.id === taskId)
            if (task) setProofTarget(task)
            return
        }
        handleStatusChange(taskId, newStatus)
    }

    const handlePriorityChange = async (taskId, newPriority) => {
        try {
            const response = await updateTask(taskId, { priority: newPriority })
            const updatedTask = response.data

            setTasks((prevTasks) =>
                prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
            )
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div
            onClick={isClickable ? onNavigate : undefined}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={
                isClickable
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onNavigate();
                          }
                      }
                    : undefined
            }
            className={`flex flex-col gap-4 ${isClickable ? "cursor-pointer" : ""}`}
        >
            <div className='flex items-center justify-between gap-4'>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Active Tasks</h3>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSeeAll?.();
                    }}
                    className='px-4 py-2.5 rounded-lg border border-[#0000000D] flex items-center gap-2 cursor-pointer'
                >
                    <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>See All</span>
                    <ChevronRightIcon />
                </button>
            </div>

            <div className='rounded-lg border border-[#0000000D] bg-[#F9FAFB] overflow-auto max-h-100'>
                {previewTasks.length === 0 ? (
                    <div className='px-6 py-10 text-center font-normal text-[14px]/[20px] text-[#636363]'>
                        No active tasks yet.
                    </div>
                ) : (
                    <table className='w-full border-collapse min-w-175'>
                        <thead className='sticky top-0 bg-[#F9FAFB] z-10'>
                            <tr className='border-b border-[#0000000D]'>
                                <th className='px-6 py-4 text-left font-medium text-[12px]/[18px] text-[#636363]'>Task</th>
                                <th className='px-6 py-4 text-left font-medium text-[12px]/[18px] text-[#636363]'>Assigned To</th>
                                <th className='px-6 py-4 text-left font-medium text-[12px]/[18px] text-[#636363]'>Priority</th>
                                <th className='px-6 py-4 text-left font-medium text-[12px]/[18px] text-[#636363]'>Status</th>
                                <th className='px-6 py-4 text-left font-medium text-[12px]/[18px] text-[#636363]'>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewTasks.map((task) => (
                                <tr key={task.id} className='border-b border-[#0000000D] last:border-b-0'>
                                    <td className='px-6 py-4 font-medium text-[14px]/[20px] text-[#090909] whitespace-nowrap'>
                                        {task.title}
                                    </td>
                                    <td className='px-6 py-4 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap'>
                                        {task.assignee?.fullName}
                                    </td>
                                    <td className='px-6 py-4'>
                                        {effectiveReadOnly ? (
                                            <span
                                                className='inline-flex items-center rounded-2xl px-3 py-1 text-white font-normal text-[14px]/[20px]'
                                                style={{ backgroundColor: PRIORITY_BADGE_COLORS[task.priority] ?? "#949494" }}
                                            >
                                                {task.priority}
                                            </span>
                                        ) : (
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                className='relative inline-flex items-center rounded-2xl px-2 py-1'
                                                style={{ backgroundColor: PRIORITY_BADGE_COLORS[task.priority] ?? "#949494" }}
                                            >
                                                <select
                                                    value={task.priority}
                                                    onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                                                    className='w-full appearance-none bg-transparent text-white font-normal text-[14px]/[20px] pl-1 pr-6 rounded-2xl cursor-pointer outline-none'
                                                >
                                                    {TASK_PRIORITY_OPTIONS.map((option) => (
                                                        <option key={option} value={option} className='text-[#667085]'>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDownIcon
                                                    stroke="white"
                                                    className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2"
                                                />
                                            </div>
                                        )}
                                    </td>
                                    <td className='px-6 py-4'>
                                        {viewOnly ? (
                                            <span className='inline-flex items-center rounded-lg px-3.5 py-2.5 font-normal text-[14px]/[20px] text-[#667085] bg-[#F2F4F7]'>
                                                {TASK_STATUS_LABELS[task.status] ?? task.status}
                                            </span>
                                        ) : (
                                        <div onClick={(e) => e.stopPropagation()} className='relative w-36.5 rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]'>
                                            <select
                                                value={task.status}
                                                onChange={(e) =>
                                                    readOnly
                                                        ? handleStaffStatusChange(task.id, e.target.value)
                                                        : handleStatusChange(task.id, e.target.value)
                                                }
                                                className='w-full appearance-none px-3.5 py-2.5 pr-9 rounded-lg outline-none font-normal text-[16px]/[24px] text-[#667085] bg-transparent cursor-pointer'
                                            >
                                                {TASK_STATUS_OPTIONS.map((option) => (
                                                    <option key={option} value={option}>
                                                        {TASK_STATUS_LABELS[option] ?? option}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDownIcon className='pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2' />
                                        </div>
                                        )}
                                    </td>
                                    <td className='px-6 py-4 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap'>
                                        {task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

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

export default OverviewActiveTasksSection
