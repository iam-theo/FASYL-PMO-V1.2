import { useState } from 'react'
import { AiTwotonePlusCircle } from "react-icons/ai"

function AddResourceModal({ availableResources = [], onClose, onConfirm }) {

    const [selectedResourceIds, setSelectedResourceIds] = useState([""])

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

    const handleConfirm = () => {
        const resourceIds = selectedResourceIds.filter(Boolean)
        onConfirm(resourceIds)
    }

    const getResourceLabel = (resource) => `${resource.firstName} ${resource.lastName} - ${resource.designation}`

    return (
        <div className='fixed inset-0 z-2000 w-full h-screen bg-[#00000080] flex items-stretch justify-end' onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className='relative z-3000 flex flex-col w-135.5 min-h-0 h-screen overflow-y-auto no-scrollbar bg-[#F7F7F7] px-4 py-4 gap-6'
            >
                <div className='flex items-center justify-between'>
                    <h2 className='font-semibold text-[16px]/[20px] text-[#090909]'>Add New Resource</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#E8E8E8] flex items-center gap-2 cursor-pointer'
                    >
                        <p className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Close</p>
                        <i className="fa-regular fa-circle-xmark fa-sm text-[#090909]"></i>
                    </button>
                </div>

                <div className='flex flex-col gap-3'>
                    <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Select Resource</h3>

                    {selectedResourceIds.map((resourceId, index) => (
                        <div key={index} className='flex items-center gap-3'>
                            <div className='flex-1 rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]'>
                                <select
                                    value={resourceId}
                                    onChange={(e) => handleResourceChange(index, e.target.value)}
                                    className='w-full px-3.5 py-2.5 rounded-lg outline-none font-normal text-[16px]/[24px] text-[#667085] bg-transparent cursor-pointer'
                                >
                                    <option value="">Select Resource</option>
                                    {availableResources.map((resource) => (
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
                        <AiTwotonePlusCircle size={18} className='text-[#1B3C4A]' />
                        <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Add Resource</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleConfirm}
                    className='w-full rounded-lg border border-[#0000000D] bg-[#1B3C4A] px-4 py-2.5 flex items-center justify-center gap-2 cursor-pointer'
                >
                    <i className="fa-regular fa-circle-check text-[#FFFFFF]"></i>
                    <span className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>Confirm</span>
                </button>
            </div>
        </div>
    )
}

export default AddResourceModal
