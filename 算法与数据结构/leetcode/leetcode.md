# leetcode

## 两数之和

给定一个整数数组 nums 和一个目标值 target，请你在该数组中找出和为目标值的那两个整数，并返回他们的数组下标。

你可以假设每种输入只会对应一个答案。但是，数组中同一个元素不能使用两遍

>给定 nums = [2, 7, 11, 15], target = 9
>
>因为 nums[0] + nums[1] = 2 + 7 = 9
>所以返回 [0, 1]


- 解法1

暴力求解，双重循环求得数组的两个项等于target的组合

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        int[] ret =new int[2];
        for(int i=0;i<nums.length;i++){
            for(int j=i;j<nums.length;j++){
                if(nums[i]+nums[j]==target
                  && i!=j){
                    ret[0]=i;
                    ret[1]=j;
                    return ret;
                }
            }
        }
        return ret;
    }
}
```
耗时:60-100ms

- 解法2

使用map存储(target-数组的item,index)
遍历数组，根据数组的item查找到index，
如果找到的index不与当前遍历的index相同，
则结果就是当前的index与查找的index

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        int[] result = new int[2];
        Map<Integer,Integer> map = new HashMap<>();
        for (int i=0;i<nums.length;i++){
            map.put(target-nums[i],i);
        }
        for (int i=0;i<nums.length;i++){
            Integer i1 = map.get(nums[i]);
            if (i1 == null || i == i1) {
                continue;
            }
            if (nums[i] + nums[i1] == target){
                return new int[]{i,i1};
            }
        }
        return result;
    }
}
```

耗时:3-4ms

## 翻转32位整数

123 -> 321

- 解法1

转换成字符串翻转

```java
class Solution {
    public int reverse(int x) {
       boolean f = false;
        if (x<0){
            f=true;

        }
        long l = x;
        String s = String.valueOf(l);

        StringBuilder sb = new StringBuilder();
        for(int i =s.length()-1;i>=0;i--){
            sb.append(s.charAt(i));
        }
        if (sb.toString().charAt(sb.length()-1) == '-'){
            sb = sb.replace(sb.length()-1,sb.length(),"");
        }
        long ret = Long.parseLong(sb.toString());
        if (f){
            ret = -ret;
        }
        if (ret > Integer.MAX_VALUE || ret <Integer.MIN_VALUE){
            return 0;
        }
        return (int) ret;
    }
}
```

耗时：28ms

- 解法2

将这个数通过区域拆解成n个个位数
再倒序n个个位数相加

```java
class Solution {
    public int reverse(int x) {
        int i;
        long result = 0;
        LinkedList<Integer> list = new LinkedList<>();
        long f =1;
        while (x!=0){
            i = x%10;
            x/=10;
            if (x!=0){
                f*=10;
            }
            list.offer(i);
        }
        while(list.size() != 0){
            result +=list.poll()*f;
            f/=10;
        }
        // 判断溢出
        return (int)result == result ? (int)result:0;
    }
}
```

使用队列解决正序转倒序问题

耗时：3ms

## 判断回文数

判断一个整数是否是回文数。回文数是指正序（从左向右）和倒序（从右向左）读都是一样的整数

- 解法1

转为字符串，生成该字符串的倒序字符串，进行判断

```java
class Solution {
    public boolean isPalindrome(int x) {
        String s = String.valueOf(x);
        StringBuilder sb = new StringBuilder();
        for (int i=s.length()-1;i>=0;i--){
            sb.append(s.charAt(i));
        }
        if (sb.toString().equals(s)){
            return true;
        }
        return false;
    }
}
```

耗时：146ms

- 解法2

过滤负数，逐一拆分为n个个位数倒序加入队列
将队列元素出队，还原为倒序的整数，判断是否相等

```java
class Solution {
    public boolean isPalindrome(int x) {
        int x1 = x;
        if (x<0) {
            return false;
        }
        LinkedList<Integer> queue = new LinkedList<>();
        int f =1;
        while(x !=0){
            queue.add(x%10);
            x = x/10;
            if (x != 0) {
                f *=10;
            }
        }
        int ret = 0;
        while (queue.size()!=0) {
            ret+=queue.poll()*f;
            f/=10;
        }
        return ret == x1;
    }
}
```

耗时：13ms

## 罗马数字转整数

V -> 5
IV -> 4

