# File类

## 构造方法

- public File(String pathname) ：通过将给定的路径名字符串转换为抽象路径名来创建新的 File实例。
- public File(String parent, String child) ：从父路径名字符串和子路径名字符串创建新的 File实例。
- public File(File parent, String child) ：从父抽象路径名和子路径名字符串创建新的 File实例

## 静态成员变量

![批注 2019-08-03 083724](/assets/批注%202019-08-03%20083724.png)

## 获取

- public String getAbsolutePath() ：返回此File的绝对路径名字符串。
- public String getPath() ：将此File转换为路径名字符串。
- public String getName() ：返回由此File表示的文件或目录的名称。
- public long length() ：返回由此File表示的文件的长度。

## 判断

- public boolean exists() ：此File表示的文件或目录是否实际存在。
- public boolean isDirectory() ：此File表示的是否为目录。
- public boolean isFile() ：此File表示的是否为文件。

## 创建删除

- public boolean createNewFile() ：当且仅当具有该名称的文件尚不存在时，创建一个新的空文件。
- public boolean delete() ：删除由此File表示的文件或目录。
- public boolean mkdir() ：创建由此File表示的目录。
- public boolean mkdirs() ：创建由此File表示的目录，包括任何必需但不存在的父目录。

## 目录遍历

- public String[] list() ：返回一个String数组，表示该File目录中的所有子文件或目录。
- public File[] listFiles() ：返回一个File数组，表示该File目录中的所有的子文件或目录。

## 路径

- 绝对路径
- 相对路径

# 递归

- 直接递归
- 间接递归

# 文件过滤器

- FileFilter
- FileNameFilter

# IO

## 顶级父类

-   | 输入流               | 输出流
--- | ----------------- | ------------------
字节流 | 字节输入流 InputStream | 字节输出流 OutputStream
字符流 | 字符输入流 Reader      | 字符输出流 Writer

## 字节输出流【OutputStream】

- public void close() ：关闭此输出流并释放与此流相关联的任何系统资源。
- public void flush() ：刷新此输出流并强制任何缓冲的输出字节被写出。
- public void write(byte[] b) ：将 b.length字节从指定的字节数组写入此输出流。
- public void write(byte[] b, int off, int len) ：从指定的字节数组写入 len字节，从偏移量 oﬀ开始输 出到此输出流。
- public abstract void write(int b) ：将指定的字节输出流。

## FileOutputStream

```java
FileOutputStream fos = new FileOutputStream("fos.txt");

        for (int i =0;i<100;i++){
            fos.write(("hello"+i+"\n").getBytes());

        }
        fos.flush();
        fos.close();
```

- 数据追加续写

```java
FileOutputStream fos = new FileOutputStream("fos.txt",true);
```

## 字节输入流【InputStream】

- public void close() ：关闭此输入流并释放与此流相关联的任何系统资源。
- public abstract int read() ： 从输入流读取数据的下一个字节。
- public int read(byte[] b) ： 从输入流中读取一些字节数，并将它们存储到字节数组 b中 。

## FileInputStream

### 构造方法

- FileInputStream(File file) ： 通过打开与实际文件的连接来创建一个 FileInputStream ，该文件由文件系 统中的 File对象 ﬁle命名。
- FileInputStream(String name) ： 通过打开与实际文件的连接来创建一个 FileInputStream ，该文件由文件 系统中的路径名 name命名。

```java
FileInputStream fis = new FileInputStream("fos.txt");
        int c = -1;
        while ((c = fis.read()) != -1) {
            System.out.print((char)c);
        }
        fis.close();
```

## 字符流

### Reader

- public void close() ：关闭此流并释放与此流相关联的任何系统资源。
- public int read() ： 从输入流读取一个字符。
- public int read(char[] cbuf) ： 从输入流中读取一些字符，并将它们存储到字符数组 cbuf中 。

### FileReader

```java
FileReader reader = new FileReader("fos.txt");

        int c = -1;
        while ((c = reader.read()) != -1){

            System.out.print((char)c);
        }
```

### Writer

- void write(int c) 写入单个字符。
- void write(char[] cbuf) 写入字符数组。
- abstract void write(char[] cbuf, int off, int len) 写入字符数组的某一部分,oﬀ数组的开始索引,len 写的字符个数。
- void write(String str) 写入字符串。
- void write(String str, int off, int len) 写入字符串的某一部分,oﬀ字符串的开始索引,len写的字符个 数。
- void flush() 刷新该流的缓冲。
- void close() 关闭此流，但要先刷新它。

### FileWriter

```java
        FileWriter writer = new FileWriter("fos.txt");

        writer.append("hh种");
        writer.flush();
        writer.close();
```

- flush与close的区别

## JDK7中IO的异常处理

```java
        // JDK7
        try (FileWriter writer = new FileWriter("fos.txt")) {
            writer.append("hh种");
            writer.flush();
            
        } catch (IOException e) {
            e.printStackTrace();
        }
        // JDK9
        FileWriter writer = new FileWriter("fos.txt");
        try (writer) {
            writer.append("hh种");
            writer.flush();

        } catch (IOException e) {
            e.printStackTrace();
        }
```

# Properties

- public Object setProperty(String key, String value) ： 保存一对属性。 
- public String getProperty(String key) ：使用此属性列表中指定的键搜索属性值。 
- public Set<String> stringPropertyNames() ：所有键的名称的集合。

## 与流相关的方法

- store
- load

# 缓冲流

- 字节缓冲流： BufferedInputStream ， BufferedOutputStream 
- 字符缓冲流： BufferedReader ， BufferedWriter

# 字符集与字符编码

>字符编码 Character Encoding : 就是一套自然语言的字符与二进制数之间的对应规则。 

- 字符集 Charset ：也叫编码表。是一个系统支持的所有字符的集合，包括各国家文字、标点符号、图形符 号、数字等。

![02_转换流的原理](/assets/02_转换流的原理.bmp)

```java
        InputStreamReader reader = new InputStreamReader(new FileInputStream("gbk.txt"),"gbk");

        OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream("utf8.txt"), StandardCharsets.UTF_8);
        int c = -1;
        while ((c= reader.read()) != -1){
            writer.write(c);
        }
        writer.close();
```


# 序列化

- ObjectOutputStream
- ObjectInputStream

```java
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("object"));
        oos.writeObject(new Person("jav",15));

        ObjectInputStream ois = new ObjectInputStream(new FileInputStream("object"));
        Person p = (Person)ois.readObject();
        System.out.println(p);
```

**transient关键字**

# 打印流







