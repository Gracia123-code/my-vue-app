<!-- ================= 注册页 ================= -->
<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2 style="text-align: center; margin-bottom: 20px;">注册账号</h2>

      <!-- 注册表单 -->
      <el-form :model="form" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="登录用的账号" />
        </el-form-item>

        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="真实姓名" />
        </el-form-item>

        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="至少6位" />
        </el-form-item>

        <el-form-item label="确认密码">
          <el-input v-model="confirmPassword" type="password" show-password placeholder="再输一遍密码" />
        </el-form-item>

        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="展示给别人的名字" />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="选填" />
        </el-form-item>

        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="选填" />
        </el-form-item>

        <el-form-item label="城市">
          <el-input v-model="form.city" placeholder="选填" />
        </el-form-item>

        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio :value="0">未知</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 角色选择：普通用户 or 商家 -->
        <el-form-item label="注册身份">
          <el-radio-group v-model="form.role">
            <el-radio :value="0">普通用户（买家）</el-radio>
            <el-radio :value="1">商家</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 只有选择「商家」时才显示这些开店资料 -->
        <template v-if="form.role === 1">
          <el-form-item label="店铺名称">
            <el-input v-model="form.shopName" placeholder="你的店铺叫什么名字" />
          </el-form-item>
          <el-form-item label="银行卡号">
            <el-input v-model="form.bankAccount" placeholder="用于收款" />
          </el-form-item>
          <el-form-item label="营业执照">
            <!-- 上传营业执照，成功后把返回的图片地址存到 businessLicenseImg -->
            <el-upload
              action="/api/file/upload"
              :on-success="(res) => (form.businessLicenseImg = res.data)"
              :limit="1"
              list-type="picture-card"
              :on-exceed="() => ElMessage.warning('只能上传一张')"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </el-form-item>
          <el-form-item label="身份证照片">
            <el-upload
              action="/api/file/upload"
              :on-success="(res) => (form.idCardImg = res.data)"
              :limit="1"
              list-type="picture-card"
              :on-exceed="() => ElMessage.warning('只能上传一张')"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </el-form-item>
        </template>

        <!-- 验证码 -->
        <el-form-item label="验证码">
          <div style="display: flex; gap: 10px; align-items: center;">
            <el-input v-model="form.captchaCode" placeholder="输入图形验证码" />
            <img :src="captchaUrl" @click="refreshCaptcha" style="cursor: pointer; height: 40px;" title="点击刷新" />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" style="width: 100%;" :loading="loading" @click="handleRegister">
            注 册
          </el-button>
        </el-form-item>

        <div style="text-align: center; font-size: 14px;">
          已有账号？<el-link type="primary" @click="$router.push('/login')">去登录</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<!-- ================= 注册页逻辑 ================= -->
<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const captchaUrl = ref('')
const confirmPassword = ref('') // 二次确认密码

// 注册表单数据（字段名和后端 UserRegisterDTO 保持一致）
const form = reactive({
  username: '',
  password: '',
  name: '',       // 姓名（真实姓名，注册必填）
  nickname: '',
  phone: '',
  email: '',
  city: '',
  gender: 0,       // 0未知 1男 2女
  role: 0,         // 0普通用户 1商家
  shopName: '',
  bankAccount: '',
  businessLicenseImg: '',
  idCardImg: '',
  captchaCode: ''  // 图形验证码
})

// 刷新验证码图片（加时间戳防止浏览器缓存）
const refreshCaptcha = () => {
  captchaUrl.value = `/api/user/captcha?t=${Date.now()}`
}

// 页面一打开就加载一张验证码
onMounted(() => refreshCaptcha())

// 处理注册点击事件
const handleRegister = async () => {
  // 1. 前端基础校验
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码！')
    return
  }
  if (!form.name) {
    ElMessage.warning('请输入姓名！')
    return
  }
  if (form.password.length < 6) {
    ElMessage.warning('密码至少6位！')
    return
  }
  if (form.password !== confirmPassword.value) {
    ElMessage.warning('两次输入的密码不一致！')
    return
  }
  if (!form.captchaCode) {
    ElMessage.warning('请输入验证码！')
    return
  }
  if (form.role === 1 && !form.shopName) {
    ElMessage.warning('请填写店铺名称！')
    return
  }
  // 银行卡号必须是16位数字（报告要求）
  if (form.role === 1 && !/^\d{16}$/.test(form.bankAccount || '')) {
    ElMessage.warning('银行卡号必须是16位数字！')
    return
  }

  loading.value = true
  try {
    // 2. 调用后端注册接口（后端会校验验证码、用户名是否重复）
    const res = await axios.post('/api/user/register', form)

    if (res.data.code === 200) {
      ElMessage.success('注册成功，请等待管理员审核！')
      router.push('/login') // 注册完回到登录页
    } else {
      ElMessage.error(res.data.msg)
      refreshCaptcha() // 失败刷新验证码
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '注册失败')
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}
</script>

<!-- ================= 注册页样式 ================= -->
<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 0;
}
.register-card {
  width: 560px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
</style>
