<template>
  <el-drawer v-model="showDrawer" :size="$isMobile() ? '90%' : '84%'" title="知识回顾" :lock-scroll="true" custom-class="knowledge-review">
    <el-row style="height:100%">
      <el-col :md="18" :xs="24">
        <knowledge-scatter ref="knowledgeScatter" :doc="doc"/>
      </el-col>
      <el-col :md="6" :xs="24" style="height:100%">
         <div class="review-range">
          <el-slider v-model="rangeValue" range :max="20" :show-tooltip="false" :marks="marks"> </el-slider>
        </div>
        <el-select v-model="displayMode" placeholder="选择" size="small" class="display-mode" @change="handleDisplayModeChange">
          <el-option
            label="倒序"
            value="倒序"
          />
          <el-option
            label="正序"
            value="正序"
          />
        </el-select>
        <div class="sort">
          <span>排序依据: </span>
            <el-radio-group v-model="sort" @change="handleDisplayModeChange">
              <el-radio label="时间"></el-radio>
              <el-radio label="质量"></el-radio>
            </el-radio-group>
        </div>
        <div class="history-list">
          <el-timeline>
            <el-timeline-item
              v-for="item in filterDocList"
              :key="item[0]"
            >
              <a href="#" @click.prevent="$router.push('/doc/' + item[0])">{{docId2Url(item[0])}}</a>
              <p class="timestamp">{{new Date(item[1].date).toLocaleString()}} <a :href="repoUrl + '/commit/' + item[1].hash" target="_blank">{{item[1].message}}</a></p>
              <p class="timestamp"><span>⚽质量分数: {{quality(item[0])}}</span></p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-col>
    </el-row>
   
  </el-drawer>
</template>


<script lang="ts">
import api from "@/api";
import CommitInfo from "@/dto/CommitInfo";
import DocUtils from "@/util/DocUtils";
import { defineComponent, CSSProperties } from "vue";
import config from "@/config";
import DocService from "@/service/DocService";
import KnowledgeScatter from './KnowledgeScatter.vue'

interface Mark {
  style: CSSProperties
  label: string
}
type Marks = Record<number, Mark | string>

export default defineComponent({
  props: {
    doc: {
      type: String,
      required: true
    }
  },
  components: {
    KnowledgeScatter
  },
  data() {
    return {
      displayMode: '倒序' as '正序' | '倒序',
      sort: '时间' as '时间' | '质量',
      showDrawer: false as boolean,
      repoUrl: config.repositoryUrl,
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
    quality(id: string): string{
      return DocService.calcQuanlityStr(id)
    },
    show() {
      this.showDrawer = true;
    },
    hide() {
      this.showDrawer = false;
    },
    sortByQuantity() {
      if (this.displayMode == '倒序') {
        this.docList = this.docList.sort((b, a) => (DocService.getDocQuality(a[0])?.quality || 0) - (DocService.getDocQuality(b[0])?.quality || 0))
      }else {
        this.docList = this.docList.sort((a, b) => (DocService.getDocQuality(a[0])?.quality || 0) - (DocService.getDocQuality(b[0])?.quality || 0))
      }
    },
    sortByTime() {
      if (this.displayMode == '倒序') {
        this.docList = this.docList.sort((a, b) => new Date(a[1].date).getTime() - new Date(b[1].date).getTime() )
      }else {
        this.docList = this.docList.sort((b, a) => new Date(a[1].date).getTime() - new Date(b[1].date).getTime() )
      }
    },
    handleDisplayModeChange() {
      if (this.sort == '时间') {
        this.sortByTime();
      }else {
        this.sortByQuantity()
      }
      document.querySelector('.knowledge-review .el-drawer__body')?.scrollTo(0,0)
    }
  },
  async created() {
    this.docList = await api.getDescCommitDocList()
    if (this.sort == '时间') {
        this.sortByTime();
      }else {
        this.sortByQuantity()
      }
  }
});
</script>

<style lang="less" scoped>
.history-list {
  height: calc(100% - 80px);
  overflow-y:scroll;
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
  .timestamp {
    margin: 0;
    padding: 0;
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    line-height: 1;
    font-size: var(--el-font-size-small);
  }
}
.display-mode {
  position: fixed;
  width: 80px;
  z-index: 998;
  top: 50px;
  right: 10px;
}
.sort {
  position: fixed;
  z-index: 998;
  top: 46px;
  right: 100px;
  span {
    font-size: 15px;
    color: #888;
  }
  .el-radio {
    margin-right: 8px;
  }
}
.review-range {
  padding: 20px;
}
</style>
