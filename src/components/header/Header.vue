<template>
  <div class="header">
    <div class="header-wrapper">
      <div class="container">
        <div class="logo">
          <a href="#" @click.prevent="$router.push('/home')">
            {{ siteName }}
          </a>
        </div>
        <div class="content">
          <div>
            <!-- 正常/暗色模式切换按钮 -->
            <theme-switcher />
            <!-- 全屏/缓存清空 -->
            <el-divider direction="vertical" />
            <el-button-group>
              <el-button size="small" @click="handleToggleFullScreen" title="进入/退出全屏模式">
                <el-icon><monitor /></el-icon>
              </el-button>
              <el-button size="small" @click="refresh">
                <el-icon><Refresh /></el-icon>
              </el-button>
              <el-popconfirm title="确认清空缓存?" @confirm="clearCache">
                <template #reference>
                  <el-button size="small" title="清空缓存">
                    <el-icon><brush /></el-icon>
                  </el-button>
                </template>
              </el-popconfirm>
              <el-button size="small" @click="enterZenMode" title="进入专注模式">
                <el-icon><aim /></el-icon>
              </el-button>
            </el-button-group>
            <el-divider direction="vertical" />
            <!-- 搜索 -->
            <el-button-group>
              <el-button
                class="search"
                @click="$emit('search')"
                size="small"
                round
              >全文搜索</el-button>
              <el-button
                class="search"
                @click="$emit('category-search')"
                size="small"
                round
              >目录搜索</el-button>
            </el-button-group>
            <el-divider direction="vertical" />
            <el-link :href="link.url" v-for="link in linkList" :key="link.url" target="_blank">{{link.title}}</el-link>
          </div>
          <div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {Sunny, Moon, Monitor, Brush, Aim, Refresh } from '@element-plus/icons-vue';
import EventBus from "@/components/EventBus";
import ThemeSwitcher from "./ThemeSwitcher.vue";
</script>

<script lang="ts">
import { defineComponent } from "vue";
import config from "@/config";
import CacheService from "@/service/CacheService";
import { ElMessage  } from 'element-plus';

export default defineComponent({
  data() {
    return {
      name: "my-book" as string,
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
      ElMessage.success('清除缓存完成');
    },
    handleToggleFullScreen(){
      this.fullscreen = !document.fullscreenElement;
      if (this.fullscreen) {
        document.body.requestFullscreen();
      }else {
        document.exitFullscreen();
      }
    },
    enterZenMode() {
      EventBus.emit('enter-zen-mode', null)
    },
    refresh() {
      location.reload()
    }
  },
  computed: {
    siteName() {
      return config.siteName;
    },
    linkList() {
      return config.linkList;
    },
  },
  created() {
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
  box-shadow: 2px 0 13px #bbb;
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
  .header {
    box-shadow: 2px 0 13px #111;
  }
}
</style>