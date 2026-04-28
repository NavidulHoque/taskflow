import { z } from 'zod';

// ─── Request Upload URL ───────────────────────────────────────────────────────

export const requestUploadUrlSchema = z.object({
	taskId: z.string().uuid(),
	fileName: z.string().min(1).max(255),
	mimeType: z.string().min(1).max(100),
	fileSize: z.number().int().positive().optional(),
});

export const requestUploadUrlOutputSchema = z.object({
	uploadId: z.string().uuid(),
	signedUrl: z.string(),
	filePath: z.string(),
});

// ─── Confirm Upload ───────────────────────────────────────────────────────────

export const confirmUploadSchema = z.object({
	uploadId: z.string().uuid(),
});

export const confirmUploadOutputSchema = z.object({
	message: z.string(),
	filePath: z.string(),
});

// ─── Download URL ─────────────────────────────────────────────────────────────

export const getDownloadUrlSchema = z.object({
	uploadId: z.string().uuid(),
});

export const downloadUrlOutputSchema = z.object({
	url: z.string(),
});

// ─── Delete Upload ────────────────────────────────────────────────────────────

export const deleteUploadSchema = z.object({
	uploadId: z.string().uuid(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;
export type RequestUploadUrlOutput = z.infer<typeof requestUploadUrlOutputSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type ConfirmUploadOutput = z.infer<typeof confirmUploadOutputSchema>;
export type GetDownloadUrlInput = z.infer<typeof getDownloadUrlSchema>;
export type DeleteUploadInput = z.infer<typeof deleteUploadSchema>;
export type DownloadUrlOutput = z.infer<typeof downloadUrlOutputSchema>;
