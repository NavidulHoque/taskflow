import type {
	ConfirmUploadOutput,
	MessageOutput,
	RequestUploadUrlInput,
	RequestUploadUrlOutput,
} from '@taskflow/validation';

export interface IStorageService {
	requestUploadUrl(userId: string, input: RequestUploadUrlInput): Promise<RequestUploadUrlOutput>;
	confirmUpload(uploadId: string, userId: string): Promise<ConfirmUploadOutput>;
	getSignedDownloadUrl(uploadId: string, userId: string): Promise<string>;
	deleteUpload(uploadId: string, userId: string): Promise<MessageOutput>;
}
