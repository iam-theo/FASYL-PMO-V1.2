import { useMemo, useState } from "react";
// import { AiTwotonePlusCircle } from "react-icons/ai"
import ResourceCard from "./ResourceCard";
import ExportMenu from "../ExportMenu";
import AddResourceModal from "./AddResourceModal";
import RemoveResourceModal from "./RemoveResourceModal";
import { removeProjectResource, api } from "../../../../api";
import { useNotification } from "../../../NotificationContext";

const ITEMS_PER_PAGE = 6;

const resourceExportColumns = [
  { label: "First Name", value: (resource) => resource.firstName },
  { label: "Last Name", value: (resource) => resource.lastName },
  { label: "Staff ID", value: (resource) => resource.staffId },
  { label: "Phone Number", value: (resource) => resource.phoneNumber },
  { label: "Email", value: (resource) => resource.email },
];

function ResourcesTab({ project, onProjectUpdate, canManageResources = false }) {
  // console.log(project)

  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [resourceToRemove, setResourceToRemove] = useState(null)
  const [removing, setRemoving] = useState(false)
  const { showNotification } = useNotification()

  const resources = useMemo(() => project?.resources || [], [project?.resources]);

  const totalPages = Math.max(1, Math.ceil(resources.length / ITEMS_PER_PAGE));

  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return resources.slice(start, start + ITEMS_PER_PAGE);
  }, [resources, currentPage]);

  const handleResourceAdded = (updatedProject) => {
    onProjectUpdate?.(updatedProject);
  };

  const handleRemoveResource = async (resource) => {
    if (removing) return;

    try {
      setRemoving(true);
      const response = await removeProjectResource(project.id, resource.recordId);

      let freshProject = response.data;

      try {
        const freshResponse = await api.get(`/projects/${project.projectId}`);
        freshProject = freshResponse.data?.data ?? freshProject;
      } catch (refetchErr) {
        console.error(refetchErr);
      }

      setResourceToRemove(null);
      onProjectUpdate?.(freshProject);

      showNotification({
        type: "success",
        title: "Resource Removed!",
        message: `${resource.firstName} ${resource.lastName} has been removed from ${project.projectName ?? "the project"}`
      });
    } catch (error) {
      console.error(error);
      showNotification({
        type: "error",
        title: "Failed To Remove Resource!",
        message: error.response?.data?.error || "Unable to remove resource"
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-50 max-w-100 rounded-lg border border-[#0000001A] bg-[#FFFFFF] px-3.5 py-2.5 flex items-center gap-2">
            <i className="fa-solid fa-magnifying-glass text-[#090909]"></i>
            <input
              type="text"
              placeholder="Search"
              className="flex-1 outline-none font-normal text-[14px]/[24px] text-[#636363] bg-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <ExportMenu
              filename={`resources-${project?.projectId ?? "export"}`}
              title={`${project?.projectName ?? "Project"} - Resources`}
              columns={resourceExportColumns}
              rows={resources}
            />

            {canManageResources && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className='px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#1B3C4A] flex items-center gap-2 cursor-pointer'
              >
                <i className="fa-solid fa-plus text-[#FFFFFF]"></i>
                <span className='font-medium text-[14px]/[20px] text-[#FFFFFF]'>Add Resource</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4">
        {resources.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-5 py-16">
            <span className="flex min-h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B3C4A] to-[#2E6B7E] text-[#FFFFFF] shadow-card-hover">
              <i className="fa-solid fa-users text-[22px]"></i>
            </span>
            <div className="text-center">
              <h3 className="text-[16px]/[24px] font-semibold text-ink">
                No resources assigned yet
              </h3>
              <p className="mt-1 text-[13px]/[20px] text-ink-muted">
                {canManageResources
                  ? "Add staff from the directory to get this project moving."
                  : "This project has no resources assigned yet."}
              </p>
            </div>
            {canManageResources && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1B3C4A] px-4 font-medium text-[13px]/[20px] text-[#FFFFFF] cursor-pointer hover:bg-[#16313D]"
              >
                <i className="fa-solid fa-plus text-[#FFFFFF]"></i>
                Add Resource
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedResources.map((resource, index) => (
              <ResourceCard
                key={resource.recordId}
                resource={resource}
                index={index}
                onRemove={canManageResources ? setResourceToRemove : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#0000000D] bg-[#F2F2F2] px-6 py-4 flex items-center justify-between">
        <p className="font-medium text-[14px]/[20px] text-[#636363]">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-[#0000000D] shadow-[2px] shadow-[#1018280D] py-2.25 px-4.25 bg-[#E8E8E8] hover:bg-[#1B3C4A] font-medium text-[14px]/[20px] text-[#1B3C4A] hover:text-[#FFFFFF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#E8E8E8] disabled:hover:text-[#1B3C4A]"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-md border border-[#0000000D] shadow-[2px] shadow-[#1018280D] py-2.25 px-4.25 bg-[#E8E8E8] hover:bg-[#1B3C4A] font-medium text-[14px]/[20px] text-[#1B3C4A] hover:text-[#FFFFFF] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#E8E8E8] disabled:hover:text-[#1B3C4A]"
          >
            Next
          </button>
        </div>
      </div>

      {resourceToRemove && (
                <RemoveResourceModal
                    resource={resourceToRemove}
                    onCancel={() => setResourceToRemove(null)}
                    onConfirm={handleRemoveResource}
                />
            )}

            {isAddModalOpen && (
                <AddResourceModal
                    projectId={project.id}
                    projectCode={project.projectId}
                    projectName={project.projectName}
                    existingEmails={(project.resources || []).map((r) => r.email)}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdded={handleResourceAdded}
                />
            )}
    </div>
  );
}

export default ResourcesTab;
