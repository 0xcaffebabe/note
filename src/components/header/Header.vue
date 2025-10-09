<template>
  <div class="optimized-header">
    <div class="header-wrapper">
      <div class="container">
        <div class="logo">
          <a href="#" @click.prevent="$router.push('/home')">
            {{ siteName }}
          </a>
        </div>
        <div class="content">
          <div class="header-actions">
            <!-- 正常/暗色模式切换按钮 -->
            <theme-switcher class="action-item" />
            <!-- 全屏/缓存清空 -->
            <el-divider direction="vertical" class="divider" />
            <el-button-group class="action-group">
              <el-button 
                size="small" 
                @click="handleToggleFullScreen" 
                title="进入/退出全屏模式"
                class="action-btn"
              >
                <el-icon><monitor /></el-icon>
              </el-button>
              <el-button 
                size="small" 
                @click="refresh"
                class="action-btn"
              >
                <el-icon><Refresh /></el-icon>
              </el-button>
              <el-popconfirm title="确认清空缓存?" @confirm="clearCache">
                <template #reference>
                  <el-button 
                    size="small" 
                    title="清空缓存"
                    class="action-btn"
                  >
                    <el-icon><brush /></el-icon>
                  </el-button>
                </template>
              </el-popconfirm>
              <el-button 
                size="small" 
                @click="enterZenMode" 
                title="进入专注模式"
                class="action-btn"
              >
                <el-icon><aim /></el-icon>
              </el-button>
            </el-button-group>
            <el-divider direction="vertical" class="divider" />
            <!-- 搜索 -->
            <el-button-group class="action-group">
              <el-button
                class="search-btn"
                @click="$emit('search')"
                size="small"
                round
              >全文搜索</el-button>
              <el-button
                class="search-btn"
                @click="$emit('category-search')"
                size="small"
                round
              >目录搜索</el-button>
            </el-button-group>
            <el-divider direction="vertical" class="divider" />
            <div class="header-links">
              <el-link 
                :href="link.url" 
                v-for="link in linkList" 
                :key="link.url" 
                target="_blank"
                class="header-link"
              >
                {{link.title}}
              </el-link>
            </div>
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
.optimized-header {
  border-bottom: 1px solid var(--el-border-color);
  padding: 0;
  height: 60px;
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 4px 6px -1px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  backdrop-filter: blur(8px); // 添加背景模糊效果
}

.header-wrapper {
  padding: 0 24px;
  height: 100%;
}

.container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .logo {
    display: flex;
    align-items: center;
    a {
      text-decoration: none;
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--el-text-color-primary);
      position: relative;
      transition: all 0.3s ease;
      padding: 4px 8px;
      border-radius: 6px;
      
      &:hover {
        color: var(--el-color-primary);
        background-color: var(--el-fill-color-light);
        transform: translateY(-1px);
      }
    }
  }
  
  .content {
    display: flex;
    align-items: center;
    height: 100%;
    
    .header-actions {
      display: flex;
      align-items: center;
      height: 100%;
      
      .divider {
        margin: 0 8px;
        height: 24px;
      }
      
      .action-group {
        display: flex;
        align-items: center;
        position: relative;
      }
      
      .action-btn {
        margin: 0 1px;
        min-width: 32px;
        height: 32px;
        transition: all 0.25s ease;
        border: none;
        background-color: transparent;
        
        &:first-child {
          margin-left: 0;
          border-radius: 6px 0 0 6px;
        }
        
        &:last-child {
          margin-right: 0;
          border-radius: 0 6px 6px 0;
        }
        
        &:not(:first-child):not(:last-child) {
          border-radius: 0;
        }
        
        &:hover {
          background-color: var(--el-fill-color-light);
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        &:active {
          transform: translateY(0);
        }
      }
      
      .search-btn {
        margin: 0 2px;
        height: 32px;
        transition: all 0.25s ease;
        border: 1px solid var(--el-border-color);
        border-radius: 20px;
        
        &:first-child {
          margin-left: 0;
        }
        
        &:last-child {
          margin-right: 0;
        }
        
        &:hover {
          border-color: var(--el-color-primary);
          color: var(--el-color-primary);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
        }
      }
      
      .header-links {
        display: flex;
        align-items: center;
        margin-left: 12px;
        
        .header-link {
          margin: 0 8px;
          font-size: 14px;
          color: var(--el-text-color-secondary);
          transition: all 0.25s ease;
          padding: 4px 6px;
          border-radius: 4px;
          text-decoration: none;
          
          &:hover {
            color: var(--el-color-primary);
            background-color: var(--el-fill-color-light);
            transform: translateY(-1px);
            text-decoration: none;
          }
        }
      }
    }
  }
}

// 深色主题适配
body[theme=dark] {
  .optimized-header {
    background-color: var(--second-dark-bg-color);
    border-bottom: 1px solid var(--default-dark-border-color);
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.4), 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  }
  
  .container {
    .logo a {
      color: var(--main-dark-text-color);
      transition: all 0.3s ease;
      
      &:hover {
        color: #409eff; // Element Plus primary color in dark mode
        background-color: rgba(255, 255, 255, 0.05);
      }
    }
    
    .header-actions {
      .action-btn {
        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
      }
      
      .search-btn {
        border: 1px solid var(--default-dark-border-color);
        background-color: rgba(255, 255, 255, 0.03);
        color: var(--main-dark-text-color);
        
        &:hover {
          border-color: #409eff;
          color: #409eff;
          background-color: rgba(64, 158, 255, 0.1);
        }
      }
    }
    
    .header-links {
      .header-link {
        color: var(--second-dark-text-color);
        
        &:hover {
          color: #409eff; // Element Plus primary color in dark mode
          background-color: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .optimized-header {
    height: 50px;
  }
  
  .header-wrapper {
    padding: 0 16px;
  }
  
  .container {
    .logo {
      a {
        font-size: 1.2rem;
        padding: 2px 6px;
      }
    }
    
    .content {
      .header-actions {
        .action-btn, .search-btn {
          min-width: 28px;
          height: 28px;
          margin: 0 1px;
          padding: 0 8px;
        }
        
        .search-btn {
          span {
            display: none; // 在小屏幕上隐藏按钮文字
          }
          
          :deep(i) {
            margin-right: 0;
          }
        }
        
        .header-link {
          font-size: 13px;
          margin: 0 4px;
          padding: 2px 4px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .container {
    .content {
      .header-actions {
        .header-link {
          display: none; // 在极小屏幕上隐藏链接
        }
      }
    }
  }
}
</style>