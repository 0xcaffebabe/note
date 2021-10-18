# JUint

## 4

- 白盒测试
- 黑盒测试

```java
    @Test
    public void test(){
        Assert.assertEquals(1,1);
    }
```

- @Before
- @After

## 5

组成：

- JUint Platform 用于在JVM上启动测试框架
- JUint Jupiter 5版本的全新编程模型与扩展机制
- JUint Vintage 兼容3和4

注解                 | 释义
------------------ | ----------------------------------------------------------------------------------------------------------------
@Test              | 注明一个方法是测试方法，JUnit 框架会在测试阶段自动找出所有使用该注解标明的测试方法并运行。需要注意的是，在JUnit5版本中，取消了该注解的timeout参数的支持
@TestFactory       | 注明一个方法是基于数据驱动的动态测试数据源
@ParameterizedTest | 注明一个方法是测试方法，这一点同@Test注解作用一样。此外，该注解还可以让一个测试方法使用不同的入参运行多次
@RepeatedTest      | 从字面意思就可以看出，这个注释可以让测试方法自定义重复运行次数
@BeforeEach        | 与JUnit4中的@Before类似，可以在每一个测试方法运行前， 都运行个指定的方法。在JUnit5中，除了运行@Test注解的方法，还额外支持运行@ParameterizedTest和@RepeatedTest注解的方法
@AfterEach         | 与JUnit4中的@Afer类似，可以在每一个测试方法运行后，都运行一个指定的方法。在JUnit5中，除了运行@Test注解的方法，还额外支持运行@ParameterizedTest 和@ RepeatedTest注解的方法
@BeforeAll         | 与JUni4中的@BeforeClass 类似，可以在每一个测试类运行前，都运行一个指定的方法
@AfterAll          | 与JUnit4中的@AfterClass 类似，可以在每一个测试类运行后， 都运行一个指定的方法
@Disabled          | 与JUnit4中的@lgnore 类似，注明一个测试的类或方法不再运行
@Nested            | 为测试添加嵌套层级，以便组织用例结构
@Tag               | 为测试类或方法添加标签，以便有选择性地执行

命名：

shoud...when...

流式断言：

AssertJ
