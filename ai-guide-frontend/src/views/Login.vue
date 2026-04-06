<template>
    <div>
      <div>
        <a-card
          :body-style="{ padding: '40px 32px' }" style="border-color:#10b981"
        >
          <div>
            <div>
              <UnlockOutlined />
            </div>
            <h2>系统访问授权</h2>
            <p>验证身份，进入 AI 领航中枢</p>
          </div>
  
          <a-form
            :model="formState"
            layout="vertical"
            @finish="handleLogin"
            class="tech-form"
          >
            <a-form-item
              label="用户名"
              name="username"
              :rules="[{ required: true, message: '请输入用户名' }]"
            >
              <a-input
                v-model:value="formState.username"
                size="large"
                placeholder="输入用户名"
              />
            </a-form-item>
  
            <a-form-item
              label="密码"
              name="password"
              :rules="[{ required: true, message: '请输入密码' }]"
            >
              <a-input-password
                v-model:value="formState.password"
                size="large"
                placeholder="输入密码"
              />
            </a-form-item>
  
            <div v-if="errorMessage">
              <span class="mr-2">⚠️</span> {{ errorMessage }}
            </div>
  
            <div v-if="successMessage">
              <span class="mr-2">✅</span> {{ successMessage }}
            </div>
  
            <a-form-item class="mb-0">
              <a-button
                html-type="submit"
                :loading="isLoading"
                block
                size="large"
                class="login-btn"
              >
                <span v-if="isLoading">验证身份中...</span>
                <span v-else style="color: white;">启 动 登 录</span>
              </a-button>
            </a-form-item>
  
            <div>
              还没有注册？
              <router-link
                to="/register"
              >
                立即注册
              </router-link>
            </div>
          </a-form>
        </a-card>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import axios from 'axios'
  import { UnlockOutlined } from '@ant-design/icons-vue' 
  
  const router = useRouter()
  
  const formState = reactive({
    username: '',
    password: ''
  })
  
  const errorMessage = ref('')
  const successMessage = ref('')
  const isLoading = ref(false)
  
  const handleLogin = async (values: any) => {
    errorMessage.value = ''
    successMessage.value = ''
    isLoading.value = true
  
    try {
      // 调用后端登录接口
      const res = await axios.post('http://localhost:3000/api/user/login', {
        username: values.username,
        password: values.password
      })
  
      // 登录成功后，将 Token 和用户名存储到浏览器的 localStorage 中
      const token = res.data.token
      const username = res.data.username
      localStorage.setItem('token', token)
      localStorage.setItem('username', username)
  
      successMessage.value = '身份验证通过，正在接入系统...'
  
      // 登录成功后，延迟 1 秒跳转到首页 (或者跳转到后台 /admin)
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (err: any) {
      errorMessage.value = err?.response?.data?.message || '服务器连接失败，请重试'
    } finally {
      isLoading.value = false
    }
  }
  </script>
  
  <style scoped>  
  :deep(.ant-input:focus),
  :deep(.ant-input-affix-wrapper-focused) {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
  }
  
  :deep(.ant-input:hover),
  :deep(.ant-input-affix-wrapper:hover) {
    border-color: rgba(16, 185, 129, 0.5) !important;
  }
  
  /* 登录按钮样式 */
  .login-btn {
    background-color: #10b981 !important;
    border-color: #10b981 !important;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
  }
  
  .login-btn:hover,
  .login-btn:focus {
    background-color: #34d399 !important;
    border-color: #34d399 !important;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
    transform: translateY(-1px);
  }
  </style>