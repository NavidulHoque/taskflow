import {
	confirmUploadOutputSchema,
	confirmUploadSchema,
	deleteUploadSchema,
	downloadUrlOutputSchema,
	getDownloadUrlSchema,
	messageOutputSchema,
	requestUploadUrlOutputSchema,
	requestUploadUrlSchema,
} from '@taskflow/validation';

import { protectedProcedure } from '../init';

export const uploadsRouter = {
	requestUploadUrl: protectedProcedure
		.route({
			method: 'POST',
			path: '/uploads/request',
			summary: 'Request a signed URL to upload a file directly to storage',
			tags: ['uploads'],
		})
		.input(requestUploadUrlSchema)
		.output(requestUploadUrlOutputSchema)
		.handler(({ context, input }) =>
			context.services.storage.requestUploadUrl(context.userId, input)
		),

	confirm: protectedProcedure
		.route({
			method: 'POST',
			path: '/uploads/confirm',
			summary: 'Confirm a completed upload',
			tags: ['uploads'],
		})
		.input(confirmUploadSchema)
		.output(confirmUploadOutputSchema)
		.handler(({ context, input }) =>
			context.services.storage.confirmUpload(input.uploadId, context.userId)
		),

	getDownloadUrl: protectedProcedure
		.route({
			method: 'POST',
			path: '/uploads/download-url',
			summary: 'Get a 1-hour signed download URL for a file you own',
			tags: ['uploads'],
		})
		.input(getDownloadUrlSchema)
		.output(downloadUrlOutputSchema)
		.handler(async ({ context, input }) => {
			const url = await context.services.storage.getSignedDownloadUrl(input.uploadId, context.userId);
			return { url };
		}),

	delete: protectedProcedure
		.route({
			method: 'DELETE',
			path: '/uploads/{uploadId}',
			summary: 'Delete an upload and remove the file from storage',
			tags: ['uploads'],
		})
		.input(deleteUploadSchema)
		.output(messageOutputSchema)
		.handler(({ context, input }) =>
			context.services.storage.deleteUpload(input.uploadId, context.userId)
		),
};
