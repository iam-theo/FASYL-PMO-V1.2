function selectedProjectDetails( {selectedProject} ) {
    return (
        <div className='w-full flex flex-col gap-4 py-4'>
            <div className='w-full h-100 rounded-lg border border-[#0000000D] bg-[#F3F3F3] flex flex-col gap-4 justify-center p-4'>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>{selectedProject.projectName}</h3>
                <ul className='flex flex-col gap-4'>
                    <li className='font-normal text-[16px]/[20px] text-[#636363] flex items-center gap-2'>
                        <i className="fa-solid fa-user-tie fa-lg text-[#1b3c4a]"></i>
                        <p>Client - {selectedProject.clientName}</p>
                    </li>
                    <li className='font-normal text-[16px]/[20px] text-[#636363] flex items-center gap-2'>
                        <i className="fa-solid fa-lg fa-square-poll-horizontal text-[#1b3c4a]"></i>
                        <p>Type- {selectedProject.productType}</p>
                    </li>
                    <li className='font-normal text-[16px]/[20px] text-[#636363] flex items-center gap-2'>
                        <i className="fa-brands fa-lg fa-product-hunt text-[#1b3c4a]"></i>
                        <p>Product - {selectedProject.productName}</p>
                    </li>
                    <li className='font-normal text-[16px]/[20px] text-[#636363] flex items-center gap-2'>
                        <i className="fa-solid fa-lg fa-globe text-[#1b3c4a]"></i>
                        <p>Location - {selectedProject.location}</p>
                    </li>
                    <li className='font-normal text-[16px]/[20px] text-[#636363] flex items-center gap-2'>
                        <i className="fa-solid fa-lg fa-qrcode text-[#1b3c4a]"></i>
                        <p>Sitecode - {}</p>
                    </li>
                    <li className='font-normal text-[16px]/[20px] text-[#636363] flex items-center gap-2'>
                        <i className="fa-solid fa-lg fa-coins text-[#1b3c4a]"></i>
                        <p>AMC - {selectedProject.amcPercentage}</p>
                    </li>
                    <li className='font-normal text-[16px]/[20px] text-[#636363] flex items-center gap-2'>
                    <i className="fa-solid fa-lg fa-registered text-[#1b3c4a]"></i>
                        <p>Register For - {}</p>
                    </li>
                    <li className='font-normal text-[16px]/[20px] text-[#636363] flex items-center gap-2'>
                        <i className="fa-solid fa-lg fa-calendar-day text-[#1b3c4a]"></i>
                        <p>Purchase Order Date - {}</p>
                    </li>
                    <li className='font-normal text-[16px]/[20px] text-[#636363] flex items-center gap-2'>
                        <i className="fa-solid fa-lg fa-calendar-day text-[#1b3c4a]"></i>
                        <p>Expected Commencement Date - {selectedProject.commencementDate}</p>
                    </li>
                </ul>
            </div>

            <div className='flex flex-col gap-4'>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Assigned Project Manager</h3>
                <div className='w-full p-4 rounded-lg border border-[#0000000D] flex items-center gap-4'>
                    <div className='font-medium text-[16px]/[20px] text-[#090909] flex items-center gap-2'>
                        <i className="fa-solid fa-lg fa-user-secret text-[#1B3C4A]"></i>
                        <p>{selectedProject.projectManager?.email}</p>
                    </div>
                    <p className='font-normal text-[16px]/[20px] text-[#636363]'>Project Manager</p>
                        </div>
            </div>

            <div className='flex flex-col gap-4'>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Order Letter</h3>
                    <div className='w-full p-4 rounded-lg border border-[#0000000D] flex items-center justify-between'>
                        <div className='font-normal text-[14px]/[20px] text-[#636363] flex items-center gap-4'>
                            <i className="fa-solid fa-lg fa-circle-arrow-up text-[#1B3C4A]"></i>
                            <p>{}</p>
                        </div>
                        <button className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>View</button>
                    </div>
            </div>

            <div className='flex flex-col gap-4'>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Cost Sheet</h3>
                <div className='w-full p-4 rounded-lg border border-[#0000000D] flex items-center justify-between'>
                    <div className='font-normal text-[14px]/[20px] text-[#636363] flex items-center gap-4'>
                        <i className="fa-solid fa-lg fa-circle-arrow-up text-[#1B3C4A]"></i>
                        <p>{}</p>
                    </div>
                    <button className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>View</button>
                </div>
            </div>

            <div className='flex flex-col gap-4'>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Addition Information</h3>
                <div className='font-normal text-[16px]/[24px] text-[#636363] w-full px-3.5 py-2.5 rounded-lg border border-[#0000000D] flex items-center'>
                    <p>{}</p>
                </div>
            </div>

            <div className='flex flex-col gap-4'>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Fasyl Sales</h3>
                {/* {
                    selectedProject.sales.map((s, index) => (
                        <div 
                        key={index}
                        className='w-full p-4 rounded-lg border border-[#0000000D] flex flex-col justify-between gap-2.5'>
                            <div className='font-semibold text-[16px]/[20px] text-[#090909] flex items-center gap-2'>
                                <i className="fa-solid fa-lg fa-address-card text-[#1B3C4A]"></i>
                                <p>{}</p>
                            </div>
                            <p className='font-normal text-[16px]/[20px] text-[#636363]'>{l}</p>
                        </div>
                    ))
                } */}
            </div>

            <div className='flex flex-col gap-4'>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Resources</h3>
                {
                    selectedProject.resources.map((r, index) => (
                        <div 
                        key={index}
                        className='w-full p-4 rounded-lg border border-[#0000000D] flex flex-col justify-between gap-2.5'>
                            <div className='font-semibold text-[16px]/[20px] text-[#090909] flex items-center gap-2'>
                                <i className="fa-solid fa-lg fa-address-card text-[#1B3C4A]"></i>
                                <p>
                                    <span>{r.firstName}</span>
                                    <span>{r.lastName}</span>
                                </p>
                            </div>
                            <p className='font-normal text-[16px]/[20px] text-[#636363]'>{r.email}</p>
                            <p className='font-normal text-[16px]/[20px] text-[#636363]'>{r.phoneNumber}</p>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default selectedProjectDetails