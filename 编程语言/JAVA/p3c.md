# p3c

现代软件架构的复杂性需要协同开发完成，如何高效地协同呢？无规矩不成方圆，无规范难以协同

## 编码

### 命名

- <span style="color:red">【强制】</span>代码中的命名均不能以下划线或美元符号开始，也不能以下划线或美元符号结束

- <span style="color:red">【强制】</span>代码中的命名严禁使用拼音与英文混合的方式，更不允许直接使用中文的方式

一个好的命名应该是望文生义

- <span style="color:red">【强制】</span>类名使用 UpperCamelCase 风格，但以下情形例外：DO / BO / DTO / VO / AO / PO / UID 等

- <span style="color:red">【强制】</span>方法名、参数名、成员变量、局部变量都统一使用 lowerCamelCase 风格

- <span style="color:red">【强制】</span>常量命名全部大写，单词间用下划线隔开，力求语义表达完整清楚，不要嫌名字长

- <span style="color:red">【强制】</span>抽象类命名使用 Abstract 或 Base 开头；异常类命名使用 Exception 结尾；测试类命名以它要测试的类的名称开始，以 Test 结尾

- <span style="color:red">【强制】</span>类型与中括号紧挨相连来表示数组

- <span style="color:red">【强制】</span>POJO 类中布尔类型变量都不要加 is 前缀，否则部分框架解析会引起序列化错误

这条与数据库字段名需要以is开头起冲突了 需要通过手动映射的方式来将is_xx 映射到 xx

- <span style="color:red">【强制】</span>包名统一使用小写，点分隔符之间有且仅有一个自然语义的英语单词。包名统一使用单数形式，但是类名如果有复数含义，类名可以使用复数形式

- <span style="color:red">【强制】</span>避免在子父类的成员变量之间、或者不同代码块的局部变量之间采用完全相同的命名，使可读性降低

只有方法才会多态 属性访问并不会

- <span style="color:red">【强制】</span>杜绝完全不规范的缩写

将AbtractFactory 缩写成 AbsFac 可能不是一个好主意

- <span style="color:yellow">【推荐】</span>为了达到代码自解释的目标，任何自定义编程元素在命名时，使用尽量完整的单词组合来表达其意

- <span style="color:yellow">【推荐】</span>在常量与变量的命名时，表示类型的名词放在词尾，以提升辨识度

- <span style="color:yellow">【推荐】</span>如果模块、接口、类、方法使用了设计模式，在命名时需体现出具体模式

- <span style="color:yellow">【推荐】</span>接口类中的方法和属性不要加任何修饰符号（public 也不要加），保持代码的简洁性，并加上有效的 Javadoc 注释

- <span style="color:yellow">【推荐】</span>尽量不要在接口里定义变量，如果一定要定义变量，肯定是与接口方法相关，并且是整个应用的基础常量

可以是接口的基础常量

- <span style="color:red">【强制】</span>对于 Service 和 DAO 类，基于 SOA 的理念，暴露出来的服务一定是接口，内部的实现类用Impl 的后缀与接口区别

既然是基于SOA的理念 那么现在大部分都是内部调用的Service就没必要定义接口了

- <span style="color:yellow">【推荐】</span>如果是形容能力的接口名称，取对应的形容词为接口名（通常是–able 的形容词）

- <span style="color:green">【参考】</span>枚举类名带上 Enum 后缀，枚举成员名称需要全大写，单词间用下划线隔开

- <span style="color:green">【参考】</span>各层命名规范
  - Service/DAO
    - 获取单个对象的方法用 get 做前缀。
    - 获取多个对象的方法用 list 做前缀，复数形式结尾如：listObjects。
    - 获取统计值的方法用 count 做前缀。
    - 插入的方法用 save/insert 做前缀。
    - 删除的方法用 remove/delete 做前缀。
    - 修改的方法用 update 做前缀
  - 领域模型
    - 数据对象：xxxDO，xxx 即为数据表名。
    - 数据传输对象：xxxDTO，xxx 为业务领域相关的名称。
    - 展示对象：xxxVO，xxx 一般为网页名称。
    - POJO 是 DO/DTO/BO/VO 的统称，禁止命名成 xxxPOJO。

### 常量定义

- <span style="color:red">【强制】</span>不允许任何魔法值直接出现在代码中
- <span style="color:red">【强制】</span>在 long 或者 Long 赋值时，数值后使用大写的 L，不能是小写的 l，小写容易跟数字 1 混淆，造成误解
- <span style="color:yellow">【推荐】</span>不要使用一个常量类维护所有常量，要按常量功能进行归类，分开维护
- <span style="color:yellow">【推荐】</span>常量的复用层次有五层：
  - 跨应用共享常量：其他库中
  - 应用内共享常量：本工程子模块中
  - 子工程内共享常量：本工程中的const目录
  - 包内共享常量：本包的const目录
  - 类内共享常量：使用private static final定义

- <span style="color:yellow">【推荐】</span>如果变量值仅在一个固定范围内变化用 enum 类型来定义

