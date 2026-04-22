import type {
	CreateProjectInput,
	ListProjectsQuery,
	PaginatedProjectsOutput,
	ProjectOutput,
	ProjectStatsOutput,
	UpdateProjectInput,
} from '@taskflow/validation';

export interface IProjectsService {
	create(userId: string, input: CreateProjectInput): Promise<ProjectOutput>;
	list(userId: string, query: ListProjectsQuery): Promise<PaginatedProjectsOutput>;
	getById(userId: string, projectId: string): Promise<ProjectOutput>;
	update(userId: string, projectId: string, input: UpdateProjectInput): Promise<ProjectOutput>;
	delete(userId: string, projectId: string): Promise<{ message: string }>;
	archive(userId: string, projectId: string): Promise<ProjectOutput>;
	unarchive(userId: string, projectId: string): Promise<ProjectOutput>;
	getStats(userId: string, projectId: string): Promise<ProjectStatsOutput>;
}
