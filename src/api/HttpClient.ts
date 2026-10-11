import { invoke } from "@tauri-apps/api/core"

export interface RequestOptions {
  headers?: Record<string, string>
  query?: Record<string, string | number | boolean>
}

export interface HttpClient {
  get<T>(
    url: string,
    options?: RequestOptions
  ): Promise<T>

  post<T>(
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T>
}

export class TauriHttpClient implements HttpClient {

  async get<T>(
    url: string,
    options?: RequestOptions
  ): Promise<T> {

    return await invoke<T>("http_request", {
      method: "GET",
      url,
      headers: options?.headers,
    })
  }

  async post<T>(
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {

    return await invoke<T>("http_request", {
      method: "POST",
      url,
      body,
      headers: options?.headers,
    })
  }
}