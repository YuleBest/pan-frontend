<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { formatFileSize, formatDate, getFileIcon } from '@/utils/format'
import {
  Folder,
  Image,
  Video,
  Music,
  FileText,
  Table,
  Presentation,
  Archive,
  Globe,
  Palette,
  Code,
  Terminal,
  File,
} from '@lucide/vue'
import type { FileNode } from '@/types'

const iconComponents: Record<string, ReturnType<typeof shallowRef>> = {
  folder: shallowRef(Folder),
  image: shallowRef(Image),
  video: shallowRef(Video),
  music: shallowRef(Music),
  'file-text': shallowRef(FileText),
  table: shallowRef(Table),
  presentation: shallowRef(Presentation),
  archive: shallowRef(Archive),
  globe: shallowRef(Globe),
  palette: shallowRef(Palette),
  code: shallowRef(Code),
  terminal: shallowRef(Terminal),
  file: shallowRef(File),
}

const props = defineProps<{
  node: FileNode
  depth: number
}>()

const emit = defineEmits<{
  enter: [path: string]
  download: [node: FileNode]
  copyLink: [node: FileNode]
}>()

const isDir = computed(() => props.node.type === 'directory')
const iconName = computed(() => (isDir.value ? 'folder' : getFileIcon(props.node.name)))
const iconComp = computed(() => iconComponents[iconName.value]?.value ?? File)
const indentStyle = computed(() => ({ paddingLeft: `${props.depth * 20 + 12}px` }))

function handleClick() {
  if (isDir.value) {
    emit('enter', props.node.path)
  }
}
</script>

<template>
  <div :class="['file-item', { clickable: isDir }]" :style="indentStyle" @click="handleClick">
    <component :is="iconComp" class="icon" :size="20" />
    <div class="file-info">
      <span class="name">{{ node.name }}</span>
      <span v-if="!isDir" class="meta-line">
        <span class="meta-chip">{{ formatFileSize(node.size) }}</span>
        <span class="meta-chip">{{ formatDate(node.lastModified) }}</span>
      </span>
    </div>
    <span v-if="!isDir" class="actions">
      <button class="action-btn" @click.stop="emit('download', node)" title="下载文件">下载</button>
      <button class="action-btn" @click.stop="emit('copyLink', node)" title="复制下载链接">
        复制链接
      </button>
    </span>
  </div>
</template>

<style scoped>
.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.022em;
  color: #1d1d1f;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}
.file-item:hover {
  background: rgba(0, 0, 0, 0.02);
}
.file-item.clickable {
  cursor: pointer;
}
.file-item.clickable:hover {
  color: #0066cc;
}

.icon {
  flex-shrink: 0;
  color: #7a7a7a;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
}

.meta-line {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.meta-chip {
  font-size: 14px;
  font-weight: 400;
  color: #7a7a7a;
  letter-spacing: -0.014em;
  line-height: 1.43;
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.action-btn {
  font-size: 14px;
  font-weight: 400;
  color: #0066cc;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 12px;
  line-height: 1.29;
  font-family: inherit;
  border-radius: 6px;
  transition:
    background 0.15s,
    transform 0.15s;
  white-space: nowrap;
  letter-spacing: -0.014em;
}
.action-btn:hover {
  background: rgba(0, 102, 204, 0.06);
}
.action-btn:active {
  transform: scale(0.95);
}

/* Desktop: table-like columns */
@media (min-width: 641px) {
  .file-item {
    display: grid;
    grid-template-columns: 32px 1fr 100px 160px 140px;
    align-items: center;
    padding: 10px 12px;
    gap: 0;
    font-size: 14px;
    letter-spacing: -0.014em;
  }

  .file-info {
    display: contents;
  }

  .name {
    font-weight: 400;
  }

  .meta-line {
    display: contents;
  }

  .meta-chip {
    font-size: 14px;
    text-align: right;
    padding-right: 16px;
    letter-spacing: -0.014em;
    line-height: 1.43;
  }

  .meta-chip:first-child {
    grid-column: 3;
  }

  .meta-chip:last-child {
    grid-column: 4;
  }

  .actions {
    justify-content: flex-end;
    padding-right: 8px;
    grid-column: 5;
  }

  .action-btn {
    padding: 0;
    border-radius: 0;
    letter-spacing: -0.014em;
  }

  .action-btn:hover {
    text-decoration: underline;
    background: none;
  }
}
</style>
