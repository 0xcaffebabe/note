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

## 相同的树

给定两个二叉树，编写一个函数来检验它们是否相同

<https://leetcode-cn.com/problems/same-tree/>

- 解法

对两棵树做前序遍历，结果存到两个list，比较两个lsit即可
需要注意的是，需要特别处理左树为空，但右树不为空的情况

```java
class Solution {
    public boolean isSameTree(TreeNode p, TreeNode q) {
        ArrayList<Integer> list1 = new ArrayList<>();
        ArrayList<Integer> list2 = new ArrayList<>();
        preWalk(p,list1);
        preWalk(q,list2);
        return list1.equals(list2);
    }
    public void preWalk(TreeNode p, List<Integer> list){
        if (p == null){
            return ;
        }
        list.add(p.val);
        if (p.left == null && p.right != null) {
            list.add(null);
        }
        preWalk(p.left,list);
        preWalk(p.right,list);
    }
}
```

耗时:0ms

## 二叉树的最大深度

给定一个二叉树，找出其最大深度。

<https://leetcode-cn.com/problems/maximum-depth-of-binary-tree/>

- 解法

同上题，传入根节点，如果根节点为空，返回0
否则i++
接下来递归获取左右子树的深度，获取最大深度，累加到i即可

```java
class Solution {
    public int maxDepth(TreeNode root) {
        return getDepth(root,0);
    }
    public int getDepth(TreeNode root,int i) {
        if (root == null) {
            return 0;
        }
        i++;
        int left = getDepth(root.left,0);
        int right = getDepth(root.right,0);
        if (left > right) {
            return i + left;
        }else {
            return i + right;
        }
    }
}
```

耗时：0ms

## 求1+2+…+n

求 1+2+...+n ，要求不能使用乘除法、for、while、if、else、switch、case等关键字及条件判断语句（A?B:C）。

<https://leetcode-cn.com/problems/qiu-12n-lcof/>

- 解法

等差数列求和公式

```java
return (n+1)*n/2;
```

## 验证回文串

给定一个字符串，验证它是否是回文串，只考虑字母和数字字符，可以忽略字母的大小写

<https://leetcode-cn.com/problems/valid-palindrome/>

- 解法

类似于前面的验证回文数字，分别正序与逆序将字符串入栈，比较两个栈

```java
class Solution {
    public boolean isPalindrome(String s) {
        s = s.toLowerCase();
        LinkedList<Character> stack1 = new LinkedList<>();
        LinkedList<Character> stack2 = new LinkedList<>();
        for (int i=s.length()-1;i>=0;i--){
            char c =s.charAt(i);
            if ((c >=48 && c <=57) || (c >=97 && c <=122)){
                stack1.addLast(c);
                stack2.addFirst(c);
            }
        }
        return stack1.equals(stack2);
    }
}
```

## 环形链表

给定一个链表，判断链表中是否有环。

<https://leetcode-cn.com/problems/linked-list-cycle/>

- 解法

使用map存储遍历过的node
对List进行遍历，发现存在过的node即存在环

```java
public class Solution {
    public boolean hasCycle(ListNode head) {
        Map<ListNode,Boolean> map = new HashMap();
        while(head != null){
            if (map.containsKey(head)){
                return true;
            }
            map.put(head,true);
            head = head.next;
        }
        return false;
    }
}
```

耗时：5ms

## 二叉树的层次遍历

给定一个二叉树，返回其节点值自底向上的层次遍历。 （即按从叶子节点所在层到根节点所在的层，逐层从左向右遍历）

<https://leetcode-cn.com/problems/binary-tree-level-order-traversal-ii/>

- 解法

对树做前序遍历，将结果写到list里，再对list进行reverse

```java
class Solution {
    public List<List<Integer>> levelOrderBottom(TreeNode root) {
        ArrayList<List<Integer>> list = new ArrayList<>();
        walk(root,list,0);
        Collections.reverse(list);
        return list;
    }
    public void walk(TreeNode root,ArrayList<List<Integer>> list,int p) {
        if (root == null) {
            return;
        }
        if (list.size()<=p) {
            list.add(p,new ArrayList<>());
        }
        list.get(p).add(root.val);
        walk(root.left,list,p+1);
        walk(root.right,list,p+1);
    }
}
```

耗时：1ms

