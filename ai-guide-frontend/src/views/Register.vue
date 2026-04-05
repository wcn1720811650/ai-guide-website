<template>
    <div class="min-h-screen flex items-center justify-center bg-[#0b1220] px-4">
      <div class="w-full max-w-md">
        <a-card
          class="rounded-2xl border border-[#1f2a44] bg-[#0f172a]/80 backdrop-blur-md shadow-lg"
          :body-style="{ padding: '32px' }"
          style="border-color:#10b981"
        >
          <!-- Header -->
          <div class="text-center mb-8">
            <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#10b981]/10 flex items-center justify-center">
              <UserOutlined class="text-[#10b981] text-xl" />
            </div>
            <h2 class="text-xl font-semibold text-slate-100">创建账户</h2>
            <p class="text-slate-400 text-sm mt-1">连接你的 AI 世界</p>
          </div>
  
          <!-- Form -->
          <a-form
            :model="formState"
            layout="vertical"
            @finish="handleRegister"
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
              :rules="[
                { required: true, message: '请输入密码' },
                { min: 6, message: '至少 6 位字符' }
              ]"
            >
              <a-input-password
                v-model:value="formState.password"
                size="large"
                placeholder="输入密码"
              />
            </a-form-item>
  
            <a-form-item
              label="确认密码"
              name="confirmPassword"
              :rules="[
                { required: true, message: '请确认密码' },
                { validator: validateConfirmPassword }
              ]"
            >
              <a-input-password
                v-model:value="formState.confirmPassword"
                size="large"
                placeholder="再次输入密码"
              />
            </a-form-item>
  
            <!-- 状态提示 -->
            <a-alert
              v-if="errorMessage"
              type="error"
              :message="errorMessage"
              show-icon
              class="mb-4"
            />
  
            <a-alert
              v-if="successMessage"
              type="success"
              :message="successMessage"
              show-icon
              class="mb-4"
            />
  
            <!-- 按钮 -->
            <a-form-item class="mb-0">
              <a-button
                type="primary"
                html-type="submit"
                :loading="isLoading"
                block
                size="large"
                class="rounded-lg"
                style="background-color:#10b981;border-color:#10b981"
              >
                注册
              </a-button>
            </a-form-item>
  
            <!-- Footer -->
            <div class="text-center text-sm text-slate-400 mt-6">
              已有账号？
              <router-link
                to="/login"
                class="text-[#10b981] hover:underline"
                style="color: #10b981"
              >
                去登录
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
  import { UserOutlined } from '@ant-design/icons-vue'
  import type { Rule } from 'ant-design-vue/es/form'
  
  const router = useRouter()
  
  const formState = reactive({
    username: '',
    password: '',
    confirmPassword: ''
  })
  
  const errorMessage = ref('')
  const successMessage = ref('')
  const isLoading = ref(false)
  
  const validateConfirmPassword = async (_rule: Rule, value: string) => {
    if (!value) return Promise.reject('请确认密码')
    if (value !== formState.password) return Promise.reject('两次密码不一致')
    return Promise.resolve()
  }
  
  const handleRegister = async (values: any) => {
    errorMessage.value = ''
    successMessage.value = ''
    isLoading.value = true
  
    try {
      const res = await axios.post('http://localhost:3000/api/user/register', {
        username: values.username,
        password: values.password
      })
  
      successMessage.value = res.data.message || '注册成功'
  
      setTimeout(() => {
        router.push('/login')
      }, 1200)
    } catch (err: any) {
      errorMessage.value = err?.response?.data?.message || '请求失败'
    } finally {
      isLoading.value = false
    }
  }
  </script>
  
  <style scoped>
    :deep(.ant-input),
    :deep(.ant-input-affix-wrapper) {
    background-color: #ffffff !important;
    border-color: #e5e7eb !important;
    color: #0f172a !important;
    }

    :deep(.ant-input:focus),
    :deep(.ant-input-affix-wrapper-focused) {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15) !important;
    }
  </style>