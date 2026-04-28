export const BUCKET = {
	TASK_ATTACHMENTS: 'task-attachments',
} as const;

export type Bucket = (typeof BUCKET)[keyof typeof BUCKET];

export const UPLOAD_STATUS = {
	PENDING: 'pending',
	CONFIRMED: 'confirmed',
	ORPHANED: 'orphaned',
} as const;

export const SIZE_LIMIT: Record<Bucket, number> = {
	[BUCKET.TASK_ATTACHMENTS]: 10 * 1024 * 1024, // 10MB
};

export const MIME_TO_EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'application/pdf': 'pdf',
};