## 一维数组的动态和

输入：nums = [1,2,3,4]
输出：[1,3,6,10]
解释：动态和计算过程为 [1, 1+2, 1+2+3, 1+2+3+4] 。

<https://leetcode-cn.com/problems/running-sum-of-1d-array/>

- 解法

求出nums的和，设置ret的最后一个元素为sum

遍历ret数组倒数第二个至第一个，ret元素内容为后一个下标元素-nums对应的数

```java
class Solution {
    public int[] runningSum(int[] nums) {
        if (nums.length == 0) {
            return new int[]{};
        }
        int[] ret = new int[nums.length];
        int sum = 0;
        for (int i:nums){
            sum+=i;
        }
        ret[ret.length-1]=sum;
        for(int i=nums.length-2;i>=0;i--){
            ret[i] = ret[i+1]-nums[i+1];
        }
        return ret;
    }
}
```

## 斐波那契数

给定 N，计算 F(N)。

<https://leetcode-cn.com/problems/fibonacci-number/submissions/>

- 解法1

递归

```java
class Solution {
    public int fib(int N) {
        if (N == 0 || N == 1) {
            return N;
        }
        return fib(N-1) + fib(N-2);
    }
}
```

耗时:9ms

- 解法2

使用缓存避免重复的计算

```java
class Solution {
    private int[] cache = new int[100];
    public int fib(int N) {
        return fib0(N);
    }
    private int fib0(int N){
        if (N == 0 || N == 1) {
            return N;
        }
        if (cache[N] == 0){
            cache[N] = fib1(N);
        }
        return cache[N];
    }
     private int fib1(int N){
        if (N == 0 || N == 1) {
            return N;
        }
        return fib0(N-1) + fib0(N-2);
    }
}
```

耗时:0ms

## 反转字符串

<https://leetcode-cn.com/problems/reverse-string/>

使用前后双指针 两个指针往中间靠 交换元素

```java
class Solution {
    public void reverseString(char[] s) {
        if (s.length <=1) return;
        int l=0,r=s.length-1;
        while(l<r){
            char tmp = s[l];
            s[l]=s[r];
            s[r]=tmp;
            l++;r--;
        }
    }
}
```

## 只出现一次的数字

<https://leetcode-cn.com/problems/single-number/>

使用异或去除相同数字

```java
class Solution {
    public int singleNumber(int[] nums) {
        int base = nums[0];
        for(int i=1;i<nums.length;i++){
            base = base^nums[i];
        }
        return base;
    }
}
```

耗时:1ms

## 完全平方数

<https://leetcode-cn.com/problems/valid-perfect-square/submissions/>

- 从1扫描到num/2+1 每次递增1

```java
class Solution {
    public boolean isPerfectSquare(int num) {
        int N = num/2+1;
        for (int i=1;i<=N;i++){
            if (i*i == num){
                return true;
            }
        }
        return false;
    }
}
```

耗时:1449ms

## 两数之和

<https://leetcode-cn.com/problems/sum-of-two-integers/submissions/>

```java
class Solution {
    public int getSum(int a, int b) {
        if (b >0){
            while(b>0){
                a++;
                b--;
            }
        }else if (b<0){
            while(b<0){
                a--;
                b++;
            }
        }
        return a;
    }
}
```

耗时:946

## 猜数字大小

<https://leetcode-cn.com/problems/guess-number-higher-or-lower/submissions/>

```java
public class Solution extends GuessGame {
    public int guessNumber(int n) {
        int low = 1;
        int high = n;
        while(low <= high){
            int mid = low+(high-low)/2;
            int ret = guess(mid);
            if (ret == 0){
                return mid;
            }else if (ret == 1){
                low = mid+1;
            }else {
                high = mid-1;
            }
        }
        return -1;
    }
}
```

## 多数元素

<https://leetcode-cn.com/problems/majority-element/submissions/>

```java
class Solution {
    public int majorityElement(int[] nums) {
        int n = nums.length/2;
        Map<Integer,Integer> map = new HashMap<>();
        for(int i :nums){
            if (map.containsKey(i)){
                map.put(i,map.get(i)+1);
            }else{
                map.put(i,1);
            }
        }
        for(int i:map.keySet()){
            if (map.get(i)>n){
                return i;
            }
        }
        return -1;
    }
}
```

