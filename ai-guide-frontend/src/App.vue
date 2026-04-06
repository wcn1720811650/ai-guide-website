<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const currentUsername = ref('')

watch(
  () => route.path,
  () => {
    currentUsername.value = localStorage.getItem('username') || ''
  },
  { immediate: true }
)

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  currentUsername.value = ''
  
  message.success('已安全退出当前账号')
  router.push('/login')
}
</script>

<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#10b981', 
        colorLink: '#10b981',    
        colorLinkHover: '#34d399', 
        borderRadius: 8,         
      },
    }"
  >
    <a-layout style="min-height: 100vh; background-color: #f9fafb;">
      
      <a-layout-header style="background: #ffffff; padding: 0 50px; border-bottom: 1px solid #f0f0f0;">
        <div style="max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; height: 100%;">
          
          <router-link to="/" style="font-size: 20px; font-weight: bold; color: #10b981; text-decoration: none;">
            AI 导航
          </router-link>
          
          <div style="display: flex; align-items: center; gap: 24px;">
            <router-link to="/" style="color: #333; text-decoration: none;">首页</router-link>
            
            <template v-if="currentUsername">
              <div style="display: flex; align-items: center; border-left: 1px solid #e5e7eb; padding-left: 24px;">
                <a-dropdown placement="bottomRight" :arrow="{ pointAtCenter: true }">
                  <a-avatar 
                    :size="40" 
                    style="background-color: #10b981;"
                  >
                    {{ currentUsername.charAt(0).toUpperCase() }}
                  </a-avatar>
                  
                  <template #overlay>
                    <a-menu style="min-width: 160px; padding: 8px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
                      
                      <div>
                        <div>已登录为</div>
                        <div>{{ currentUsername }}</div>
                      </div>
                      
                      <a-menu-item key="profile">
                        <router-link to="/" style="color: inherit; text-decoration: none;">
                          <UserOutlined class="mr-2" /> 个人主页
                        </router-link>
                      </a-menu-item>
                      
                      <a-menu-divider />
                      
                      <a-menu-item key="logout" @click="handleLogout">
                        <LogoutOutlined class="mr-2" /> 退出登录
                      </a-menu-item>
                      
                    </a-menu>
                  </template>

                </a-dropdown>
              </div>
            </template>

            <template v-else>
              <div style="display: flex; align-items: center; gap: 16px; border-left: 1px solid #e5e7eb; padding-left: 24px;">
                <router-link to="/login">
                  登录
                </router-link>
                <router-link to="/register">
                  <a-button type="primary" style="box-shadow: 0 4px 14px rgba(16,185,129,0.3);">
                    免费注册
                  </a-button>
                </router-link>
              </div>
            </template>

          </div>
        </div>
      </a-layout-header>

      <a-layout-content style="padding: 40px 20px; max-width: 1000px; margin: 0 auto; width: 100%;">
        <router-view></router-view>
      </a-layout-content>
      
    </a-layout>
  </a-config-provider>
</template>

<style>
/* 🌟 终极隐藏滚动条大法 */
html, body {
  /* 隐藏 Firefox 的滚动条 */
  scrollbar-width: none; 
  /* 隐藏 IE 和旧版 Edge 的滚动条 */
  -ms-overflow-style: none; 
}

/* 隐藏 Chrome, Safari 和新版 Edge 的滚动条 */
html::-webkit-scrollbar, 
body::-webkit-scrollbar {
  display: none; 
  width: 0;
  height: 0;
}
</style>