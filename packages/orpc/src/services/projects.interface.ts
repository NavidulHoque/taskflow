import type {
	CreateProjectInput,
	GetProjectsInput,
	MessageOutput,
	PaginatedProjectsOutput,
	ProjectOutput,
	UpdateProjectInput,
} from '@taskflow/validation';

export interface IProjectsService {
	createProject(userId: string, input: CreateProjectInput): Promise<ProjectOutput>;
	getAllProjects(userId: string, query: GetProjectsInput): Promise<PaginatedProjectsOutput>;
	getProjectById(userId: string, projectId: string): Promise<ProjectOutput>;
	updateProject(userId: string, input: UpdateProjectInput): Promise<ProjectOutput>;
	deleteProject(userId: string, projectId: string): Promise<MessageOutput>;
	archiveProject(userId: string, projectId: string): Promise<ProjectOutput>;
	unarchiveProject(userId: string, projectId: string): Promise<ProjectOutput>;
}
