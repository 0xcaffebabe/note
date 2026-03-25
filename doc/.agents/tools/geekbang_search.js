const keywords = process.argv.slice(2);

if (keywords.length === 0) {
  console.log("关键词为空 搜索失败");
  process.exit(1);
}

const keyword = keywords.join(" ");
const response = await fetch("https://s.geekbang.org/api/gksearch/search", {
  "headers": {
    "Referer": `https://s.geekbang.org`
  },
  "body": JSON.stringify({"q": keyword, "t": 0, "s": 20, "p": 1, "st": 0, "sort": 0, "range": 0}),
  "method": "POST"
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));