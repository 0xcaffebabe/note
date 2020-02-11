# 使用

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-freemarker</artifactId>
        </dependency>
```

- 配置

```yml
spring:
  freemarker:
    cache: false
    enabled: true
    suffix: .html
    content-type: text/html
```

# 指令


```html
<h1>hello ${name}</h1>
```

- 类型
  - 注释，即<#‐‐和‐‐>，介于其之间的内容会被freemarker忽略 
  - 插值（Interpolation）：即`${..}`部分,freemarker会用真实的值代替${..} 
  - FTL指令：和HTML标记类似，名字前加#予以区分，Freemarker会解析标签中的表达式或逻辑。 
  - 文本，仅文本信息，这些不是freemarker的注释、插值、FTL指令的内容会被freemarker忽略解析，直接输出内 容。

## list指令

```html
<#list list as name>
    <li>${name}</li>
</#list>
```

## map操作

```html
<h1>${map['name']}</h1> <!--第一种方式-->
<h1>${map.name}</h1> <!--第二种方式-->
```

- 遍历map

```html
<#list map?keys as key>
    <li>${map[key]}</li>
</#list>
```

## 条件渲染

```html
<#if map.name == 'cxk'>
    jntm
</#if>
```

## 空值处理

```html
<#if map.name??> <!--返回值代表是否存在-->
    存在
</#if>

${map.class!"default"} <!--不存在则取默认值-->
```

## 内建函数

内建函数语法格式： 变量+?+函数名称 

```ftl
    ${time?time}
    ${time?date}
    ${time?datetime}
```












