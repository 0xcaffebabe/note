<template>
  <el-drawer v-model="showDrawer" :size="$isMobile() ? '90%': '600px'" custom-class="search">
    <template #header>
      <el-autocomplete
        v-model="kw"
        placeholder="搜索"
        :fetch-suggestions="getSearchSuggestion"
        @keydown.enter="handleSearch"
        popper-class="popper-list"
        @select="handleSearchSelect"
        size="default"
        ref="input"
      >
        <template #default="{ item }">
          <div class="search-suggestion-item">{{ item.query }}</div>
          <el-badge :value="item.popularity" />
        </template>
        <template #append>
          <div style="width:48px;">

          <el-select style="height:100%" v-model="searchEngine" placeholder="搜索引擎" size="default" popper-class="popper-list">
            <el-option
            v-for="item in searchEngineList"
            :key="item"
            :label="item"
            :value="item"
          >
          </el-option>
        </el-select>
          </div>
        </template>
        <template #suffix>
          <span class="search-took" v-if="resultList.length > 0">搜索耗时:{{searchTook}}</span>
        </template>
      </el-autocomplete>
    </template>
    <div class="search-result" v-loading="showLoading" :element-loading-background="loadingColor">
      <div v-for="result in resultList" :key="result.url">
        <div class="result-item top-heading">
        <h1
          class=""
          v-html="result.hilighedUrl"
          @click="handleDocClick(result.url)"
        />
        <div class="index-time-wrapper">
          <el-tag class="index-time" size="small">⏰索引时间: {{new Date(result.createTime).toLocaleString()}}</el-tag>
          <el-tag class="index-time" style="margin-left: 10px" size="small" v-if="result.score">⚽分数: {{result.score}}</el-tag>
        </div>
        </div>
        <div
          v-for="p in result.hilighedSegement"
          :key="p.id"
          class="result-item"
          @click="handleDocClick(result.url, p.id)"
        >
          <h3 v-html="p.id"></h3>
          <p v-html="p.txt"></p>
          <p v-if="p.missingKeywords">
          <span class="font-size:12px;color:#666">缺少关键词:</span>
          <el-tag v-for="mkw in p.missingKeywords" :key="mkw" size="small" type="danger"><del>{{mkw}}</del></el-tag>
          </p>
        </div>
      </div>
    </div>
    <el-empty
      v-show="showEmpty"
      :description="kw ? `按下回车以搜索 ${kw}` : '搜索结果将在这里展示'"
      v-if="resultList.length == 0"
    />
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import searchService from "@/service/SearchService";
import SearchResultItem from "@/dto/search/SearchResultItem";
import docService from "@/service/DocService";
import SearchSuggestion from "@/dto/search/SearchSuggestion";

let searchTimer: NodeJS.Timeout;

export default defineComponent({
  setup() {},
  data() {
    return {
      kw: "" as string,
      showDrawer: false as boolean,
      showEmpty: true as boolean,
      showLoading: false as boolean,
      resultList: [] as SearchResultItem[],
      // 搜索耗时
      searchTook: 0,
      searchSuggestionList: [] as SearchSuggestion[],
      searchEngineList: ['es', 'algolia'],
      searchEngine: 'es' as 'es' | 'algolia'
    };
  },
  computed: {
    outerKw() {
      return this.$store.state.currentSearchKw;
    },
    loadingColor() {
      if (this.$store.state.isDarkMode) {
        return 'rgba(0, 0, 0, 0.8)'
      }
      return 'rgba(0, 0, 0, 0.2)'
    }
  },
  watch: {
    outerKw(val: string) {
      this.showDrawer = true;
      this.kw = val;
      this.handleSearch();
    },
  },
  methods: {
    async show() {
      this.showDrawer = true;
      setTimeout(() => {
        (this.$refs.input as any).focus();
      }, 200)
      this.searchSuggestionList = await searchService.getQuerySuggestions();
    },
    hide() {
      this.showDrawer = false;
    },
    handleSearch() {
      // 搜索框失焦
      (this.$refs.input as any).close();

      this.showEmpty = false;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(async () => {
        // 动画开始
        this.showLoading = true;
        // 拉取数据
        const searchResult = await searchService.search(this.kw, this.searchEngine);
        this.resultList = searchResult.list
        this.searchTook = searchResult.took
        this.showEmpty = true;
        this.showLoading = false;
        // 动画结束
        // 重置结果详情滚动条到最顶端
        document.querySelector(".search .el-drawer__body")?.scrollTo(0, 0);
      }, 500);
    },
    handleDocClick(doc: string, headingId?: string) {
      if (!doc.startsWith("./") && !doc.startsWith("/")) {
        doc = "/" + doc;
      }
      const id = docService.docUrl2Id(doc);
      if (headingId) {
        headingId = headingId.replace(/<mark>/gi, "").replace(/<\/mark>/gi, "");
      }
      this.$router.push({
        path: "/doc/" + id,
        query: {
          headingId,
          kw: this.kw
        },
      });
    },
    handleSearchSelect(item: SearchSuggestion) {
      this.kw = item.query;
      this.handleSearch();
    },
    getSearchSuggestion(queryString: string, cb: any) {
      if (!queryString) {
        return cb([]);
      }
      const filtedSuggestions = this.searchSuggestionList.filter(
        (v) => v.query.toLowerCase().indexOf(queryString.toLowerCase()) != -1
      );
      cb(filtedSuggestions);
    },
  },
});
</script>

<style lang="less">
.el-drawer__body {
  overflow-y: auto;
  padding-left: 0 !important;
  padding-right: 0 !important;
  overflow-x: hidden;
}
</style>

<style lang="less" scoped>
.search-result {
  width: 100%;
  :deep(mark) {
    color: #409eff;
    background-color: transparent;
  }
}
.result-item-wrapper {
  position: relative;
}
.index-time-wrapper {
  width: 100%;
}
.result-item {
  margin: 0;
  cursor: pointer;
  padding: 8px 24px;
  border-bottom: 1px solid rgba(211, 220, 228, 1);
}
.result-item:hover {
  transition: all 0.3s;
  background-color: #e9edf2;
}
.top-heading {
  border-left: 4px solid #409eff;
  h1 {
    margin-bottom: 0!important;
  }
}
.search-suggestion-item {
  display: inline-block;
  padding: 4px 0;
}
.search-took {
  color: #bbb;
  padding-right: 10px;
}

body[theme=dark] {
  .result-item {
    border-bottom: 1px solid var(--default-dark-border-color);
  }
  .result-item:hover {
    background-color: var(--main-dark-bg-color);
  }
}
</style>