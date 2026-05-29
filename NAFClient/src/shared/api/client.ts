import axios, { type AxiosError } from "axios";
import { ApiError } from "@/shared/lib/apiError";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(ApiError.fromAxios(error)),
);
