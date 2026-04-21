import type { CreateProjectInput, ProjectOutput, UpdateProjectInput } from '@taskflow/validation';

export interface IProjectsService {
	create(userId: string, input: CreateProjectInput): Promise<ProjectOutput>;
	list(userId: string): Promise<ProjectOutput[]>;
	getById(userId: string, projectId: string): Promise<ProjectOutput>;
	update(userId: string, projectId: string, input: UpdateProjectInput): Promise<ProjectOutput>;
	delete(userId: string, projectId: string): Promise<{ message: string }>;
}
