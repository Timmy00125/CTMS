export interface BulkUploadResult {
  created: number;
  errors: { row: number; field?: string; message: string }[];
}
