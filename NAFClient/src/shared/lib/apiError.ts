import type { AxiosError } from "axios";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  static fromAxios(error: AxiosError): ApiError {
    const data = error.response?.data as Record<string, string> | undefined;
    const message =
      data?.error ??
      data?.message ??
      error.response?.statusText ??
      "Something went wrong.";
    const status = error.response?.status ?? 0;
    return new ApiError(message, status);
  }
}
