<template>
  <el-drawer v-model="showDrawer" :size="$isMobile() ? '75%' : '44%'" :direction="$isMobile() ? 'btt' : 'rtl'"
    title="模板生成问题" :modal="false" @close="$emit('close')" :lock-scroll="false" modal-class="operational-drawer-modal"
    class="operational-drawer">
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
import DocService from "@/service/DocService";
import Content from '@/dto/Content'
import CategoryService from "@/service/CategoryService";
import Category from "@/dto/Category";
import TagService from "@/service/TagService";

function contents2String(contents: Content[]): string {
  if (!contents || contents.length == 0) {
    return ''
  }
  return contents.map(v => tab(v.level) + "- " + v.name + "\n" + contents2String(v.chidren)).join('\n')
}

function categorys2String(categorys: Category[], level: number): string {
  if (!categorys || categorys.length == 0) {
    return ''
  }
  return categorys.map(v => tab(level) + "- " + v.name + "\n" + categorys2String(v.chidren, level + 1)).join('\n')
}

function tab(t: number) {
  let str = ""
  for (let i = 0; i < t; i++) {
    str += ' '
  }
  return str
}

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
      llmMode: 'category',
      query: '',
      presets: [
        { name: '根据整个目录回答问题', value: 'answerByAllCategory', template: () => this.answerByAllCategoryTemplate() },
        { name: '根据内容回答问题', value: 'ansuwerByContent', template: () => this.answerByContentTempalte() },
        { name: '根据目录回答问题', value: 'ansuwerByCategory', template: () => this.answerByCategoryTempalte() },
        { name: '标签预测', value: 'predictTag', template: () => this.tagsPredicateTemplate() },
        { name: '概括总结', value: 'summary', template: () => this.summaryTemplate() },
        { name: '补充目录', value: 'category', template: () => this.categoryTempalte() },
        { name: '更新与趋势', value: 'trends', template: () => this.trendsTemplate() },
        { name: '历史背景', value: 'history', template: () => this.historyTemplate() },
        { name: '未来发展', value: 'future', template: () => this.futureTemplate() },
        { name: '核心概念解释', value: 'concepts', template: () => this.conceptsTemplate() },
        { name: '实践应用场景', value: 'applications', template: () => this.applicationsTemplate() },
        { name: '常见问题与解答', value: 'faq', template: () => this.faqTemplate() },
        { name: '知识对比分析', value: 'comparison', template: () => this.comparisonTemplate() },
        { name: '学习路径规划', value: 'learningPath', template: () => this.learningPathTemplate() },
        { name: '关键要点梳理', value: 'keyPoints', template: () => this.keyPointsTemplate() },
        { name: '案例分析', value: 'caseStudy', template: () => this.caseStudyTemplate() },
        { name: '错误概念纠正', value: 'misconceptions', template: () => this.misconceptionsTemplate() },
        { name: '知识关联图谱', value: 'relations', template: () => this.relationsTemplate() },
      ]
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
    async answerByContentTempalte() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
        请根据以下文本回答问题：

        问题：


        文本：
        ---
        ${file.content}
        ---
      `
    },
    async answerByAllCategoryTemplate() {
      const categorys = await CategoryService.getCategoryList()
      return `
        以下是个人知识体系的目录，请根据目录回答问题：

        问题：


        目录：
        ---
        ${categorys2String(categorys, 0)}
        ---
      `
    },
    async answerByCategoryTempalte() {
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
        以下是关于 《${this.doc}》 的目录，请根据目录回答问题：

        问题：


        目录：
        ---
        ${text}
        ---
      `
    },
    async futureTemplate() {
      return `
        简单介绍一下关于 《${this.doc}》 的未来可能得发展方向与挑战
      `
    },
    async historyTemplate() {
      return `
        简单介绍一下关于 《${this.doc}》 的历史背景，重点放在关于 《${this.doc}》 的发展历程
      `
    },
    async trendsTemplate() {
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
        以下是关于 《${this.doc}》 的目录，根据你最新的模型，列出该主题的最近更新与趋势，并附带年份
        ---
        ${text}
        ---
      `
    },
    async categoryTempalte() {
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
        以下是关于 《${this.doc}》 的目录，还有哪些方面的内容还可以补充
        ---
        ${text}
        ---
      `
    },
    async summaryTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
        概括以下文本的内容：
        ---
        ${file.content}
        ---
      `
    },
    async tagsPredicateTemplate() {
      const tags = TagService.getTagList()
      const file = await DocService.getDocFileInfo(this.doc)
      return `
      根据这篇 《${this.doc}》的内容，从标签列表中挑选出最合适的 5 个标签，标签尽量从标签列表选择，当然也可以根据文本内容生成，但是生成的标签应具备抽象通用的语义，标签不要太过具体
      
      标签列表：${tags.join(",")}

      文本内容：
      ---
      ${file.content}
      ---
      `
    },
    show() {
      this.showDrawer = true
    },
    async handleModeChange() {
      const method = this.presets.filter(v => v.value == this.llmMode)[0].template
      const template = (await method())
        .split('\n').map((v: string) => v.replace(/(^\s*)|(\s*$)/g, "")).join('\n')

      this.query = template
    },
    async conceptsTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
        请详细解释关于 《${this.doc}》 的核心概念和定义，并提供易于理解的示例。
        
        文本内容：
        ---
        ${file.content}
        ---
      `
    },
    async applicationsTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
        请列举关于 《${this.doc}》 的实际应用场景，并详细说明在不同场景中如何运用相关知识。
        
        文本内容：
        ---
        ${file.content}
        ---
      `
    },
    async faqTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
        基于以下关于 《${this.doc}》 的内容和目录，请提出并回答可能遇到的常见问题。
        
        目录：
        ---
        ${text}
        ---
        
        内容：
        ---
        ${file.content}
        ---
      `
    },
    async comparisonTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
        请将 《${this.doc}》 与其他相关概念或技术进行对比，突出它们之间的异同点。
        
        文本内容：
        ---
        ${file.content}
        ---
      `
    },
    async learningPathTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
        基于 《${this.doc}》 的知识体系，请设计一个循序渐进的学习路径，包括前置知识、学习顺序和实践建议。
        
        目录：
        ---
        ${text}
        ---
        
        内容：
        ---
        ${file.content}
        ---
      `
    },
    async keyPointsTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
        请梳理 《${this.doc}》 的关键要点，并按重要性排序，提供简洁的摘要。
        
        文本内容：
        ---
        ${file.content}
        ---
      `
    },
    async caseStudyTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
        请基于 《${this.doc}》 的知识，提供一个相关的案例分析，包括背景、问题、解决方案和结果。
        
        文本内容：
        ---
        ${file.content}
        ---
      `
    },
    async misconceptionsTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
        指出在学习 《${this.doc}》 过程中常见的错误概念或误解，并提供正确的理解。
        
        文本内容：
        ---
        ${file.content}
        ---
      `
    },
    async relationsTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
        分析 《${this.doc}》 与其他相关知识领域的关联，绘制知识关系图谱。
        
        目录：
        ---
        ${text}
        ---
        
        内容：
        ---
        ${file.content}
        ---
      `
    },
    handleQueryKeyUp(event: KeyboardEvent) {
      // 移除了发送功能，保留复制功能
    },
    handleCopy() {
      navigator.clipboard.writeText(this.query);
      ElMessage.success("复制成功")
    }
  },
  async created() {
    this.query = await this.categoryTempalte()
  }
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
</style>