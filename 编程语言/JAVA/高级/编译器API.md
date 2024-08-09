---
tags: ['Java']
---

# 编译器API

- 对.java文件即时编译
- 对字符串即时编译
- 监听编译与错误

`JavaCompiler`

- run方法：调用直接在源代码目录生成class文件，api较为简单
- getTask方法：功能较为强大，支持对内存中的源代码生成class

## 编译文件

```java
JavaCompiler javaCompiler = ToolProvider.getSystemJavaCompiler();
javaCompiler.run(null,null,null,"path");
```

## 编译字符串

```java
private static Class<?> compile(String className, String javaCodes) throws URISyntaxException {

    class JavaSourceFromString extends SimpleJavaFileObject {
        private final String src;

        public JavaSourceFromString(String className, String code) throws URISyntaxException {
            super(URI.create("string:///" + className.replace('.', '/')
                    + ".java"), JavaFileObject.Kind.SOURCE);
            this.src = code;
        }

        public String getCode() {return src;}

        @Override
        public CharSequence getCharContent(boolean ignoreEncodingErrors) {
            return src;
        }
    }

    //将字符串包装为SimpleJavaFileObject对象
    JavaSourceFromString srcObject = new JavaSourceFromString(className, javaCodes);
    System.out.println(srcObject.getCode());
    Iterable<? extends JavaFileObject> fileObjects = Arrays.asList(srcObject);

    JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    StandardJavaFileManager fileManager = compiler.getStandardFileManager(null, null, null);
    DiagnosticCollector<JavaFileObject> diagnosticCollector = new DiagnosticCollector<JavaFileObject>();

    //设置编译的输出目录，并包装在options中
    String flag = "-d";
    String outDir = "";
    try {
        File classPath = new File(Thread.currentThread().getContextClassLoader().getResource("").toURI());
        outDir = classPath.getAbsolutePath() + File.separator;
        System.out.println(outDir);
    } catch (URISyntaxException e1) {
        e1.printStackTrace();
    }
    Iterable<String> options = Arrays.asList(flag, outDir);

    //JavaCompiler.getTask方法：以future的任务形式(多线程)，来执行编译任务

    // 第一个参数：额外输出流，null表示默认使用system.err
    // 第二个参数：文件管理器，null表示编译器标准文件管理器
    // 第三个参数：诊断监听器，null表示使用编译器默认方法来报告诊断信息
    // 第四个参数：编译器参数，null表示无参数
    // 第五个参数：需要经过annotation处理的类名，null表示没有类需要annotation处理
    // 第六个参数：待编译的类

    JavaCompiler.CompilationTask task =
            compiler.getTask(null, fileManager, diagnosticCollector, options, null, fileObjects);

    //等待编译结束
    boolean result = task.call();
    if (result) {
        try {
            return Class.forName(className);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
    else
    {
        //print the Diagnostic's information
        for  (Diagnostic diagnostic : diagnosticCollector
                .getDiagnostics())
        {
            System.out.println("Error on line: "
                    + diagnostic.getLineNumber() + "; URI: "
                    + diagnostic.getSource().toString());
        }
    }
    return null;
}
```

```java
String sourceCode = """
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("hello world");
    }
}
""";
Class<?> klass = compile("HelloWorld", sourceCode);
Method method = klass.getDeclaredMethod("main", String[].class);
method.invoke(null, new Object[]{new String[]{}}); // print hello world
```

## 应用

- JSP编译
- 在线编程
- 自动化构建和测试
