<!-- ================= 商品详情页 ================= -->
<template>
  <div class="detail-container">
    <!-- 顶部导航 -->
    <div class="header">
      <el-button @click="$router.back()">返回</el-button>
      <el-button @click="$router.push('/home')">回首页</el-button>
    </div>

    <!-- 商品主体信息 -->
    <el-card v-if="goods" class="main-card">
      <div class="main-body">
        <!-- 左侧：商品图片轮播（支持多张图） -->
        <div class="left">
          <el-carousel v-if="images.length > 0" height="350px">
            <el-carousel-item v-for="(img, i) in images" :key="i">
              <img :src="img" class="main-img" />
            </el-carousel-item>
          </el-carousel>
          <img v-else :src="getImage(goods.imgUrl)" class="main-img" />
        </div>

        <!-- 右侧：商品文字信息 -->
        <div class="right">
          <h2>{{ goods.goodsName }}</h2>
          <p class="price">
            <span class="sell">￥{{ goods.sellPrice }}</span>
            <span class="origin">￥{{ goods.originalPrice }}</span>
          </p>
          <p class="meta">
            <el-tag size="small">{{ goods.category || '未分类' }}</el-tag>
            <el-tag size="small" type="warning">{{ goods.oldDegree }}</el-tag>
            <span v-if="goods.size">尺寸 {{ goods.size }}</span>
            <span>销量 {{ goods.sales }}</span>
            <span>库存 {{ goods.stock }}</span>
          </p>
          <!-- 店铺信息 + 进店逛逛 -->
          <p class="shop-row">
            <span>店铺：{{ goods.shopName || '未知店铺' }}</span>
            <span v-if="goods.goodRate != null" class="rate">好评率 {{ goods.goodRate }}%</span>
            <el-button size="small" type="info" plain @click="$router.push(`/home?shopId=${goods.shopId}`)">进店逛逛</el-button>
          </p>
          <p class="desc">{{ goods.description || '暂无描述' }}</p>

          <div class="actions">
            <el-button type="primary" size="large" @click="addToCart">加入购物车</el-button>
            <el-button type="danger" size="large" @click="buyNow">立即购买</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 评价区域 -->
    <el-card class="comment-card">
      <template #header>商品评价（{{ commentList.length }}）</template>

      <el-empty v-if="commentList.length === 0" description="还没有评价~" />

      <div v-else v-for="c in commentList" :key="c.id" class="comment-item">
        <div class="comment-head">
          <el-rate :model-value="c.star" disabled />
          <span class="comment-time">{{ formatTime(c.createTime) }}</span>
        </div>
        <p class="comment-content">{{ c.content }}</p>
      </div>
    </el-card>
  </div>
</template>

<!-- ================= 商品详情页逻辑 ================= -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getImage, getImages, formatTime, authHeaders } from '../utils'

const route = useRoute()
const router = useRouter()

const goods = ref(null)        // 当前商品信息
const commentList = ref([])    // 该商品的评价列表

// 计算多张图片的完整地址数组（用于轮播图）
const images = computed(() => getImages(goods.value?.imgUrl))

// 加载商品详情 + 评价（两个请求分开，一个失败不影响另一个）
const loadDetail = async () => {
  const goodsId = route.params.id // 从路由参数里拿到商品ID

  // 查商品详情（公开接口）
  try {
    const goodsRes = await axios.get(`/api/goods/detail/${goodsId}`)
    if (goodsRes.data.code === 200) goods.value = goodsRes.data.data
  } catch (error) {
    console.error('商品详情加载失败：', error) // 打印到浏览器 F12 控制台，方便排查
    const msg = error.response?.data?.msg
      || (error.response?.status === 404 ? '接口未找到，请重启后端！' : '加载商品失败')
    ElMessage.error(msg)
  }

  // 查该商品的评价（公开接口，加载失败不打断页面）
  try {
    const commentRes = await axios.get(`/api/comment/goods/${goodsId}`)
    if (commentRes.data.code === 200) commentList.value = commentRes.data.data
  } catch (error) {
    // 静默处理
  }
}

// 加入购物车
const addToCart = async () => {
  // 未登录先去登录
  if (!localStorage.getItem('token')) {
    ElMessage.warning('请先登录！')
    router.push('/login')
    return
  }
  try {
    const res = await axios.post('/api/cart/add', null, {
      params: { goodsId: goods.value.id, buyNum: 1 },
      headers: authHeaders()
    })
    if (res.data.code === 200) ElMessage.success('已加入购物车！')
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '加入失败')
  }
}

// 立即购买：先加入购物车，再跳转到购物车结算
const buyNow = async () => {
  await addToCart()
  router.push('/cart')
}

onMounted(() => loadDetail())
</script>

<!-- ================= 商品详情页样式 ================= -->
<style scoped>
.detail-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.header { display: flex; gap: 10px; margin-bottom: 20px; }
.main-card { margin-bottom: 20px; }
.main-body { display: flex; gap: 30px; }
.left { width: 420px; flex-shrink: 0; }
.main-img { width: 100%; height: 350px; object-fit: cover; border-radius: 8px; }
.right { flex: 1; }
.right h2 { margin: 0 0 15px; }
.price { margin: 10px 0; }
.price .sell { color: #ff4d4f; font-size: 30px; font-weight: bold; }
.price .origin { color: #999; text-decoration: line-through; margin-left: 10px; }
.meta { display: flex; gap: 10px; align-items: center; color: #666; margin: 15px 0; }
.shop-row { display: flex; gap: 15px; align-items: center; color: #666; margin: 10px 0; }
.shop-row .rate { color: #e6a23c; }
.desc { color: #333; line-height: 1.8; margin: 15px 0; }
.actions { margin-top: 20px; }
.comment-item { padding: 15px 0; border-bottom: 1px solid #ebeef5; }
.comment-head { display: flex; justify-content: space-between; align-items: center; }
.comment-time { color: #999; font-size: 12px; }
.comment-content { color: #333; margin: 8px 0 0; }
</style>