耗时：16ms

## 路径总和

<https://leetcode-cn.com/problems/path-sum/submissions/>

```java
class Solution {
    public boolean hasPathSum(TreeNode root, int sum) {
        if (root == null){
            return false;
        }
        if (root.left == null && root.right == null){
            return root.val == sum;
        }else if(root.left == null){
            return hasPathSum(root.right,sum-root.val);
        }else if(root.right == null){
            return hasPathSum(root.left,sum-root.val);
        }else {
            return hasPathSum(root.right,sum-root.val) || 
                    hasPathSum(root.left,sum-root.val);
        }
    }
}
```

耗时:0

## 魔术索引

<https://leetcode-cn.com/problems/magic-index-lcci/submissions/>

```java
class Solution {
    public int findMagicIndex(int[] nums) {
        for(int i=0;i<nums.length;i++){
            if (nums[i] == i){
                return nums[i];
            }
        }
        return -1;
    }
}
```

耗时:1

## 左叶子之和

<https://leetcode-cn.com/problems/sum-of-left-leaves/submissions/>

```java
class Solution {
    public int sumOfLeftLeaves(TreeNode root) {
        return sum(root,false);
    }
    public int sum(TreeNode root,boolean isLeft){
        if (root == null){
            return 0;
        }
        if (root.left == null && root.right == null){
            if (isLeft){
                return root.val;
            }else {
                return 0;
            }
        }
        return sum(root.left,true)+sum(root.right,false);
    }
}
```

耗时:0

## 汉明距离

<https://leetcode-cn.com/problems/hamming-distance/submissions/>

```java
class Solution {
    public int hammingDistance(int x, int y) {
        // 异或：相同为0 不同为1
        int z = x^y;
        int ret = 0;
        // 计算二进制有多少1
        while(z!=0){
            int t = z%2;
            z/=2;
            if (t == 1){
                ret++;
            }
        }
        return ret;
    }
}
```

耗时：0

## 从尾到头打印链表

<https://leetcode-cn.com/problems/cong-wei-dao-tou-da-yin-lian-biao-lcof>

```java
class Solution {
    public int[] reversePrint(ListNode head) {
        List<Integer> list = new ArrayList<>();
        walk(head,list);
        int [] ret = new int[list.size()];
        for (int i=0;i<ret.length;i++){
            ret[i]=list.get(i);
        }
        return ret;
    }
    private void walk(ListNode head,List<Integer> list){
        if (head == null){
            return;
        }
        walk(head.next,list);
        list.add(head.val);
    }
}
```

耗时：1

## Excel 表列序号

<https://leetcode-cn.com/problems/excel-sheet-column-number/submissions/>

```java
class Solution {
    public int titleToNumber(String s) {
        int ret = 0;
        int N = s.length();
        for(int i=0;i<N;i++){
            char c = s.charAt(i);
            int val = c-64;
            double t =Math.pow(26,N-i-1);
            ret+=val*t;
        }
        return ret;
    }
}
```

耗时：2

## 二叉树的最小深度

<https://leetcode-cn.com/problems/minimum-depth-of-binary-tree/submissions/>

```java
class Solution {
    public int minDepth(TreeNode root) {
        if (root == null) return 0;
        if (root.left == null && root.right == null) return 1;
        int l = minDepth(root.left)+1;
        int r = minDepth(root.right)+1;
        if (root.left == null || root.right == null){
            return Math.max(l,r);
        }else{
            return Math.min(l,r);
        }
    }
}
```

耗时：0

## 移动零

<https://leetcode-cn.com/problems/move-zeroes/submissions/>

```java
class Solution {
    public void moveZeroes(int[] nums) {
        int numOf0 = 0;
        int passOf0 =0;
        for(int i=0;i<nums.length;i++){
            if (nums[i] == 0) numOf0++;
        }
        for(int i=0;i<nums.length;i++){
            if (nums[i]==0){
                passOf0++;
            }else{
                // 如果当前数不为0并且已经过的0个数不为0
                if (passOf0 != 0){
                    // 当前数向左移动passOf0
                    nums[i-passOf0] = nums[i];
                }
            }
        }
        for(int i=nums.length-1;i>=nums.length-numOf0;i--){
            nums[i]=0;
        }
    }
}
```

耗时：0

