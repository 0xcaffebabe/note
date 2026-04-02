
## 搜索工具使用要求

1. **不要使用 WebSearch**
2. **每次搜索除了中文，你必须同时使用英文关键词再搜索一遍，以获得高质量的搜索结果**
3. **每次搜索你必须同时使用以下所有搜索工具，以获得全面的搜索结果：**

- MiniMax 大模型厂商提供的搜索接口：`mcp__MiniMax__web_search`，每天有次数限制
- 极客时间搜索：`node .agents/tools/geekbang_search.js 最相关的一个关键词`
- 必应搜索：`node .agents/tools/bing_search.js 最相关的一个关键词`
- 百度搜索：`node .agents/tools/baidu_search.js 最相关的一个关键词`
- 搜狗搜索：`node .agents/tools/sogou_search.js 最相关的一个关键词`

当某个搜索工具搜索失败时，应继续使用其他工具进行搜索。