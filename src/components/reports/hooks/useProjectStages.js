import { useMemo } from 'react';
import { useProjects } from './useProjects';

const EMPTY_STAGES = [];

/**
 * Stages for one project — the dependent half of the form's project/stage pair.
 *
 * NO SECOND REQUEST. `GET /projects` already embeds each project's full stage
 * list, so fetching `GET /projects/{id}` just to read `stages` off it would be
 * a round trip for data already in memory. Selecting a project is therefore
 * instant, and switching between projects costs nothing.
 *
 * If your `/projects` list ever stops embedding stages, swap this for
 * `projectService.getProjectStages`, which falls back to the detail endpoint.
 */
export const useProjectStages = (projectId) => {
  const { projects, isLoading, error } = useProjects();

  const stages = useMemo(() => {
    if (!projectId) return EMPTY_STAGES;
    const project = projects.find((entry) => entry.id === projectId);
    return project?.stages?.length ? project.stages : EMPTY_STAGES;
  }, [projects, projectId]);

  return {
    stages,
    error,
    // Only "loading" while the list itself is in flight.
    isLoading: Boolean(projectId) && isLoading,
  };
};