## 剑指 Offer 22. 链表中倒数第k个节点

<https://leetcode-cn.com/problems/lian-biao-zhong-dao-shu-di-kge-jie-dian-lcof/>

递归到尾不断对计数器+1 判断计数器等于目标值 就返回当前遍历节点

```java
class Solution {

    private ListNode ret;

    public ListNode getKthFromEnd(ListNode head, int k) {
        getKthFromEnd0(head,k,new int[]{0});
        return ret;
    }
    private void getKthFromEnd0(ListNode head, int k,int[] arr) {
        if (head == null){
            return;
        }
        getKthFromEnd0(head.next,k,arr);
        arr[0]=arr[0]+1;
        if (arr[0] == k){
            ret = head;
        }
    }
}
```

耗时：0

## LCP 06. 拿硬币

<https://leetcode-cn.com/problems/na-ying-bi/>

```java
class Solution {
    public int minCount(int[] coins) {
        int count = 0;
        for (int i:coins){
            count+=i/2;
            if (i % 2!= 0){
                count+=1;
            }
        }
        return count;
    }
}
```

耗时:0

## 剑指 Offer 50. 第一个只出现一次的字符

<https://leetcode-cn.com/problems/di-yi-ge-zhi-chu-xian-yi-ci-de-zi-fu-lcof/>

```java
class Solution {
    public char firstUniqChar(String s) {
        int[] map = new int[128];
        for(char c : s.toCharArray()){
            map[c] = map[c] + 1;
        }
        for(int i=0;i<s.length();i++){
            char c = s.charAt(i);
            if (map[c] == 1){
                return c;
            }
        }
        return ' ';
    }
}
```

耗时：6

## 1486. 数组异或操作

<https://leetcode-cn.com/problems/xor-operation-in-an-array/>

```java
class Solution {
    public int xorOperation(int n, int start) {
        int ret=start;
        for(int i=1;i<n;i++){
            ret=ret^(start+2*i);
        }
        return ret;
    }
}
```

耗时：0

## 剑指 Offer 58 - II. 左旋转字符串

<https://leetcode-cn.com/problems/zuo-xuan-zhuan-zi-fu-chuan-lcof/submissions/>

```java
class Solution {
    public String reverseLeftWords(String s, int n) {
        StringBuffer sb = new StringBuffer();
        for(int i = n;i<s.length();i++){
            sb.append(s.charAt(i));
        }
        for(int i=0;i<n;i++){
            sb.append(s.charAt(i));
        }
        return sb.toString();
    }
}
```

耗时：5

## 剑指 Offer 53 - II. 0～n-1中缺失的数字

<https://leetcode-cn.com/problems/que-shi-de-shu-zi-lcof/submissions/>

```java
class Solution {
    public int missingNumber(int[] nums) {
        int ret = nums[nums.length-1];
        for(int i=0;i<ret;i++){
            if (nums[i] != i) return i;
        }
        return ret+1;
    }
}
```

耗时：0

## 剑指 Offer 05. 替换空格

<https://leetcode-cn.com/problems/ti-huan-kong-ge-lcof/>

```java
class Solution {
    public String replaceSpace(String s) {
        StringBuffer sb = new StringBuffer();
        for(int i=0;i<s.length();i++){
            char c = s.charAt(i);
            if (c == ' '){
                sb.append("%20");
            }else{
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
```

耗时：0

## 剑指 Offer 03. 数组中重复的数字

<https://leetcode-cn.com/problems/shu-zu-zhong-zhong-fu-de-shu-zi-lcof/>

```java
class Solution {
    public int findRepeatNumber(int[] nums) {
        int[] map = new int[nums.length];
        for(int i:nums){
            map[i] = map[i] + 1;
        }
        for(int i=0;i<map.length;i++){
            if (map[i]>1){
                return i;
            }
        }
        return -1;
    }
}
```

耗时：1

## 剑指 Offer 17. 打印从1到最大的n位数

<https://leetcode-cn.com/problems/da-yin-cong-1dao-zui-da-de-nwei-shu-lcof/>

```java
class Solution {
    public int[] printNumbers(int n) {
        if (n == 0) return new int[]{};
        int[] ret = new int[(int)Math.pow(10,n)-1];
        for(int i=0;i<ret.length;i++){
            ret[i]=i+1;
        }
        return ret;
    }
}
```

