<template>
  <el-drawer v-model="showDrawer" size="600px" custom-class="search">
    <template #title>
      <el-autocomplete
        v-model="kw"
        placeholder="搜索"
        :fetch-suggestions="getSearchSuggestion"
        @keydown.enter="handleSearch"
        @select="handleSearchSelect"
        ref="input"
      >
        <template #default="{ item }">
          <div class="search-suggestion-item">{{ item.query }}</div>
          <el-badge :value="item.popularity" />
        </template>
      </el-autocomplete>
    </template>
    <div class="search-result" v-loading="showLoading">
      <div v-for="result in resultList" :key="result.url">
        <!-- <span>{{result.createTime}}</span> -->
        <h1
          class="top-heading result-item"
          v-html="result.hilighedUrl"
          @click="handleDocClick(result.url)"
        />
        <div
          v-for="p in result.hilighedSegement"
          :key="p.id"
          class="result-item"
          @click="handleDocClick(result.url, p.id)"
        >
          <h3 v-html="p.id"></h3>
          <p v-html="p.txt"></p>
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
import SearchResult from "@/dto/SearchResult";
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
      resultList: [] as SearchResult[],
      searchSuggestionList: [] as SearchSuggestion[],
    };
  },
  async created() {
    this.searchSuggestionList = await searchService.getQuerySuggestions();
  },
  computed: {
    outerKw() {
      return this.$store.state.currentSearchKw;
    },
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
      (this.$refs.input as any).focus();
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
        this.resultList = await searchService.search(this.kw);
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
}
.search-suggestion-item {
  display: inline-block;
  padding: 4px 0;
}
</style>
