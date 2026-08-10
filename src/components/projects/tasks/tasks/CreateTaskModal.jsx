import { useRef, useState } from 'react'
import { CloseIcon, CheckCircleIcon, ChevronDownIcon, CalendarIcon, TrashIcon } from '../icons/index'
import { TASK_PRIORITY_OPTIONS } from './taskConstants'
import { MAX_UPLOAD_MB, MAX_FILE_SIZE } from '../../../../constants/uploads'

const ALLOWED_FILE_TYPES = ["image/svg+xml", "image/jpeg", "application/pdf"];

function CreateTaskModal({ 
    onClose, 
    onCreate, 
    loggedInUser,
    project, 
    resources,
    projectManagers,
    isEditing,
    editValues,
    onEdit
}) {

    const userRole = loggedInUser.role;

    // const [title, setTitle] = useState("");
    // const [description, setDescription] = useState("");
    // const [startDate, setStartDate] = useState("");
    // const [dueDate, setDueDate] = useState("");
    // const [priority, setPriority] = useState("MEDIUM");
    // const [assignedToUserId, setAssignedToUserId] = useState("");
    // const [assignedResourceId, setAssignedResourceId] = useState("");

    const initialForm = {
        title: editValues?.title ?? "",
        description: editValues?.description ?? "",
        startDate: editValues?.startDate?.split("T")[0] ?? "",
        dueDate: editValues?.dueDate?.split("T")[0] ?? "",
        priority: editValues?.priority ?? "MEDIUM",
        reminderDays: "3",
        assignedToUserId:
            userRole === "HEADOFOPS"
                ? editValues?.assignee?.id ?? ""
                : "",
        assignedResourceId:
            userRole === "PROJECTMANAGER"
                ? editValues?.assignee?.id ?? ""
                : "",
    };

    const [form, setForm] = useState(initialForm);

    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState("");

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";

        if (!file) return;

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            setFileError("Invalid file type. Only SVG, JPG, or PDF allowed");
            setSelectedFile(null);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setFileError(`File is too large. Maximum allowed size is ${MAX_UPLOAD_MB}MB`);
            setSelectedFile(null);
            return;
        }

        setFileError("");
        setSelectedFile(file);
    };

    const handleDropFile = (e) => {
        e.preventDefault();
        handleFileChange({ target: { files: e.dataTransfer.files, value: "" } });
    };

    // useEffect(() => {
    //     if (!isEditing) return;

    //     setForm({
    //         title: editValues.title ?? "",
    //         description: editValues.description ?? "",
    //         startDate: editValues.startDate?.split("T")[0] ?? "",
    //         dueDate: editValues.dueDate?.split("T")[0] ?? "",
    //         priority: editValues.priority ?? "MEDIUM",
    //         assignedToUserId:
    //             userRole === "HEADOFOPS"
    //                 ? editValues.assignee?.id ?? ""
    //                 : "",
    //         assignedResourceId:
    //             userRole === "PROJECTMANAGER"
    //                 ? editValues.assignee?.id ?? ""
    //                 : "",
    //     });
    // }, [isEditing, editValues, userRole]);

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };


    const isValid = form.title.trim().length > 0 && (
        (userRole === "HEADOFOPS" && form.assignedToUserId) ||
        (userRole === "PROJECTMANAGER" && form.assignedResourceId)
    );

    const handleCreate = async () => {

        // console.log({
        //     userRole,
        //     assignedToUserId: form.assignedToUserId,
        //     assignedResourceId: form.assignedResourceId,
        //     isValid
        // });

        if (!isValid) return

        const payload = {
            projectId: project.projectId,
            stageOrder: project.currentStageOrder,
            title: form.title,
            description: form.description,
            startDate: form.startDate,
            dueDate: form.dueDate,
            priority: form.priority.toUpperCase(),
            reminderDays: Number(form.reminderDays) || 3,
            document: selectedFile
        };

        if (userRole === "HEADOFOPS") {
            payload.assignedToUserId = Number(form.assignedToUserId);
        }

        if (userRole === "PROJECTMANAGER") {
            payload.assignedResourceId = form.assignedResourceId;
        }

        await onCreate(payload);

    }

    const handleEdit = async () => {

        // console.log({
        //     userRole,
        //     assignedToUserId,
        //     assignedResourceId,
        //     isValid
        // });

        if (!isValid) return

        const payload = {
            title: form.title,
            description: form.description,
            startDate: form.startDate,
            dueDate: form.dueDate,
            priority: form.priority.toUpperCase()
        };

        if (userRole === "HEADOFOPS") {
            payload.assignedToUserId = Number(form.assignedToUserId);
        }

        if (userRole === "PROJECTMANAGER") {
            payload.assignedResourceId = form.assignedResourceId;
        }

        console.log(editValues.id);
        console.log(payload);

        await onEdit(editValues.id, payload);

    }

    return (
        <div className='fixed inset-0 z-2000 w-full h-screen bg-[#00000080] flex items-stretch justify-end' onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className='relative z-3000 flex flex-col w-135.5 min-h-0 h-screen overflow-y-auto no-scrollbar bg-[#F7F7F7] px-4 py-4 gap-6'
            >
                <div className='flex items-center justify-between'>
                    <h2 className='font-semibold text-[16px]/[20px] text-[#090909]'>Create Task</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#E8E8E8] flex items-center gap-2 cursor-pointer'
                    >
                        <span className='font-medium text-[14px]/[20px] text-[#1B3C4A]'>Close</span>
                        <CloseIcon />
                    </button>
                </div>

                <div className='flex flex-col gap-4'>
                    <div className='flex flex-col gap-1.5'>
                        <label className='font-medium text-[14px]/[20px] text-[#090909]'>Task Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            placeholder='Enter Title'
                            className='rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] px-3.5 py-2.5 outline-none font-normal text-[16px]/[24px] text-[#090909] placeholder:text-[#667085]'
                        />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='font-medium text-[14px]/[20px] text-[#090909]'>Assign To</label>
                        <div className='relative rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]'>

                            {userRole === "HEADOFOPS" && (
                                <select
                                    value={form.assignedToUserId}
                                    onChange={(e) => handleChange("assignedToUserId", e.target.value)}
                                    className='w-full appearance-none px-3.5 py-2.5 pr-10 rounded-lg outline-none font-normal text-[16px]/[24px] text-[#667085] bg-transparent cursor-pointer'
                                >
                                    <option value="">Select Project Manager</option>
                                    {projectManagers.map((pm) => (
                                        <option key={pm.id} value={pm.id}>{pm.email}</option>
                                    ))}
                                </select>
                            )}
                            

                            {userRole === "PROJECTMANAGER" && (
                                <select
                                    value={form.assignedResourceId}
                                    onChange={(e) => handleChange("assignedResourceId", e.target.value)}
                                    className='w-full appearance-none px-3.5 py-2.5 pr-10 rounded-lg outline-none font-normal text-[16px]/[24px] text-[#667085] bg-transparent cursor-pointer'
                                >
                                    <option value="">Select Resource</option>
                                    {resources.map((resource) => (
                                        <option key={resource.recordId} value={resource.recordId}>{resource.email}</option>
                                    ))}
                                </select>
                            )}

                            <ChevronDownIcon className='pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2' />
                        </div>
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='font-medium text-[14px]/[20px] text-[#090909]'>Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder='Enter description'
                            rows={6}
                            className='resize-none rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] px-3.5 py-2.5 outline-none font-normal text-[16px]/[24px] text-[#090909] placeholder:text-[#667085]'
                        />
                    </div>

                    {!isEditing && (
                        <div className='flex flex-col gap-1.5'>
                            <label className='font-medium text-[14px]/[20px] text-[#090909]'>Attach Document</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className='hidden'
                                accept="image/svg+xml,image/jpeg,application/pdf"
                                onChange={handleFileChange}
                            />

                            {selectedFile ? (
                                <div className='rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] px-3.5 py-2.5 flex items-center justify-between gap-2'>
                                    <div className='flex items-center gap-2 min-w-0'>
                                        <i className="fa-solid fa-paperclip text-[#1B3C4A]"></i>
                                        <span className='font-normal text-[16px]/[24px] text-[#090909] truncate'>{selectedFile.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setFileError("");
                                        }}
                                        aria-label="Remove document"
                                        className='shrink-0 cursor-pointer'
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDropFile}
                                    className='w-full min-h-27.5 rounded-lg border border-dashed border-[#E4E7EC] bg-[#FFFFFF] flex flex-col items-center justify-center gap-1 cursor-pointer p-4'
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <i className="fa-solid fa-circle-arrow-up text-[#1B3C4A] mt-3"></i>
                                    <p className='font-normal text-[14px]/[20px] text-[#636363]'>
                                        <span className='text-[#1B3C4A] font-medium'>Click to upload</span> or drag and drop
                                    </p>
                                    <p className='font-normal text-[14px]/[20px] text-[#636363]'>SVG, JPG, or PDF (max. {MAX_UPLOAD_MB}MB)</p>
                                    {fileError && (
                                        <p className='text-[14px]/[20px] text-[#D20019] font-normal'>{fileError}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className='flex flex-col gap-1.5'>
                        <label className='font-medium text-[14px]/[20px] text-[#090909]'>Start Date</label>
                        <div className='relative rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]'>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => handleChange("startDate", e.target.value)}
                                className='w-full px-3.5 py-2.5 pr-10 rounded-lg outline-none font-normal text-[16px]/[24px] text-[#090909] bg-transparent'
                            />
                            <CalendarIcon className='pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2' />
                        </div>
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='font-medium text-[14px]/[20px] text-[#090909]'>Due Date</label>
                        <div className='relative rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]'>
                            <input
                                type="date"
                                value={form.dueDate}
                                onChange={(e) => handleChange("dueDate", e.target.value)}
                                className='w-full px-3.5 py-2.5 pr-10 rounded-lg outline-none font-normal text-[16px]/[24px] text-[#090909] bg-transparent'
                            />
                            <CalendarIcon className='pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2' />
                        </div>
                    </div>

                    {!isEditing && (
                        <div className='flex flex-col gap-1.5'>
                            <label className='font-medium text-[14px]/[20px] text-[#090909]'>Reminder</label>
                            <div className='relative rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]'>
                                <input
                                    type="number"
                                    min={0}
                                    max={60}
                                    value={form.reminderDays}
                                    onChange={(e) => handleChange("reminderDays", e.target.value)}
                                    placeholder='3'
                                    className='w-full px-3.5 py-2.5 pr-10 rounded-lg outline-none font-normal text-[16px]/[24px] text-[#090909] bg-transparent'
                                />
                                <span className='pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-normal text-[14px]/[20px] text-[#667085]'>days before due</span>
                            </div>
                            <p className='text-[12px]/[18px] text-[#636363]'>
                                The assignee gets a reminder this many days before the due date. Defaults to 3.
                            </p>
                        </div>
                    )}

                    <div className='flex flex-col gap-1.5'>
                        <label className='font-medium text-[14px]/[20px] text-[#090909]'>Priority Rating</label>
                        <div className='relative rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]'>
                            <select
                                value={form.priority}
                                onChange={(e) => handleChange("priority", e.target.value)}
                                className='w-full appearance-none px-3.5 py-2.5 pr-10 rounded-lg outline-none font-normal text-[16px]/[24px] text-[#667085] bg-transparent cursor-pointer'
                            >
                                {TASK_PRIORITY_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className='pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2' />
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={isEditing === false ? handleCreate : handleEdit}
                    disabled={!isValid}
                    className='w-full rounded-lg border border-[#0000000D] bg-[#1B3C4A] px-4 py-2.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                >
                    <CheckCircleIcon />
                    <span className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>{isEditing === false ? "Create Task" : "Update Task"}</span>
                </button>
            </div>
        </div>
    )
}

export default CreateTaskModal
