<template>
  <el-drawer v-model="showDrawer" :size="$isMobile() ? '50%' : '44%'" :direction="$isMobile() ? 'btt' : 'rtl'"
    title="LLM" :modal="false" @close="$emit('close')" :lock-scroll="false" modal-class="operational-drawer-modal"
    class="operational-drawer">
    <div class="llm-container" v-loading="loading">
      <div id="llm" class="content"></div>
      <el-select v-model="llmMode" style="width: 200px" @change="handleModeChange">
        <el-option v-for="item in presets" :key="item.value" :value="item.value" :label="item.name">{{ item.name
          }}</el-option>
      </el-select>
      <el-input type="textarea" rows="5" v-model="query" @keyup="handleQueryKeyUp"/>
      <el-button type="primary" @click="handleSend">发送</el-button>
    </div>

  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import api from "@/api";
import { ElMessage } from "element-plus";
import DocService from "@/service/DocService";
import Content from '@/dto/Content'
import axios from 'axios'
import { marked } from 'marked'

function contents2String(contents: Content[]): string {
  if (!contents || contents.length == 0) {
    return ''
  }
  return contents.map(v => tab(v.level) + "- " + v.name + "\n" + contents2String(v.chidren)).join('\n')
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
      llmMode: '',
      llmContent: '',
      query: '',
      loading: false,
      presets: [
        { name: '概括总结', value: 'summary', template: () => this.summaryTemplate() },
        { name: '根据内容回答问题', value: 'ansuwerByContent', template: () => this.answerByContentTempalte() },
        { name: '根据目录回答问题', value: 'ansuwerByCategory', template: () => this.answerByCategoryTempalte() },
        { name: '补充目录', value: 'category', template: () => this.categoryTempalte() }
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
    show() {
      this.showDrawer = true
    },
    async handleModeChange() {
      const method = this.presets.filter(v => v.value == this.llmMode)[0].template
      const template = (await method())
                        .split('\n').map((v: string) => v.replace(/(^\s*)|(\s*$)/g, "")).join('\n')
      
      this.query = template
    },
    handleQueryKeyUp(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === 'Enter') {
        this.handleSend()
      }
    },
    async handleSend() {
      let stream = null
      try {
        stream = (await axios.post('https://llm.ismy.wang', this.query, {
        headers: {
          'Accept': 'text/event-stream',
        },
        responseType: 'stream',
        adapter: 'fetch'
      })).data;
      }catch(err :any) {
        ElMessage.error(err.message)
      }

      const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
      this.llmContent = '';
      let data = '';
      const targetElement = document.getElementById('llm')!;  // 假设输出的元素ID是 'output'

      // 清空目标元素内容
      targetElement.innerHTML = '';

      // 函数用于逐字添加文本到目标元素
      const addTextToElement = async (text: string) => {
        for (const char of text) {
          // 暂存当前HTML内容
          const currentContent = targetElement.innerHTML;

          // 将新字符添加到当前数据
          data += char;

          // 重新渲染Markdown为HTML
          const renderedContent = marked(data) as string;

          // 更新目标元素内容
          targetElement.innerHTML = renderedContent;

          // 保持滚动条在底部
          targetElement.scrollTop = targetElement.scrollHeight;

          // 等待一段时间以实现逐字显示效果
          await new Promise(resolve => setTimeout(resolve, 10)); // 控制每个字符出现的速度
        }
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const arr = value.split('\n');
        for (const i of arr) {
          if (i.trim() === 'data: [DONE]') {
            continue;
          }
          if (i.trim().length === 0) {
            continue;
          }
          const line = JSON.parse(i.replace('data: ', '')).response;
          await addTextToElement(line);
        }
      }
    }
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
}
</style>