<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFiles } from '@/composables/useFiles'
import SearchBar from '@/components/SearchBar.vue'
import FileItem from '@/components/FileItem.vue'
import type { FileNode } from '@/types'

const route = useRoute()
const router = useRouter()

const {
  sortedTree,
  displayCount,
  loading,
  error,
  searchQuery,
  sortField,
  sortOrder,
  breadcrumbs,
  filteredFiles,
  loadFiles,
  getDownloadInfo,
  toggleSort,
} = useFiles()

// 从 URL 解析目录前缀
function prefixFromRoute(): string | undefined {
  const pathMatch = route.params.pathMatch
  const path = Array.isArray(pathMatch) ? pathMatch.join('/') : pathMatch || ''
  if (!path) return undefined
  return path.endsWith('/') ? path : path + '/'
}

// 将目录前缀同步到 URL
function pushRoute(prefix: string | null) {
  if (!prefix) {
    router.push({ name: 'browse', params: { pathMatch: '' } })
  } else {
    const cleanPath = prefix.replace(/\/$/, '')
    router.push({ name: 'browse', params: { pathMatch: cleanPath } })
  }
}

// 进入目录：清搜索 + 更新 URL（watch 会自动触发加载）
function handleNavigate(path: string) {
  searchQuery.value = ''
  pushRoute(path || null)
}

// 监听 URL 变化加载文件
watch(
  () => route.params.pathMatch,
  () => {
    loadFiles(prefixFromRoute())
  },
  { immediate: true },
)

async function handleDownload(node: FileNode) {
  const url = node.url || ''
  const name = node.name
  if (!url) return

  try {
    const res = await fetch(url + '?t=' + Date.now())
    if (!res.ok) throw new Error('下载失败')
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank')
  }
}

async function handleCopyLink(node: FileNode) {
  let url = ''
  if (node.url) {
    url = node.url
  } else if (node.path) {
    try {
      const info = await getDownloadInfo(node.path)
      url = info.url
    } catch {
      url = node.url || ''
    }
  }
  if (!url) return

  try {
    await navigator.clipboard.writeText(url)
    showToast('链接已复制')
  } catch {
    // fallback: use textarea
    const ta = document.createElement('textarea')
    ta.value = url
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    showToast('链接已复制')
  }
}

let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string) {
  if (toastTimer) clearTimeout(toastTimer)
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = msg
  el.classList.add('show')
  toastTimer = setTimeout(() => {
    el.classList.remove('show')
  }, 2000)
}

