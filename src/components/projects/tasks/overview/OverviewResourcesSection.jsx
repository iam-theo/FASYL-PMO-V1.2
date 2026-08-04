const PREVIEW_COUNT = 5

function OverviewResourcesSection({ resources = [] }) {
    const previewResources = resources.slice(0, PREVIEW_COUNT)

    return (
        <div className='flex flex-col gap-4'>
            <h3 className='font-semibold text-[16px]/[20px] text-[#090909]'>Resources On This Project</h3>

            <div className='rounded-lg border border-[#0000000D] bg-[#FFFFFF] overflow-x-auto'>
                {previewResources.length === 0 ? (
                    <div className='px-6 py-10 text-center font-normal text-[14px]/[20px] text-[#636363]'>
                        No resources assigned to this project yet.
                    </div>
                ) : (
                    <table className='w-full border-collapse'>
                        <thead>
                            <tr className='border-b border-[#0000000D]'>
                                <th className='px-4 py-3 text-left font-medium text-[12px]/[18px] text-[#636363]'>ID</th>
                                <th className='px-4 py-3 text-left font-medium text-[12px]/[18px] text-[#636363]'>First Name</th>
                                <th className='px-4 py-3 text-left font-medium text-[12px]/[18px] text-[#636363]'>Last Name</th>
                                <th className='px-4 py-3 text-left font-medium text-[12px]/[18px] text-[#636363]'>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewResources.map((resource) => (
                                <tr key={resource.recordId} className='border-b border-[#0000000D] last:border-b-0'>
                                    <td className='px-4 py-3 font-normal text-[14px]/[20px] text-[#090909] whitespace-nowrap'>{resource.staffId}</td>
                                    <td className='px-4 py-3 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap'>{resource.firstName}</td>
                                    <td className='px-4 py-3 font-normal text-[14px]/[20px] text-[#636363] whitespace-nowrap'>{resource.lastName}</td>
                                    <td className='px-4 py-3 font-normal text-[14px]/[20px] text-[#636363] truncate max-w-40'>{resource.email}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default OverviewResourcesSection
