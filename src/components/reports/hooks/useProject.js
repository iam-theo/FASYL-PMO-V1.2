import { useCallback } from 'react';
import { CACHE_KEYS } from '../constants/cache.constants';
import { projectService } from '../services/projectService';
import { useAsyncResource } from './useAsyncResource';

/**
 * One project, for resolving a report's project and stage names on the detail
 * page. Failure is not surfaced — the page falls back to the raw ids, which are
 * still meaningful, rather than showing an error for missing decoration.
 */
export const useProject = (projectId) => {
  const fetchProject = useCallback(
    ({ force }) => projectService.getProjectById(projectId, { force }),
    [projectId],
  );

  const { data, isLoading } = useAsyncResource(fetchProject, {
    deps: [projectId],
    enabled: Boolean(projectId),
    cacheKey: projectId ? CACHE_KEYS.project(projectId) : null,
  });

  return { project: data, isLoading: Boolean(projectId) && isLoading };
};
