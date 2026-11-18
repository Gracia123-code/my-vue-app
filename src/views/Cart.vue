<!-- ================= 1. HTML 骨架 ================= -->
<template>
  <div class="cart-container">
    <div class="header">
      <h2>我的购物车</h2>
      <el-button @click="$router.push('/home')">返回首页继续购物</el-button>
    </div>

    <!-- 购物车为空时的提示 -->
    <el-empty v-if="cartList.length === 0" description="购物车空空如也~" />

    <!-- 购物车有数据时展示表格 -->
    <div v-else>
      <el-table :data="cartList" style="width: 100%" border>
        <!-- 1. 商品图片列 -->
        <el-table-column label="商品图片" width="120">
          <template #default="scope">
            <img :src="getImage(scope.row.goods.imgUrl)" class="cart-img" />
          </template>
        </el-table-column>

        <!-- 2. 商品名称列 -->
        <el-table-column prop="goods.goodsName" label="商品名称" />

        <!-- 3. 单价列 -->
        <el-table-column label="单价" width="120">
          <template #default="scope">
            <span style="color: #ff4d4f;">￥{{ scope.row.goods.sellPrice }}</span>
          </template>
        </el-table-column>

        <!-- 4. 数量列（带加减按钮） -->
        <el-table-column label="购买数量" width="180">
          <template #default="scope">
            <!-- 当数量改变时，触发 updateNum 方法 -->
            <el-input-number 
              v-model="scope.row.buyNum" 
              :min="1" 
              :max="scope.row.goods.stock" 
              @change="updateNum(scope.row)" 
            />
          </template>
        </el-table-column>

        <!-- 5. 小计列（单价 * 数量） -->
        <el-table-column label="小计" width="120">
          <template #default="scope">
            <span style="color: #ff4d4f; font-weight: bold;">
              ￥{{ (scope.row.goods.sellPrice * scope.row.buyNum).toFixed(2) }}
            </span>
          </template>
        </el-table-column>

        <!-- 6. 操作列（删除） -->
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button type="danger" size="small" @click="deleteCart(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 底部结算栏 -->
      <div class="checkout-bar">
        <div class="total-info">
          <span>总金额：<span style="color: #ff4d4f; font-size: 24px; font-weight: bold;">￥{{ totalAmount }}</span></span>
          <span style="margin-left: 20px; font-size: 14px; color: #666;">
            我的积分：{{ userPoints }}（100积分抵扣1元）
          </span>
        </div>
        
        <div class="checkout-actions">
          <!-- 积分抵扣输入框 -->
          <el-input-number v-model="usePoints" :min="0" :max="userPoints" placeholder="使用积分" style="width: 150px; margin-right: 15px;" />
          <el-button type="primary" size="large" @click="submitOrder" :loading="submitting">立即结算</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- ================= 2. JavaScript 逻辑 ================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const cartList = ref([])       // 购物车数据
const userPoints = ref(0)      // 用户当前可用积分
const usePoints = ref(0)       // 本次下单准备使用的积分
const submitting = ref(false)  // 是否正在提交订单

// 获取图片地址
const getImage = (url) => {
  if (!url) return 'https://via.placeholder.com/100x100?text=暂无图片'
  const firstImg = url.split(',')[0]
  return firstImg.startsWith('http') ? firstImg : `http://localhost:8080${firstImg}`
}

// 动态计算总金额（只要购物车数据或数量变了，它会自动重新计算）
const totalAmount = computed(() => {
  let total = 0
  cartList.value.forEach(item => {
    total += item.goods.sellPrice * item.buyNum
  })
  return total.toFixed(2)
})

// 【方法】获取购物车列表
const fetchCart = async () => {
  try {
    const token = localStorage.getItem('token')
    // 注意：这里不需要传 userId，你的后端已经通过拦截器自动从 Token 取出来了
    const res = await axios.get('/api/cart/list', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.data.code === 200) {
      cartList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取购物车失败，请检查登录状态')
  }
}

// 【方法】获取用户最新积分
const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    // 调用后端接口拿最新积分，避免显示本地缓存里的旧数据
    const res = await axios.get('/api/user/info', { headers: { Authorization: `Bearer ${token}` } })
    if (res.data.code === 200) {
      userPoints.value = res.data.data.points || 0
    }
  } catch (error) {
    // 接口失败时，退回到本地缓存里的积分（兜底）
    const userStr = localStorage.getItem('userInfo')
    if (userStr) userPoints.value = JSON.parse(userStr).points || 0
  }
}

// 【方法】修改购物车数量
const updateNum = async (row) => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(`/api/cart/update?id=${row.id}&buyNum=${row.buyNum}`, null, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('数量已更新')
  } catch (error) {
    ElMessage.error('修改数量失败')
    fetchCart() // 失败就把数据重置回来
  }
}

// 【方法】删除购物车商品
const deleteCart = async (id) => {
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`/api/cart/delete/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('删除成功')
    fetchCart() // 重新加载列表
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 【方法】立即结算（提交订单）
const submitOrder = async () => {
  if (cartList.value.length === 0) return

  submitting.value = true
  try {
    const token = localStorage.getItem('token')
    
    // 调用你后端的 createOrder 接口，把使用的积分传过去
    const res = await axios.post('/api/order/create', null, {
      params: { usePoints: usePoints.value }, // 传积分
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.data.code === 200) {
      ElMessage.success('下单成功，资金已托管至平台！')
      // 下单成功后跳转到“我的订单”页面
      router.push('/order')
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '下单失败')
  } finally {
    submitting.value = false
  }
}

// 页面加载时执行
onMounted(() => {
  fetchCart()
  fetchUserInfo()
})
</script>

<!-- ================= 3. CSS 样式 ================= -->
<style scoped>
.cart-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.cart-img { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; }
.checkout-bar { 
  margin-top: 20px; 
  padding: 20px; 
  background: #fff; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border-radius: 8px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}
.checkout-actions { display: flex; align-items: center; }
</style>