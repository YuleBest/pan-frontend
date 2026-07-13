export interface FileNode {
  name: string
  type: 'file' | 'directory'
  path: string
  size?: number
  lastModified?: string
  url?: string
  children?: FileNode[]
}

export interface FileListResponse {
  tree: FileNode[]
  count: number
  prefix: string | null
}

export interface DownloadResponse {
  url: string
  name: string
  path: string
  size: number
  lastModified: string
  httpMetadata: {
    contentType: string
  } | null
}

export interface ApiError {
  error: string
}

export type SortField = 'name' | 'size' | 'lastModified'
export type SortOrder = 'asc' | 'desc'
