import UploadBox from './UploadBox';
import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { toggleChecklist } from './utils/ToggleChecklist';
import { submitStage, approveStage, rejectStage } from '../../../api';
import { useNotification } from '../../NotificationContext';
import { FaRegCircleXmark, FaRegCircleCheck } from 'react-icons/fa6'

function ProjectLifeCycle({ 
    selectedProject, 
    setSelectedProject,
    setProjects, 
    onClose,  
    user,
    }) {

        const { showNotification } = useNotification()
        // const [isRejected, setIsRejected] = useState(false);
        const [reasonn, setReasonn] = useState("");
        const [isOpen, setIsOpen] = useState(false);

    const STAGES = {
        1: "Client ID",
        2: "Engagement",
        3: "Initiation",
        4: "Planning",
        5: "Execution",
        6: "UAT",
        7: "Go-Live",
        8: "Closure"
    };

    const STAGESDESC = {
        0: "Record and qualify the prospective client before any engagement begins.",
        1: "Pre-sales and proposal activities. All items must be complete before initiation.",
        2: "Mandatory pre-project documents per policy. ",
        3: "Mandatory pre-project documents per policy. ",
        4: "Track milestones and mandatory sign-offs at each delivery gate.",
        5: "Client-led testing. All critical issues must be resolved before go-live approval.",
        6: "Final production deployment. Requires all prior stage gates cleared.",
        7: "Final production deployment. Requires all prior stage gates cleared."
    };

    const getStageDesc = (stageIndex) => {
        return STAGESDESC[stageIndex] || "Unknown Desc";
    };

    const getStage = (currentStageOrder) => {
        return STAGES[currentStageOrder] || "Unknown Stage";
    };

    console.log(selectedProject);

    // const length = selectedProject?.stages?.length || 0
    const currentStageOrder = selectedProject?.currentStageOrder;
    const projectStage = selectedProject?.stages?.find(s => s.stageOrder === currentStageOrder) || selectedProject?.stages?.[0] || null;
    // console.log(projectStage);
    const currentStage = getStage(projectStage?.stageOrder);
    const nextStage = getStage((projectStage?.stageOrder) + 1)
    const stageIndex = projectStage?.stageOrder;
    const stageTitle = projectStage?.stageName
    const checklistLength = projectStage?.checklist?.length || 0
    const required = projectStage?.checklist?.filter(item => item.isRequired)?.length || 0
    const completed = projectStage?.checklist?.filter(item => item.completed)?.length || 0

    const desc = getStageDesc(stageIndex - 1);


    const actionMap = {
        PROJECTMANAGER: submitStage,
        HEADOFOPS: approveStage,
    };

    const allDocsUploaded = projectStage?.requiredDocs ? projectStage.requiredDocs.every(doc => doc.status === "UPLOADED") : false;

    const handleWorkflowAction = async () => {
        try {

            if (allDocsUploaded === false) {
                showNotification({
                    type: "error",
                    title: "Project Incomplete!",
                    message: "Upload all supporting documents to submit this stage"
                }) 
                return
            }

            if (projectStage?.workflowStatus === "COMPLETED" && user?.role === "PROJECTMANAGER") { 
                showNotification({
                    type: "success",
                    title: "Project Completed!",
                    message: `You have successfully completed - ${selectedProject?.projectName}`
                }) 
                return 
            } 

            if (projectStage?.workflowStatus === "COMPLETED" && user?.role === "HEADOFOPS") { 
                showNotification({
                    type: "success",
                    title: "Project Completed!",
                    message: `This project - ${selectedProject?.projectName} has been successfully completed`
                }) 
                return 
            } 

            const action = actionMap[user?.role];

            if (!action) {
                console.log("Unauthorized");
                return;
            }

            const response = await action(
                selectedProject?.projectId,
                projectStage?.stageOrder
            );

            const updatedProject = response.data

            setSelectedProject(updatedProject)

            setProjects(prevProjects => 
                prevProjects.map(project =>
                    project.projectId === updatedProject.projectId
                        ? updatedProject
                        : project
                )
            )

            user?.role === "PROJECTMANAGER"
            ? showNotification({
                type: "success",
                title: "Signoff Request Sent!",
                message: `You have successfully sent a signoff request for - ${selectedProject?.projectName} (${projectStage?.stageName})`
            }) : showNotification({
                type: "success",
                title: "Project Stage Signed off Successful!",
                message: `You have successfully signed off for - ${selectedProject?.projectName} (${projectStage?.stageName})`
            });

            onClose()

            window.dispatchEvent(new Event("notifications:refresh"))

        } catch (err) {
            console.error(err);

            user?.role === "PROJECTMANAGER"
            ? showNotification({
                type: "error",
                title: "Signoff Request Failed!",
                message: err.message
            }) : showNotification({
                type: "error",
                title: "Signoff Request Failed!",
                message: err.message
            });
        }
    };

    const handleRejection = async (pid, order, reason) => {

        try {
            if(!reasonn) { 
                return setIsOpen(true)
            } else {

                const response = await rejectStage(pid, order, reason)

                const updatedProject = response.data

                setSelectedProject(updatedProject)

                setProjects(prevProjects => 
                    prevProjects.map(project =>
                        project.projectId === updatedProject.projectId
                            ? updatedProject
                            : project
                    )
                )

                // console.log(response)

                setIsOpen(false)

                showNotification({
                    type: "success",
                    title: "Project Stage Signoff Rejected!",
                    message: `You have successfully rejected signoff for - ${selectedProject?.projectName} (${projectStage?.stageName})`
                });

                onClose()

                window.dispatchEvent(new Event("notifications:refresh"))
            }

        } catch(err) {
            console.error(err)

            showNotification({
                type: "error",
                title: "Reject Signoff Failed!",
                message: err.message
            });
        }
    }

    const handleReason = (e) => {
        setReasonn(e.target.value)
    }

    return (
        <div className='relative'>
            {/* Stage Summary */}
            <div className='mb-3'>
                <div className='flex items-center justify-between rounded-lg border border-[#0000000D] p-4 bg-[#F3F3F3]'>
                    <div className='flex items-center gap-2'>
                        {/* Current Stage Info */}
                        <p className='font-normal text-[16px]/[20px] text-[#636363]'>Stage {stageIndex}/8</p>
                        <p className='rounded-2xl px-2 py-1 bg-[#228CEE] font-medium text-[14px]/[20px] text-center text-[#FFFFFF]'>{currentStage}</p>
                    </div>
                    {/* Next Stage */}
                    <div>
                        <p className='font-normal text-[16px]/[20px] text-[#636363]'>
                        {
                            projectStage?.stageOrder !== 8
                                ? `Next - ${nextStage}` : null
                        }
                        </p>
                    </div>
                </div>
            </div>

            {/* Stage Description */}
            <div className='flex flex-col'>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909] mb-2'>{stageTitle}</h3>
                <p className='font-normal text-[14px]/[20px] text-[#636363] mb-3'>{desc}</p>

                {/* Number of Items */}
                <div className='flex flex-col sm:flex-row items-stretch gap-2 mb-3'>
                    <div className='flex-1 h-22 rounded-lg border border-[#0000000D] p-4 flex flex-col justify-between gap-4 bg-[#F3F3F3]'>
                        <p className='font-semibold text-[16px]/[20px] text-[#090909]'>{required}</p>
                        <p className='font-normal text-[16px]/[20px] text-[#636363]'>Mandatory Items</p>
                    </div>

                    <div className='flex-1 h-22 rounded-lg border border-[#0000000D] p-4 flex flex-col justify-between gap-4 bg-[#F3F3F3]'>
                        <p className='font-semibold text-[16px]/[20px] text-[#090909]'>{completed}/{checklistLength}</p>
                        <p className='font-normal text-[16px]/[20px] text-[#636363]'>Completed</p>
                    </div>
                </div>
            </div>

            {/* Stage Required Docs */}
            <div className=''>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909] mb-3'>Upload Supporting Documents</h3>
                <p className='font-normal text-[14px]/[20px] text-[#636363] mb-3'>Upload required documents to complete checklist & request signoff</p>
                {/* <ClientIDDoc /> */}
                {projectStage?.requiredDocs?.map((doc) => (
                    <UploadBox 
                        key={doc.key}
                        title={doc.title}
                        docKey={doc.key}
                        docStatus={doc.status}
                        docName={doc.fileName}
                        docURL={doc.fileURL}
                        projectId={selectedProject?.projectId}
                        stageId={projectStage?.id}
                        user={user}
                        setProjects={setProjects}
                        setSelectedProject={setSelectedProject}
                        showNotification={showNotification}
                    />
                ))}
            </div>

            {/* Stage Checklist */}
            <div className='mb-3'>
                <h3 className='font-semibold text-[16px]/[20px] text-[#090909] mb-3'>Stage Checklist</h3>
                {/* Checklist */}
                <div className='flex flex-col gap-2'>
                    {
                        projectStage?.checklist?.map((item) => (
                            <div 
                                key={item.id}
                                onClick={() =>
                                    toggleChecklist(
                                        setProjects,
                                        setSelectedProject,
                                        selectedProject?.projectId,
                                        projectStage?.id,
                                        item.id,
                                        user
                                    )
                                }
                                className='flex items-center justify-between w-full h-21 rounded-lg border border-[#0000000D] p-4 bg-[#F3F3F3] cursor-pointer'>
                                <div className='flex flex-col gap-2'>
                                    <div className='flex items-center gap-3'>
                                        <input 
                                            type="checkbox" 
                                            checked={item.completed || false}
                                            readOnly
                                            name="" 
                                            id="" 
                                            className='w-5 h-5 rounded-md border border-[#D0D5DD] bg-[#FFFFFF] outline-none accent-[#7F56D9] pointer-events-none' 
                                            />
                                        <p className='font-medium text-[14px]/[20px] text-[#000000]'>{item.title}</p>
                                    </div>
                                    <p className='font-normal text-[14px]/[20px] text-[#636363]'>{item.desc}</p>
                                </div>
                                {/* Required? */}
                                <div className={`rounded-2xl px-2 py-1 text-center ${item.isRequired ? "bg-[#D20019]" : ""} font-medium text-[14px]/[20px] text-[#FFFFFF]`}>{item.isRequired && "Required"}</div>
                            </div>
                        ))
                    }
                </div>
            </div>

            {user?.role === "PROJECTMANAGER" && ( 
                <button
                    onClick={handleWorkflowAction} 
                    className={`w-full border border-[#0000000D] rounded-lg px-4 py-2.5 bg-[#1B3C4A] cursor-pointer flex items-center justify-center gap-2`}>
                    <FaRegCircleCheck className='text-[#FFFFFF]' />
                    <p className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>{
                    projectStage?.workflowStatus === "COMPLETED" 
                        ? "Stage Completed" 
                        : "Request Signoff"
                    }
                    </p>
                </button>
            )}

            {user?.role === "HEADOFOPS" && ( 
            <div className='flex items-center justify-between gap-3 relative w-full'>
                {isOpen && (
                    <div className='absolute z-4000 bottom-10 right-0 w-full max-w-100'>
                        <textarea
                            value={reasonn}
                            onInput={(e) => handleReason(e)}
                            placeholder='Enter reason for rejection...'
                            className='w-full min-h-24 rounded-lg border border-[#E4E7EC] bg-[#FFFFFF] px-4 py-3 outline-none'
                        />
                    </div>
                )}

                {
                    projectStage?.workflowStatus !== "COMPLETED" 
                    ? (
                        <div className='flex items-center justify-between gap-3 w-full'>
                            <button
                                onClick={handleWorkflowAction} 
                                className='w-full border border-[#0000000D] rounded-lg px-4 py-2.5 bg-[#1B3C4A] flex items-center justify-center gap-2 cursor-pointer'>
                                <FaRegCircleCheck className='text-[#FFFFFF]' />
                                <p className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>Accept Signoff</p>
                            </button>

                            <button
                                onClick={() => handleRejection(selectedProject?.projectId, projectStage?.stageOrder, reasonn)} 
                                className='w-full border border-[#0000000D] rounded-lg px-4 py-2.5 bg-[#D20019] flex items-center justify-center gap-2 cursor-pointer'>
                                <FaRegCircleXmark className='text-[#FFFFFF]' />
                                <p className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>Reject Signoff</p>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleWorkflowAction}
                            className='w-full border border-[#0000000D] rounded-lg px-4 py-2.5 bg-[#1B3C4A] flex items-center justify-center gap-2 cursor-pointer'>
                            <FaRegCircleCheck className='text-[#FFFFFF]' />
                            <p className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>Stage Completed</p>
                        </button>
                    )
                }
            </div>
            )}
        </div>
    )

}

export default ProjectLifeCycle
