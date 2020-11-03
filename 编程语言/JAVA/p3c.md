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

### 代码格式

- <span style="color:red">【强制】</span>如果是大括号内为空，则简洁地写成{}即可，大括号中间无需换行和空格，否则：
  - 左大括号前不换行。
  - 左大括号后换行。
  - 右大括号前换行。
  - 右大括号后还有 else 等代码则不换行；表示终止的右大括号后必须换行。
- <span style="color:red">【强制】</span>左小括号和字符之间不出现空格 ； 同样，右小括号和字符之间也不出现空格；而左大括号前需要空格
- <span style="color:red">【强制】</span>if/for/while/switch/do 等保留字与括号之间都必须加空格
- <span style="color:red">【强制】</span>任何二目、三目运算符的左右两边都需要加一个空格
- <span style="color:red">【强制】</span>采用 4 个空格缩进，禁止使用 tab 字符
- <span style="color:red">【强制】</span>注释的双斜线与注释内容之间有且仅有一个空格
- <span style="color:red">【强制】</span>在进行类型强制转换时，右括号与强制转换值之间不需要任何空格隔开
- <span style="color:red">【强制】</span>单行字符数限制不超过 120 个，超出需要换行，换行时遵循如下原则：
  - 第二行相对第一行缩进 4 个空格，从第三行开始，不再继续缩进。
  - 运算符与下文一起换行。
  - 方法调用的点符号与下文一起换行。
  - 方法调用中的多个参数需要换行时，在逗号后进行。
  - 在括号前不要换行，见反例
- <span style="color:red">【强制】</span>方法参数在定义和传入时，多个参数逗号后边必须加空格
- <span style="color:red">【强制】</span>IDE 的 text file encoding 设置为 UTF-8; IDE 中文件的换行符使用 Unix 格式
- <span style="color:yellow">【推荐】</span>单个方法的总行数不超过 80 行
- <span style="color:yellow">【推荐】</span>没有必要增加若干空格来使变量的赋值等号与上一行对应位置的等号对齐
- <span style="color:yellow">【推荐】</span>不同逻辑、不同语义、不同业务的代码之间插入一个空行分隔开来以提升可读性

### OOP规约

- <span style="color:red">【强制】</span>避免通过一个类的对象引用访问此类的静态变量或静态方法，无谓增加编译器解析成本，直接用类名来访问即可
- <span style="color:red">【强制】</span>所有的覆写方法，必须加@ Override 注解
- <span style="color:red">【强制】</span>相同参数类型，相同业务含义，才可以使用 Java 的可变参数，避免使用 Object...
- <span style="color:red">【强制】</span>外部正在调用或者二方库依赖的接口，不允许修改方法签名，避免对接口调用方产生影响。接口过时必须加@ Deprecated 注解，并清晰地说明采用的新接口或者新服务是什么
- <span style="color:red">【强制】</span>不能使用过时的类或方法
- <span style="color:red">【强制】</span> Object 的 equals 方法容易抛空指针异常，应使用常量或确定有值的对象来调用equals 
- <span style="color:red">【强制】</span>所有整型包装类对象之间值的比较，全部使用 equals 方法比较
- <span style="color:red">【强制】</span>浮点数之间的等值判断，基本数据类型不能用==来比较，包装数据类型不能用equals 来判断
- <span style="color:red">【强制】</span>定义数据对象 DO 类时，属性类型要与数据库字段类型相匹配
- <span style="color:red">【强制】</span>为了防止精度损失，禁止使用构造方法 BigDecimal(double) 的方式把 double 值转化为 BigDecimal 对象,优先使用入参的 String 构造函数
- <span style="color:red">【强制】</span>由于自动装箱拆箱的原因，所有的 POJO 类属性必须使用包装数据类型
- <span style="color:red">【强制】</span>RPC 方法的返回值和参数必须使用包装数据类型
- <span style="color:yellow">【推荐】</span>所有的局部变量使用基本数据类型
- <span style="color:red">【强制】</span>定义 DO/DTO/VO 等 POJO 类时，不要设定任何属性默认值
- <span style="color:red">【强制】</span>序列化类新增属性时，请不要修改 serialVersionUID 字段，避免反序列失败；如果完全不兼容升级，避免反序列化混乱，那么请修改 serialVersionUID 值
- <span style="color:red">【强制】</span>构造方法里面禁止加入任何业务逻辑，如果有初始化逻辑，请放在 init 方法中
- <span style="color:red">【强制】</span>POJO 类必须写 toString 方法。使用 IDE 中的工具：source> generate toString时，如果继承了另一个 POJO 类，注意在前面加一下 super.toString
- <span style="color:red">【强制】</span>禁止在 POJO 类中，同时存在对应属性 xxx 的 isXxx()和 getXxx()方法
- <span style="color:yellow">【推荐】</span>使用索引访问用 String 的 split 方法得到的数组时，需做最后一个分隔符后有无内容的检查，如果最后一个分隔符并没有内容，那么并不会产生一个空字符串
- <span style="color:yellow">【推荐】</span>当一个类有多个构造方法，或者多个同名方法，这些方法应该按顺序放置在一起，便于阅读
- <span style="color:yellow">【推荐】</span>类内方法定义的顺序依次是：公有方法或保护方法 > 私有方法 > getter / setter方法，此条规则规则的优先级低于上一条
- <span style="color:yellow">【推荐】</span>setter 方法中，参数名称与类成员变量名称一致，this.成员名 = 参数名。在getter/setter 方法中，不要增加业务逻辑，会增加排查问题的难度
- <span style="color:yellow">【推荐】</span>循环体内，字符串的连接方式，使用 StringBuilder 的 append 方法进行替代
- <span style="color:yellow">【推荐】</span>慎用 Object 的 clone 方法来拷贝对象，该方法默认为浅拷贝
- <span style="color:yellow">【推荐】</span>类成员与方法访问控制从严

