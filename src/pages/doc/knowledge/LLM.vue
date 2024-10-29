<template>
  <el-drawer v-model="showDrawer" :size="$isMobile() ? '75%' : '44%'" :direction="$isMobile() ? 'btt' : 'rtl'"
    title="LLM" :modal="false" @close="$emit('close')" :lock-scroll="false" modal-class="operational-drawer-modal"
    class="operational-drawer">
    <div class="llm-container">
      <div id="llm" class="content"></div>
      <el-row :gutter="12">
        <el-col :span="8">
          问答模板：
          <el-select v-model="llmMode" @change="handleModeChange">
            <el-option v-for="item in presets" :key="item.value" :value="item.value" :label="item.name">{{ item.name
              }}</el-option>
          </el-select>
        </el-col>
        <el-col :span="8">
          模型：
          <el-select v-model="model">
            <el-option v-for="item in models" :key="item" :value="item" :label="item">{{ item }}</el-option>
          </el-select>
        </el-col>
      </el-row>


      <el-input type="textarea" rows="5" v-model="query" @keyup="handleQueryKeyUp" />
      <el-row :gutter="12">
        <el-col :span="8">
          <el-button type="primary" :loading="loading" @click="handleSend" style="width:100%">单模型问答</el-button>
        </el-col>
        <el-col :span="8">
          <el-button type="warning" @click="handleMultiSend" style="width:100%">多模型问答</el-button>
        </el-col>
        <el-col :span="8">
          <el-button type="success" @click="handleCopy" style="width:100%">复制提问</el-button>
        </el-col>
      </el-row>
    </div>
    <!-- 多模型对比对话框 -->
    <el-dialog v-model="multiLLMShow" title="多模型问答" width="1800" top="1vh">
      <!-- 一个四列的 div -->
      <div style="height: 840px;">
        <el-row :gutter="12">
          <el-col v-for="(item, index) in models" :key="item" :span="6">
            <span>{{ item }}</span> <el-button type="primary" size="small" @click="regenerate(index)">重新生成</el-button>
            <div :id="'llm' + index" class="content" style="max-height: 800px"></div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElMessage } from "element-plus";
import DocService from "@/service/DocService";
import Content from '@/dto/Content'
import { marked } from 'marked'
import CategoryService from "@/service/CategoryService";
import Category from "@/dto/Category";

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

async function* stream(model: string, data: any) {
  try {
    console.log('Sending request');
    const response = await fetch("https://llm.ismy.wang?model=" + model, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: data,
    });

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        yield chunk;
      }
    }

    console.log('Request sent');
  } catch (error) {
    console.error(error)
  }
}

async function requestLLMAndRender(model: string, containerId: string, query: string) {
  let data = ''
  const targetElement = document.getElementById(containerId)!;

  // 清空目标元素内容
  targetElement.innerHTML = '';

  // 函数用于逐字添加文本到目标元素
  const addTextToElement = async (text: string) => {
    for (const char of text) {

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

  const streamGenerator = stream(model, query)

  for await (const chunk of streamGenerator) {
    if (!chunk) {
      break;
    }
    const arr = chunk.split('\n');
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
      multiLLMShow: false,
      llmMode: 'category',
      model: '@cf/qwen/qwen1.5-14b-chat-awq',
      models: [
        '@cf/qwen/qwen1.5-14b-chat-awq',
        '@hf/google/gemma-7b-it',
        '@hf/nousresearch/hermes-2-pro-mistral-7b',
        '@cf/meta/llama-3.1-70b-instruct'
      ],
      llmContent: '',
      query: '',
      loading: false,
      presets: [
        { name: '根据整个目录回答问题', value: 'answerByAllCategory', template: () => this.answerByAllCategoryTemplate() },
        { name: '概括总结', value: 'summary', template: () => this.summaryTemplate() },
        { name: '根据内容回答问题', value: 'ansuwerByContent', template: () => this.answerByContentTempalte() },
        { name: '根据目录回答问题', value: 'ansuwerByCategory', template: () => this.answerByCategoryTempalte() },
        { name: '补充目录', value: 'category', template: () => this.categoryTempalte() },
        { name: '更新与趋势', value: 'trends', template: () => this.trendsTemplate() },
        { name: '历史背景', value: 'history', template: () => this.historyTemplate() },
        { name: '未来发展', value: 'future', template: () => this.futureTemplate() },
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
    handleCopy() {
      navigator.clipboard.writeText(this.query);
      ElMessage.success("复制成功")
    },
    async handleMultiSend() {
      this.multiLLMShow = true;
      setTimeout(() => {
        for (let i = 0; i < this.models.length; i++) {
          requestLLMAndRender(this.models[i], 'llm' + i, this.query)
        }
      }, 1000)
    },
    regenerate(index: number) {
      requestLLMAndRender(this.models[index], 'llm' + index, this.query)
    },
    async handleSend() {
      this.loading = true;
      await requestLLMAndRender(this.model, 'llm', this.query)
      this.loading = false
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