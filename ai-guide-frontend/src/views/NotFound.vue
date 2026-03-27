<script setup lang="ts">
</script>

<template>
  <div class="not-found-container">
    <a-result
      status="404"
      title="404"
      sub-title="哎呀，你似乎来到了知识的荒原...这篇 AI 秘籍可能被黑洞吸走了。"
    >
      <template #extra>
        <router-link to="/">
          <a-button type="primary" size="large" style="border-radius: 8px;">
            返回首页安全地带
          </a-button>
        </router-link>
      </template>
    </a-result>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  /* 高度设置为视口高度的 80%，让画面偏中间且留有呼吸感 */
  min-height: 80vh; 
  background-color: #f9fafb; /* 淡淡的背景色，更显质感 */
}
</style>