### 集合处理

- <span style="color:red">【强制】</span>关于 hashCode 和 equals 的处理，遵循如下规则
  -  只要覆写 equals，就必须覆写 hashCode。
  -  因为 Set 存储的是不重复的对象，依据 hashCode 和 equals 进行判断，所以 Set 存储的对象必须覆
写这两个方法。
  -  如果自定义对象作为 Map 的键，那么必须覆写 hashCode 和 equals。
- <span style="color:red">【强制】</span>ArrayList 的 subList 结果不可强转成 ArrayList subList返回的是原来List的一个映射 在subList上所做的修改都会反映到原List
- <span style="color:red">【强制】</span>使用 Map 的方法 keySet() / values() / entrySet() 返回集合对象时，不可以对其进行添加元素操作，否则会抛出 UnsupportedOperationException 异常
- <span style="color:red">【强制】</span>Collections 类返回的对象，如： emptyList() / singletonList() 等都是 immutablelist，不可对其进行添加或者删除元素的操作
- <span style="color:red">【强制】</span>在 subList 场景中，高度注意对原集合元素的增加或删除，均会导致子列表的遍历、增加、删除产生 ConcurrentModificationException 异常
- <span style="color:red">【强制】</span>使用集合转数组的方法，必须使用集合的 toArray(T[] array)，传入的是类型完全一致、长度为 0 的空数组
- <span style="color:red">【强制】</span>在使用 Collection 接口任何实现类的 addAll()方法时，都要对输入的集合参数进行NPE 判断
- <span style="color:red">【强制】</span>使用工具类 Arrays.asList()把数组转换成集合时，不能使用其修改集合相关的方法，它的 add/remove/clear 方法会抛出 UnsupportedOperationException 异常
- <span style="color:red">【强制】</span>使用工具类 Arrays.asList()把数组转换成集合时，不能使用其修改集合相关的方法，它的 add/remove/clear 方法会抛出 UnsupportedOperationException 异常
- <span style="color:red">【强制】</span>泛型通配符 <? extends T> 来接收返回的数据，此写法的泛型集合不能使用 add 方法，而 <? super T> 不能使用 get 方法
- <span style="color:red">【强制】</span>在无泛型限制定义的集合赋值给泛型限制的集合时，在使用集合元素时，需要进行instanceof 判断，避免抛出 ClassCastException 异常
- <span style="color:red">【强制】</span>不要在 foreach 循环里进行元素的 remove/add 操作。remove 元素请使用Iterator 方式，如果并发操作，需要对 Iterator 对象加锁
- <span style="color:red">【强制】</span>在 JDK 7 版本及以上， Comparator 实现类要满足对称性与传递性，不然 Arrays.sort ，Collections.sort 会抛 IllegalArgumentException 异常
- <span style="color:yellow">【推荐】</span>集合泛型定义时，在 JDK7 及以上，使用 diamond 语法或全省略
- <span style="color:yellow">【推荐】</span>集合初始化时，指定集合初始值大小
- <span style="color:yellow">【推荐】</span>使用 entrySet 遍历 Map 类集合 KV ，而不是 keySet 方式进行遍历
- <span style="color:yellow">【推荐】</span>高度注意 Map 类集合 K/V 能不能存储 null 值的情况
- <span style="color:green">【参考】</span>合理利用好集合的有序性(sort)和稳定性(order)，避免集合的无序性(unsort)和不稳定性(unorder)带来的负面影响
- <span style="color:green">【参考】</span>利用 Set 元素唯一的特性，可以快速对一个集合进行去重操作
