import type { FileListResponse, DownloadResponse } from '@/types'

const API_BASE = 'https://pan-worker-api.yule.ink'

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Network error' }))
    throw new Error((body as { error: string }).error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function fetchFiles(prefix?: string): Promise<FileListResponse> {
  const params = new URLSearchParams()
  if (prefix) params.set('prefix', prefix)
  const query = params.toString()
  return request<FileListResponse>(`${API_BASE}/api/files${query ? `?${query}` : ''}`)
}

export function fetchDownload(path: string): Promise<DownloadResponse> {
  return request<DownloadResponse>(`${API_BASE}/api/download?path=${encodeURIComponent(path)}`)
}

export function getDownloadUrl(path: string): string {
  return `${API_BASE}/api/download?path=${encodeURIComponent(path)}`
}
