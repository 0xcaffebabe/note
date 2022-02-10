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
            <instapaper-shower />
            <el-divider direction="vertical" />
            <datasource-selector />
            <el-divider direction="vertical" />
            <!-- 正常/暗色模式切换按钮 -->
            <el-switch
              v-model="showMode"
              :inline-prompt="true"
              :active-icon="activeIcon"
              :inactive-icon="inactiveIcon"
              @click="toggleDarkMode"
              active-color="#000"
              inactive-color="#409EFF"
            >
            </el-switch>
            <!-- 全屏/缓存清空 -->
            <el-divider direction="vertical" />
            <el-button-group>
              <el-button size="mini" @click="handleToggleFullScreen" title="进入/退出全屏模式">
                <el-icon><monitor /></el-icon>
              </el-button>
              <el-popconfirm title="确认清空缓存?" @confirm="clearCache">
                <template #reference>
                  <el-button size="mini" title="清空缓存">
                    <el-icon><brush /></el-icon>
                  </el-button>
                </template>
              </el-popconfirm>
              <el-button size="mini" @click="enterZenMode" title="进入专注模式">
                <el-icon><aim /></el-icon>
              </el-button>
              <yueque-draft-shower />
            </el-button-group>
            <el-divider direction="vertical" />
            <!-- 搜索 -->
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
          <div>
            <el-link :href="link.url" v-for="link in linkList" :key="link.url" target="_blank">{{link.title}}</el-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {Sunny, Moon, Monitor, Brush, Aim } from '@element-plus/icons';
import EventBus from "@/components/EventBus";
import InstapaperShower from "./InstapaperShower.vue";
import YuequeDraftShower from "./YuequeDraftShower.vue";
</script>

<script lang="ts">
import { defineComponent } from "vue";
import config from "@/config";
import DatasourceSelector from './datasource/DatasourceSelector.vue';
import CacheService from "@/service/CacheService";
import MermaidUtils from '@/util/MermaidUtils';

export default defineComponent({
  components: {
    DatasourceSelector
  },
  data() {
    return {
      name: "my-book" as string,
      showMode: false as boolean,
      activeIcon: Moon,
      inactiveIcon: Sunny,
      fullscreen: false,
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
    clearCache(){
      CacheService.getInstance().clear();
    },
    handleToggleFullScreen(){
      this.fullscreen = !document.fullscreenElement;
      if (this.fullscreen) {
        document.body.requestFullscreen();
      }else {
        document.exitFullscreen();
      }
    },
    toggleDarkMode(){
      const theme = document.body.getAttribute('theme');
      if (theme == 'dark') {
        document.body.setAttribute('theme', 'light');
        this.$store.commit('setIsDarkMode', false);
        localStorage.setItem('system::theme', "light");
        MermaidUtils.initWithNormal();
      }else {
        document.body.setAttribute('theme', 'dark');
        this.$store.commit('setIsDarkMode', true);
        localStorage.setItem('system::theme', "dark");
        MermaidUtils.initWithNormal();
      }
    },
    enterZenMode() {
      EventBus.emit('enter-zen-mode', null)
    }
  },
  computed: {
    siteName() {
      return config.siteName;
    },
    linkList() {
      return config.linkList;
    },
    isDark(){
      return this.$store.state.isDarkMode;
    }
  },
  created() {
    this.showMode = this.isDark;
    EventBus.on('enter-zen-mode', () => {
      document.body.requestFullscreen();
    })
  },
});
</script>


<style lang="less" scoped>
.header {
  border-bottom: 1px solid #ccc;
  padding: 0;
  height: 60px;
  background-color: #fff;
}
.header-wrapper {
  padding: 16px 32px;
}
.el-link {
  padding-left: 4px;
  font-size: 16px;
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
body[theme=dark] {
  .header {
    background-color:var(--second-dark-bg-color);
    color: var(--main-dark-text-color);
    border-bottom: 1px solid #333;
  }
  .el-menu {
    background-color:var(--second-dark-bg-color);
    color: var(--main-dark-text-color);
  }
  .logo a {
    color: var(--first-dark-text-color)
  }
}

body[theme=dark] {
  .el-link {
    color: var(--second-dark-text-color);
  }
  .el-link:hover {
    color: var(--main-dark-text-color);
  }
}
</style>