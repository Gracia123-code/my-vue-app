<!-- ================= 登录页 ================= -->
<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 style="text-align: center; margin-bottom: 30px;">校园二手交易系统</h2>

      <!-- el-form 是 Element-Plus 的表单组件，:model 绑定表单数据 -->
      <el-form :model="loginForm" label-width="0">
        <!-- 用户名输入框，v-model 双向绑定 -->
        <el-form-item>
          <el-input v-model="loginForm.username" placeholder="请输入用户名" size="large" />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <!-- 验证码输入框和图片（点图片刷新验证码） -->
        <el-form-item>
          <div style="display: flex; width: 100%; gap: 10px;">
            <el-input v-model="loginForm.captcha" placeholder="图形验证码" size="large" />
            <img
              :src="captchaUrl"
              @click="refreshCaptcha"
              style="cursor: pointer; border-radius: 4px; height: 40px;"
              title="点击刷新验证码"
            />
          </div>
        </el-form-item>

        <!-- 登录按钮，:loading 控制加载状态 -->
        <el-button
          type="primary"
          size="large"
          style="width: 100%; margin-top: 10px;"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>

      <!-- 底部：去注册入口 -->
      <div style="text-align: center; margin-top: 15px; font-size: 14px;">
        还没有账号？<el-link type="primary" @click="$router.push('/register')">去注册</el-link>
      </div>
    </el-card>
  </div>
</template>

<!-- ================= 登录页逻辑 ================= -->
<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)      // 登录按钮是否显示加载中
const captchaUrl = ref('')      // 验证码图片地址

// reactive 定义响应式表单对象，专门放登录数据
const loginForm = reactive({
  username: '',
  password: '',
  captcha: '' // 验证码（保留输入框，后端登录校验可自行决定是否启用）
})

// 点击图片刷新验证码（加 ?t=时间戳 防止浏览器缓存图片）
const refreshCaptcha = () => {
  captchaUrl.value = `/api/user/captcha?t=${Date.now()}`
}

// 页面一打开就加载一张验证码
onMounted(() => {
  refreshCaptcha()
})

// 处理登录点击事件
const handleLogin = async () => {
  // 1. 前端先做非空校验，避免发无效请求
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码！')
    return
  }

  loading.value = true // 按钮变灰，显示加载中
  try {
    // 2. 调用后端登录接口
    const res = await axios.post('/api/user/login', {
      username: loginForm.username,
      password: loginForm.password
    })

    // 3. 登录成功（code === 200）
    if (res.data.code === 200) {
      ElMessage.success('登录成功！')

      // 4. 把后端返回的 JWT Token 和用户信息存到浏览器本地
      localStorage.setItem('token', res.data.data.token)
      localStorage.setItem('userInfo', JSON.stringify(res.data.data.userInfo))

      // 5. 跳转到首页
      router.push('/home')
    } else {
      ElMessage.error(res.data.msg || '登录失败')
      refreshCaptcha() // 登录失败刷新验证码
    }
  } catch (error) {
    // 6. 网络错误或后端返回异常，展示具体原因
    ElMessage.error(error.response?.data?.msg || '网络请求失败')
    refreshCaptcha()
  } finally {
    loading.value = false // 请求结束，按钮恢复原样
  }
}
</script>

<!-- ================= 登录页样式 ================= -->
<style scoped>
.login-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;     /* 垂直居中 */
  height: 100vh;           /* 高度占满整个屏幕 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 渐变背景 */
}
.login-card {
  width: 400px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); /* 阴影让卡片更立体 */
}
</style>