const sortArrow = (field: string) => {
  if (sortField.value !== field) return '↕'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <div class="browser">
    <!-- Header -->
    <header class="header">
      <div class="header-inner">
        <h1 class="title">于乐的下载站</h1>
        <p class="subtitle">文件浏览器</p>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-inner">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <button
            v-for="(crumb, i) in breadcrumbs"
            :key="crumb.path"
            class="crumb"
            :class="{ active: i === breadcrumbs.length - 1 }"
            @click="handleNavigate(crumb.path)"
          >
            {{ crumb.name }}
          </button>
        </nav>

        <div class="toolbar-right">
          <SearchBar v-model="searchQuery" />
          <span class="count">共 {{ displayCount }} 项</span>
        </div>
      </div>

      <!-- Sort Controls -->
      <div class="sort-row">
        <span class="sort-label">排序：</span>
        <button
          class="sort-btn"
          :class="{ active: sortField === 'name' }"
          @click="toggleSort('name')"
        >
          名称 {{ sortArrow('name') }}
        </button>
        <button
          class="sort-btn"
          :class="{ active: sortField === 'size' }"
          @click="toggleSort('size')"
        >
          大小 {{ sortArrow('size') }}
        </button>
        <button
          class="sort-btn"
          :class="{ active: sortField === 'lastModified' }"
          @click="toggleSort('lastModified')"
        >
          修改时间 {{ sortArrow('lastModified') }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <main class="content">
      <!-- Loading -->
      <div v-if="loading" class="status">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="status error">
        <p>⚠️ {{ error }}</p>
        <button class="retry-btn" @click="loadFiles(prefixFromRoute())">重试</button>
      </div>

      <!-- Search results -->
      <div v-else-if="searchQuery.trim()" class="file-list-section">
        <h2 class="section-title">搜索结果（{{ filteredFiles.length }}）</h2>
        <div v-if="filteredFiles.length === 0" class="empty">未找到匹配的文件</div>
        <div v-else class="file-list">
          <div class="file-header-row desktop-only">
            <span class="header-icon"></span>
            <span class="header-name">名称</span>
            <span class="header-size">大小</span>
            <span class="header-date">修改时间</span>
            <span class="header-actions">操作</span>
          </div>
          <FileItem
            v-for="node in filteredFiles"
            :key="node.path"
            :node="node"
            :depth="0"
            @enter="handleNavigate"
            @download="handleDownload"
            @copy-link="handleCopyLink"
          />
        </div>
      </div>

      <!-- Normal file list -->
      <div v-else class="file-list-section">
        <div v-if="sortedTree.length === 0 && !loading" class="empty">此目录为空</div>
        <div v-else class="file-list">
          <div class="file-header-row desktop-only">
            <span class="header-icon"></span>
            <span class="header-name">名称</span>
            <span class="header-size">大小</span>
            <span class="header-date">修改时间</span>
            <span class="header-actions">操作</span>
          </div>
          <FileItem
            v-for="node in sortedTree"
            :key="node.path"
            :node="node"
            :depth="0"
            @enter="handleNavigate"
            @download="handleDownload"
            @copy-link="handleCopyLink"
          />
        </div>
      </div>
    </main>

    <!-- Toast -->
    <div id="toast" class="toast"></div>
  </div>
</template>

<style>
/* Global reset */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html {
  font-family:
    'SF Pro Text',
    'SF Pro Display',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Inter',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  background: #f5f5f7;
  color: #1d1d1f;
  min-height: 100vh;
}
</style>

<style scoped>
.browser {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

/* ===== Header — Apple-style hero tile ===== */
.header {
  padding: 80px 0 48px;
  text-align: center;
}
.header-inner {
  max-width: 600px;
  margin: 0 auto;
}
.title {
  font-family:
    'SF Pro Display',
    system-ui,
    -apple-system,
    'Inter',
    sans-serif;
  font-size: 40px;
  font-weight: 600;
  letter-spacing: 0;
  color: #1d1d1f;
  line-height: 1.1;
}
.subtitle {
  font-size: 21px;
  font-weight: 600;
  color: #7a7a7a;
  margin-top: 8px;
  letter-spacing: 0.011em;
  line-height: 1.19;
}

/* ===== Toolbar — store-utility-card style ===== */
.toolbar {
  background: #ffffff;
  border-radius: 18px;
  padding: 20px 24px;
  margin-bottom: 24px;
  border: 1px solid #e0e0e0;
}
.toolbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.count {
  font-size: 14px;
  font-weight: 400;
  color: #7a7a7a;
  white-space: nowrap;
  letter-spacing: -0.014em;
  line-height: 1.43;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.crumb {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 17px;
  font-weight: 400;
  color: #7a7a7a;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition:
    color 0.15s,
    background 0.15s;
  letter-spacing: -0.022em;
  line-height: 1.47;
}
.crumb:hover {
  color: #0066cc;
}
.crumb.active {
  color: #1d1d1f;
  font-weight: 600;
  cursor: default;
}
.crumb.active:hover {
  color: #1d1d1f;
}
.crumb + .crumb::before {
  content: '/';
  color: #e0e0e0;
  margin-right: 4px;
}

/* Sort */
.sort-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}
.sort-label {
  font-size: 14px;
  font-weight: 400;
  color: #7a7a7a;
  margin-right: 4px;
  letter-spacing: -0.014em;
  line-height: 1.43;
}
.sort-btn {
  background: #f5f5f7;
  border: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  color: #7a7a7a;
  padding: 6px 14px;
  border-radius: 9999px;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  letter-spacing: -0.014em;
  line-height: 1.29;
}
.sort-btn:hover {
  color: #1d1d1f;
  background: #e8e8ed;
}
.sort-btn.active {
  background: #0066cc;
  color: #ffffff;
}
.sort-btn.active:hover {
  background: #0055aa;
  color: #ffffff;
}
.sort-btn:active {
  transform: scale(0.95);
}

/* ===== Content card — store-utility-card style ===== */
.content {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

/* Status */
.status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 24px;
  color: #7a7a7a;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.022em;
}
.status.error {
  color: #d32f2f;
}
.retry-btn {
  background: #0066cc;
  color: #ffffff;
  border: none;
  font-family: inherit;
  font-size: 17px;
  font-weight: 400;
  letter-spacing: -0.022em;
  line-height: 1;
  padding: 11px 22px;
  border-radius: 9999px;
  cursor: pointer;
  transition: transform 0.15s;
}
.retry-btn:active {
  transform: scale(0.95);
}

/* Spinner */
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #0066cc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty */
.empty {
  padding: 80px 24px;
  text-align: center;
  color: #7a7a7a;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.022em;
}

/* Section */
.file-list-section {
  padding: 0;
}
.section-title {
  font-size: 21px;
  font-weight: 600;
  color: #1d1d1f;
  padding: 24px 24px 0;
  letter-spacing: 0.011em;
  line-height: 1.19;
}

/* File list header */
.file-header-row {
  display: grid;
  grid-template-columns: 32px 1fr 100px 160px 140px;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #7a7a7a;
  border-bottom: 2px solid #f0f0f0;
  background: #fafafc;
}
.header-size,
.header-date {
  text-align: right;
  padding-right: 16px;
}
.header-actions {
  text-align: right;
  padding-right: 8px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: #1d1d1f;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.014em;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.3s,
    transform 0.3s;
  z-index: 1000;
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* ===== Responsive ===== */

@media (max-width: 640px) {
  .browser {
    padding: 0 12px 60px;
  }

  .header {
    padding: 48px 0 32px;
  }

  .title {
    font-size: 34px;
  }

  .subtitle {
    font-size: 17px;
    margin-top: 4px;
  }

  .toolbar {
    padding: 14px 16px;
    border-radius: 14px;
    margin-bottom: 16px;
  }

  .toolbar-inner {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .toolbar-right {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .count {
    text-align: center;
  }

  .sort-row {
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
  }

  .sort-label {
    width: 100%;
    text-align: center;
    margin-right: 0;
    margin-bottom: 2px;
  }

  .sort-btn {
    font-size: 13px;
    padding: 5px 12px;
  }

  .content {
    border-radius: 14px;
  }

  .desktop-only {
    display: none !important;
  }

  .section-title {
    font-size: 17px;
    padding: 16px 16px 0;
  }

  .empty,
  .status {
    padding: 48px 16px;
  }
}

@media (max-width: 640px) {
  .breadcrumb {
    justify-content: center;
  }

  .crumb {
    font-size: 15px;
  }
}
</style>
