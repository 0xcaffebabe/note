<template>
  <el-drawer v-model="showDrawer" size="30%" title="知识回顾" :lock-scroll="false" custom-class="knowledge-review">
    <div class="review-range">
      <el-slider v-model="rangeValue" range :max="20" :show-tooltip="false" :marks="marks"> </el-slider>
    </div>
    <el-select v-model="displayMode" placeholder="选择" size="mini" class="display-mode" @change="handleDisplayModeChange">
      <el-option
        label="倒序"
        value="倒序"
      />
      <el-option
        label="正序"
        value="正序"
      />
    </el-select>
    <div class="history-list">
      <el-timeline>
        <el-timeline-item
          v-for="item in filterDocList"
          :key="item[0]"
          :timestamp="new Date(item[1].date).toLocaleString() + ' ' + item[1].message"
        >
          <a href="#" @click.prevent="$router.push('/doc/' + item[0])">{{docId2Url(item[0])}}</a>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-drawer>
</template>


<script lang="ts">
import api from "@/api";
import CommitInfo from "@/dto/CommitInfo";
import DocUtils from "@/util/DocUtils";
import { defineComponent, CSSProperties } from "vue";

interface Mark {
  style: CSSProperties
  label: string
}
type Marks = Record<number, Mark | string>

export default defineComponent({
  data() {
    return {
      displayMode: '倒序' as '正序' | '倒序',
      showDrawer: false as boolean,
      rangeValue: [0, 20],
      docList: [] as [string, CommitInfo][],
      marks: {
        0: '现在',
        1: {
          style: {
            "margin-top": '-24px'
          },
          label: '1天内'
        },
        3: '1周内',
        6: {
          style: {
            "margin-top": '-24px'
          },
          label: '1月内'
        },
        10: {
          style: {
          },
          label: '6月内',
        },
        20: '最远'
      } as Marks
    };
  },
  computed: {
    filterDocList(): [string, CommitInfo][]{
      const now = new Date().getTime()
      let left = this.rangeMapping(this.rangeValue[0])
      let right = this.rangeMapping(this.rangeValue[1])
      const startTime = now - left * 3600 * 1000 * 24
      const endTime = now - right * 3600 * 1000 * 24

      return this.docList.filter((v : [string, CommitInfo]) => {
        const time = new Date(v[1].date).getTime()
        return time >= endTime && time <= startTime
      })
    }
  },
  methods: {
    docId2Url: DocUtils.docId2Url,
    docUrl2Id: DocUtils.docUrl2Id,
    // 将滑动条的关键日期数字转为具体的天数
    rangeMapping(val: number): number {
      if (val == 0) {
        return 0
      }
      if (val >= 1 && val < 3)  {
        return 1
      }
      if (val >=3 && val < 6) {
        return 7
      }
      if (val >= 6 && val < 10) {
        return 30
      }
      if (val >= 10 && val < 20) {
        return 180
      }
      return 2147483647
    },
    show() {
      this.showDrawer = true;
    },
    hide() {
      this.showDrawer = false;
    },
    handleDisplayModeChange() {
      this.docList.reverse()
      document.querySelector('.knowledge-review .el-drawer__body')?.scrollTo(0,0)
    }
  },
  async created() {
    this.docList = await api.getDescCommitDocList()
  }
});
</script>

<style lang="less" scoped>
.history-list {
  a {
    text-decoration: none;
    color: #74818d;
    font-weight: 400;
    font-size: 14px;
  }
  a:hover {
    color: #3E90E8 !important;
  }
  :deep(.el-timeline-item:hover .el-timeline-item__node) {
    background-color: #3E90E8 !important;
    border-color: #3E90E8 !important;
  }
}
.display-mode {
  position: fixed;
  width: 80px;
  z-index: 998;
  top: 50px;
  right: 10px;
}
.review-range {
  padding: 20px;
}
</style>
