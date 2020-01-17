import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class Statistics {
    private static List<File> mdFiles;

    public static void main(String[] args) throws Exception {
        fileCount();
        wordCount();
        lineCount();
    }

    // 统计笔记文件数
    private static void fileCount() {
        var list = getMDFiles();
        System.out.println("md file count:" + list.size());
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
        for (var f : getMDFiles()){
            var fis = new FileInputStream(f);
            String fileContent = new String(fis.readAllBytes()).trim();
            fileContent = fileContent.replaceAll("\n", "");
            wordCount+=fileContent.length();
            fis.close();
        }
        System.out.println("word count:"+wordCount);
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
}