<!-- ================= 系统管理中心 ================= -->
<template>
  <div class="manage-container">
    <div class="header">
      <h2>系统管理中心 ({{ roleText }})</h2>
      <el-button @click="$router.push('/home')">返回首页</el-button>
    </div>

    <!-- 标签页：根据角色决定显示哪些标签 -->
    <el-tabs v-model="activeTab" type="border-card">

      <!-- ============ 商家专属 ============ -->
      <template v-if="role === 1">
        <!-- 标签1：商品管理 -->
        <el-tab-pane label="商品管理" name="myGoods">
          <el-button type="primary" style="margin-bottom: 15px;" @click="openGoodsDialog()">发布新商品</el-button>
          <el-table :data="myGoodsList" border>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="图片" width="90">
              <template #default="scope">
                <img :src="getImage(scope.row.imgUrl)" class="table-img" />
              </template>
            </el-table-column>
            <el-table-column prop="goodsName" label="商品名称" />
            <el-table-column prop="sellPrice" label="售价" width="90" />
            <el-table-column prop="stock" label="库存" width="70" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getGoodsStatusType(scope.row.goodsStatus)">{{ getGoodsStatusText(scope.row.goodsStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button type="primary" size="small" @click="openGoodsDialog(scope.row)">编辑</el-button>
                <el-button type="warning" size="small" v-if="scope.row.goodsStatus === 1" @click="offShelf(scope.row.id)">下架</el-button>
                <el-button type="danger" size="small" @click="deleteGoods(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 标签2：退货审核 -->
        <el-tab-pane label="退货审核" name="returnAudit">
          <el-table :data="returnList" border>
            <el-table-column prop="orderNo" label="订单编号" />
            <el-table-column prop="buyerName" label="买家" width="120" />
            <el-table-column prop="returnReason" label="退货原因" />
            <el-table-column label="申请时间" width="180">
              <template #default="scope">{{ formatTime(scope.row.applyTime) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.auditStatus === 0 ? 'warning' : (scope.row.auditStatus === 1 ? 'success' : 'danger')">
                  {{ scope.row.auditStatus === 0 ? '待审核' : (scope.row.auditStatus === 1 ? '已同意' : '已驳回') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160">
              <template #default="scope">
                <template v-if="scope.row.auditStatus === 0">
                  <el-button type="success" size="small" @click="auditReturn(scope.row.id, 1)">同意</el-button>
                  <el-button type="danger" size="small" @click="auditReturn(scope.row.id, 2)">驳回</el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 标签3：已售订单（商家查看卖出记录、评价买家） -->
        <el-tab-pane label="已售订单" name="shopOrders">
          <el-table :data="shopOrders" border>
            <el-table-column prop="orderNo" label="订单编号" />
            <el-table-column prop="buyerName" label="买家" width="120" />
            <el-table-column prop="totalAmount" label="金额" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getOrderStatusType(scope.row.orderStatus)">{{ getOrderStatusText(scope.row.orderStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="商品" min-width="220">
              <template #default="scope">
                <span v-for="it in scope.row.items" :key="it.id" class="goods-tag">{{ it.goods?.goodsName }} × {{ it.buyNum }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <!-- 交易完成的订单才能评价买家，这里简化为评价订单里的第一个商品明细 -->
                <el-button v-if="scope.row.orderStatus === 3 && scope.row.items && scope.row.items.length" type="primary" size="small" @click="openShopComment(scope.row.items[0].id)">
                  评价买家
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 标签4：拉黑买家 -->
        <el-tab-pane label="拉黑买家" name="blacklist">
          <el-form :model="merchantBlackForm" inline>
            <el-form-item label="买家ID">
              <el-input-number v-model="merchantBlackForm.targetUserId" :min="1" />
            </el-form-item>
            <el-form-item>
              <el-button type="danger" @click="addMerchantBlacklist">拉黑该买家</el-button>
            </el-form-item>
          </el-form>
          <p class="tips">拉黑后，该买家将无法购买本店的商品。</p>
        </el-tab-pane>
      </template>

      <!-- ============ 管理员专属 ============ -->
      <template v-if="role === 2">
        <!-- 用户审核 -->
        <el-tab-pane label="用户审核" name="auditUser">
          <el-table :data="userList" border>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column label="角色" width="100">
              <template #default="scope">{{ scope.row.role === 1 ? '商家' : scope.row.role === 2 ? '管理员' : '普通用户' }}</template>
            </el-table-column>
            <el-table-column prop="shopName" label="店铺名" />
            <el-table-column label="审核状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.auditStatus === 1 ? 'success' : scope.row.auditStatus === 0 ? 'warning' : 'danger'">
                  {{ scope.row.auditStatus === 1 ? '已通过' : scope.row.auditStatus === 0 ? '待审核' : '驳回' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="账号状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">{{ scope.row.status === 0 ? '正常' : '已封禁' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="420">
              <template #default="scope">
                <el-button type="success" size="small" v-if="scope.row.auditStatus === 0" @click="auditUser(scope.row.id, 1)">通过</el-button>
                <el-button type="danger" size="small" v-if="scope.row.auditStatus === 0" @click="auditUser(scope.row.id, 2)">驳回</el-button>
                <el-button type="primary" size="small" @click="openEditUser(scope.row)">编辑</el-button>
                <el-button type="danger" size="small" @click="deleteUser(scope.row.id)">删除</el-button>
                <el-button type="primary" size="small" @click="rechargeUser(scope.row.id)">充值</el-button>
                <el-button type="warning" size="small" v-if="scope.row.status === 0" @click="banUser(scope.row.id)">封禁</el-button>
                <el-button type="success" size="small" v-else @click="unbanUser(scope.row.id)">解封</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 商品审核 -->
        <el-tab-pane label="商品审核" name="auditGoods">
          <el-table :data="allGoodsList" border>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="goodsName" label="商品名称" />
            <el-table-column prop="shopId" label="商家ID" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getGoodsStatusType(scope.row.goodsStatus)">{{ getGoodsStatusText(scope.row.goodsStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="290">
              <template #default="scope">
                <el-button type="success" size="small" v-if="scope.row.goodsStatus === 0" @click="auditGoods(scope.row.id, 1)">审核上架</el-button>
                <el-button type="danger" size="small" v-if="scope.row.goodsStatus === 0" @click="auditGoods(scope.row.id, 4)">驳回</el-button>
                <!-- 惩罚功能：下架该商家的全部商品（店铺暂时关闭） -->
                <el-button type="warning" size="small" @click="offShelfAll(scope.row.shopId)">全部下架</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 商家等级管理 -->
        <el-tab-pane label="商家等级" name="level">
          <el-button type="primary" style="margin-bottom: 15px;" @click="openLevelDialog()">新增等级</el-button>
          <el-table :data="levelList" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="levelName" label="等级名称" />
            <el-table-column prop="rate" label="交易费率" />
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button type="primary" size="small" @click="openLevelDialog(scope.row)">编辑</el-button>
                <el-button type="danger" size="small" @click="deleteLevel(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 轮播图管理 -->
        <el-tab-pane label="轮播图管理" name="banner">
          <el-button type="primary" style="margin-bottom: 15px;" @click="openBannerDialog()">新增轮播图</el-button>
          <el-table :data="bannerList" border>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="图片" width="140">
              <template #default="scope">
                <img :src="getImage(scope.row.imgUrl)" class="table-img" />
              </template>
            </el-table-column>
            <el-table-column prop="goodsId" label="关联商品ID" width="110" />
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column label="是否展示" width="90">
              <template #default="scope">
                <el-tag :type="scope.row.isShow === 1 ? 'success' : 'info'">{{ scope.row.isShow === 1 ? '展示中' : '隐藏' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button type="danger" size="small" @click="deleteBanner(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 黑名单管理 -->
        <el-tab-pane label="黑名单" name="blacklist">
          <el-form :model="blackForm" inline>
            <el-form-item label="被拉黑用户ID">
              <el-input-number v-model="blackForm.targetUserId" :min="1" />
            </el-form-item>
            <el-form-item>
              <el-button type="danger" @click="addBlacklist">确认拉黑</el-button>
            </el-form-item>
          </el-form>
          <p class="tips">管理员拉黑为平台拉黑，该用户将无法在平台购买任何商品。</p>
        </el-tab-pane>
      </template>
    </el-tabs>

    <!-- ============ 商品发布/编辑弹窗（商家） ============ -->
    <el-dialog v-model="goodsDialogVisible" :title="editGoodsId ? '编辑商品' : '发布新商品'" width="600px">
      <el-form :model="goodsForm" label-width="100px">
        <el-form-item label="商品名称"><el-input v-model="goodsForm.goodsName" /></el-form-item>
        <el-form-item label="商品分类"><el-input v-model="goodsForm.category" placeholder="如：数码产品、生活用品" /></el-form-item>
        <el-form-item label="原价(￥)"><el-input-number v-model="goodsForm.originalPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="售价(￥)"><el-input-number v-model="goodsForm.sellPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="库存数量"><el-input-number v-model="goodsForm.stock" :min="1" /></el-form-item>
        <el-form-item label="新旧程度">
          <el-select v-model="goodsForm.oldDegree" placeholder="请选择">
            <el-option label="全新" value="全新" />
            <el-option label="九成新" value="九成新" />
            <el-option label="八成新" value="八成新" />
            <el-option label="七成新及以下" value="七成新及以下" />
          </el-select>
        </el-form-item>
        <el-form-item label="尺寸大小">
          <el-input v-model="goodsForm.size" placeholder="如：M码、L码、13寸、标准等" />
        </el-form-item>
        <el-form-item label="是否议价">
          <el-switch v-model="goodsForm.allowBargain" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="商品图片">
          <el-upload action="/api/file/upload" :on-success="handleGoodsUpload" :limit="3" list-type="picture-card">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="商品描述"><el-input v-model="goodsForm.description" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="goodsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGoods">提交（需管理员审核）</el-button>
      </template>
    </el-dialog>

    <!-- ============ 商家等级弹窗（管理员） ============ -->
    <el-dialog v-model="levelDialogVisible" :title="editLevelId ? '编辑等级' : '新增等级'" width="400px">
      <el-form :model="levelForm" label-width="90px">
        <el-form-item label="等级名称"><el-input v-model="levelForm.levelName" /></el-form-item>
        <el-form-item label="交易费率"><el-input-number v-model="levelForm.rate" :min="0" :precision="4" :step="0.0001" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitLevel">保存</el-button>
      </template>
    </el-dialog>

    <!-- ============ 轮播图弹窗（管理员） ============ -->
    <el-dialog v-model="bannerDialogVisible" title="新增轮播图" width="420px">
      <el-form :model="bannerForm" label-width="90px">
        <el-form-item label="图片">
          <el-upload action="/api/file/upload" :on-success="(res) => (bannerForm.imgUrl = res.data)" :limit="1" list-type="picture-card">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="关联商品ID"><el-input-number v-model="bannerForm.goodsId" :min="1" placeholder="选填，点击轮播图跳转到该商品" /></el-form-item>
        <el-form-item label="排序权重"><el-input-number v-model="bannerForm.sort" :min="0" /></el-form-item>
        <el-form-item label="是否展示"><el-switch v-model="bannerForm.isShow" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bannerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBanner">保存</el-button>
      </template>
    </el-dialog>

    <!-- ============ 评价买家弹窗（商家） ============ -->
    <el-dialog v-model="shopCommentVisible" title="评价买家" width="400px">
      <el-form>
        <el-form-item label="评价星级">
          <el-rate v-model="shopCommentStar" />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="shopCommentContent" type="textarea" placeholder="评价一下这位买家吧~" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shopCommentVisible = false">取消</el-button>
        <el-button type="primary" @click="submitShopComment">提交评价</el-button>
      </template>
    </el-dialog>

    <!-- ============ 编辑用户弹窗（管理员） ============ -->
    <el-dialog v-model="userEditVisible" title="编辑用户" width="480px">
      <el-form :model="userEditForm" label-width="90px">
        <el-form-item label="姓名"><el-input v-model="userEditForm.name" /></el-form-item>
        <el-form-item label="昵称"><el-input v-model="userEditForm.nickname" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="userEditForm.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="userEditForm.email" /></el-form-item>
        <el-form-item label="城市"><el-input v-model="userEditForm.city" /></el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="userEditForm.gender">
            <el-radio :value="0">未知</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="userEditForm.role">
            <el-radio :value="0">普通用户</el-radio>
            <el-radio :value="1">商家</el-radio>
            <el-radio :value="2">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="店铺名称"><el-input v-model="userEditForm.shopName" /></el-form-item>
        <el-form-item label="银行卡号"><el-input v-model="userEditForm.bankAccount" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userEditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUserEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<!-- ================= 管理中心逻辑 ================= -->
<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getImage, authHeaders, formatTime, getUserInfo } from '../utils'

const activeTab = ref('')
const userInfo = ref({})
const role = ref(0)

// ===== 商品表单（发布/编辑共用） =====
const goodsDialogVisible = ref(false)
const editGoodsId = ref(null) // 为空表示新增，有值表示编辑
const goodsForm = reactive({
  goodsName: '', category: '', originalPrice: 0, sellPrice: 0, stock: 1,
  oldDegree: '', size: '', allowBargain: 0, description: '', imgUrl: ''
})

// ===== 各列表数据 =====
const myGoodsList = ref([])   // 商家的商品
const returnList = ref([])    // 商家的退货申请
const shopOrders = ref([])    // 商家的已售订单
const userList = ref([])      // 管理员：用户列表
const allGoodsList = ref([])  // 管理员：所有商品
const levelList = ref([])     // 管理员：商家等级
const bannerList = ref([])    // 管理员：轮播图

// ===== 等级弹窗 =====
const levelDialogVisible = ref(false)
const editLevelId = ref(null)
const levelForm = reactive({ levelName: '', rate: 0 })

// ===== 轮播图弹窗 =====
const bannerDialogVisible = ref(false)
const bannerForm = reactive({ goodsId: null, imgUrl: '', sort: 0, isShow: 1 })

// ===== 黑名单表单 =====
const blackForm = reactive({ targetUserId: 1, operateType: 2 })

// ===== 评价买家弹窗 =====
const shopCommentVisible = ref(false)
const shopCommentStar = ref(5)
const shopCommentContent = ref('')
const currentShopCommentItemId = ref(null)

// ===== 编辑用户弹窗（管理员） =====
const userEditVisible = ref(false)
const userEditForm = reactive({ id: null, name: '', nickname: '', phone: '', email: '', city: '', gender: 0, role: 0, shopName: '', bankAccount: '' })

// ===== 商家拉黑买家表单 =====
const merchantBlackForm = reactive({ targetUserId: 1 })

const roleText = computed(() => (role.value === 2 ? '管理员' : '商家'))

// 初始化：读取用户信息，设置默认标签页
const initUser = () => {
  userInfo.value = getUserInfo()
  role.value = userInfo.value.role
  if (role.value === 1) activeTab.value = 'myGoods'
  if (role.value === 2) activeTab.value = 'auditUser'
}

// ===== 商品状态辅助 =====
const getGoodsStatusText = (s) => {
  const map = { 0: '待审核', 1: '已上架', 2: '锁定', 3: '已售出', 4: '已下架', 5: '退货中' }
  return map[s] || '未知'
}
const getGoodsStatusType = (s) => {
  const map = { 0: 'warning', 1: 'success', 2: 'info', 3: 'info', 4: 'danger', 5: 'info' }
  return map[s] || 'info'
}

// 订单状态辅助（商家已售订单展示用）
const getOrderStatusText = (s) => {
  const map = { 0: '待付款', 1: '待收货', 2: '退货申请中', 3: '交易完成', 4: '退货完成', 5: '已取消' }
  return map[s] || '未知'
}
const getOrderStatusType = (s) => {
  const map = { 0: 'info', 1: 'warning', 2: 'info', 3: 'success', 4: 'danger', 5: 'info' }
  return map[s] || 'info'
}

// ===== 商品：上传图片成功回调 =====
const handleGoodsUpload = (res) => {
  if (res.code === 200) {
    // 多张图用逗号拼接保存
    goodsForm.imgUrl = goodsForm.imgUrl ? goodsForm.imgUrl + ',' + res.data : res.data
    ElMessage.success('图片上传成功')
  }
}

// ===== 商品：打开发布/编辑弹窗 =====
const openGoodsDialog = (item) => {
  if (item) {
    // 编辑模式：把原数据填进表单
    editGoodsId.value = item.id
    Object.assign(goodsForm, {
      goodsName: item.goodsName, category: item.category, originalPrice: item.originalPrice,
      sellPrice: item.sellPrice, stock: item.stock, oldDegree: item.oldDegree, size: item.size,
      allowBargain: item.allowBargain, description: item.description, imgUrl: item.imgUrl
    })
  } else {
    // 新增模式：清空表单
    editGoodsId.value = null
    Object.assign(goodsForm, { goodsName: '', category: '', originalPrice: 0, sellPrice: 0, stock: 1, oldDegree: '', size: '', allowBargain: 0, description: '', imgUrl: '' })
  }
  goodsDialogVisible.value = true
}

// ===== 商品：提交（新增或编辑） =====
const submitGoods = async () => {
  try {
    let res
    if (editGoodsId.value) {
      // 编辑：调用修改接口，带上商品ID
      res = await axios.put('/api/goods/update', { ...goodsForm, id: editGoodsId.value }, { headers: authHeaders() })
    } else {
      // 新增：调用发布接口，带上商家ID
      res = await axios.post('/api/goods/add', { ...goodsForm, shopId: userInfo.value.id }, { headers: authHeaders() })
    }
    if (res.data.code === 200) {
      ElMessage.success('提交成功，等待管理员审核！')
      goodsDialogVisible.value = false
      fetchMyGoods()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '提交失败')
  }
}

// ===== 商品：查询我的商品（所有状态） =====
const fetchMyGoods = async () => {
  const res = await axios.get('/api/goods/myList', { headers: authHeaders() })
  if (res.data.code === 200) myGoodsList.value = res.data.data
}

// ===== 商品：下架 =====
const offShelf = async (id) => {
  await axios.put(`/api/goods/offShelf/${id}`, null, { headers: authHeaders() })
  ElMessage.success('已下架')
  fetchMyGoods()
}

// ===== 商品：删除 =====
const deleteGoods = async (id) => {
  await ElMessageBox.confirm('确定删除该商品吗？', '提示', { type: 'warning' })
  await axios.delete(`/api/goods/delete/${id}`, { headers: authHeaders() })
  ElMessage.success('已删除')
  fetchMyGoods()
}

// ===== 退货：查询 + 审核 =====
const fetchReturns = async () => {
  const res = await axios.get('/api/order/returnList', { headers: authHeaders() })
  if (res.data.code === 200) returnList.value = res.data.data
}
const auditReturn = async (returnId, auditStatus) => {
  await axios.put(`/api/order/returnAudit?returnId=${returnId}&auditStatus=${auditStatus}`, null, { headers: authHeaders() })
  ElMessage.success('审核完成')
  fetchReturns()
}

// ===== 已售订单：查询 + 评价买家 =====
const fetchShopOrders = async () => {
  const res = await axios.get('/api/order/shopList', { headers: authHeaders() })
  if (res.data.code === 200) shopOrders.value = res.data.data
}
const openShopComment = (orderItemId) => {
  currentShopCommentItemId.value = orderItemId
  shopCommentStar.value = 5
  shopCommentContent.value = ''
  shopCommentVisible.value = true
}
const submitShopComment = async () => {
  if (!shopCommentContent.value) {
    ElMessage.warning('请填写评价内容')
    return
  }
  await axios.post('/api/comment/shopAdd', null, {
    params: { orderItemId: currentShopCommentItemId.value, star: shopCommentStar.value, content: shopCommentContent.value },
    headers: authHeaders()
  })
  ElMessage.success('评价成功！')
  shopCommentVisible.value = false
}

// ===== 管理员：用户审核 =====
const fetchUsers = async () => {
  const res = await axios.get('/api/admin/user/list', { headers: authHeaders() })
  if (res.data.code === 200) userList.value = res.data.data
}
const auditUser = async (id, auditStatus) => {
  await axios.put(`/api/admin/user/audit?id=${id}&auditStatus=${auditStatus}`, null, { headers: authHeaders() })
  ElMessage.success('审核完成')
  fetchUsers()
}
// 充值
const rechargeUser = (id) => {
  ElMessageBox.prompt('请输入充值金额', '充值', {
    confirmButtonText: '确定', cancelButtonText: '取消'
  }).then(async ({ value }) => {
    if (isNaN(value) || value <= 0) return ElMessage.warning('金额不合法')
    await axios.put(`/api/admin/user/recharge?id=${id}&amount=${value}`, null, { headers: authHeaders() })
    ElMessage.success('充值成功')
  }).catch(() => {})
}
// 封禁（弹出输入天数，留空表示永久）
const banUser = (id) => {
  ElMessageBox.prompt('请输入封禁天数（留空表示永久禁止发布商品）', '限时封禁', {
    confirmButtonText: '确定', cancelButtonText: '取消'
  }).then(async ({ value }) => {
    const params = { userId: id, status: 1 }
    if (value !== '') params.banDays = Number(value) // 填了天数才传 banDays，留空=永久禁止发布
    await axios.put('/api/admin/user/ban', null, { params, headers: authHeaders() })
    ElMessage.success('已封禁')
    fetchUsers()
  }).catch(() => {})
}
// 解封
const unbanUser = async (id) => {
  await axios.put(`/api/admin/user/ban?userId=${id}&status=0`, null, { headers: authHeaders() })
  ElMessage.success('已解封')
  fetchUsers()
}

// ===== 管理员：商品审核 =====
const fetchAllGoods = async () => {
  const res = await axios.get('/api/admin/goods/list', { headers: authHeaders() })
  if (res.data.code === 200) allGoodsList.value = res.data.data
}
const auditGoods = async (id, status) => {
  await axios.put(`/api/admin/goods/audit?id=${id}&status=${status}`, null, { headers: authHeaders() })
  ElMessage.success('审核操作成功')
  fetchAllGoods()
}

// ===== 管理员：商家等级 =====
const fetchLevels = async () => {
  const res = await axios.get('/api/admin/level/list', { headers: authHeaders() })
  if (res.data.code === 200) levelList.value = res.data.data
}
const openLevelDialog = (item) => {
  editLevelId.value = item ? item.id : null
  Object.assign(levelForm, { levelName: item ? item.levelName : '', rate: item ? item.rate : 0 })
  levelDialogVisible.value = true
}
const submitLevel = async () => {
  if (editLevelId.value) {
    await axios.put('/api/admin/level/update', { ...levelForm, id: editLevelId.value }, { headers: authHeaders() })
  } else {
    await axios.post('/api/admin/level/add', levelForm, { headers: authHeaders() })
  }
  ElMessage.success('保存成功')
  levelDialogVisible.value = false
  fetchLevels()
}
const deleteLevel = async (id) => {
  await axios.delete(`/api/admin/level/delete/${id}`, { headers: authHeaders() })
  ElMessage.success('已删除')
  fetchLevels()
}

// ===== 管理员：轮播图 =====
const fetchBanners = async () => {
  const res = await axios.get('/api/banner/list', { headers: authHeaders() })
  if (res.data.code === 200) bannerList.value = res.data.data
}
const openBannerDialog = () => {
  Object.assign(bannerForm, { goodsId: null, imgUrl: '', sort: 0, isShow: 1 })
  bannerDialogVisible.value = true
}
const submitBanner = async () => {
  await axios.post('/api/banner/add', bannerForm, { headers: authHeaders() })
  ElMessage.success('添加成功')
  bannerDialogVisible.value = false
  fetchBanners()
}
const deleteBanner = async (id) => {
  await axios.delete(`/api/banner/delete/${id}`, { headers: authHeaders() })
  ElMessage.success('已删除')
  fetchBanners()
}

// ===== 管理员：平台拉黑 =====
const addBlacklist = async () => {
  await axios.post('/api/blacklist/add', null, {
    params: { targetUserId: blackForm.targetUserId },
    headers: authHeaders()
  })
  ElMessage.success('拉黑成功')
}

// ===== 管理员：编辑/删除用户 =====
const openEditUser = (user) => {
  Object.assign(userEditForm, {
    id: user.id, name: user.name, nickname: user.nickname, phone: user.phone,
    email: user.email, city: user.city, gender: user.gender, role: user.role,
    shopName: user.shopName, bankAccount: user.bankAccount
  })
  userEditVisible.value = true
}
const submitUserEdit = async () => {
  await axios.put('/api/admin/user/update', userEditForm, { headers: authHeaders() })
  ElMessage.success('修改成功')
  userEditVisible.value = false
  fetchUsers()
}
const deleteUser = async (id) => {
  await ElMessageBox.confirm('确定删除该用户吗？', '提示', { type: 'warning' })
  await axios.delete(`/api/admin/user/delete/${id}`, { headers: authHeaders() })
  ElMessage.success('已删除')
  fetchUsers()
}

// ===== 管理员：下架商家的全部商品（惩罚） =====
const offShelfAll = async (shopId) => {
  await ElMessageBox.confirm('确定下架该商家的全部商品吗？（店铺暂时关闭）', '提示', { type: 'warning' })
  await axios.put(`/api/goods/offShelfAll/${shopId}`, null, { headers: authHeaders() })
  ElMessage.success('已下架该商家的全部商品')
  fetchAllGoods()
}

// ===== 商家：拉黑买家 =====
const addMerchantBlacklist = async () => {
  await axios.post('/api/blacklist/add', null, {
    params: { targetUserId: merchantBlackForm.targetUserId },
    headers: authHeaders()
  })
  ElMessage.success('拉黑成功')
}

onMounted(() => {
  initUser()
  if (role.value === 1) {
    fetchMyGoods()
    fetchReturns()
    fetchShopOrders()
  }
  if (role.value === 2) {
    fetchUsers()
    fetchAllGoods()
    fetchLevels()
    fetchBanners()
  }
})
</script>

<!-- ================= 管理中心样式 ================= -->
<style scoped>
.manage-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.table-img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
.goods-tag { display: inline-block; background: #f0f2f5; padding: 2px 8px; border-radius: 4px; margin: 2px 4px 2px 0; font-size: 12px; color: #555; }
.tips { color: #999; font-size: 13px; margin-top: 10px; }
</style>
