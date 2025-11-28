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
      llmMode: 'review',
      query: '',
      presets: [
        { name: '审视文章优缺点和建议', value: 'review', template: () => this.reviewTemplate() },
        { name: '文档升维处理', value: 'upscaling', template: () => this.upscalingTemplate() },
        { name: '知识错误纠正', value: 'misconceptions', template: () => this.misconceptionsTemplate() },
        { name: '标签预测', value: 'predictTag', template: () => this.tagsPredicateTemplate() },
        { name: '概括总结', value: 'summary', template: () => this.summaryTemplate() },
        { name: '更新与趋势', value: 'trends', template: () => this.trendsTemplate() },
        { name: '历史背景', value: 'history', template: () => this.historyTemplate() },
        { name: '未来发展', value: 'future', template: () => this.futureTemplate() },
        { name: '根据整个目录回答问题', value: 'answerByAllCategory', template: () => this.answerByAllCategoryTemplate() },
        { name: '根据内容回答问题', value: 'ansuwerByContent', template: () => this.answerByContentTempalte() },
        { name: '根据目录回答问题', value: 'ansuwerByCategory', template: () => this.answerByCategoryTempalte() },
        { name: '补充目录', value: 'category', template: () => this.categoryTempalte() },
        { name: '核心概念解释', value: 'concepts', template: () => this.conceptsTemplate() },
        { name: '实践应用场景', value: 'applications', template: () => this.applicationsTemplate() },
        { name: '常见问题与解答', value: 'faq', template: () => this.faqTemplate() },
        { name: '知识对比分析', value: 'comparison', template: () => this.comparisonTemplate() },
        { name: '学习路径规划', value: 'learningPath', template: () => this.learningPathTemplate() },
        { name: '关键要点梳理', value: 'keyPoints', template: () => this.keyPointsTemplate() },
        { name: '案例分析', value: 'caseStudy', template: () => this.caseStudyTemplate() },
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
你是一名内容理解与知识抽取专家。

【任务目标】
根据《${this.doc}》的全文内容回答用户的问题。

【输出格式要求】
1. 回答必须基于文本内容，不得超出文本范围。
2. 使用 Markdown 格式输出。
3. 若文本无相关内容，请明确指出。

【输入数据】
《${this.doc}》内容：
---
${file.content}
---

【重要规则】
- 所有结论必须来源于内容。
- 不得脑补内容。
- 如内容不足，要提醒用户补充问题上下文。

【问题】

      `
    },
    async answerByAllCategoryTemplate() {
      const categorys = await CategoryService.getCategoryList()
      return `
你是一名知识体系分析专家。

【任务目标】
根据整个知识体系目录结构回答用户的问题。

【输出格式要求】
1. 输出应基于目录结构推论，不得凭空创造不存在的内容。
2. 回答保持结构化（使用 Markdown）。
3. 若目录无法提供足够信息，请明确指出信息不足之处。

【输入数据】
知识体系目录：
---
${categorys2String(categorys, 0)}
---

【重要规则】
- 只能利用目录中的主题推断，不得捏造细节内容。
- 避免输出与当前知识体系无关的内容。

【问题】（请在此处填写问题）

      `
    },
    async answerByCategoryTempalte() {
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
你是一名文档结构理解与知识推理专家。

【任务目标】
根据《${this.doc}》的目录，回答用户提出的问题。

【输出格式要求】
1. 回答需与目录结构严格对应，不得臆造目录中不存在的主题。
2. 使用 Markdown 格式，结构清晰。
3. 若目录信息不足以回答问题，请明确说明。

【输入数据】
《${this.doc}》目录：
---
${text}
---

【重要规则】
- 所有回答必须基于目录结构，不允许编造细节。
- 未在目录中出现的概念不要提供内容。

【问题】

      `
    },
    async futureTemplate() {
      return `
你是一名趋势分析专家。

【任务目标】
基于内容推断《${this.doc}》未来 3~5 年的可能发展方向与挑战。

【输出格式要求】
1. 推动力（技术/需求/限制）
2. 未来可能的演进方向
3. 潜在风险和挑战
4. 可能的突破点（如内容可推断）


【重要规则】
- 不得凭空编造具体年份预测。
- 所有趋势必须能从内容推导或来自通用行业规律。

      `
    },
    async historyTemplate() {
      return `
你是一名知识体系发展史研究员。

【任务目标】
基于结构与内容分析《${this.doc}》对应领域的演进脉络（抽象演化而非具体年份）。

【输出格式要求】
1. 起源阶段
2. 发展阶段
3. 体系成熟阶段
4. 当前状态
5. 全程禁止虚构具体年份

【重要规则】
- 若内容缺乏时间信息，则以“逻辑演进阶段”代替。

      `
    },
    async trendsTemplate() {
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
你是一名知识趋势追踪专家。

【任务目标】
结合当前模型知识，分析《${this.doc}》主题的“近年来趋势”，并尽可能标注年份。

【输出格式要求】
1. 按年份/阶段列出趋势
2. 使用 Markdown 列表
3. 若年份不确定，用“约 202x 年”表达

【输入数据】
目录：
---
${text}
---

【重要规则】
- 年份必须是行业公认趋势，不得凭空创造特定事件。

      `
    },
    async categoryTempalte() {
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
你是一名知识体系结构设计专家。

【任务目标】
分析《${this.doc}》当前目录结构，指出可补充的知识点、缺失部分或更合理的结构拓展方向。

【输出格式要求】
1. 使用 Markdown 列表格式，展示补充建议。
2. 按类别（基础概念 / 机制原理 / 设计哲学 / 实践应用 / 扩展阅读等）整理建议。
3. 不要修改现有结构，仅给出可补充内容。

【输入数据】
《${this.doc}》目录：
---
${text}
---

【重要规则】
- 只能基于目录提出“合理可补充项”，不得幻想目录不存在的具体内容。
- 若当前目录已经较完整，需要说明“已较完整，可适当补充 xx”。


      `
    },
    async summaryTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
