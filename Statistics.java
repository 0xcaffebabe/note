import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.Map.Entry;
import java.util.stream.Collectors;

public class Statistics {
    private static List<File> mdFiles;

    public static void main(String[] args) throws Exception {
        fileCount();
        wordCount();
        lineCount();
        imgFileCount();
        repositorySize();
        codeQuantity();
    }

    // 统计笔记文件数
    private static void fileCount() {
        var list = getMDFiles();
        System.out.println("md 文件数:" + list.size());
    }

    // 统计行数
    private static void lineCount() throws IOException {
        var list = getMDFiles();
        long totalCount = 0, realCount = 0, blankCount = 0;

        for (var f : list) {
            var fis = new FileInputStream(f);
            String fileContent = new String(fis.readAllBytes()).trim();

            for (var s : fileContent.split("\n")) {
                if (s == null || "".equals(s)) {
                    blankCount++;
                } else {
                    realCount++;
                }
                totalCount++;
            }

            fis.close();
        }
        System.out.println(
                "note line total count:" + totalCount + ", real count:" + realCount + ", blank count:" + blankCount);
    }

    // 统计字数
    private static void wordCount() throws IOException {
        long wordCount = 0;
        for (var f : getMDFiles()) {
            var fis = new FileInputStream(f);
            String fileContent = new String(fis.readAllBytes()).trim();
            fileContent = fileContent.replaceAll("\n", "");
            wordCount += fileContent.length();
            fis.close();
        }
        System.out.println("word count:" + wordCount);
    }

    // 统计图片数
    private static void imgFileCount() {
        System.out.println("image count:" + listFiles(new File("./assets")).stream().count());
    }

    // 统计仓库容量
    private static void repositorySize() {
        long size = 0;
        List<File> list = listFiles(new File("./"));
        for (var f : list) {
            size += f.length();
        }
        DecimalFormat df = new DecimalFormat("0.00");
        System.out.println("repository size:" + df.format(size / 1024.0 / 1024.0) + "MB");
    }

    // 统计代码占比
    private static void codeQuantity() {
        Map<String, Integer> map = new TreeMap<>();

        for (var f : getMDFiles()) {
            var str = file2String(f);
            String[] result = str.split("\n");
            for (var s : result) {
                if (s.contains("```")) {
                    s = s.replaceAll("```", "");
                    s = s.trim();

                    if (s.length() > 0 && s.length() < 10) {
                        Integer integer = map.get(s);
                        if (integer == null) {
                            map.put(s, 1);
                        } else {
                            map.put(s, integer + 1);
                        }
                    }
                }
            }

        }
        List<Entry<String, Integer>> list = new ArrayList<>(map.entrySet());
        Collections.sort(list, new Comparator<Map.Entry<String, Integer>>() {
            @Override
            public int compare(Entry<String, Integer> o1, Entry<String, Integer> o2) {
                return o2.getValue().compareTo(o1.getValue());
            }
        });
        System.out.print("code quantity:");
        for (Entry<String, Integer> e : list) {
            System.out.print(e.getKey() + ":" + e.getValue() + ", ");
        }
        System.out.println();

    }

    private static List<File> getMDFiles() {
        if (mdFiles != null) {
            return mdFiles;
        } else {
            File file = new File("./");
            List<File> list = listFiles(file);
            mdFiles = list.stream().filter(f -> f.getName().endsWith(".md")).collect(Collectors.toList());
            return mdFiles;
        }

    }

    private static List<File> listFiles(File file) {
        File[] files = file.listFiles();
        List<File> ret = new ArrayList<>();
        for (File f : files) {
            if (f.isDirectory()) {
                List<File> fileList = listFiles(f);
                ret.addAll(fileList);
            } else {
                ret.add(f);
            }
        }
        return ret;
    }

    private static String file2String(File file) {

        try (FileInputStream fis = new FileInputStream(file)) {
            String str = new String(fis.readAllBytes());
            return str;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }
}
