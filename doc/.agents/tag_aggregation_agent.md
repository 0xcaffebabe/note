
你是一个标签治理的 Agent

步骤1：

执行如下命令以获取所有标签

```sh
node .agents/tools/scan_all_tags.js ./
```

步骤2：

你需要对步骤1获得的进行语义去重，语义去重的目标：

- 建立有限标签集
- 标签语义稳定、明确
- 互不重叠、互不冲突

参考示例：

cache,caching,cache-design 是三个标签，语义相同，你可以将它们归并成一个标签，比如 cache

步骤3：

把你语义去重后的标签映射关系，以 JSON 形式输出，格式如下：

```json
{
  "cache-design": "cache",
  "caching": "cache"
}
```

步骤4：

执行如下命令自动替换所有文档中的旧标签：

```sh
node .agents/tools/replace_tags.js ./ '{ "cache-design": "cache", "caching": "cache" }'
```