import { useRef, useState } from 'react'

const ACCEPTED = ".pdf,image/svg+xml,image/jpeg"

function SubmitProofModal({ task, onCancel, onSubmit }) {
    const [file, setFile] = useState(null)
    const inputRef = useRef(null)

    const selectFile = (selected) => {
        setFile(selected || null)
    }

    const canSubmit = Boolean(file)

    return (
        <div
            className='fixed inset-0 z-2000 w-full h-screen bg-[#00000080] flex items-center justify-center'
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className='relative z-3000 w-110 rounded-xl bg-[#FFFFFF] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.10),0_8px_8px_-4px_rgba(16,24,40,0.04)] p-6 flex flex-col gap-5'
            >
                <div className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between gap-2'>
                        <h2 className='flex-1 font-semibold text-[16px]/[28px] text-[#090909]'>
                            Submit Proof of Completion
                        </h2>
                        <button
                            type="button"
                            onClick={onCancel}
                            className='w-8 h-8 rounded-lg border border-[#0000000D] bg-[#E8E8E8] flex items-center justify-center cursor-pointer shrink-0'
                            aria-label="Close"
                        >
                            <i className="fa-regular fa-circle-xmark"></i>
                        </button>
                    </div>
                    <p className='font-normal text-[14px]/[20px] text-[#636363]'>
                        Upload proof that &quot;{task.title}&quot; is complete. It will be
                        sent to the project manager for confirmation before the task
                        is marked Done.
                    </p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED}
                    className='hidden'
                    onChange={(e) => selectFile(e.target.files?.[0])}
                />

                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className='w-full rounded-lg border border-dashed border-[#D0D5DD] bg-[#F9FAFB] px-4 py-8 flex flex-col items-center justify-center gap-2 cursor-pointer'
                >
                    <i className="fa-solid fa-cloud-arrow-up text-2xl text-[#1B3C4A]"></i>
                    <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>
                        {file ? file.name : "Click to upload proof document"}
                    </span>
                    <span className='font-normal text-[12px]/[18px] text-[#636363]'>
                        PDF, JPG, or SVG · max 5MB
                    </span>
                </button>

                {file && (
                    <div className='rounded-lg border border-[#0000000D] bg-[#F3F3F3] px-3.5 py-2.5 flex items-center justify-between gap-3'>
                        <span className='flex items-center gap-2 font-normal text-[14px]/[20px] text-[#090909] truncate'>
                            <i className="fa-solid fa-paperclip text-[#1B3C4A]"></i>
                            {file.name}
                        </span>
                        <button
                            type="button"
                            onClick={() => setFile(null)}
                            className='font-normal text-[12px]/[18px] text-[#D92D20] cursor-pointer shrink-0'
                        >
                            Remove
                        </button>
                    </div>
                )}

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
                        disabled={!canSubmit}
                        onClick={() => onSubmit(task, file)}
                        className='flex-1 rounded-lg border border-[#0000000D] bg-[#1B3C4A] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] px-4.5 py-2.5 font-medium text-[16px]/[24px] text-[#FFFFFF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Submit for Confirmation
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SubmitProofModal
