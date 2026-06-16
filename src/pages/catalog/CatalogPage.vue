<template>
  <div class="catalog-page" ref="root">
    <h1 class="page-title">浏览总目录</h1>
    <p v-if="statText" class="catalog-stat">{{ statText }}</p>

    <div class="catalog-search">
      <el-input
        v-model="kw"
        placeholder="过滤分类 / 文档（支持拼音、首字母）"
        size="large"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <div v-if="displayCategories.length" class="catalog-body">
      <catalog-rail
        class="catalog-rail"
        :sections="sections"
        :active-slug="activeSlug"
        @jump="handleJump"
      />
      <div class="catalog-content">
        <catalog-section
          v-for="cat in displayCategories"
          :key="slugOf(cat)"
          :data-section="slugOf(cat)"
          :category="cat"
          :filter-text="trimmedKw"
        />
      </div>
    </div>

    <p v-else-if="!loading" class="catalog-empty">未找到匹配的分类或文档</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Search } from '@element-plus/icons-vue'
import api from '@/api'
import Category from '@/dto/Category'
import categoryService from '@/service/CategoryService'
import { SysUtils } from '@/util/SysUtils'
import TouchUtils from '@/util/TouchUtils'
import { categorySlug, countDocs, safeMatch } from '@/util/CatalogUtils'
import CatalogRail from './CatalogRail.vue'
import CatalogSection from './CatalogSection.vue'

interface SectionMeta {
  slug: string
  name: string
  count: number
}

