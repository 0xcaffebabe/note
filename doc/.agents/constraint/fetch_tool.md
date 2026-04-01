## WebFetch 工具使用要求

- 优先通过 `node .agents/tools/web_fetch.js url` 而非 WebFetch 工具获取网页内容

`web_fetch.js` 工具的输出结果可能由于结果过大将结果保存与文件中，

当出现如下输出时，你应读取对应的文件获取完整输出：

```
<persisted-output>
Output too large (61.1KB). Full output saved to: /root/.claude/projects/-root-learning-note-doc/b962aa8f-6ae2-4466-b34d-bc11b1dba3e0/tool-results/btvy817br.txt

....

</persisted-output>
```