export interface Result<T> {
  isSucceed: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export interface PaginationResult<T> extends Result<T> {
  totalItems: number;
  totalPages: number;
  indexPage: number;
  pageSize: number;
}
