<!-- ================= 我的订单页 ================= -->
<template>
  <div class="order-container">
    <div class="header">
      <h2>我的订单</h2>
      <el-button @click="$router.push('/home')">返回首页</el-button>
    </div>

    <el-empty v-if="orderList.length === 0" description="暂无订单，快去首页逛逛吧~" />

    <div v-else class="order-list">
      <!-- 循环展示每一个订单 -->
      <el-card v-for="order in orderList" :key="order.id" class="order-card" shadow="hover">
        <!-- 订单头部信息 -->
        <div class="order-header">
          <span>订单编号：{{ order.orderNo }}</span>
          <span>下单时间：{{ formatTime(order.createTime) }}</span>
          <span class="amount">总金额：￥{{ order.totalAmount }}</span>
          <el-tag :type="getStatusType(order.orderStatus)">{{ getStatusText(order.orderStatus) }}</el-tag>
        </div>

        <!-- 订单里的商品明细列表 -->
        <div class="order-items">
          <div v-for="item in order.items" :key="item.id" class="item-row">
            <img :src="getImage(item.goods?.imgUrl)" class="item-img" />
            <div class="item-info">
              <div class="item-name">{{ item.goods?.goodsName }}</div>
              <div class="item-meta">单价 ￥{{ item.singlePrice }} × {{ item.buyNum }}</div>
            </div>
            <!-- 交易完成的订单，每个商品都可以单独评价 -->
            <el-button v-if="order.orderStatus === 3" type="primary" size="small" @click="openCommentDialog(item.id)">
              评价
            </el-button>
          </div>
        </div>

        <!-- 订单操作区域 -->
        <div class="order-actions">
          <!-- 状态 1：待收货，可以确认收货 -->
          <el-button v-if="order.orderStatus === 1" type="success" size="small" @click="confirmReceive(order.id)">
            确认收货
          </el-button>

          <!-- 状态 3：交易完成，可以申请退货 -->
          <el-button v-if="order.orderStatus === 3" type="warning" size="small" @click="openReturnDialog(order.id)">
            申请退货
          </el-button>

          <!-- 状态 4：退货完成 -->
          <span v-if="order.orderStatus === 4" class="returned-text">该订单已退货完成</span>
        </div>
      </el-card>
    </div>

    <!-- 申请退货的弹窗 -->
    <el-dialog v-model="returnDialogVisible" title="申请退货" width="400px">
      <el-form>
        <el-form-item label="退货原因">
          <el-input v-model="returnReason" type="textarea" placeholder="请填写退货原因（质量问题/不想要了等）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReturn">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 评价商品的弹窗 -->
    <el-dialog v-model="commentDialogVisible" title="评价商品" width="400px">
      <el-form>
        <el-form-item label="评价星级">
          <el-rate v-model="commentStar" />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="commentContent" type="textarea" placeholder="写点使用感受吧~" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="commentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComment">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<!-- ================= 订单页逻辑 ================= -->
<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getImage, formatTime, authHeaders } from '../utils'

const router = useRouter()
const orderList = ref([])

// 退货弹窗相关
const returnDialogVisible = ref(false)
const returnReason = ref('')
const currentReturnOrderId = ref(null)

// 评价弹窗相关
const commentDialogVisible = ref(false)
const commentStar = ref(5)
const commentContent = ref('')
const currentCommentItemId = ref(null) // 当前要评价的「订单明细ID」

// 状态文本转换（0待付款 1待收货 2退货申请中 3交易完成 4退货完成 5已取消）
const getStatusText = (status) => {
  const map = { 0: '待付款', 1: '待收货', 2: '退货申请中', 3: '交易完成', 4: '退货完成', 5: '已取消' }
  return map[status] || '未知状态'
}
// 状态标签颜色
const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'info', 3: 'success', 4: 'danger', 5: 'info' }
  return map[status] || 'info'
}

// 获取我的订单列表
const fetchOrders = async () => {
  try {
    const res = await axios.get('/api/order/myList', { headers: authHeaders() })
    if (res.data.code === 200) orderList.value = res.data.data
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '获取订单失败')
    if (error.response?.status === 400) router.push('/login')
  }
}

// 确认收货（触发资金放款给商家）
const confirmReceive = async (orderId) => {
  try {
    const res = await axios.put(`/api/order/confirmReceive?orderId=${orderId}`, null, { headers: authHeaders() })
    if (res.data.code === 200) {
      ElMessage.success('确认收货成功，资金已结算给商家！')
      fetchOrders()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '操作失败')
  }
}

// 打开退货弹窗
const openReturnDialog = (orderId) => {
  currentReturnOrderId.value = orderId
  returnReason.value = ''
  returnDialogVisible.value = true
}

// 提交退货申请
const submitReturn = async () => {
  if (!returnReason.value) {
    ElMessage.warning('请填写退货原因')
    return
  }
  try {
    const res = await axios.post('/api/order/applyReturn', null, {
      params: { orderId: currentReturnOrderId.value, reason: returnReason.value },
      headers: authHeaders()
    })
    if (res.data.code === 200) {
      ElMessage.success('退货申请已提交！')
      returnDialogVisible.value = false
      fetchOrders()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '退货失败')
  }
}

// 打开评价弹窗（现在传的是正确的「订单明细ID」orderItemId）
const openCommentDialog = (orderItemId) => {
  currentCommentItemId.value = orderItemId
  commentStar.value = 5
  commentContent.value = ''
  commentDialogVisible.value = true
}

// 提交评价
const submitComment = async () => {
  if (!commentContent.value) {
    ElMessage.warning('请填写评价内容')
    return
  }
  try {
    const res = await axios.post('/api/comment/add', null, {
      params: {
        orderItemId: currentCommentItemId.value, // 这里必须是 order_item 表的 id
        star: commentStar.value,
        content: commentContent.value
      },
      headers: authHeaders()
    })
    if (res.data.code === 200) {
      ElMessage.success('评价成功！')
      commentDialogVisible.value = false
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '评价失败')
  }
}

onMounted(() => fetchOrders())
</script>

<!-- ================= 订单页样式 ================= -->
<style scoped>
.order-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.order-card { margin-bottom: 20px; }
.order-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 1px solid #ebeef5; font-size: 14px; color: #666; }
.order-header .amount { font-weight: bold; color: #ff4d4f; }
.order-items { padding: 10px 0; }
.item-row { display: flex; align-items: center; gap: 15px; padding: 10px 0; }
.item-img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
.item-info { flex: 1; }
.item-name { font-size: 14px; color: #333; }
.item-meta { font-size: 12px; color: #999; margin-top: 5px; }
.order-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ebeef5; }
.returned-text { color: #999; font-size: 14px; }
</style>
