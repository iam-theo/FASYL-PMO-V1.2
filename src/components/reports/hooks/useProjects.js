import { useCallback, useMemo } from 'react';
import { CACHE_KEYS } from '../constants/cache.constants';
import { projectService } from '../services/projectService';
import { useAsyncResource } from './useAsyncResource';

/** All projects, for the project selects on the form and the filter panel. */
export const useProjects = () => {
  const fetchProjects = useCallback(({ force }) => projectService.getProjects({ force }), []);

  const { data, error, isLoading, refetch } = useAsyncResource(fetchProjects, {
    initialData: [],
    cacheKey: CACHE_KEYS.projectsList(),
  });

  const projects = useMemo(() => data ?? [], [data]);

  return { projects, error, isLoading, refetch };
};
