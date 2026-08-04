import { useState, useRef, useEffect } from 'react'
import { processFile, getFileFromInput, handleDragOver, handleDragLeave,  getFileFromDrop } from './utils/UploadFiles'
import { uploadStageDocument, deleteStageDocument } from '../../../api'

function UploadBox({
    maxSizeMB = 5,
    formats = "SVG, JPG, PDF",
    title,
    docKey,
    docStatus,
    docName,
    docURL,
    projectId,
    stageId,
    user,
    setProjects,
    setSelectedProject
}) {
    const inputRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)

    // const [selectedFile, setSelectedFile] = useState(null);

    const [uploadState, setUploadState] = useState({})

    // Reset local file state when the target doc/stage changes. Several stages
    // share doc keys (e.g. uat_test_plan), so without this, navigating between
    // them would leak a stale selected file into the new stage's box.
    useEffect(() => {
        setUploadState({})
    }, [docKey, stageId])

    const allowedTypes = ["image/svg+xml", "image/jpeg", "application/pdf"]
    
    // Open file picker
    const handleClick = () => {
        if(user.role === "HEADOFOPS") return
        inputRef.current.click()
    }

    // INPUT UPLOAD
    const handleFileChange = async (e, key) => {

        if(user.role === "HEADOFOPS") return

        const file = getFileFromInput(e);

        if (!file) return;

        const result = await processFile(file, {
            allowedTypes,
            maxSizeMB
        });

        console.log(result.file)


        if (!result.success) {
            setUploadState(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                error: result.error
            }
            }));

            return;
        }

        console.log("Success")

        setUploadState(prev => ({
            ...prev,
            [key]: {
            file: result.file,
            fileName: result.fileName,
            previewUrl: result.preview,
            isUploaded: true,
            isSaved: false,
            error: ""
            }
        }));
    };

    // DROP UPLOAD
    const onDrop = async (e, key) => {

        if(user.role === "HEADOFOPS") return

        e.preventDefault()

        setIsDragging(false);

        const file = getFileFromDrop(e);

        if (!file) return;

        // validate FIRST
        const result = await processFile(file, {
            allowedTypes,
            maxSizeMB
        });

        // stop if invalid
        if (!result.success) {
            setUploadState(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                error: result.error
            }
            }));

            return;
        }

        console.log("Success")

        setUploadState(prev => ({
            ...prev,
            [key]: {
            file: result.file,
            fileName: result.fileName,
            previewUrl: result.preview,
            isUploaded: true,
            isSaved: false,
            error: ""
            }
        }));
    };

    const handlePreview = () => {
        console.log(uploadState)
        docStatus !== "PENDING"
            ? window.open(docURL, "_blank")
            : window.open(uploadState[docKey].previewUrl, "_blank")
    }

    const handleSaveUpload = async (key) => {
        if (user.role !== "PROJECTMANAGER") return;

        if (!uploadState[key].file) return;

        const docState = uploadState[key]

        try {
            const res = await uploadStageDocument(
                projectId,
                stageId,
                key,
                docState.file,
                docState.fileName
            );
            console.log("UPLOAD SUCCESS", res.data);

            if (res?.success === false) {
                setUploadState(prev => ({
                    ...prev,
                    [key]: {
                        ...prev[key],
                        error: res?.message || "Upload failed"
                    }
                }));
                return;
            }

            const updatedStage = res?.data;

            if (!updatedStage) return;

            setSelectedProject(prev => ({
                ...prev,
                stages: prev.stages.map(stage =>
                    stage.id === updatedStage.id
                        ? updatedStage
                        : stage
                )
            }));

            setProjects(prev =>
                prev.map(project => {

                    if (project.projectId !== projectId) {
                        return project;
                    }

                    return {
                        ...project,
                        stages: project.stages.map(stage =>
                            stage.id === updatedStage.id
                                ? updatedStage
                                : stage
                        )
                    };
                })
            );

            setUploadState(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    isSaved: true
                }
            }));

        } catch (err) {
            console.error("UPLOAD FAILED", err);

            setUploadState(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    error: err?.message || "Upload failed"
                }
            }));
        }
    };

    const handleDeleteUpload = async (key) => {
        if (user.role !== "PROJECTMANAGER") return;

        try {
            const res = await deleteStageDocument(
                projectId,
                stageId,
                key
            );
            console.log("DELETE SUCCESS", res.data);

            if (res?.success === false) {
                setUploadState(prev => ({
                    ...prev,
                    [key]: {
                        ...prev[key],
                        error: res?.message || "Delete failed"
                    }
                }));
                return;
            }

            const updatedStage = res?.data;

            if (!updatedStage) return;

            setSelectedProject(prev => ({
                ...prev,
                stages: prev.stages.map(stage =>
                    stage.id === updatedStage.id
                        ? updatedStage
                        : stage
                )
            }));

            setProjects(prev =>
                prev.map(project => {

                    if (project.projectId !== projectId) {
                        return project;
                    }

                    return {
                        ...project,
                        stages: project.stages.map(stage =>
                            stage.id === updatedStage.id
                                ? updatedStage
                                : stage
                        )
                    };
                })
            );

            setUploadState(prev => ({
                ...prev,
                [key]: {
                    file: null,
                    fileName: "",
                    previewUrl: "",
                    isUploaded: false,
                    isSaved: false,
                    error: "",
                }
            }));
        } catch(err) {
            console.error("DELETE FAILED", err);

            setUploadState(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    error: err?.message || "Delete failed"
                }
            }));
        }
    }

    const doc = uploadState[docKey];

    const isDeletable =
        doc?.isSaved === true ||
        docStatus === "UPLOADED" ||
        docStatus === "VERIFIED";

    const isPending = docStatus === "PENDING";

    return (
        <div className='flex flex-col gap-2'>
            
            <div className='mb-3'>
                <h2 className='font-medium text-[14px]/[20px] text-[#090909] mb-1.5'>{title}</h2>
                {/* Upload Box */}
                <div
                    key={docKey}
                    onDragOver={(e) => handleDragOver(e, setIsDragging)}
                    onDragLeave={() => handleDragLeave(setIsDragging)}
                    onDrop={(e) => onDrop(e, docKey)}
                    className={`w-full min-h-27.5 rounded-lg border border-dashed ${isDragging ? "bg-gray-100" : "bg-[#FFFFFF]"} border-[#E4E7EC] flex items-center justify-center cursor-pointer p-4`}>
                    {/* Hidden Input */}
                    <input 
                        ref={inputRef}
                        key={docKey}
                        type="file"
                        className='hidden'
                        accept="image/svg+xml,image/jpeg,application/pdf"
                        onChange={(e) => handleFileChange(e, docKey)} 
                    />
                    {/* Content */}
                    <div 
                        className='w-full'>
                        {
                            uploadState[docKey]?.isUploaded === true || docStatus === "PENDING" &&  
                            (<div className='text-center w-full'>
                                <i className="fa-solid fa-circle-arrow-up text-[#1B3C4A] mt-3"></i>
                                <p className='font-normal text-[14px]/[20px] text-[#636363]'>
                                    <span 
                                        onClick={handleClick} 
                                        className='text-[#1B3C4A] font-medium'>
                                            Click to upload 
                                    </span> 
                                    or drag and drop
                                </p>
                                <p className='font-normal text-[14px]/[20px] text-[#636363]'>{formats} (max. 5mb/4000x4000px)</p>

                                {/* Error */}
                                {uploadState[docKey]?.error && (
                                    <p className='text-[14px]/[20px] text-[#D20019] font-normal'>{uploadState[docKey]?.error}</p>
                                )}
                            </div>)
                        }

                        <div className=''>
                            {/* File Name */}
                            {
                                uploadState[docKey]?.isUploaded === true || docStatus !== "PENDING" 
                                    ?
                                    (
                                        <div className='w-full flex-col'>
                                            <p 
                                                className='text-[14px]/[20px] text-[#636363] font-normal mb-4'>{
                                                    docStatus === "UPLOADED"
                                                        ? docName
                                                        : uploadState[docKey]?.fileName
                                                    
                                                }
                                            </p>

                                            <div className='flex items-center justify-between'>
                                                <button 
                                                onClick={handlePreview}
                                                className='font-medium text-[14px]/[20px] text-[#1B3C4A] cursor-pointer'>View</button>
                                                {isDeletable ? (
                                                    <button
                                                        className="font-medium text-[14px]/[20px] text-[#D20019] cursor-pointer"
                                                        onClick={() => handleDeleteUpload(docKey)}
                                                    >
                                                        Delete
                                                    </button>
                                                    ) : isPending ? (
                                                    <button
                                                        className="font-medium text-[14px]/[20px] text-[#1B3C4A] cursor-pointer"
                                                        onClick={() => handleSaveUpload(docKey)}
                                                    >
                                                        Save
                                                    </button>
                                                    ) : null}
                                            </div>
                                        </div>
                                    ) 
                                    : null
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UploadBox