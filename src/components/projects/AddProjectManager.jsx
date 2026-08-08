import { useState } from 'react'
import { assignProject } from '../../api'
import { useNotification } from '../NotificationContext'

function AddProjectManager({
    setProjects, 
    selectedProject, 
    setSelectedProject, 
    projectManagers, 
    assignedManager,
    setAssignedManager, 
    onClose,
    title = "Assign A Project Manager",
    buttonLabel = "Assign Project Manager"
    }) {

    const [open, setOpen] = useState(false)
    const { showNotification } = useNotification()
    const project = selectedProject

    const hasSelection = Boolean(assignedManager) && assignedManager !== "Select A Project Manager"

    const handleAssign = async (projectId, email) => {
        try {
            const response = await assignProject(
            projectId,
            email
            );

            const updatedProject = response.data
            setSelectedProject(updatedProject)

            setProjects(prevProjects => 
                prevProjects.map(project =>
                    project.id === updatedProject.id
                        ? updatedProject
                        : project
                )
            )

            onClose();

            showNotification({
                type: "success",
                title: "Project Manager Assigned!",
                message: `You have successfully assigned a project manager to Project - ${project.projectName}`
            });

        } catch (err) {
            console.error(err);

            showNotification({
                type: "error",
                title: "Failed To Assign Project Manager!",
                message: "Unable to assign a project manager"
            });
        }
    };

    const projectDetails = [
        { label: "Client", value: project.clientName },
        { label: "Product", value: project.productName },
        { label: "Sales ID", value: project.salesId },
        { label: "Client PMO Address", value: project.pmoAddress },
    ];

    return (
        <div 
            className='fixed inset-0 z-2000 bg-[#00000080] flex justify-end'
            onClick={onClose}
            >
            <div 
                className='relative z-3000 flex flex-col w-full sm:w-135.5 h-full min-h-0 overflow-y-auto no-scrollbar bg-[#F7F7F7]'
                onClick={(e) => e.stopPropagation()}>
                <div className='flex items-center justify-between gap-3 sticky top-0 px-4 py-4 bg-[#F7F7F7] border-b border-[#0000000D]'>
                    <h2 className='font-semibold text-[16px]/[20px] text-[#090909]'>{title}</h2>
                    <button
                    type="button"
                    onClick={onClose}
                    className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#E8E8E8] flex items-center gap-2 cursor-pointer shrink-0'>
                        <p className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Close</p>
                        <i className="fa-regular fa-circle-xmark fa-sm"></i>
                    </button>
                </div>

                <div className='flex flex-col gap-4 flex-1 px-4 py-4'>
                    <div className='rounded-lg border border-[#0000000D] bg-[#F3F3F3] p-4 flex flex-col gap-3'>
                        <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>{project.projectName}</h3>
                        <ul className='flex flex-col gap-2.5'>
                            {projectDetails.map((detail) => (
                                <li key={detail.label} className='flex items-start justify-between gap-3'>
                                    <span className='font-normal text-[13px]/[20px] text-[#636363]'>{detail.label}</span>
                                    <span className='font-medium text-[14px]/[20px] text-[#090909] text-right'>{detail.value || "—"}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='font-medium text-[14px]/[20px] text-[#090909]'>Assign Project Manager</label>
                        <div
                            className='relative'
                            onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
                            }}
                        >
                            <button 
                                type="button"
                                onClick={() => setOpen(!open)}
                                className='flex items-center justify-between w-full rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] pt-2.5 pb-2.5 px-3.5 cursor-pointer'>
                                <p className='font-normal text-[16px]/[24px] text-[#667085] truncate'>{assignedManager === null ? "Select A Project Manager" : assignedManager}</p>
                                <i className={`fa-solid fa-chevron-down text-[#667085] transition-transform ${open ? "rotate-180" : ""}`}></i>
                            </button>

                            {open && (
                                <div className='absolute left-0 right-0 top-full z-10 mt-1.5 max-h-52 overflow-y-auto no-scrollbar rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_4px_6px_-2px_rgba(16,24,40,0.03),0_12px_16px_-4px_rgba(16,24,40,0.08)]'>
                                    {projectManagers?.length ? (
                                        projectManagers.map((p, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => {
                                                    setAssignedManager(p.email)
                                                    setOpen(false)
                                                }}
                                                className='w-full text-left font-medium text-[14px]/[20px] text-[#090909] pt-2.5 pb-2.5 px-3.5 hover:bg-[#F3F3F3] cursor-pointer'>
                                                    {p.email}
                                            </button>
                                        ))
                                    ) : (
                                        <p className='font-normal text-[14px]/[20px] text-[#636363] pt-2.5 pb-2.5 px-3.5'>No project managers available</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={!hasSelection}
                        onClick={() => handleAssign(project.id, assignedManager)}
                        className='w-full border border-[#0000000D] rounded-lg px-4 py-2.5 bg-[#1B3C4A] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-auto'>
                            <i className="fa-regular fa-circle-check text-[#FFFFFF]"></i>
                            <p className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>{buttonLabel}</p>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddProjectManager
