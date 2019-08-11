> Java Server Pages： java服务器端页面

_JSP本质上就是一个Servlet_

# 指令

```jsp
<%@ 指令名称 属性名1=属性值1 属性名2=属性值2 ... %>
```

- page:配置JSP页面的

  - contentType：等同于response.setContentType()
  - import：导包
  - errorPage：当前页面发生异常后，会自动跳转到指定的错误页面
  - isErrorPage：标识当前也是是否是错误页面。

- include:页面包含的。导入页面的资源文件

  ```jsp
  <%@include file="top.jsp"%>
  ```

- taglib导入资源

  ```jsp
  <%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
  ```

# 注释

- html注释：

  `<!-- -->`:只能注释html代码片段

- jsp注释：推荐使用

  ```
  <%-- --%>：可以注释所有
  ```

  # JSP脚本

- `<% 代码 %>`：定义的java代码，在service方法中。service方法中可以定义什么，该脚本中就可以定义什么

- `<%! 代码 %>`：定义的java代码，在jsp转换后的java类的成员位置。

- `<%= 代码 %>`：定义的java代码，会输出到页面上。输出语句中可以定义什么，该脚本中就可以定义什么。

# 内置对象

变量名         | 真实类型                | 作用
----------- | ------------------- | ----------------------
pageContext | PageContext         | 当前页面共享数据,还可以获取其他八个内置对象
request     | HttpServletRequest  | 一次请求访问的多个资源(转发)
session     | HttpSession         | 一次会话的多个请求间
application | ServletContext      | 所有用户间共享数据
response    | HttpServletResponse | 响应对象
page        | Object              | 当前页面(Servlet)的对象 this
out         | JspWriter           | 输出对象，数据输出到页面上
config      | ServletConfig       | Servlet的配置对象
exception   | Throwable           | 异常对象

# MVC

![MVC开发模式](/assets/MVC开发模式.bmp)

- 耦合性低，方便维护，可以利于分工协作
- 重用性高
- 使得项目架构变得复杂，对开发人员要求高

# EL表达式

>Expression Language 表达式语言

- 语法：${表达式}

## 忽略

- 设置jsp中page指令中：isELIgnored="true" 忽略当前jsp页面中所有的el表达式
- ` \${表达式}` ：忽略当前这个el表达式

## 运算符

- 算术运算符
- 比较运算符
- 逻辑运算符
- 空运算符

    ```el
    ${empty list}
    ```
### 获取值

- ${域名称.键名}
  - pageScope
  - requestScope
  - sessionScope
  - applicationScope

- ${键名}：表示依次从最小的域中查找是否有该键对应的值，直到找到为止。

- 获取对象、List集合、Map集合的值
  - 对象：${域名称.键名.属性名}
  - List集合：${域名称.键名[索引]}
  - Map集合：
    - ${域名称.键名.key名称}
    - ${域名称.键名["key名称"]}

*逻辑视图*

## 隐式对象

![批注 2019-08-11 151212](/assets/批注%202019-08-11%20151212.png)

# JSTL

>JavaServer Pages Tag Library  JSP标准标签库

- if
- choose
- forEach




  