耗时：1

## 有效的字母异位词

<https://leetcode-cn.com/problems/valid-anagram/>

```java
class Solution {
    public boolean isAnagram(String s, String t) {
        int[] map1 = new int[128];
        int[] map2 = new int[128];
        for(int i=0;i<s.length();i++){
            char c = s.charAt(i);
            map1[c] = map1[c] + 1;
        }
        for(int i=0;i<t.length();i++){
            char c = t.charAt(i);
            map2[c] = map2[c] + 1;
        }
        for(int i=0;i<map1.length;i++){
            if (map1[i] != map2[i]) {
                return false;
            }
        }
        return true;
    }
}
```

耗时：4

## 二叉树的中序遍历

<https://leetcode-cn.com/problems/binary-tree-inorder-traversal/>

```java
class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> list = new ArrayList<>();
        walk(root, list);
        return list;
    }
    private void walk(TreeNode root, List<Integer> list){
        if (root == null) return;
        walk(root.left, list);
        list.add(root.val);
        walk(root.right, list);
    }
}
```

耗时：0

## 反转链表

<https://leetcode-cn.com/problems/reverse-linked-list/>

```java
class Solution {
    public ListNode reverseList(ListNode head) {
        if (head == null) return null;
        LinkedList<Integer> stack = new LinkedList<>();
        while(head != null){
            stack.push(head.val);
            head = head.next;
        }
        ListNode root = new ListNode();
        ListNode origin = root;
        while(!stack.isEmpty()){
            root.val = stack.pop();
            if (!stack.isEmpty()){
                root.next = new ListNode();
                root = root.next;
            }
        }
        return origin;
    }
}
```

耗时：0

## 226. 翻转二叉树

<https://leetcode-cn.com/problems/invert-binary-tree/>

```java
class Solution {
    public TreeNode invertTree(TreeNode root) {
        invertTree0(root);
        return root;
    }
    private void invertTree0(TreeNode root){
        if (root == null) return;
        
        TreeNode t = root.left;
        root.left = root.right;
        root.right = t;

        if (root.left !=null) invertTree0(root.left);
        if (root.right !=null) invertTree0(root.right);
    }
}
```

耗时：０

## 389. 找不同

<https://leetcode-cn.com/problems/find-the-difference/>

```java
class Solution {
    public char findTheDifference(String s, String t) {
        int[] map = new int[128];

        for(int i =0;i<t.length();i++){
            char c = t.charAt(i);
            map[c] = map[c] + 1;
        }
        for(int i=0;i<s.length();i++){
            char c = s.charAt(i);
            map[c] = map[c] - 1;
        }
        for(int i=0;i<map.length;i++){
            if (map[i] != 0) return (char)i;
        }
        return (char)-1;
    }
}
```

耗时：4

## 412. Fizz Buzz

<https://leetcode-cn.com/problems/fizz-buzz/>

```java
class Solution {
    public List<String> fizzBuzz(int n) {
        List<String> list = new ArrayList<>();
        for(int i=1;i<=n;i++){
            if (i % 15 == 0){
                list.add("FizzBuzz");
            }else if(i % 3 == 0){
                list.add("Fizz");
            }else if(i % 5 == 0) {
                list.add("Buzz");
            }else{
                list.add(i + "");
            }
        }
        return list;
    }
}
```

耗时：6

## 173. 二叉搜索树迭代器

<https://leetcode-cn.com/problems/binary-search-tree-iterator/>

```java
class BSTIterator {
    private LinkedList<Integer> list = new LinkedList<>();
    public BSTIterator(TreeNode root) {
        midVisist(root);
    }

    private void midVisist(TreeNode root){
        if (root == null) return;
        midVisist(root.left);
        list.add(root.val);
        midVisist(root.right);
    }
    
    /** @return the next smallest number */
    public int next() {
        return list.removeFirst();
    }
    
    /** @return whether we have a next smallest number */
    public boolean hasNext() {
        return !list.isEmpty();
    }
}
```

耗时：24

## 290. 单词规律

<https://leetcode-cn.com/problems/word-pattern/>

