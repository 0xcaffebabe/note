# MyBook

## 背景

忍受够了Gitbook动辄半小时的打包时间 VuePress无法满足要求且有许多限制

理念：

- 尽可能缩小打包编译时间 将大部分计算渲染移动到运行期
- 无缝迁移Gitbook文档

愿景：

- 拥有单页应用的良好体验
- 用写 Vue 的方式来扩展

## 功能

- 仓库、笔记等相关信息统计、图表生成
- 笔记全文检索、目录检索
- 思维导图自动生成
- 知识网络自动生成
- 阅读历史记录
- (随缘更新)...

## 使用

1.克隆仓库

```sh
git clone --depth 1 https://github.com/0xcaffebabe/note.git # 无历史克隆
```

2.清空doc目录，并在这里新增或者移入你的GitBook文档

3.安装依赖

```sh
npm run install
```

4.启动测试

```sh
npm run dev
```

5.初始化仓库并推送到你自己的仓库

### 注意事项

#### 全文检索

该功能需要你 <http://aloglia.com/> 申请应用，并创建一个名称为note的索引库（也可以直接在src/scripts/updateSearchIndex.ts中修改成你喜欢的索引名称）

分别将设置环境变量ALGOLIA_APPID、ALGOLIA_SECRET

然后

```sh
npm run update-index
```

#### 知识网络生成功能

该功能会自动将markdown文件里对本项目内其他的markdown文件链接自动绘制成一个网络图，在使用本功能时需要注意md链接要使用绝对路径如 xxx/xxx.md 或者 /xxx/xx.md

#### 自动部署

- 自动更新索引工作流：.github/workflows/updateSearchIndex.yml 需要添加两个密钥 分别为ALGOLIA_APP_ID 和 ALGOLIA_API_KEY 含义同上
- 自动部署GithubPages：.github/workflows/build_book.yml 需要添加THE_GITHUB_TOKEN 密钥
- 同步至Gitee：.github/workflows/sync_to_gitee.yml 具体配置参考配置文件里的注释
