import { useState } from 'react'
import { AiTwotonePlusCircle } from "react-icons/ai"

function SetupProjectModal({ project, onClose }) {

    const [resources] = useState([])
    const [isLoadingResources] = useState(true)
    const [selectedResourceIds, setSelectedResourceIds] = useState([""])
    const [isSubmitting] = useState(false)

    // useEffect(() => {
    //     let isMounted = true

    //     const loadResources = async () => {
    //         try {
    //             const data = await getAssignableResources()
    //             if (isMounted) setResources(data?.data ?? data ?? [])
    //         } catch (err) {
    //             console.error(err)
    //         } finally {
    //             if (isMounted) setIsLoadingResources(false)
    //         }
    //     }

    //     loadResources()

    //     return () => {
    //         isMounted = false
    //     }
    // }, [])

    const handleResourceChange = (index, value) => {
        setSelectedResourceIds((prev) => prev.map((id, i) => (i === index ? value : id)))
    }

    const handleAddResource = () => {
        setSelectedResourceIds((prev) => [...prev, ""])
    }

    const handleRemoveResource = (index) => {
        setSelectedResourceIds((prev) =>
            prev.length === 1 ? [""] : prev.filter((_, i) => i !== index)
        )
    }

    // const handleConfirm = async () => {
    //     const resourceIds = selectedResourceIds.filter(Boolean)

    //     if (resourceIds.length === 0) {
    //         showNotification({
    //             type: "error",
    //             title: "Select A Resource",
    //             message: "Please select at least one resource before confirming"
    //         })

    //         return
    //     }

    //     setIsSubmitting(true)

    //     try {
    //         const updatedProject = await setupProjectResources(project.id, resourceIds)

    //         onSetupComplete?.(updatedProject)

    //         showNotification({
    //             type: "success",
    //             title: "Project Setup Complete!",
    //             message: `Resources have been assigned to ${project.projectName}`
    //         })

    //         onClose()
    //     } catch (err) {
    //         console.error(err)

    //         showNotification({
    //             type: "error",
    //             title: "Failed To Setup Project!",
    //             message: err?.message || "Unable to assign resources to this project"
    //         })
    //     } finally {
    //         setIsSubmitting(false)
    //     }
    // }

    const projectDetails = [
        { icon: "fa-user-tie", label: `Client - ${project?.clientName ?? "—"}` },
        { icon: "fa-square-poll-horizontal", label: `Type - ${project?.productType ?? "—"}` },
        { icon: "fa-boxes-stacked", label: `Product - ${project?.productName ?? "—"}` },
        { icon: "fa-globe", label: `Location - ${project?.location ?? "—"}` },
        { icon: "fa-qrcode", label: `Sitecode - ${project?.siteCode ?? "—"}` },
    ]

    const getResourceLabel = (resource) => {
        const name = resource.name ?? `${resource.firstName ?? ""} ${resource.lastName ?? ""}`.trim()
        return resource.role ? `${name} - ${resource.role}` : name
    }

    return (
        <div className='fixed z-2000 w-full h-screen bg-[#00000080] flex flex-col items-end' onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className='relative z-3000 flex flex-col w-135.5 min-h-0 h-screen overflow-y-auto no-scrollbar bg-[#F7F7F7] px-4 py-4 gap-4'
            >
                <div className='flex items-center justify-between'>
                    <h2 className='font-semibold text-[16px]/[20px] text-[#090909]'>Setup Project</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#E8E8E8] flex items-center gap-2 cursor-pointer'
                    >
                        <p className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Close</p>
                        <i className="fa-regular fa-circle-xmark fa-sm text-[#090909]"></i>
                    </button>
                </div>

                <div className='rounded-lg border border-[#0000000D] bg-[#F3F3F3] p-4 flex flex-col gap-4'>
                    <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>{project?.projectName ?? "Project"}</h3>
                    <ul className='flex flex-col gap-3'>
                        {projectDetails.map((detail) => (
                            <li key={detail.label} className='flex items-center gap-2 font-normal text-[16px]/[20px] text-[#636363]'>
                                <i className={`fa-solid ${detail.icon} text-[#1B3C4A]`}></i>
                                <span>{detail.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className='flex flex-col gap-1'>
                    <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Project Setup</h3>
                    <p className='font-normal text-[14px]/[20px] text-[#636363]'>Setup your project to proceed</p>
                </div>

                <div className='rounded-lg border border-[#0000000D] bg-[#F3F3F3] p-4 flex items-center gap-2'>
                    <span className='font-normal text-[16px]/[20px] text-[#636363]'>Stage1/1</span>
                    <span className='rounded-2xl bg-[#228CEE] px-2 py-1 font-medium text-[14px]/[20px] text-[#FFFFFF]'>Assign Resource</span>
                </div>

                <div className='flex flex-col gap-3'>
                    <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Select Resource</h3>

                    {selectedResourceIds.map((resourceId, index) => (
                        <div key={index} className='flex items-center gap-3'>
                            <div className='flex-1 rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]'>
                                <select
                                    value={resourceId}
                                    onChange={(e) => handleResourceChange(index, e.target.value)}
                                    disabled={isLoadingResources}
                                    className='w-full px-3.5 py-2.5 rounded-lg outline-none font-normal text-[16px]/[24px] text-[#667085] bg-transparent cursor-pointer'
                                >
                                    <option value="">{isLoadingResources ? "Loading resources..." : "Select"}</option>
                                    {resources.map((resource) => (
                                        <option key={resource.id} value={resource.id}>
                                            {getResourceLabel(resource)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveResource(index)}
                                className='w-8 h-8 flex items-center justify-center rounded-full border border-[#0000000D] text-[#090909] cursor-pointer hover:bg-[#E8E8E8]'
                                aria-label="Remove resource"
                            >
                                <i className="fa-solid fa-minus"></i>
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddResource}
                        className='w-full rounded-lg border border-[#0000000D] bg-[#E8E8E8] px-4 py-2.5 flex items-center justify-center gap-2 cursor-pointer'
                    >
                        {/* <i className="fa-regular fa-circle-plus text-[#090909]"></i> */}
                        <AiTwotonePlusCircle 
                            size={18}
                            className='text-[#1B3C4A]' 
                        />
                        <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Add Resource</span>
                    </button>
                </div>

                <button
                    type="button"
                    // onClick={handleConfirm}
                    // disabled={isSubmitting}
                    className='w-full rounded-lg border border-[#0000000D] bg-[#1B3C4A] px-4 py-2.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60'
                >
                    <i className="fa-regular fa-circle-check text-[#FFFFFF]"></i>
                    <span className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>{isSubmitting ? "Confirming..." : "Confirm"}</span>
                </button>
            </div>
        </div>
    )
}

export default SetupProjectModal
