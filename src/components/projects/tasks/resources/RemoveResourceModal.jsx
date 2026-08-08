function RemoveResourceModal({ resource, onCancel, onConfirm }) {
    return (
        <div className='fixed inset-0 z-2000 w-full h-screen bg-[#00000080] flex items-center justify-center' onClick={onCancel}>
            <div
                onClick={(e) => e.stopPropagation()}
                className='relative z-3000 w-100 rounded-xl bg-[#FFFFFF] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.10),0_8px_8px_-4px_rgba(16,24,40,0.04)] p-6 flex flex-col gap-8'
            >
                <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-2'>
                        <i className="fa-solid fa-trash-can text-[#D20019] text-xl"></i>
                        <h2 className='flex-1 font-semibold text-[16px]/[28px] text-[#090909]'>Remove Resource</h2>
                    </div>
                    <p className='font-normal text-[14px]/[20px] text-[#636363]'>
                        Are you sure you want to remove this resource from this project?
                    </p>
                </div>

                <div className='flex items-start gap-3'>
                    <button
                        type="button"
                        onClick={onCancel}
                        className='flex-1 rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] px-4.5 py-2.5 font-medium text-[16px]/[24px] text-[#344054] cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(resource)}
                        className='flex-1 rounded-lg border border-[#D92D20] bg-[#D92D20] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] px-4.5 py-2.5 font-medium text-[16px]/[24px] text-[#FFFFFF] cursor-pointer'
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RemoveResourceModal
