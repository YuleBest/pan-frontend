export function formatFileSize(bytes: number | undefined): string {
  if (bytes == null) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  let size = bytes
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  const iconMap: Record<string, string> = {
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    webp: 'image',
    svg: 'image',
    bmp: 'image',
    ico: 'image',
    mp4: 'video',
    mkv: 'video',
    avi: 'video',
    mov: 'video',
    webm: 'video',
    mp3: 'music',
    wav: 'music',
    flac: 'music',
    aac: 'music',
    ogg: 'music',
    pdf: 'file-text',
    doc: 'file-text',
    docx: 'file-text',
    xls: 'table',
    xlsx: 'table',
    ppt: 'presentation',
    pptx: 'presentation',
    zip: 'archive',
    rar: 'archive',
    '7z': 'archive',
    tar: 'archive',
    gz: 'archive',
    txt: 'file-text',
    md: 'file-text',
    json: 'file-text',
    xml: 'file-text',
    yaml: 'file-text',
    yml: 'file-text',
    html: 'globe',
    css: 'palette',
    js: 'code',
    ts: 'code',
    vue: 'code',
    py: 'code',
    java: 'code',
    cpp: 'code',
    c: 'code',
    go: 'code',
    rs: 'code',
    sh: 'terminal',
  }

  return iconMap[ext] ?? 'file'
}
