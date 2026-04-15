
# Mermaid 图表生成器

根据用户需求生成高质量的 Mermaid 图表代码。

## 工作流程

1. **理解需求**：分析用户描述，确定最合适的图表类型  
2. **阅读文档**：读取对应图表类型的语法参考  
3. **生成代码**：按照规范生成 Mermaid 代码  
4. **应用样式**：应用合适的主题和样式配置  

## 图表类型参考

选择合适的图表类型并通过 .agents/constraint/fetch_tool.md 工具阅读对应的文档以了解语法：

| 类型 | 文档 | 使用场景 |
| ---- | ---- | -------- |
| 流程图 | [https://mermaid.js.org/syntax/flowchart.html] | 流程、决策、步骤 |
| 时序图 | [https://mermaid.js.org/syntax/sequenceDiagram.html] | 交互、消息传递、API 调用 |
| 类图 | [https://mermaid.js.org/syntax/classDiagram.html] | 类结构、继承、关联关系 |
| 状态图 | [https://mermaid.js.org/syntax/stateDiagram.html] | 状态机、状态转换 |
| ER 图 | [https://mermaid.js.org/syntax/entityRelationshipDiagram.html] | 数据库设计、实体关系 |
| 甘特图 | [https://mermaid.js.org/syntax/gantt.html] | 项目规划、时间线 |
| 饼图 | [https://mermaid.js.org/syntax/pie.html] | 占比、分布 |
| 思维导图 | [https://mermaid.js.org/syntax/mindmap.html] | 层级结构、知识图谱 |
| 时间线 | [https://mermaid.js.org/syntax/timeline.html] | 历史事件、里程碑 |
| Git 图 | [https://mermaid.js.org/syntax/gitgraph.html] | 分支、合并、版本 |
| 四象限图 | [https://mermaid.js.org/syntax/quadrantChart.html] | 四象限分析 |
| 需求图 | [https://mermaid.js.org/syntax/requirementDiagram.html] | 需求追踪 |
| C4 图 | [https://mermaid.js.org/syntax/c4.html] | 系统架构（C4 模型） |
| 桑基图 | [https://mermaid.js.org/syntax/sankey.html] | 流向、转化 |
| XY 图 | [https://mermaid.js.org/syntax/xyChart.html] | 折线图、柱状图 |
| 块图 | [https://mermaid.js.org/syntax/block.html] | 系统组件、模块 |
| 数据包图 | [https://mermaid.js.org/syntax/packet.html] | 网络协议、数据结构 |
| 看板 | [https://mermaid.js.org/syntax/kanban.html] | 任务管理、工作流 |
| 架构图 | [https://mermaid.js.org/syntax/architecture.html] | 系统架构 |
| 雷达图 | [https://mermaid.js.org/syntax/radar.html] | 多维对比 |
| 矩形树图 | [https://mermaid.js.org/syntax/treemap.html] | 分层数据可视化 |
| 韦恩图 | [https://mermaid.js.org/syntax/venn.html] | 集合关系、交集 |
| 鱼骨图 | [https://mermaid.js.org/syntax/ishikawa.html] | 因果分析、原因分类 |
| 树形图 | [https://mermaid.js.org/syntax/treeView.html] | 层级结构、目录树 |
| 用户旅程图 | [https://mermaid.js.org/syntax/userJourney.html] | 用户体验流程 |
| ZenUML | [https://mermaid.js.org/syntax/zenuml.html] | 时序图（代码风格） |

## 输出规范

生成的 Mermaid 代码应：

1. 使用 ```mermaid 代码块包裹  
2. 语法正确，可直接渲染  
3. 结构清晰，具备良好的换行与缩进  
4. 使用语义化节点命名  
5. 在需要时包含样式以提升可读性  

## 示例输出

```mermaid
flowchart TD
    A[开始] --> B{条件}
    B -->|是| C[执行]
    B -->|否| D[结束]
    C --> D