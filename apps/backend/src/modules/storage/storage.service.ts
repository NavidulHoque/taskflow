import { Injectable, Logger } from '@nestjs/common';

import { and, eq, uploads } from '@taskflow/database';
import { ORPCError } from '@taskflow/orpc';
import type { IStorageService } from '@taskflow/orpc';
import type {
	ConfirmUploadOutput,
	MessageOutput,
	RequestUploadUrlInput,
	RequestUploadUrlOutput,
} from '@taskflow/validation';

import { DatabaseService } from '@backend/modules/database/database.service';
import { SupabaseService } from '@backend/modules/supabase/supabase.service';

import { BUCKET, SIZE_LIMIT, UPLOAD_STATUS } from './types/storage.types';

@Injectable()
export class StorageService implements IStorageService {
	private readonly logger = new Logger(StorageService.name);

	constructor(
		private readonly supabase: SupabaseService,
		private readonly database: DatabaseService
	) {}

	async requestUploadUrl(userId: string, input: RequestUploadUrlInput): Promise<RequestUploadUrlOutput> {
		if (input.fileSize && input.fileSize > SIZE_LIMIT[BUCKET.TASK_ATTACHMENTS]) {
			const limitMb = SIZE_LIMIT[BUCKET.TASK_ATTACHMENTS] / 1024 / 1024;
			throw new ORPCError('BAD_REQUEST', { message: `File exceeds the ${limitMb}MB limit` });
		}

		const sanitized = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
		const filePath = `${input.taskId}/${sanitized}`;

		const { data, error } = await this.supabase.admin.storage
			.from(BUCKET.TASK_ATTACHMENTS)
			.createSignedUploadUrl(filePath);

		if (error || !data) {
			this.logger.error('[request-upload-url] createSignedUploadUrl failed', error);
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create upload URL' });
		}

		const [record] = await this.database.db
			.insert(uploads)
			.values({
				uploadedBy: userId,
				bucket: BUCKET.TASK_ATTACHMENTS,
				filePath,
				mimeType: input.mimeType,
				fileSize: input.fileSize ?? null,
				status: UPLOAD_STATUS.PENDING,
			})
			.returning({ id: uploads.id });

		return { uploadId: record.id, signedUrl: data.signedUrl, filePath };
	}

	async confirmUpload(uploadId: string, userId: string): Promise<ConfirmUploadOutput> {
		const [upload] = await this.database.db
			.select()
			.from(uploads)
			.where(and(eq(uploads.id, uploadId), eq(uploads.uploadedBy, userId)))
			.limit(1);

		if (!upload) throw new ORPCError('NOT_FOUND', { message: 'Upload not found' });
		if (upload.status === UPLOAD_STATUS.CONFIRMED)
			throw new ORPCError('BAD_REQUEST', { message: 'Upload already confirmed' });

		await this.database.db
			.update(uploads)
			.set({ status: UPLOAD_STATUS.CONFIRMED, confirmedAt: new Date() })
			.where(eq(uploads.id, uploadId));

		return { message: 'Upload confirmed', filePath: upload.filePath };
	}

	async getSignedDownloadUrl(uploadId: string, userId: string): Promise<string> {
		const [upload] = await this.database.db
			.select()
			.from(uploads)
			.where(and(eq(uploads.id, uploadId), eq(uploads.uploadedBy, userId)))
			.limit(1);

		if (!upload) throw new ORPCError('NOT_FOUND', { message: 'Upload not found' });
		if (upload.status !== UPLOAD_STATUS.CONFIRMED)
			throw new ORPCError('BAD_REQUEST', { message: 'Upload not yet confirmed' });

		const { data, error } = await this.supabase.admin.storage
			.from(upload.bucket)
			.createSignedUrl(upload.filePath, 3600);

		if (error || !data)
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create download URL' });

		return data.signedUrl;
	}

	async deleteUpload(uploadId: string, userId: string): Promise<MessageOutput> {
		const [upload] = await this.database.db
			.select()
			.from(uploads)
			.where(and(eq(uploads.id, uploadId), eq(uploads.uploadedBy, userId)))
			.limit(1);

		if (!upload) throw new ORPCError('NOT_FOUND', { message: 'Upload not found' });

		const { error } = await this.supabase.admin.storage.from(upload.bucket).remove([upload.filePath]);

		if (error) {
			this.logger.error('[delete-upload] storage remove failed', error);
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete upload' });
		}

		await this.database.db.delete(uploads).where(eq(uploads.id, uploadId));

		return { message: 'Upload deleted successfully' };
	}
}
