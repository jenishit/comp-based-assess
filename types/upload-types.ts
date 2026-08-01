export interface UploadFileResponse {
  file_path: string;
  filename: string;
  saved_filename: string;
  size_bytes: number;
}

export interface PresignedUploadResponse {
  upload_url: string;
  file_key: string;
}