你是一名文档摘要与知识提炼专家。

【任务目标】
对以下《${this.doc}》文本进行结构化总结，提炼主要思想。

【输出格式要求】
1. 使用 Markdown 输出以下四部分内容：
   - 核心观点摘要
   - 关键论点
   - 重要概念提炼
   - 适用场景与限制（如内容中可推导）
2. 结构清晰，避免无关内容。

【输入数据】
文本内容：
---
${file.content}
---

【重要规则】
- 摘要必须可从原文推导，不得添加文中未出现的观点。

      `
    },
    async tagsPredicateTemplate() {
      const tags = TagService.getTagList()
      const file = await DocService.getDocFileInfo(this.doc)
      return `
你是一名文本分类与标签抽象专家。

【任务目标】
从标签列表中选出最适合《${this.doc}》内容的标签，如必要可生成新的抽象标签，但必须具有通用性。

【输出格式要求】
1. 输出“最终标签列表 (最多 5 个)”
2. 每个标签需附一句理由说明
3. 若生成新标签，需要说明其抽象语义

【输入数据】
标签列表：
${tags.join(",")}

文本内容：
---
${file.content}
---

【输出格式要求】
---
tags: ['标签1', '标签2', '标签3']
---

【重要规则】
- 不允许生成具体到“案例”“年份”“技术版本号”的标签。
- 所有标签必须与文本高度相关。

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
你是《${this.doc}》领域的专业讲解者。

【任务目标】
解释该主题的核心概念、关键术语与本质思想。

【输出格式要求】
1. 包含以下部分：
   - 核心概念定义
   - 本质思想（核心逻辑）
   - 关键术语解释
   - 易混淆点澄清
   - 简单示例帮助理解
2. 全文使用 Markdown。

【输入数据】
---
${file.content}
---

【重要规则】
- 定义必须可从文本推断，不得创造不存在的概念。

      `
    },
    async applicationsTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
你是一名技术应用与场景分析专家。

【任务目标】
基于《${this.doc}》提取可应用的实践场景并解释如何落地使用。

【输出格式要求】
1. 按场景分类（如业务场景/技术场景/流程场景）
2. 每个场景必须包含：
   - 场景描述
   - 如何使用相关知识
   - 注意事项
3. Markdown 格式输出

【输入数据】
---
${file.content}
---

【重要规则】
- 场景必须能由文档内容推导。

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
你是一名知识对比与差异化分析专家。

【任务目标】
对《${this.doc}》与相关概念/技术进行对比分析。

【输出格式要求】
1. 输出对比表格（优势/劣势/适用场景）
2. 须包含以下部分：
   - 概念对比
   - 原理对比
   - 应用对比
   - 适用边界分析

【输入数据】
---
${file.content}
---

【重要规则】
- 所有对比必须基于内容和行业常识。

      `
    },
    async learningPathTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
你是一名学习路径设计专家。

