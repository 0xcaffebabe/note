

# Lucene实现全文检索的流程

![](https://img-blog.csdnimg.cn/20190322170318574.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3phaG5namlhbGlhbmc=,size_16,color_FFFFFF,t_70)

# 创建索引库

```java
        // 创建directory指定索引存放位置
        Directory directory = FSDirectory.open(new File("./index").toPath());
        IndexWriter indexWriter = new IndexWriter(directory,new IndexWriterConfig());

        File dir = new File("./res");
        File[] files = dir.listFiles();

        assert files != null;
        // 遍历文件
        for (File file : files) {
            String fileName = file.getName();
            String filePath = file.getPath();
            String content = FileUtils.readFileToString(file, "utf8");
            long fileSize = FileUtils.sizeOf(file);
            
            // 根据文件内容生成成员
            Field fieldName = new TextField("name",fileName, Field.Store.YES);
            Field fieldPath = new TextField("path",filePath,Field.Store.YES);
            Field fieldContent = new TextField("content",content,Field.Store.YES);
            Field fieldSize = new TextField("size", String.valueOf(fileSize),Field.Store.YES);

            // 将成员添加到文档中
            Document document = new Document();
            document.add(fieldName);
            document.add(fieldPath);
            document.add(fieldContent);
            document.add(fieldSize);

            // 将文档写入索引库
            indexWriter.addDocument(document);
        }
        indexWriter.close();
```

# 搜索

```java
        // 创建directory指定索引存放位置
        Directory directory = FSDirectory.open(new File("./index").toPath());

        IndexReader indexReader = DirectoryReader.open(directory);
        IndexSearcher indexSearcher = new IndexSearcher(indexReader);

        Query query = new TermQuery(new Term("content","spring"));
        TopDocs docs = indexSearcher.search(query, 10);

        System.out.println("总记录数:"+docs.totalHits);
        ScoreDoc[] scoreDocs = docs.scoreDocs;
        for (ScoreDoc scoreDoc : scoreDocs) {
            int id = scoreDoc.doc;
            Document document = indexSearcher.doc(id);
            System.out.println(document.get("name"));
            System.out.println(document.get("path"));
            System.out.println(document.get("size"));
//            System.out.println(document.get("content"));
            System.out.println("--------------");
        }
        indexReader.close();
```

# 分析

```java
        Analyzer analyzer = new StandardAnalyzer();

        TokenStream tokenStream = analyzer.tokenStream("", "Learn how to create a web page with Spring MVC.");

        CharTermAttribute charTermAttribute = tokenStream.addAttribute(CharTermAttribute.class);

        tokenStream.reset();

        while (tokenStream.incrementToken()){
            System.out.println(charTermAttribute.toString());
        }
```

## 使用别的分析器

```java
Analyzer analyzer = new IKAnalyzer();
```

# 维护

![批注 2019-09-02 211421](/assets/批注%202019-09-02%20211421.png)

## 删除

```java
        Directory directory = FSDirectory.open(new File("./index").toPath());
        IndexWriter indexWriter = new IndexWriter(directory,new IndexWriterConfig());
        //indexWriter.deleteAll();
        indexWriter.deleteDocuments(new Term("content","name"));
        indexWriter.close();
```

## 更新

```java
indexWriter.updateDocument(new Term("content","name"),document);
```

# QueryParser

