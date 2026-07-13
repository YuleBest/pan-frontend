import { ref, computed } from 'vue'
import { fetchFiles, fetchDownload } from '@/api'
import type { FileNode, SortField, SortOrder, DownloadResponse } from '@/types'

export function useFiles() {
  const tree = ref<FileNode[]>([])
  const totalCount = ref(0)
  const currentPrefix = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const searchQuery = ref('')
  const sortField = ref<SortField>('name')
  const sortOrder = ref<SortOrder>('asc')

  const breadcrumbs = computed(() => {
    if (!currentPrefix.value) return [{ name: '根目录', path: '' }]
    const parts = currentPrefix.value.replace(/\/$/, '').split('/')
    return [
      { name: '根目录', path: '' },
      ...parts.map((p, i) => ({
        name: p,
        path: parts.slice(0, i + 1).join('/') + '/',
      })),
    ]
  })

  async function loadFiles(prefix?: string) {
    loading.value = true
    error.value = null
    try {
      const res = await fetchFiles(prefix)
      tree.value = res.tree
      totalCount.value = res.count
      currentPrefix.value = res.prefix ?? null
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      tree.value = []
    } finally {
      loading.value = false
    }
  }

  async function getDownloadInfo(path: string): Promise<DownloadResponse> {
    return fetchDownload(path)
  }

  function navigateTo(path: string) {
    searchQuery.value = ''
    loadFiles(path || undefined)
  }

  const allFiles = computed<FileNode[]>(() => {
    const result: FileNode[] = []

    function walk(nodes: FileNode[]) {
      for (const node of nodes) {
        if (node.type === 'directory') {
          result.push(node)
          if (node.children) walk(node.children)
        } else {
          result.push(node)
        }
      }
    }
    walk(tree.value)

    return result
  })

  const filteredFiles = computed<FileNode[]>(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return []

    return allFiles.value.filter((f) => f.name.toLowerCase().includes(q))
  })

  // 展开当前层级的项目
  // 根层级：展示顶层目录和文件（用户点击目录进入）
  // 有 prefix 时：API 返回目录包裹节点，需要展开 children
  const flatItems = computed<FileNode[]>(() => {
    const items: FileNode[] = []
    for (const node of tree.value) {
      if (currentPrefix.value && node.type === 'directory' && node.children) {
        items.push(...node.children)
      } else {
        items.push(node)
      }
    }
    return items
  })

  // 当前展示层级的项目计数
  const displayCount = computed(() => {
    if (searchQuery.value.trim()) return filteredFiles.value.length
    return flatItems.value.length
  })

  const sortedTree = computed<FileNode[]>(() => {
    const dirs = flatItems.value.filter((n) => n.type === 'directory')
    const files = flatItems.value.filter((n) => n.type === 'file')

    const cmp = (a: FileNode, b: FileNode) => {
      let result: number
      if (sortField.value === 'name') {
        result = a.name.localeCompare(b.name)
      } else if (sortField.value === 'size') {
        result = (a.size ?? 0) - (b.size ?? 0)
      } else {
        result = new Date(a.lastModified ?? 0).getTime() - new Date(b.lastModified ?? 0).getTime()
      }
      return sortOrder.value === 'asc' ? result : -result
    }

    return [...dirs.sort(cmp), ...files.sort(cmp)]
  })

  function toggleSort(field: SortField) {
    if (sortField.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortOrder.value = 'asc'
    }
  }

  return {
    tree,
    sortedTree,
    displayCount,
    totalCount,
    currentPrefix,
    loading,
    error,
    searchQuery,
    sortField,
    sortOrder,
    breadcrumbs,
    filteredFiles,
    loadFiles,
    getDownloadInfo,
    navigateTo,
    toggleSort,
  }
}