export default defineComponent({
  components: { CatalogRail, CatalogSection, Search },
  data() {
    return {
      // 顶级分类原树(未过滤)
      topCategories: [] as Category[],
      // 顶级分类名 -> 稳定唯一 slug
      slugByName: new Map<string, string>(),
      kw: '' as string,
      // 防抖后的过滤词(实际驱动过滤/高亮)
      appliedKw: '' as string,
      kwTimer: undefined as ReturnType<typeof setTimeout> | undefined,
      activeSlug: '' as string,
      noteCount: 0 as number,
      loading: true as boolean,
      io: undefined as IntersectionObserver | undefined,
      // 当前与「激活带」相交的分区 slug 集
      intersecting: new Set<string>(),
      // 速跳/深链后锁定激活态, 直到用户真正滚动才交回 IO(尾部分区无法滚到顶时也能正确高亮被点项)
      scrollLock: false as boolean,
      scrollLockTimer: undefined as ReturnType<typeof setTimeout> | undefined,
      unlockCleanup: undefined as undefined | (() => void),
    }
  },
  computed: {
    trimmedKw(): string {
      return this.appliedKw.trim()
    },
    // 过滤后的顶级分类: 克隆裁剪, 保留自身命中或后代命中的节点及其祖先链(同 CategoryList.filterTree)
    displayCategories(): Category[] {
      if (!this.trimmedKw) {
        return this.topCategories
      }
      return this.filterTree(this.topCategories, this.trimmedKw)
    },
    sections(): SectionMeta[] {
      return this.displayCategories.map(cat => ({
        slug: this.slugOf(cat),
        name: cat.name,
        count: countDocs(cat),
      }))
    },
    catCount(): number {
      return this.topCategories.length
    },
    statText(): string {
      if (!this.noteCount || !this.catCount) {
        return ''
      }
      return `${this.noteCount} 篇笔记 · ${this.catCount} 个分类`
    },
  },
  watch: {
    kw() {
      // 数百节点的过滤/高亮逐键跑会抖, 沿用 DocCluster 的 250ms 防抖
      clearTimeout(this.kwTimer)
      this.kwTimer = setTimeout(() => {
        this.appliedKw = this.kw
      }, 250)
    },
    displayCategories() {
      // 过滤改变了分区集合, 重建 observer
      this.$nextTick(() => this.setupObserver())
    },
  },
  methods: {
    // 过滤态的克隆节点与原节点同名, 故 slug 按名查表即可保持稳定
    slugOf(cat: Category): string {
      return this.slugByName.get(cat.name) || categorySlug(cat.name)
    },
    // 顶级名唯一性兜底: 同 slug 冲突时追加序号
    buildSlugs() {
      const seen = new Map<string, number>()
      const map = new Map<string, string>()
      for (const cat of this.topCategories) {
        const base = categorySlug(cat.name)
        const n = seen.get(base) || 0
        seen.set(base, n + 1)
        map.set(cat.name, n === 0 ? base : `${base}-${n}`)
      }
      this.slugByName = map
    },
    filterTree(list: Category[], kw: string): Category[] {
      const result: Category[] = []
      for (const cate of list) {
        const children = this.filterTree(cate.chidren || [], kw)
        if (children.length !== 0 || safeMatch(cate, kw)) {
          const clone = new Category()
          clone.name = cate.name
          clone.link = cate.link
          clone.parent = cate.parent
          clone.chidren = children
          result.push(clone)
        }
      }
      return result
    },
    handleJump(slug: string) {
      const el = this.sectionEl(slug)
      if (!el) {
        return
      }
      this.lockScroll()
      this.activeSlug = slug
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // 更新 hash 但不触发路由滚动(replaceState 不进 history 栈)
      try {
        history.replaceState(history.state, '', '#' + slug)
      } catch { /* 个别环境禁用 history 时忽略 */ }
    },
    sectionEl(slug: string): HTMLElement | null {
      const root = this.$refs.root as HTMLElement | undefined
      if (!root) {
        return null
      }
      const sel = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(slug) : slug.replace(/"/g, '\\"')
      return root.querySelector<HTMLElement>(`[data-section="${sel}"]`)
    },
    lockScroll() {
      this.scrollLock = true
      this.clearUnlock()
      // 程序化平滑滚动不触发 wheel/touchmove/方向键, 用这些「用户意图」事件解锁, 而非定时器:
      // 避免锁过早释放导致 IO 把高亮改到尾部分区上方那一节(尾部分区滚不到顶)
      const release = () => this.unlockScroll()
      const keyRelease = (e: KeyboardEvent) => {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) {
          this.unlockScroll()
        }
      }
      window.addEventListener('wheel', release, { passive: true })
      window.addEventListener('touchmove', release, { passive: true })
      window.addEventListener('keydown', keyRelease)
      this.unlockCleanup = () => {
        window.removeEventListener('wheel', release)
        window.removeEventListener('touchmove', release)
        window.removeEventListener('keydown', keyRelease)
      }
      // 兜底: 极端情况下避免永久锁
      clearTimeout(this.scrollLockTimer)
      this.scrollLockTimer = setTimeout(() => this.unlockScroll(), 5000)
    },
    unlockScroll() {
      this.scrollLock = false
      this.clearUnlock()
    },
    clearUnlock() {
      if (this.unlockCleanup) {
        this.unlockCleanup()
        this.unlockCleanup = undefined
      }
      clearTimeout(this.scrollLockTimer)
    },
    setupObserver() {
      this.teardownObserver()
      if (typeof IntersectionObserver === 'undefined') {
        return
      }
      const root = this.$refs.root as HTMLElement | undefined
      const els = root?.querySelectorAll<HTMLElement>('[data-section]')
      if (!els || !els.length) {
        return
      }
      this.intersecting = new Set<string>()
      this.io = new IntersectionObserver(
        entries => {
          for (const e of entries) {
            const slug = (e.target as HTMLElement).dataset.section
            if (!slug) {
              continue
            }
            if (e.isIntersecting) {
              this.intersecting.add(slug)
            } else {
              this.intersecting.delete(slug)
            }
          }
          if (this.scrollLock) {
            return
          }
          // 取文档序最靠上的相交分区为激活项
          const ordered = this.sections.map(s => s.slug).filter(s => this.intersecting.has(s))
          if (ordered.length) {
            this.activeSlug = ordered[0]
          }
        },
        // 激活带置于内容顶部下方(略低于速跳落点 ~scroll-margin-top+顶栏), 使跳转后高亮的就是被点分区
        { rootMargin: '-180px 0px -60% 0px', threshold: 0 }
      )
      els.forEach(el => this.io!.observe(el))
    },
    teardownObserver() {
      if (this.io) {
        this.io.disconnect()
        this.io = undefined
      }
    },
    applyHashAnchor() {
      let hash = ''
      try {
        hash = decodeURIComponent((this.$route.hash || '').replace(/^#/, ''))
      } catch {
        hash = (this.$route.hash || '').replace(/^#/, '')
      }
      if (!hash) {
        return
      }
      const el = this.sectionEl(hash)
      if (el) {
        this.lockScroll()
        this.activeSlug = hash
        el.scrollIntoView({ block: 'start' })
      }
    },
  },
  async created() {
    try {
      const tree = await categoryService.getCompiledCategoryList()
      // 剔除 show:false 的「首页」README 节点, 与 Banner/HomeQuickAccess 同口径
      this.topCategories = tree.filter(c => c.name && c.name !== '首页')
      this.buildSlugs()
      if (this.topCategories.length) {
        this.activeSlug = this.slugOf(this.topCategories[0])
      }
    } catch {
      // 目录取不到时留空(下方空状态兜底)
    }
    try {
      this.noteCount = (await api.getDescCommitDocList()).length
    } catch {
      // 统计行取不到则不渲染
    }
    this.loading = false
    this.$nextTick(() => {
      this.setupObserver()
      this.applyHashAnchor()
    })
  },
  mounted() {
    SysUtils.setDocTitle('浏览总目录')
    // 右滑返回手势, 与 TagListPage 一致
    const root = this.$refs.root as HTMLElement | undefined
    if (root) {
      TouchUtils.onSwipe(root, (direction, delta) => {
        if (direction[0] === 'right' && delta[0] > 150) {
          history.back()
        }
      })
    }
  },
  beforeUnmount() {
    this.teardownObserver()
    this.clearUnlock()
    clearTimeout(this.kwTimer)
  },
})
</script>

<style lang="less" scoped>
.catalog-page {
  max-width: var(--home-max);
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--content-pad) var(--spacing-3xl);
  min-height: 70vh;
}

.page-title {
  text-align: center;
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--main-text-color);
  margin: 0 0 var(--spacing-sm);
}

.catalog-stat {
  text-align: center;
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--spacing-xl);
}

