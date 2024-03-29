<template>
  <div class="container" :class="{'mobile': $isMobile()}" ref="container">
    <div class="search-box-zone">
      <el-input placeholder="搜索标签" v-model="kw">
        <template #prefix>
          <el-icon class="el-input__icon" :size="32"><search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="tag-zone">
      <transition-group name="list" tag="p">
        <el-tag
          v-for="item in filtedTags"
          :key="item.tag"
          :type="item.type"
          @click="handleTagClick(item.tag)"
          :effect="checkedMap[item.tag] ? 'dark' : 'light'"
          >{{ item.tag }}({{ item.count }})</el-tag
        >
      </transition-group>
    </div>
    <!-- 数据展示区 -->
    <div class="data-container">
      <tag-chapter-zone :chapters="chapters"/>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import TagChapterZone from './TagChapterZone.vue'
</script>

<script lang="ts">
import api from "@/api";
import { defineComponent, ref } from "vue";
import DocUtils from "@/util/DocUtils";
import TagUtils from './TagUtils';
import TouchUtils from "@/util/TouchUtils";

interface TagItem {
  tag: string
  type: string
  count: number,
  chapters: string[]
}

export default defineComponent({
  data() {
    return {
      tags: [] as TagItem[],
      // 记录标签是否被选中
      checkedMap: {} as any,
      kw: "" as string,
    };
  },
  methods: {
    docUrl2Id(url: string): string{
      return DocUtils.docUrl2Id(url);
    },
    randomType(item: string) {
      return TagUtils.calcTagType(item);
    },
    handleTagClick(tag: string) {
      if (this.checkedMap[tag]) {
        this.checkedMap[tag] = !this.checkedMap[tag];
      } else {
        this.checkedMap[tag] = true;
      }
    },
    
  },
  computed: {
    filtedTags(): TagItem[] {
      return this.tags.filter((v) => v.tag.indexOf(this.kw) != -1);
    },
    chapters() {
       const list: string[] = this.filtedTags
            .filter((v) => this.checkedMap[v.tag])
            .flatMap((v) => v.chapters)
      return Array.from(new Set(list))
    },
  },
  async created() {
    let list = (await api.getTagMapping()).map((v) => {
      return { tag: v[0], count: v[1].length, chapters: v[1] };
    });
    this.tags = list
      .map((v) => {
        return {
          tag: v.tag,
          type: this.randomType(v.tag),
          count: v.count,
          chapters: v.chapters,
        };
      });
    TouchUtils.onSwipe(this.$refs.container as HTMLElement, (direction, delta) => {
      if (direction[0] == 'right' && delta[0] > 150) {
            history.back()
          }
    })
  },
  mounted(){
    // 通过url传参 确认哪些标签
    if (this.$route.query.tag) {
      this.checkedMap[this.$route.query.tag.toString()] = true
    }
  },
});
</script>

<style lang="less" scoped>
.container {
  margin-top: 10%;
  min-height: 1200px;
}
.search-box-zone {
  max-width: 50%;
  margin: 0 auto;
}
.tag-zone {
  transition: all 0.2s ease;
  max-width: 60%;
  margin: 5% auto;
  text-align: center;
  .el-tag {
    transition: all 0.2s ease;
    margin: 4px;
    cursor: pointer;
  }
}
.el-input :deep(input) {
  border-radius: 50px;
  font-size: 32px;
  line-height: 48px;
  padding: 30px 60px !important;
}
.el-input__icon {
  vertical-align: middle;
  margin-left: 10px;
  margin-top: 14px;
}

.list-item {
  display: inline-block;
  margin-right: 10px;
}
// 动画
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from,
.list-leave-to {
  transition: all 0.2s ease;
  opacity: 0;
  transform: translateY(30px);
}
.data-container {
  max-width:60%;
  margin:0 auto;
}
.mobile {
  .search-box-zone {
    max-width: 88%;
  }
  .tag-zone {
    max-width: 96%;
  }
  .data-container {
    max-width: 88%;
  }
}
</style>