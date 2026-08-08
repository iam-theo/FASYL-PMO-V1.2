import { AiTwotonePlusCircle } from "react-icons/ai"

function ProjectOnboardingEmptyState({ onSetupProject }) {
    return (
        <div className='flex items-center justify-center py-20 px-4'>
            <div className='w-full max-w-88 flex flex-col items-center gap-6 text-center'>
                <div className='flex flex-col items-center gap-4'>
                    <div className='w-15.5 h-15.5 rounded-lg border border-[#0000000D] bg-[#F3F3F3] flex items-center justify-center'>
                        <i className="fa-solid fa-briefcase fa-xl text-[#DBDBDB]"></i>
                    </div>
                    <div className='flex flex-col items-center gap-1'>
                        <h3 className='font-medium text-[16px]/[24px] text-[#090909]'>You have been assigned a new project</h3>
                        <p className='font-normal text-[14px]/[20px] text-[#636363]'>You have a new project. Assign resources to procced</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onSetupProject}
                    className='w-full rounded-lg border border-[#0000000D] bg-[#1B3C4A] px-4 py-2.5 flex items-center justify-center gap-2 cursor-pointer'
                >
                    {/* <i className="fa-regular fa-circle-plus text-[#FFFFFF]"></i> */}
                    <AiTwotonePlusCircle
                        className="text-[#FFFFFF]"
                        size={22}
                    />
                    <span className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>Setup Project</span>
                </button>
            </div>
        </div>
    )
}

export default ProjectOnboardingEmptyState
