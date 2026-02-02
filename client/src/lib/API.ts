import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { API_URL } from "./config.ts";

export const API = axios.create({
  baseURL: `${API_URL}/api`,
});

API.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }

    return request;
  },
  () => Promise.reject(),
);
