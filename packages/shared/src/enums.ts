export const TaskStatus = {
	TODO: 'todo',
	IN_PROGRESS: 'in_progress',
	DONE: 'done',
}

export const TaskPriority = {
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
}

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority];
