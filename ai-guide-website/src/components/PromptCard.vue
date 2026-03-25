<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { message } from 'ant-design-vue'
import { Copy, Check } from 'lucide-vue-next'

const props = defineProps<{
  title?: string
  content: string
}>()

const { copy, copied, isSupported } = useClipboard({ source: props.content })

const handleCopy = async () => {
  if (!isSupported.value) {
    message.error('哎呀，您的浏览器不支持一键复制功能 😢')
    return
  }
  
  await copy(props.content)
  message.success('提示词已成功复制，快去发给 AI 吧！')
}
</script>

<template>
  <div style="margin: 24px 0; border: 1px solid #a7f3d0; border-radius: 8px; background-color: #ecfdf5; overflow: hidden; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.05);">
    
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: #d1fae5; border-bottom: 1px solid #a7f3d0;">
      
      <span style="font-weight: bold; color: #047857; display: flex; align-items: center; gap: 6px;">
        💡 {{ title || '核心提示词 (Prompt)' }}
      </span>
      
      <a-button 
        :type="copied ? 'default' : 'primary'" 
        size="small" 
        @click="handleCopy" 
        :style="{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          backgroundColor: copied ? '#ffffff' : '#10b981',
          color: copied ? '#10b981' : '#ffffff',
          borderColor: '#10b981',
          boxShadow: 'none'
        }"
      >
        <template #icon>
          <Check v-if="copied" :size="14" />
          <Copy v-else :size="14" />
        </template>
        {{ copied ? '已复制' : '一键复制' }}
      </a-button>

    </div>
    
    <div style="padding: 24px; color: #374151; font-family: monospace; white-space: pre-wrap; line-height: 1.6; font-size: 15px;">
      {{ content }}
    </div>

  </div>
</template>