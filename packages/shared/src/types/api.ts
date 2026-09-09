export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
};