准备(字符,整数)，从下表1-结束扫描字符串
找到罗马字符代表的整数，
如果当前扫码的罗马字符比index-1的罗马字符还要小，
    则将该罗马字符代表的整数累加到结果
    否则减去两倍index-1位置的值（因为你前已经加了一遍）

```java
import java.util.*;
class Solution {
    public int romanToInt(String s) {
        Map<Character,Integer> map = new HashMap<>();
        map.put('I',1);
        map.put('V',5);
        map.put('X',10);
        map.put('L',50);
        map.put('C',100);
        map.put('D',500);
        map.put('M',1000);
        int ret = 0;
        for(int i =0;i<s.length();i++){
            char c = s.charAt(i);
            if (i<1){
                ret +=map.get(c);
            }else{
                int current = map.get(c);
                int previous = map.get(s.charAt(i-1));
                ret += current;
                if (current > previous){
                    ret -=2*previous;
                }
            }
        }
        return ret;
    }
}
```

耗时：8ms

## 字符串数组最长公共前缀

- 暴力解法

取字符串数组第一个作为src
分别求得src的所有前缀
判断数组其他项是否都有这个前缀，如果没有，最长前缀及当前src的前缀

```java
class Solution {
    public String longestCommonPrefix(String[] strs) {
        if (strs.length == 0) {
            return "";
        }
        String prefix = "";
        String src = strs[0];
        for (int i =0;i<=src.length();i++){
            String tmpPrefix = src.substring(0,i);
            boolean f = false;
            for (String s : strs){
                if (!s.startsWith(tmpPrefix)){
                    f = true;
                    break;
                }
            }
            if (!f) {
                prefix = tmpPrefix;
            }else {
                // flag为true，代表当前tmpPrefix是最长前缀，跳出循环，避免没有意义的循环
                break;
            }
        }
        return prefix;
    }
}
```

耗时：4ms

## 括号匹配问题

输入"()" -> true "[)" -> false

- 使用栈

左括号是入栈，右括号出栈
如果发现出栈的与入栈不匹配，则不匹配
或者发现输入右括号时，栈为空，也是不匹配
字符串扫描完成时，栈为空，表明匹配

```java
class Solution {
    public boolean isValid(String s) {
        LinkedList<Character> stack = new LinkedList<>();
        Map<Character,Character> map = new HashMap<>();
        map.put('{','}');
        map.put('[',']');
        map.put('(',')');
        for (int i=0;i<s.length();i++){
            char c = s.charAt(i);
            if (c == '{' || c == '(' || c == '[') {
                stack.push(c);
            }else {
                if (stack.size() == 0) {
                    return false;
                }
                if (c !=map.get(stack.pop())){
                    return false;
                }
            }
        }
        return stack.size() == 0;
    }
}
```

耗时：2ms

## 合并两个有序链表

输入：1->2->4, 1->3->4
输出：1->1->2->3->4->4

- 解法

当两个指针都不为空时，则判断哪个指针的值比较小，
将较小的值存入结果，结果的指针与比较小的指针后移

