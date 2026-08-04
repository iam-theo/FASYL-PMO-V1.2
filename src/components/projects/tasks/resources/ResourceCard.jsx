
function ResourceCard({ resource }) {
    return (
        <div
            className='w-full rounded-lg border border-[#0000000D] bg-[#F3F3F3] p-4 flex flex-col gap-5.5'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <div className='w-9.5 h-9.5 rounded-md bg-[#DBDBDB] flex items-center justify-center shrink-0'>
                        <i className="fa-solid fa-address-card text-[#1B3C4A]"></i>
                    </div>
                    <div className='flex items-center gap-2'>
                        <span className='font-semibold text-[16px]/[20px] text-[#090909]'>{resource.firstName} {resource.lastName}</span>
                        <span className='font-normal text-[16px]/[20px] text-[#636363]'>{resource.staffId}</span>
                    </div>
                </div>
                {/* <button
                    type="button"
                    onClick={() => onRemove(resource)}
                    className='w-5 h-5 rounded-full border border-black flex items-center justify-center text-black shrink-0 cursor-pointer hover:bg-[#0000000D]'
                    aria-label="Remove resource"
                >
                    <i className="fa-solid fa-minus text-[10px]"></i>
                </button> */}
            </div>
            <ul className='flex flex-col gap-3'>
                <li className='font-normal text-[16px]/[20px] text-[#636363]'>First Name - {resource.firstName}</li>
                <li className='font-normal text-[16px]/[20px] text-[#636363]'>Last Name - {resource.lastName}</li>
                {/* <li className='font-normal text-[16px]/[20px] text-[#636363]'>Designation - {resource.designation}</li> */}
                <li className='font-normal text-[16px]/[20px] text-[#636363]'>Phone Number - {resource.phoneNumber}</li>
                <li className='font-normal text-[16px]/[20px] text-[#636363]'>Email - {resource.email}</li>
            </ul>
        </div>
    )
}

export default ResourceCard
