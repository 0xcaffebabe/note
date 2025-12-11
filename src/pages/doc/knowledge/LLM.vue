<template>
  <el-drawer v-model="showDrawer" :size="$isMobile() ? '75%' : '44%'" :direction="$isMobile() ? 'btt' : 'rtl'"
    title="模板生成问题" :modal="false" @close="$emit('close')" :lock-scroll="false" modal-penetrable resizable>
    <div class="llm-container">
      <el-row :gutter="12">
        <el-col :span="24">
          问题模板：
          <el-select v-model="llmMode" @change="handleModeChange" style="width: 100%;">
            <el-option v-for="item in presets" :key="item.value" :value="item.value" :label="item.name">{{ item.name
            }}</el-option>
          </el-select>
        </el-col>
      </el-row>

      <!-- 显示当前模板的变量编辑区域 -->
      <div v-if="currentTemplate && currentTemplate.variables.length > 0" class="variables-section">
        <h4>模板变量</h4>
        <el-row :gutter="12" v-for="variable in currentTemplate.variables" :key="variable.name"
          style="margin-bottom: 12px;">
          <el-col :span="24">
            <label>{{ variable.label }}</label>
            <el-input type="textarea" :rows="3" v-model="variableValues[variable.name]"
              :placeholder="variable.description" @input="updateTemplateContent" />
          </el-col>
        </el-row>
      </div>

      <!-- 渲染后的模板内容 -->
      <el-input type="textarea" rows="15" v-model="query" @keyup="handleQueryKeyUp" />

      <el-row :gutter="12" style="margin-top: 10px;">
        <el-col :span="24">
          <el-button type="success" @click="handleCopy" style="width:100%">复制提问</el-button>
        </el-col>
      </el-row>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElMessage } from "element-plus";
import templates from '@/templates/llmTemplates';
import { LlmTemplate } from '@/templates/llmTemplates';
import DocService from "@/service/DocService";
import CategoryService from "@/service/CategoryService";
import TagService from "@/service/TagService";

export default defineComponent({
  props: {
    doc: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showDrawer: false,
      llmMode: 'review',
      query: '',
      presets: templates as LlmTemplate[],
      currentTemplate: null as LlmTemplate | null,
      variableValues: {} as Record<string, string>
    };
  },
  watch: {
    doc() {
      this.handleModeChange()
    }
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    }
  },
  methods: {
    async renderTemplate(template: LlmTemplate) {
      // 在创建时获取文档数据
      const file = await DocService.getDocFileInfo(this.doc);
      const contents = await DocService.getContentByDocId(this.doc);
      const categories = await CategoryService.getCategoryList();
      const tags = TagService.getTagList();

      // 设置变量值
      const variableValues: Record<string, string> = {};
      for (const variable of template.variables) {
        switch (variable.name) {
          case 'docTitle':
            variableValues[variable.name] = this.doc;
            break;
          case 'inputContent':
            variableValues[variable.name] = `---\n${file.content}\n---`;
            break;
          case 'docOutline':
            variableValues[variable.name] = `---\n${this.contents2String(contents)}\n---`;
            break;
          case 'knowledgeCatalog':
            variableValues[variable.name] = `---\n${this.categories2String(categories, 0)}\n---`;
            break;
          case 'availableTags':
            variableValues[variable.name] = tags.join(',');
            break;
          default:
            variableValues[variable.name] = variable.value
              .replace('{{doc}}', this.doc)
              .replace('{{fileContent}}', file.content)
              .replace('{{outline}}', this.contents2String(contents))
              .replace('{{allCategories}}', this.categories2String(categories, 0))
              .replace('{{tags}}', tags.join(','));
            break;
        }
      }

      // 使用变量值生成模板内容
      let templateContent = template.template;
      for (const [key, value] of Object.entries(variableValues)) {
        templateContent = templateContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      return templateContent
        .split('\n')
        .map((v: string) => v.replace(/(^\s*)|(\s*$)/g, ""))
        .join('\n');
    },
    show() {
      this.showDrawer = true
    },
    async handleModeChange() {
      const template = this.presets.find(v => v.value === this.llmMode);
      if (template) {
        this.currentTemplate = template;

        // 获取文档相关数据
        const file = await DocService.getDocFileInfo(this.doc);
        const contents = await DocService.getContentByDocId(this.doc);
        const categories = await CategoryService.getCategoryList();
        const tags = TagService.getTagList();

        // 初始化变量值
        this.variableValues = {};
        for (const variable of template.variables) {
          // 根据变量名设置默认值
          switch (variable.name) {
            case 'docTitle':
              this.variableValues[variable.name] = this.doc;
              break;
            case 'inputContent':
              this.variableValues[variable.name] = `\n${file.content}\n`;
              break;
            case 'docOutline':
              this.variableValues[variable.name] = `\n${this.contents2String(contents)}\n`;
              break;
            case 'knowledgeCatalog':
              this.variableValues[variable.name] = `\n${this.categories2String(categories, 0)}\n`;
              break;
            case 'availableTags':
              this.variableValues[variable.name] = tags.join(',');
              break;
            default:
              this.variableValues[variable.name] = variable.value
                .replace('{{doc}}', this.doc)
                .replace('{{fileContent}}', file.content)
                .replace('{{outline}}', this.contents2String(contents))
                .replace('{{allCategories}}', this.categories2String(categories, 0))
                .replace('{{tags}}', tags.join(','));
              break;
          }
        }

        // 更新模板内容
        this.updateTemplateContent();
      }
    },

    contents2String(contents: any[]): string {
      if (!contents || contents.length === 0) {
        return '';
      }
      return contents
        .map((v: any) => this.tab(v.level) + "- " + v.name + "\n" + this.contents2String(v.chidren || []))
        .join('\n');
    },

    categories2String(categories: any[], level: number): string {
      if (!categories || categories.length === 0) {
        return '';
      }
      return categories
        .map((v: any) => this.tab(level) + "- " + v.name + "\n" + this.categories2String(v.chidren || [], level + 1))
        .join('\n');
    },

    tab(t: number): string {
      let str = "";
      for (let i = 0; i < t; i++) {
        str += ' ';
      }
      return str;
    },

    updateTemplateContent() {
      if (this.currentTemplate) {
        // 使用变量值生成模板内容
        let templateContent = this.currentTemplate.template;
        for (const [key, value] of Object.entries(this.variableValues)) {
          templateContent = templateContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        // 清理空行和多余空白
        this.query = templateContent
          .split('\n')
          .map((v: string) => v.replace(/(^\s*)|(\s*$)/g, ""))
          .join('\n');
      }
    },

    handleQueryKeyUp(event: KeyboardEvent) {
      // 移除了发送功能，保留复制功能
    },
    handleCopy() {
      navigator.clipboard.writeText(this.query);
      ElMessage.success("复制成功");
    }
  },
  async created() {
    const reviewTemplate = this.presets.find(v => v.value === 'review');
    if (reviewTemplate) {
      this.currentTemplate = reviewTemplate;
      this.query = await this.renderTemplate(reviewTemplate);
      this.handleModeChange()
    }
  },
});
</script>

<style lang="less">
.el-drawer__body {
  padding: 0;
}
</style>

<style lang="less" scoped>
.llm-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
}

.content {
  flex: 1;
  overflow: auto;
  font-size: 16px;
}

.variables-section {
  margin-bottom: 20px;

  h4 {
    margin: 10px 0 15px 0;
    font-size: 16px;
  }

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    font-size: 14px;
  }
}
</style>