【任务目标】
基于《${this.doc}》设计系统化学习路径，包括前置知识 → 核心学习 → 进阶扩展 → 实践建议。

【输出格式要求】
1. 学习分四阶段：
   - 前置知识
   - 基础理解
   - 深入进阶
   - 实践应用
2. 每阶段附学习建议与目标
3. 使用 Markdown

【输入数据】
目录：
---
${text}
---
内容：
---
${file.content}
---

【重要规则】
- 路径必须与文档结构一致。

      `
    },
    async keyPointsTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
你是一名知识结构化与要点提炼专家。

【任务目标】
提炼《${this.doc}》的关键要点并按重要性排序。

【输出格式要求】
1. 输出“重要性排序列表”
2. 每个要点用一句话说明理由
3. 保持 Markdown 格式

【输入数据】
---
${file.content}
---

【重要规则】
- 不得加入原文中未提到的要点。

      `
    },
    async caseStudyTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
你是一名结构化案例分析专家。

【任务目标】
根据《${this.doc}》的内容，构造一个合理的示例案例（不依赖真实世界厂商/产品）。

【输出格式要求】
案例需包含：
1. 背景
2. 问题
3. 解决方案（应用文档知识）
4. 效果与启发
5. 使用 Markdown 展示

【输入数据】
---
${file.content}
---

【重要规则】
- 案例必须是“抽象化案例”，避免虚构具体公司名称或真实数据。

      `
    },
    async misconceptionsTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      return `
你是一名知识纠偏专家。

【任务目标】
指出所给出的《${this.doc}》中常见的有误的表述。

【输出格式要求】
1. 每条误解包含：
   - 错误表述
   - 正确表述
   - 简明解释
2. 使用 Markdown 列表

【输入数据】
---
${file.content}
---

【重要规则】
- 误解必须基于所输入的数据，不要编造错误。

      `
    },
    async relationsTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
你是一名知识图谱构建专家。

【任务目标】
分析《${this.doc}》与其他知识点的关联，生成"关系说明列表"。

【输出格式要求】
1. 以 Markdown 列表展示以下内容：
   - 内部概念关联
   - 外部相关领域关联
   - 前置与后置关系
2. 如可推导，可给出"关系解释"

【输入数据】
目录：
---
${text}
---
内容：
---
${file.content}
---

【重要规则】
- 不创建不存在的概念节点。
- 所有关联必须符合文本或常识推理。

      `
    },
    async upscalingTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
你是知识体系专家和文档升维专家。

${this.knowledgePrincipal()}

任务：将输入的原始文档 (${this.doc}) 升维为高抽象度、体系化、逻辑严谨的知识文档。请输出完整知识文档版本。

---

【顶层结构模块选择】：

1. 技术/系统架构文档：
   - 概述（Overview）
   - 本质（Essence）
   - 模型（Model）
   - 能力体系（Capability System）
   - 架构模型（Architecture Model）
   - 类型体系（Taxonomy）
   - 边界与生态（Boundary & Ecosystem）
   - 治理体系（Governance System）
   - 演进趋势（Evolution）
   - 选型方法论（Selection Framework）
   - 总结（Conclusion）

2. 产品/业务方法论文档：
   - 概述/目标价值
   - 本质/核心原则
   - 流程模型（Process Model）
   - 能力模型（Capability Model）
   - 角色与职责（Roles & Responsibilities）
   - 治理体系（Governance System）
   - 演进趋势（Evolution）
   - 总结（Conclusion）

3. 流程规范文档：
   - 概述
   - 核心流程（Core Process）
   - 输入输出（Input/Output）
   - 角色职责（Roles & Responsibilities）
   - 策略规则（Policies & Rules）
   - 治理与监控（Governance & Monitoring）
   - 优化与演进（Optimization & Evolution）
   - 总结

4. 知识概念/学科文档：
   - 概述
   - 本质/定义
   - 核心概念（Core Concepts）
   - 分类体系（Taxonomy）
   - 应用场景（Use Cases / Applications）
   - 关联关系（Relations / Dependencies）
   - 发展趋势（Evolution / Trends）
   - 总结

有些知识可能不存在某些模块,或者列出的模块无法满足某些知识的描述需求，请参照具体的知识内容自行扩展。

---

【生成要求】：

1. 对每个模块：
   - 提炼核心概念、定义和作用
   - 可使用表格、流程图或 mermaid 图增强可读性
   - 抽象概念优先，工程或实践示例可选

