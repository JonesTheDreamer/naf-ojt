import type { AxiosError } from "axios";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  static fromAxios(error: AxiosError): ApiError {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const serverMessage =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
          ? data.message
          : undefined;
    const message =
      serverMessage ??
      error.response?.statusText ??
      error.message ??
      "Something went wrong.";
    const status = error.response?.status ?? 0;
    return new ApiError(message, status);
  }
}
