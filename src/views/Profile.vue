<!-- ================= 个人中心页 ================= -->
<template>
  <div class="profile-container">
    <div class="header">
      <h2>个人中心</h2>
      <el-button @click="$router.push('/home')">返回首页</el-button>
    </div>

    <!-- 左侧：基本信息卡片 -->
    <el-card class="info-card">
      <div class="info-top">
        <img :src="getImage(user.avatar)" class="avatar" />
        <div class="info-basic">
          <h3>{{ user.nickname || user.username }}</h3>
          <p>用户名：{{ user.username }}</p>
          <el-tag :type="user.role === 2 ? 'danger' : (user.role === 1 ? 'warning' : 'primary')">
            {{ roleText }}
          </el-tag>
        </div>
      </div>

      <el-divider />

      <!-- 详细资料 -->
      <div class="detail-row"><span class="label">姓名</span><span>{{ user.name || '未填写' }}</span></div>
      <div class="detail-row"><span class="label">手机号</span><span>{{ user.phone || '未填写' }}</span></div>
      <div class="detail-row"><span class="label">邮箱</span><span>{{ user.email || '未填写' }}</span></div>
      <div class="detail-row"><span class="label">城市</span><span>{{ user.city || '未填写' }}</span></div>
      <div class="detail-row"><span class="label">性别</span><span>{{ genderText }}</span></div>
      <div class="detail-row"><span class="label">好评率</span><span>{{ user.goodRate != null ? user.goodRate + '%' : '暂无评价' }}</span></div>

      <!-- 商家才显示店铺信息 -->
      <template v-if="user.role === 1">
        <el-divider />
        <div class="detail-row"><span class="label">店铺名称</span><span>{{ user.shopName || '未填写' }}</span></div>
        <div class="detail-row"><span class="label">银行卡号</span><span>{{ user.bankAccount || '未填写' }}</span></div>
      </template>

      <el-button type="primary" style="width: 100%; margin-top: 20px;" @click="openEditDialog">编辑资料</el-button>
    </el-card>

    <!-- 右侧：钱包卡片 -->
    <el-card class="wallet-card">
      <div class="wallet-item">
        <span>钱包余额</span>
        <span class="money">￥{{ user.balance }}</span>
        <el-button size="small" type="success" @click="openRecharge">充值</el-button>
      </div>
      <el-divider />
      <div class="wallet-item">
        <span>我的积分</span>
        <span class="points">{{ user.points }} 分</span>
        <span class="tips">100积分抵扣1元</span>
      </div>
    </el-card>

    <!-- 编辑资料弹窗 -->
    <el-dialog v-model="editVisible" title="编辑资料" width="480px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="editForm.city" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio :value="0">未知</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="头像">
          <!-- 上传头像，成功后把地址存进 editForm.avatar -->
          <el-upload action="/api/file/upload" :on-success="(res) => (editForm.avatar = res.data)" :limit="1" list-type="picture-card">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <!-- 商家额外可改的字段 -->
        <template v-if="user.role === 1">
          <el-form-item label="店铺名称">
            <el-input v-model="editForm.shopName" />
          </el-form-item>
          <el-form-item label="银行卡号">
            <el-input v-model="editForm.bankAccount" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<!-- ================= 个人中心逻辑 ================= -->
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getImage, authHeaders, getUserInfo, setUserInfo } from '../utils'

const user = ref({})          // 当前用户信息
const editVisible = ref(false) // 编辑资料弹窗是否显示

// 编辑资料表单
const editForm = reactive({
  name: '', nickname: '', phone: '', email: '', city: '', gender: 0, avatar: '', shopName: '', bankAccount: ''
})

// 角色文本
const roleText = computed(() => (user.value.role === 2 ? '管理员' : user.value.role === 1 ? '商家' : '普通用户'))
// 性别文本
const genderText = computed(() => ({ 0: '未知', 1: '男', 2: '女' }[user.value.gender] || '未知'))

// 拉取最新用户信息
const fetchUser = async () => {
  try {
    const res = await axios.get('/api/user/info', { headers: authHeaders() })
    if (res.data.code === 200) {
      user.value = res.data.data
      setUserInfo(res.data.data) // 同步更新本地缓存
    }
  } catch (error) {
    // 失败时退回本地缓存
    user.value = getUserInfo()
  }
}

// 打开编辑资料弹窗（先把当前信息填进表单）
const openEditDialog = () => {
  Object.assign(editForm, {
    name: user.value.name,
    nickname: user.value.nickname,
    phone: user.value.phone,
    email: user.value.email,
    city: user.value.city,
    gender: user.value.gender,
    avatar: user.value.avatar,
    shopName: user.value.shopName,
    bankAccount: user.value.bankAccount
  })
  editVisible.value = true
}

// 保存编辑
const submitEdit = async () => {
  try {
    const res = await axios.put('/api/user/update', editForm, { headers: authHeaders() })
    if (res.data.code === 200) {
      ElMessage.success('资料修改成功！')
      editVisible.value = false
      fetchUser() // 重新拉取最新信息
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '修改失败')
  }
}

// 打开充值弹窗
const openRecharge = () => {
  ElMessageBox.prompt('请输入充值金额', '钱包充值', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async ({ value }) => {
    if (isNaN(value) || value <= 0) return ElMessage.warning('金额不合法')
    try {
      const res = await axios.post('/api/user/recharge', null, {
        params: { amount: value },
        headers: authHeaders()
      })
      if (res.data.code === 200) {
        ElMessage.success('充值成功！')
        fetchUser()
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.msg || '充值失败')
    }
  }).catch(() => {}) // 用户点了取消，静默处理
}

onMounted(() => fetchUser())
</script>

<!-- ================= 个人中心样式 ================= -->
<style scoped>
.profile-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.info-card { display: inline-block; width: 55%; vertical-align: top; margin-right: 20px; }
.wallet-card { display: inline-block; width: 40%; vertical-align: top; }
.info-top { display: flex; gap: 20px; align-items: center; }
.avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
.info-basic h3 { margin: 0 0 10px; }
.info-basic p { color: #666; margin: 0 0 10px; }
.detail-row { display: flex; justify-content: space-between; padding: 8px 0; color: #333; }
.detail-row .label { color: #999; }
.wallet-item { display: flex; align-items: center; gap: 15px; }
.wallet-item .money { font-size: 28px; color: #ff4d4f; font-weight: bold; flex: 1; }
.wallet-item .points { font-size: 24px; color: #409eff; font-weight: bold; flex: 1; }
.wallet-item .tips { color: #999; font-size: 12px; }
</style>
