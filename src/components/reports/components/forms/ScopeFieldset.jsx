import PropTypes from 'prop-types';
import { EMPTY_STATES } from '../../constants/messages.constants';
import { SelectField } from '../ui/SelectField';
import { FormSection } from './FormSection';

/**
 * What the report covers: project, then the stage within it.
 *
 * The two are one idea, which is why they are one component — the stage select
 * is meaningless without the project and its enabled/empty/loading wording all
 * depends on it.
 */
export const ScopeFieldset = ({ register, errors, projects, stages, isLoadingStages, hasProject }) => {
  // Project names are often terse ("OFI"), so the client disambiguates them.
  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.clientName ? `${project.name.trim()} — ${project.clientName}` : project.name.trim(),
  }));
  const stageOptions = stages.map((stage) => ({ value: String(stage.id), label: stage.name }));

  return (
    <FormSection title="Scope" description="What this report covers.">
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Project"
          required
          options={projectOptions}
          placeholder="Select a project"
          emptyMessage={EMPTY_STATES.noProjects.title}
          error={errors.projectId?.message}
          {...register('projectId')}
        />

        <SelectField
          label="Stage"
          options={stageOptions}
          isLoading={isLoadingStages}
          placeholder="Whole project"
          disabled={!hasProject}
          emptyMessage={hasProject ? EMPTY_STATES.noStages.title : 'Select a project first'}
          hint={
            hasProject && !isLoadingStages && stages.length === 0
              ? EMPTY_STATES.noStages.body
              : 'Leave empty for a project-wide report.'
          }
          error={errors.stageId?.message}
          {...register('stageId')}
        />
      </div>
    </FormSection>
  );
};

ScopeFieldset.propTypes = {
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  projects: PropTypes.array.isRequired,
  stages: PropTypes.array.isRequired,
  isLoadingStages: PropTypes.bool,
  hasProject: PropTypes.bool,
};
