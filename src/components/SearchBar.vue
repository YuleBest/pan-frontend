<script setup lang="ts">
import { Search, X } from '@lucide/vue'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="search-bar">
    <Search class="search-icon" :size="16" />
    <input
      type="text"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      placeholder="搜索文件..."
      class="search-input"
    />
    <button
      v-if="modelValue"
      class="clear-btn"
      @click="emit('update:modelValue', '')"
      aria-label="清除搜索"
    >
      <X :size="16" />
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 400px;
  width: 100%;
}
.search-icon {
  position: absolute;
  left: 14px;
  color: #7a7a7a;
  pointer-events: none;
}
.search-input {
  width: 100%;
  height: 44px;
  padding: 0 40px 0 40px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  font-family:
    'SF Pro Text',
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.47;
  letter-spacing: -0.022em;
  color: #1d1d1f;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.search-input::placeholder {
  color: #7a7a7a;
  font-weight: 400;
}
.search-input:focus {
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.15);
}
.clear-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #7a7a7a;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  line-height: 1;
  transition: transform 0.15s;
}
.clear-btn:hover {
  color: #1d1d1f;
}
.clear-btn:active {
  transform: scale(0.95);
}
</style>
