export interface UploadFileResponse {
  file_path: string;
  filename: string;
  saved_filename: string;
  size_bytes: number;
}

export interface PresignedUploadResponse {
  upload_url: string;
  file_key: string;
  // Presigned-POST policy fields (key, policy, signature, ...) that must be
  // included in the multipart form — the policy is what enforces the 10 MB
  // size cap at the storage layer.
  fields: Record<string, string>;
}