```java
class Solution {
    public boolean wordPattern(String pattern, String s) {
        Map<Character,String> map1 = new HashMap<>();
        Map<String,Character> map2 = new HashMap<>();
        String[] strs = s.split(" ");
        if (strs.length != pattern.length()) return false;

        for(int i = 0;i<pattern.length();i++){
            char c = pattern.charAt(i);

            if (!map1.containsKey(c)) {
                map1.put(c, strs[i]);
            }
            if (!map2.containsKey(strs[i])) {
                map2.put(strs[i],pattern.charAt(i));
            }
        }
        for(int i = 0;i<pattern.length();i++){
            String s1 = map1.get(pattern.charAt(i));
            Character c = map2.get(s1);
            if (!s1.equals(strs[i])) return false;
            if (c == null) return false;
            if (c.charValue() != pattern.charAt(i)) return false;
        }
        return true;
    }
}
```

耗时：1

## 709. 转换成小写字母

<https://leetcode-cn.com/problems/to-lower-case/>

```java
class Solution {
    public String toLowerCase(String str) {
        StringBuffer sb = new StringBuffer();
        for(int i =0;i<str.length();i++){
            char c = str.charAt(i);
            if (c >= 65 && c <=90) c = (char)(c+32);
            sb.append(c);
        }
        return sb.toString();
    }
}
```

耗时：0

## 66. 加一

<https://leetcode-cn.com/problems/plus-one/>

```java
class Solution {
    public int[] plusOne(int[] digits) {
        int[] ret = new int[digits.length+1];
        for(int i=0;i<digits.length;i++){
            ret[i+1] = digits[i];
        }
        ret[ret.length-1] = ret[ret.length-1] + 1;
        boolean f = false;
        for(int i=ret.length-1;i>=0;i--){
            if (ret[i] == 10) {
                ret[i] = 0;
                f = true;
                continue;
            }
            if (f) {
                if (ret[i] == 9) {
                    ret[i] = 0;
                    f = true;
                }else {
                    ret[i]++;
                    f= false;
                }
            }
        }
        if (ret[0] == 0) {
            int[] trimArr = new int[ret.length-1];
            System.arraycopy(ret,1,trimArr,0,trimArr.length);
            return trimArr;
        }
        return ret;
    }
}
```

耗时：0

## 110. 平衡二叉树

<https://leetcode-cn.com/problems/balanced-binary-tree/>

```java
class Solution {
    public boolean isBalanced(TreeNode root) {
        if (root == null) return true;
        if (root.left == null && root.right == null) return true;
        
        if (Math.abs(treeHeight(root.left, 0) - treeHeight(root.right, 0)) > 1) return false;
        return isBalanced(root.left) && isBalanced(root.right);
    }

    private int treeHeight(TreeNode root, int i){
        if (root == null) return i;
        i++;
        int l = treeHeight(root.left, i);
        int r = treeHeight(root.right, i);
        return l > r ? l : r;
    }
}
```

耗时：1

## 349. 两个数组的交集

<https://leetcode-cn.com/problems/intersection-of-two-arrays/>

```java
class Solution {
    public int[] intersection(int[] nums1, int[] nums2) {
        HashSet<Integer> s1 = new HashSet<>();
        HashSet<Integer> s2 = new HashSet<>();
        for(int i : nums1) {
            s1.add(i);
        }
        for(int i : nums2) {
            s2.add(i);
        }
        if (s1.size() < s2.size()) {
            var t = s1;
            s1 = s2;
            s2 = t;
        }

        Iterator<Integer> it = s1.iterator();
        while(it.hasNext()){
            var e = it.next();
            if (!s2.contains(e)) it.remove();
        }

        int[] ret = new int[s1.size()];
        int count = 0;
        for(int i :s1){
            ret[count] = i;
            count++;
        }
        return ret;
    }
}
```

耗时：3

## 557. 反转字符串中的单词 III

<https://leetcode-cn.com/problems/reverse-words-in-a-string-iii/>

```java
class Solution {
    public String reverseWords(String s) {
        if (s.length() == 0) return "";
        StringBuffer sb = new StringBuffer();
        for(int i =s.length()-1;i>=0;i--){
            sb.append(s.charAt(i));
        }
        String[] strs = sb.toString().split(" ");
        sb = new StringBuffer();
        for(int i = strs.length-1;i>=0;i--){
            sb.append(strs[i]);
            if (i != 0) sb.append(" ");
        }
        return sb.toString();
    }
}
```

耗时：10