2. 输出风格：
   - 知识文档风格、逻辑严谨、层次清晰
   - 大标题、小标题不要使用中文数字或者阿拉伯数字开头
   - 避免不必要的 emoji 表情
   - 概念和边界明确
   - 可作为团队内部标准参考

3. 可选增强：
   - 能力树图示
   - 流程图或模型关系图
   - 演进路线图
   - 选型/决策表格或决策树

---

【输入文档】：
---
${file.content}
---

      `
    },
    async reviewTemplate() {
      const file = await DocService.getDocFileInfo(this.doc)
      const contents = await DocService.getContentByDocId(this.doc)
      const text = contents2String(contents)
      return `
你是文章审阅与知识分析专家。

${this.knowledgePrincipal()}

任务：对输入文章 (${this.doc}) 进行全面审视，输出文章的**优缺点分析与改进建议**，并根据文档类型动态适配分析维度。

---

【分析逻辑】：

1. **技术/系统架构文档**
   - **优点分析**：
     - 技术结构清晰性（架构、模块划分、层次性）
     - 概念准确性（核心概念、模型、边界）
     - 实用性（示例、可执行性、可复用性）
     - 可观测性与治理体系体现
   - **缺点分析**：
     - 抽象不足或概念混淆
     - 缺少可视化图表或模型关系
     - 部分设计原则不明确
     - 缺少演进趋势或选型参考
   - **改进建议**：
     - 增加抽象概念和模块化模型
     - 补充可视化能力树、流程图
     - 明确边界和职责
     - 加入演进趋势和选型方法论

2. **产品/业务方法论文档**
   - **优点分析**：
     - 核心原则明确
     - 流程/方法模型完整
     - 角色职责清晰
     - 与业务目标或价值关联
   - **缺点分析**：
     - 流程或能力模型不够抽象
     - 缺少实践示例或可量化指标
     - 逻辑顺序不够清晰
   - **改进建议**：
     - 梳理流程模型和能力树
     - 补充实践案例和可量化指标
     - 明确角色、责任、协作关系

3. **流程规范文档**
   - **优点分析**：
     - 流程步骤完整
     - 输入输出、角色职责清晰
     - 策略规则明确
   - **缺点分析**：
     - 流程抽象层次不足
     - 缺少优化或治理建议
     - 可视化图表不足
   - **改进建议**：
     - 增加流程图或泳道图
     - 明确策略与监控指标
     - 提供优化和演进方案

4. **知识概念/学科文档**
   - **优点分析**：
     - 核心概念定义准确
     - 分类体系完整
     - 应用场景和关联关系清晰
   - **缺点分析**：
     - 概念抽象度不够
     - 缺少发展趋势或演进分析
     - 逻辑层次不够清晰
   - **改进建议**：
     - 强化概念抽象和边界定义
     - 补充发展趋势和应用示例
     - 增加分类关系图或概念图

有些知识可能不存在某些模块,或者列出的模块无法满足某些知识的描述需求，请参照具体的知识内容自行扩展。

---

【输出要求】：
1. 输出**优点分析**、**缺点分析**、**改进建议**三个部分
2. 每条分析建议都应简明、具体、可操作
3. 可使用表格或列表增强可读性
4. 逻辑清晰、条理分明，便于团队复用和改进

---

【输入文章】：
---
${file.content}
---

      `
    },
    knowledgePrincipal() {
      return `
## 知识管理哲学

1. 本质、稳定优先原则
   * 追求技术背后的**第一性原理**
   * 关注**不变**的架构模式、设计思想、哲学基础
   * 从具体实现中抽象出**通用规律**
   * 所有解析必须穿透现象直达架构原理与设计哲学
   * 概念解释需揭示底层原理而非表面特征
   * 知识组织应体现从抽象到具体的认知层次
   * 稳定知识 = 原理层认知 + 架构思想 + 设计模式 + 工程哲学
   * 不稳定知识 = 具体API + 临时方案 + 未经验证的新特性
   * **关注** 原理、理论体系、组织协作
   * **忽略** 具体技术细节、临时内容、表面特征
   * 工具导向 → 思想导向
   * 分散知识 → 系统认知
   * 短期关注 → 长期沉淀
   * 技术思维 → 人文思维
   * 应用层 → 原理层
   
2. 知识结构化原则
   *  树形结构可以引导用户结构化思考
   *  网状结构可以展示知识间的关系
   *  标签元数据能对知识进行分类整理
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
    this.query = await this.reviewTemplate()
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