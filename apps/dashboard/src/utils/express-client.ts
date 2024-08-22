import { createClient } from "@map/supabase/server";
import axios, { type AxiosRequestConfig } from "axios";

const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://app.mapthemap.com"
    : "http://localhost:8080";

const apiClient = axios.create({
  baseURL: API_URL,
});

export async function authorizedApiCall<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
  config: AxiosRequestConfig = {},
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No active session");
  }

  const response = await apiClient.request<T>({
    url: endpoint,
    method,
    data,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
    ...config,
  });

  return response.data;
}
