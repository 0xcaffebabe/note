<template>
  <div class="header">
    <div class="header-wrapper">
      <div class="container">
        <div class="logo">
          <a href="#" @click="$router.push('/')">
            {{ siteName }}
          </a>
        </div>
        <div class="content">
          <div>
            <div style="display: inline-block">
              <span style="color: #606266; font-size: 14px">数据源:</span>
              <el-select
                v-model="currentDatasource"
                placeholder="数据源"
                size="mini"
                style="width: 120px; margin-left: 10px"
                @change="handleDatasourceChange"
              >
                <el-option
                  v-for="item in datasourceList"
                  :key="item.id"
                  :label="item.id"
                  :value="item.id"
                >
                  <span style="float: left">{{ item.id }}</span>
                  <span
                    style="
                      float: right;
                      margin-left:10px;
                      color: var(--el-text-color-secondary);
                      font-size: 13px;
                    "
                    >{{ item.desc }}</span
                  >
                </el-option>
              </el-select>
            </div>
            <el-divider direction="vertical" />
            <el-switch
              v-model="showMode"
              active-text="黑暗模式"
              inactive-text="正常模式"
            >
            </el-switch>
            <el-divider direction="vertical" />
            <el-button-group style="margin-left: 20px">
              <el-button
                icon="el-icon-search"
                class="search"
                @click="$emit('search')"
                size="mini"
                round
              >
                Ctrl + K 全文搜索
              </el-button>
              <el-button
                icon="el-icon-search"
                class="search"
                @click="$emit('category-search')"
                size="mini"
                round
              >
                Ctrl + Q 目录搜索
              </el-button>
            </el-button-group>
            <el-divider direction="vertical" />
          </div>
          <el-menu mode="horizontal" :ellipsis="false">
            <template v-for="(menu, index) in navMenu" :key="index">
              <el-sub-menu :index="index + ''" v-if="menu.children">
                <template #title>{{ menu.title }}</template>
                <el-menu-item
                  :index="index + '-' + subIndex"
                  v-for="(subMenu, subIndex) in menu.children"
                  :key="index + '-' + subIndex"
                  @click="handleNavMenuClick(subMenu)"
                  >{{ subMenu.title }}</el-menu-item
                >
              </el-sub-menu>
              <el-menu-item
                v-else
                :index="index + ''"
                @click="handleNavMenuClick(menu)"
                >{{ menu.title }}</el-menu-item
              >
            </template>
          </el-menu>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import config from "@/config";
import DatasourceService from "@/service/DatasourceService";
import DatasourceItem from "@/dto/DatasourceItem";

export default defineComponent({
  setup() {},
  data() {
    return {
      name: "my-book" as string,
      showMode: false as boolean,
    };
  },
  methods: {
    handleNavMenuClick(menu: any) {
      if (menu.url) {
        window.open(menu.url);
      } else {
        this.$router.push(menu.router);
      }
    },
    handleDatasourceChange(id: string){
      DatasourceService.setCurrentDatasource(this.datasourceList.filter(v => v.id == id)[0])
      window.location.reload()
    }
  },
  computed: {
    siteName() {
      return config.siteName;
    },
    navMenu() {
      return config.navMenu;
    },
    datasourceList(): DatasourceItem[] {
      return DatasourceService.listDatasourceList();
    },
    currentDatasource(): string {
      return DatasourceService.getCurrentDatasource().id;
    }
  },
  created() {},
});
</script>


<style lang="less" scoped>
.header {
  border-bottom: 1px solid #ccc;
  padding: 0;
  background-color: #fff;
}
.header-wrapper {
  padding: 0 32px;
}
.container {
  display: flex;
  justify-content: space-between;
  .logo {
    display: flex;
    align-items: center;
    a {
      text-decoration: none;
      font-size: 1.3rem;
      font-weight: 600;
      color: #2c3e50;
      position: relative;
    }
  }
  .search {
    height: 24px;
    display: flex;
    align-items: center;
  }
  .content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .content /deep/ .el-menu {
    border-bottom: none;
  }
}
.el-menu {
  width: 320px;
}
</style>