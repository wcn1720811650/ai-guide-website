<script setup lang="ts">

</script>

<template>
  <a-layout style="min-height: 100vh; background-color: #f9fafb;">
    
    <a-layout-header style="background: #ffffff; padding: 0 50px; border-bottom: 1px solid #f0f0f0;">
      <div style="max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; height: 100%;">
        <router-link to="/" style="font-size: 20px; font-weight: bold; color: #10b981; text-decoration: none;">
          AI 枕边书
        </router-link>
        <div>
          <router-link to="/" style="margin-right: 24px; color: #333; text-decoration: none;">首页</router-link>
          <a href="#" style="color: #333; text-decoration: none;">关于本站</a>
        </div>
      </div>
    </a-layout-header>

    <a-layout-content style="padding: 40px 20px; max-width: 1000px; margin: 0 auto; width: 100%;">
      <router-view></router-view>
    </a-layout-content>
    
  </a-layout>
</template>
