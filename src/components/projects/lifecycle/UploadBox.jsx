import { useState, useRef, useEffect } from 'react'
import { processFile, getFileFromInput, handleDragOver, handleDragLeave, getFileFromDrop } from './utils/UploadFiles'
import { uploadStageDocument, deleteStageDocument } from '../../../api'
import { MAX_UPLOAD_MB } from '../../../constants/uploads'
import {
    FaCloudArrowUp,
    FaRegFileLines,
    FaRegCircleCheck,
    FaRegTrashCan,
    FaEye,
    FaSpinner,
    FaRegCircleXmark,
    FaRegFloppyDisk,
} from 'react-icons/fa6'

function UploadBox({
    maxSizeMB = MAX_UPLOAD_MB,
    formats = "SVG, JPG, PDF, XLSX",
    title,
    docKey,
    docStatus,
    docName,
    docURL,
    projectId,
    stageId,
    user,
    setProjects,
    setSelectedProject,
    viewOnly = false
}) {
    const inputRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [busy, setBusy] = useState(false)
    const [uploadState, setUploadState] = useState({})

    // Reset local file state when the target doc/stage changes. Several stages
    // share doc keys (e.g. uat_test_plan), so without this, navigating between
    // them would leak a stale selected file into the new stage's box.
    useEffect(() => {
        setUploadState({})
        setBusy(false)
    }, [docKey, stageId])

    const allowedTypes = [
        "image/svg+xml",
        "image/jpeg",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    const isManager = user?.role === "PROJECTMANAGER"
    // HEADOOPS can never upload; viewOnly (e.g. reviewing a completed lifecycle
    // stage) additionally freezes the box for everyone, including the manager.
    const isReadOnly = user?.role === "HEADOFOPS" || viewOnly

    // Open file picker
    const handleClick = () => {
        if (isReadOnly) return
        inputRef.current?.click()
    }

    // INPUT UPLOAD
    const handleFileChange = async (e) => {
        if (isReadOnly) return

        const file = getFileFromInput(e);

        if (!file) return;

        const result = await processFile(file, {
            allowedTypes,
            maxSizeMB
        });

        if (!result.success) {
            setUploadState(prev => ({
                ...prev,
                [docKey]: {
                    ...prev[docKey],
                    error: result.error
                }
            }));
            return;
        }

        setUploadState(prev => ({
            ...prev,
            [docKey]: {
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
    const onDrop = async (e) => {
        if (isReadOnly) return

        e.preventDefault()
        setIsDragging(false);

        const file = getFileFromDrop(e);

        if (!file) return;

        const result = await processFile(file, {
            allowedTypes,
            maxSizeMB
        });

        if (!result.success) {
            setUploadState(prev => ({
                ...prev,
                [docKey]: {
                    ...prev[docKey],
                    error: result.error
                }
            }));
            return;
        }

        setUploadState(prev => ({
            ...prev,
            [docKey]: {
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
        const selected = uploadState[docKey]
        const previewUrl = selected?.previewUrl || docURL
        if (previewUrl) window.open(previewUrl, "_blank")
    };

    const handleSaveUpload = async () => {
        if (!isManager || isReadOnly || busy) return;

        const selected = uploadState[docKey]

        if (!selected?.file) return;

        setBusy(true)

        try {
            const res = await uploadStageDocument(
                projectId,
                stageId,
                docKey,
                selected.file,
                selected.fileName
            );

            if (res?.success === false) {
                setUploadState(prev => ({
                    ...prev,
                    [docKey]: {
                        ...prev[docKey],
                        error: res?.message || "Upload failed"
                    }
                }));
                return;
            }

            const updatedStage = res?.data;

            if (!updatedStage) return;

            setSelectedProject(prev => ({
                ...prev,
                stages: (prev?.stages || []).map(stage =>
                    stage.id === updatedStage.id
                        ? updatedStage
                        : stage
                )
            }));

            setProjects(prev =>
                (Array.isArray(prev) ? prev : []).map(project => {
                    if (project.projectId !== projectId) return project;

                    return {
                        ...project,
                        stages: (project.stages || []).map(stage =>
                            stage.id === updatedStage.id
                                ? updatedStage
                                : stage
                        )
                    };
                })
            );

            setUploadState(prev => ({
                ...prev,
                [docKey]: {
                    ...prev[docKey],
                    isSaved: true,
                    error: ""
                }
            }));
        } catch (err) {
            console.error("UPLOAD FAILED", err);
            setUploadState(prev => ({
                ...prev,
                [docKey]: {
                    ...prev[docKey],
                    error: err?.message || "Upload failed"
                }
            }));
        } finally {
            setBusy(false)
        }
    };

    const handleDeleteUpload = async () => {
        if (!isManager || isReadOnly || busy) return;

        setBusy(true)

        try {
            const res = await deleteStageDocument(
                projectId,
                stageId,
                docKey
            );

            if (res?.success === false) {
                setUploadState(prev => ({
                    ...prev,
                    [docKey]: {
                        ...prev[docKey],
                        error: res?.message || "Delete failed"
                    }
                }));
                return;
            }

            const updatedStage = res?.data;

            if (!updatedStage) return;

            setSelectedProject(prev => ({
                ...prev,
                stages: (prev?.stages || []).map(stage =>
                    stage.id === updatedStage.id
                        ? updatedStage
                        : stage
                )
            }));

            setProjects(prev =>
                (Array.isArray(prev) ? prev : []).map(project => {
                    if (project.projectId !== projectId) return project;

                    return {
                        ...project,
                        stages: (project.stages || []).map(stage =>
                            stage.id === updatedStage.id
                                ? updatedStage
                                : stage
                        )
                    };
                })
            );

            setUploadState(prev => ({
                ...prev,
                [docKey]: {
                    file: null,
                    fileName: "",
                    previewUrl: "",
                    isUploaded: false,
                    isSaved: false,
                    error: "",
                }
            }));
        } catch (err) {
            console.error("DELETE FAILED", err);
            setUploadState(prev => ({
                ...prev,
                [docKey]: {
                    ...prev[docKey],
                    error: err?.message || "Delete failed"
                }
            }));
        } finally {
            setBusy(false)
        }
    };

    const clearSelection = () => {
        setUploadState(prev => ({
            ...prev,
            [docKey]: {
                ...prev[docKey],
                file: null,
                fileName: "",
                previewUrl: "",
                isUploaded: false,
                isSaved: false,
                error: "",
            }
        }));
    };

    const selected = uploadState[docKey]
    const hasSelection = !!selected?.isUploaded
    const isPending = docStatus === "PENDING"
    const isVerified = docStatus === "VERIFIED"

    const hasServerFile = docStatus === "UPLOADED" || docStatus === "VERIFIED"
    const isSaved = hasServerFile || selected?.isSaved === true

    const showDropzone = isPending && !hasSelection && !isReadOnly
    const showFileRow = !showDropzone

    const statusMeta = isVerified
        ? { label: "Verified", className: "bg-[#ECFDF3] text-[#027A48]" }
        : hasServerFile
            ? { label: "Uploaded", className: "bg-[#EFF8FF] text-[#175CD3]" }
            : hasSelection
                ? { label: "Ready to save", className: "bg-[#FFF4E5] text-[#B54708]" }
                : isReadOnly
                    ? { label: "Awaiting upload", className: "bg-line text-ink-muted" }
                    : { label: "Not uploaded", className: "bg-line text-ink-muted" };

    const error = selected?.error

    const actionButtonClass =
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px]/[16px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"

    return (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        hasSelection || hasServerFile ? "bg-primary-soft text-primary" : "bg-line-soft text-ink-muted"
                    }`}>
                        {hasSelection || hasServerFile
                            ? <FaRegFileLines className="h-4 w-4" />
                            : <FaCloudArrowUp className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-[13px]/[18px] font-medium text-ink">{title}</p>
                        <p className="mt-0.5 truncate text-[11px]/[14px] text-ink-muted">{statusMeta.label}</p>
                    </div>
                </div>
                {hasSelection || hasServerFile ? (
                    <span className="shrink-0 text-[#08BD66]">
                        <FaRegCircleCheck className="h-4 w-4" />
                    </span>
                ) : (
                    <span className="shrink-0 text-ink-muted">
                        <FaRegCircleXmark className="h-4 w-4" />
                    </span>
                )}
            </div>

            {/* Dropzone */}
            {showDropzone && (
                <div
                    onDragOver={(e) => handleDragOver(e, setIsDragging)}
                    onDragLeave={() => handleDragLeave(setIsDragging)}
                    onDrop={(e) => onDrop(e)}
                    onClick={handleClick}
                    className={`mx-3.5 mb-3.5 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-4 text-center transition-colors ${
                        isDragging
                            ? "border-accent bg-[#F0F9FF]"
                            : "border-[#D0D5DD] bg-surface hover:border-accent/60 hover:bg-canvas"
                    }`}
                >
                    {/* Hidden Input */}
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept="image/svg+xml,image/jpeg,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={(e) => handleFileChange(e)}
                    />
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        isDragging ? "bg-accent text-white" : "bg-primary-soft text-primary"
                    }`}>
                        <FaCloudArrowUp className="h-4 w-4" />
                    </span>
                    <p className="text-[12px]/[16px] text-ink-soft">
                        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[11px]/[14px] text-ink-muted">
                        {formats} · Max {MAX_UPLOAD_MB}MB / 4000×4000px
                    </p>
                    {error && (
                        <p className="text-[11px]/[14px] font-medium text-[#D20019]">{error}</p>
                    )}
                </div>
            )}

            {/* File row */}
            {showFileRow && (
                <div className="flex items-center justify-between gap-3 border-t border-line-soft bg-canvas/60 px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                        {hasSelection || hasServerFile ? (
                            <FaRegFileLines className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                        ) : (
                            <FaCloudArrowUp className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                        )}
                        <p className="truncate text-[12px]/[16px] text-ink-soft">
                            {hasServerFile
                                ? docName
                                : selected?.fileName || "No file selected"}
                        </p>
                        {hasServerFile && !isVerified && (
                            <span className="shrink-0 rounded-full bg-[#FFF4E5] px-1.5 py-0.5 text-[10px]/[12px] font-semibold text-[#B54708]">
                                Pending verification
                            </span>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        {hasSelection || hasServerFile ? (
                            <button
                                onClick={handlePreview}
                                disabled={busy}
                                className={`${actionButtonClass} text-primary hover:bg-primary-soft`}
                            >
                                <FaEye className="h-3 w-3" />
                                View
                            </button>
                        ) : null}

                        {isManager && !isReadOnly && hasSelection && !isSaved && (
                            <>
                                <button
                                    onClick={handleSaveUpload}
                                    disabled={busy}
                                    className={`${actionButtonClass} bg-primary text-white hover:bg-primary-strong`}
                                >
                                    {busy ? (
                                        <>
                                            <FaSpinner className="h-3 w-3 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaRegFloppyDisk className="h-3 w-3" />
                                            Save
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={clearSelection}
                                    disabled={busy}
                                    className={`${actionButtonClass} text-ink-soft hover:bg-line`}
                                >
                                    Remove
                                </button>
                            </>
                        )}

                        {isManager && !isReadOnly && isSaved && (
                            <button
                                onClick={handleDeleteUpload}
                                disabled={busy}
                                className={`${actionButtonClass} text-[#D20019] hover:bg-[#FEF3F2]`}
                            >
                                {busy ? (
                                    <>
                                        <FaSpinner className="h-3 w-3 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FaRegTrashCan className="h-3 w-3" />
                                        Delete
                                    </>
                                )}
                            </button>
                        )}

                        {!isManager && hasServerFile && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px]/[12px] font-semibold ${statusMeta.className}`}>
                                {isVerified ? "Verified" : "Uploaded"}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default UploadBox