// 复用 TagListPage 的圆角搜索框语言
.catalog-search {
  max-width: 560px;
  margin: 0 auto var(--spacing-2xl);

  :deep(.el-input__wrapper) {
    border-radius: var(--radius-xl);
    padding: 4px var(--spacing-md);
  }
}

// 左速跳栏 + 右内容两栏; 内容区为全宽分区卡纵向堆叠
.catalog-body {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--spacing-xl);
  align-items: start;
}

.catalog-rail {
  position: sticky;
  top: var(--spacing-lg);
  align-self: start;
}

// 顶级分区全宽纵向堆叠(DOM 序=视觉序), 速跳栏滚动联动才有确定语义;
// 卡内叶子再用 CSS 多栏紧凑铺排(见 CatalogSection)
.catalog-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.catalog-empty {
  text-align: center;
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
  margin: var(--spacing-2xl) 0;
}

// 大屏宽档: 速跳栏加宽(壳宽随 --home-max 全局令牌自动放大, 卡内多栏自适应更多列)
@media (min-width: @bp-wide) {
  .catalog-body {
    grid-template-columns: 240px 1fr;
    gap: var(--spacing-2xl);
  }
}

// 移动端: 收起速跳栏, 单栏堆叠
@media (max-width: @bp-mobile) {
  .catalog-page {
    padding-top: var(--spacing-lg);
  }
  .catalog-body {
    grid-template-columns: 1fr;
  }
  .catalog-rail {
    display: none;
  }
}
</style>