如果只有一个指针不为空，则不断对该指针存入结果，并且将结果与该指针后移

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
class Solution {
    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
        if (l1 == null && l2 == null) {
            return null;
        }
        ListNode node = new ListNode();
        ListNode ret = node;
        while(l1 != null && l2 != null) {
            if (l1.val < l2.val) {
                node.val = l1.val;
                l1 = l1.next;
            }else {
                node.val = l2.val;
                l2 = l2.next;
            }
            node.next = new ListNode();
            node = node.next;
        }
        ListNode tl = null;
        if (l1 == null) {
           tl = l2;
        } else if (l2 == null) {
            tl = l1;
        }
        while (tl != null) {
            node.val = tl.val;
            tl = tl.next;
            if (tl != null) {
                node.next = new ListNode();
                node = node.next;
            }
        }
        return ret;
    }
}
```

耗时：1ms

## 删除排序数组中的重复项

给定数组 nums = [1,1,2], 

函数应该返回新的长度 2, 并且原数组 nums 的前两个元素被修改为 1, 2。 

- 解法1

从左向右扫描数组
如果发现被扫描元素等于左边元素
则将该元素往后的所有元素往前移动一位

```java
class Solution {
    public int removeDuplicates(int[] nums) {
        int length = nums.length;
        for (int i=1;i<length;i++){
            
            if (nums[i-1] == nums[i]){
                for(int j=i;j<length;j++){
                    nums[j-1]=nums[j];
                }
                i--;
                length--;
            }
        }
        return length;
    }
}
```

耗时：86ms

- 解法2

双指针解法
定义一个指针i，默认指向0
从1-n扫描数组，如果发现右边不等于左边
则i++，然后让数组i的位置内容替换为扫描位置的内容

由于i代表的是下标，所以最后需要i+1转为长度

```java
class Solution {
    public int removeDuplicates(int[] nums) {
        if (nums.length == 0) return 0;
        int i = 0;
        for (int j = 1; j < nums.length; j++) {
            if (nums[j] != nums[i]) {
                i++;
                nums[i] = nums[j];
            }
        }
        return i + 1;
    }
}
```

耗时：1ms

## 移除元素

给定 nums = [3,2,2,3], val = 3,

函数应该返回新的长度 2, 并且 nums 中的前两个元素均为 2。

你不需要考虑数组中超出新长度后面的元素

- 解法1

这道题跟上一道题很像，同样可以扫描元素，等于val时就将后面的元素全部向前移动一位

耗时：5ms

- 解法2

维护一个指针i=0
从左向右扫描元素，如果发现扫描的值不等于要被移除的值
则将扫描的值转移到数组i的位置，然后i向后移动一位

```java
class Solution {
    public int removeElement(int[] nums, int val) {
        int i = 0;
        for (int j=0; j < nums.length; j++) {
            if (nums[j] != val) {
                nums[i]=nums[j];
                i++;
            }
        }
        return i;
    }
}
```

耗时：0ms

## IP地址无效化

给你一个有效的 IPv4 地址 address，返回这个 IP 地址的无效化版本。
所谓无效化 IP 地址，其实就是用 "[.]" 代替了每个 "."。

- 解法

从左至右扫描字符，遇到“.”就改为"[.]"否则原样输出

为了效率，这里使用了StringBuffer

```java
class Solution {
    public String defangIPaddr(String address) {
        StringBuffer sb = new StringBuffer();
        for(int i =0;i<address.length();i++){
            char c = address.charAt(i);
            if (c != '.'){
                sb.append(c);
            }else{
                sb.append("[.]");
            }
        }
        return sb.toString();
    }
}
```

## 合并两个有序数组

输入:
nums1 = [1,2,3,0,0,0], m = 3
nums2 = [2,5,6],       n = 3

输出: [1,2,2,3,5,6]

```java

```

跟合并两个有序链表类似

```java
class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
        LinkedList<Integer> list1 = new LinkedList<>();
        for (int i=0;i<m;i++) {
            list1.add(nums1[i]);
        }
        LinkedList<Integer> list2 = new LinkedList<>();
        for (int i=0;i<n;i++) {
            list2.add(nums2[i]);
        }
        int index = 0;
        while (!list1.isEmpty() && !list2.isEmpty()){
            int i = list1.peek();
            int j = list2.peek();
            if (i<j){
                nums1[index++] = i;
                list1.remove();
            }else {
                nums1[index++] = j;
                list2.remove();
            }
        }
        LinkedList<Integer> list;
        if (list1.isEmpty()){
            list=list2;
        }else {
            list = list1;
        }
        while(!list.isEmpty()){
            nums1[index++]=list.remove();
        }
    }
}
```

耗时：2ms

## 最后一个单词的长度

<https://leetcode-cn.com/problems/length-of-last-word/>

输入: "Hello World"
输出: 5

- 解法

从后往前扫描文本
发现字符为非空格，长度+1
发现字符是空格，并且长度不等于0，则已经查找到最后一个单词的长度

```java
class Solution {
    public int lengthOfLastWord(String s) {
        int length =0;
        for (int i=s.length()-1;i>=0;i--){
            if (s.charAt(i) == ' ' && length != 0) {
                break;
            }else if (s.charAt(i) != ' '){
                length ++;
            }
        }
        return length;
    }
}
```

耗时：0ms

## 删除排序链表中的重复元素

<https://leetcode-cn.com/problems/remove-duplicates-from-sorted-list/>

给定一个排序链表，删除所有重复的元素，使得每个元素只出现一次

- 解法

遍历链表，如果发现当前节点等于后继节点，则将当前节点的后继修改为后继节点的后继
当当前节点或者后继节点为null，停止遍历

```java
class Solution {
    public ListNode deleteDuplicates(ListNode head) {
        ListNode origin = head;
        while(head != null && head.next != null) {
            if (head.val == head.next.val) {
                head.next = head.next.next;
                continue;
            }
            head = head.next;
        }
        return origin;
    }
}
```

耗时：0ms