---
tags: ['算法', 'leetcode']
---
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

- 解法1：使用哈希表存储每个数字出现的频率

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

- 解法2：摩尔投票法？

```java
class Solution {
    public int majorityElement(int[] nums) {
        if (nums.length == 0) return 0;
        int cnt = 0, last = nums[0];
        for(int i : nums){
            if (i == last) cnt++;
            else cnt--;
            if (cnt < 0) {
                last = i;
                cnt = 0;
            }
        }
        return last;
    }
}
```

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

## 811. 子域名访问计数

<https://leetcode-cn.com/problems/subdomain-visit-count/>

```java
class Solution {
    public List<String> subdomainVisits(String[] cpdomains) {
        Map<String,Integer> map = new HashMap<>(256);
        for (String s : cpdomains){
            String[] a = s.split(" ");
            int count = Integer.valueOf(a[0]);
            String domain = a[1];
            for(int i=domain.length()-1;i>=0;i--){
                char c = domain.charAt(i);
                if (c == '.') {
                    String subDomain = domain.substring(i+1,domain.length());
                    Integer oldCount = map.get(subDomain);
                    if (oldCount == null){
                        map.put(subDomain, count);
                    }else {
                        map.put(subDomain, oldCount + count);
                    }
                }
                if (i == 0){
                    Integer oldCount = map.get(domain);
                    if (oldCount == null){
                        map.put(domain, count);
                    }else {
                        map.put(domain, oldCount + count);
                    }
                }
            }
        }
        List<String> ret = new ArrayList<>();
        for (String s: map.keySet()){
            ret.add(map.get(s) + " " + s);
        }
        return ret;
    }
}
```

耗时：21

## 118. 杨辉三角

<https://leetcode-cn.com/problems/pascals-triangle/>

```java
class Solution {
    public List<List<Integer>> generate(int numRows) {
        List<List<Integer>> list = new ArrayList<>();
        for(int i=0;i<numRows;i++){
            List<Integer> seq = new ArrayList<>();
            for(int j = 0;j<=i;j++){
                if (j == 0 || j == i) {
                    seq.add(1);
                    continue;
                }
                seq.add(list.get(i-1).get(j-1) + list.get(i-1).get(j));
            }
            list.add(seq);
        }
        return list;
    }
}
```

耗时：1

## 231. 2的幂

<https://leetcode-cn.com/problems/power-of-two/>

```java
class Solution {
    public boolean isPowerOfTwo(int n) {
        int k = 1;
        while (true){
            if (n == k) return true;
            if (k > n) return false;
            if (k < 0) break;
            k <<= 1;
        }
        return false;
    }
}
```

耗时：1

## 844. 比较含退格的字符串

<https://leetcode-cn.com/problems/backspace-string-compare/>

```java
class Solution {
    public boolean backspaceCompare(String S, String T) {
        LinkedList<Character> s1 = new LinkedList<>();
        LinkedList<Character> s2 = new LinkedList<>();
        for(int i = 0;i<S.length();i++){
            char c = S.charAt(i);
            if (c == '#' && !s1.isEmpty()) s1.pop();
            else if(c != '#') s1.push(c);
        }
        for(int i = 0;i<T.length();i++){
            char c = T.charAt(i);
            if (c == '#' && !s2.isEmpty()) s2.pop();
            else if(c != '#') s2.push(c);
        }
        if (s1.size() != s2.size()) return false;
        while(!s1.isEmpty() && !s2.isEmpty()){
            if (s1.pop() != s2.pop()) return false;
        }
        return true;
    }
}
```

耗时：2

## 747. 至少是其他数字两倍的最大数

<https://leetcode-cn.com/problems/largest-number-at-least-twice-of-others/>

```java
class Solution {
    public int dominantIndex(int[] nums) {
        int maxIndex = 0;
        for(int i = 0;i<nums.length;i++){
            if (nums[i] > nums[maxIndex]) maxIndex = i;
        }
        for(int i = 0;i<nums.length;i++){
            if (nums[i] * 2 > nums[maxIndex] && i != maxIndex) return -1;
        }
        return maxIndex;
    }
}
```

耗时：0

## 938. 二叉搜索树的范围和

<https://leetcode-cn.com/problems/range-sum-of-bst/>

```java
class Solution {
    public int rangeSumBST(TreeNode root, int L, int R) {
        int[] sum = new int[]{0};
        midTravel(root,sum,L,R);
        return sum[0];
    }
    private void midTravel(TreeNode root,int[] sum,int l,int r){
        if (root == null) return;
        midTravel(root.left, sum,l,r);
        if (root.val >=l && root.val <=r ) sum[0] += root.val;
        midTravel(root.right, sum,l,r);
    }
}
```

耗时：1

## 929. 独特的电子邮件地址

<https://leetcode-cn.com/problems/unique-email-addresses/>

```java
class Solution {
    public int numUniqueEmails(String[] emails) {
        List<String> list = new ArrayList<>();
        for(String s: emails){
            String[] a = s.split("@");
            String name = a[0];
            String domain = a[1];
            StringBuilder sb = new StringBuilder();
            for(int i = 0;i<name.length();i++){
                char c = name.charAt(i);
                if (c == '+') break;
                if (c != '.') sb.append(c);
            }
            sb.append("@");
            sb.append(domain);
            if (!list.contains(sb.toString())){
                list.add(sb.toString());
            }
        }
        return list.size();
    }
}
```

耗时：12

## 744. 寻找比目标字母大的最小字母

<https://leetcode-cn.com/problems/find-smallest-letter-greater-than-target/>

```java
class Solution {
    public char nextGreatestLetter(char[] letters, char target) {
        for(int i = 0;i<letters.length;i++){
            if (letters[i] > target) return letters[i];
        }
        return letters[0];
    }
}
```

耗时：0

## 191. 位1的个数

<https://leetcode-cn.com/problems/number-of-1-bits/>

```c
int hammingWeight(uint32_t n) {
    int count = 0;
    while(n != 0){
        if (n % 2 != 0) count++;
        n >>= 1;
    }
    return count;
}
```

耗时：4

## 706. 设计哈希映射

<https://leetcode-cn.com/problems/design-hashmap/>

```java
class MyHashMap {
    private static final int SIZE = 1000001;
    private Integer[] data = new Integer[SIZE];
    
    public void put(int key, int value) {
        data[key % SIZE] = value;
    }
    
    public int get(int key) {
        Integer i = data[key % SIZE];
        if (i == null) return -1;
        return i;
    }
    
    public void remove(int key) {
        data[key % SIZE] = null;
    }
}
```

耗时：30

## 225. 用队列实现栈

<https://leetcode-cn.com/problems/implement-stack-using-queues/>

```java
class MyStack {

    private LinkedList<Integer> q1 = new LinkedList<>();
    private LinkedList<Integer> q2 = new LinkedList<>();
    private int next = 0;
    
    public void push(int x) {
        q1.add(x);
        next = x;
    }
    
    /** Removes the element on top of the stack and returns that element. */
    public int pop() {
        int size = q1.size();
        int oldNext = next;
        for(int i = 0;i<size;i++){
            int x = q1.remove();
            if (i == size - 2) next = x;
            if (i != size - 1) q2.add(x);
        }
        var t = q1;
        q1 = q2;
        q2 = t;
        return oldNext;
    }
    
    public int top() { return next; }
    
    public boolean empty() { return q1.isEmpty(); }
}
```

耗时：0

## 面试题 01.01. 判定字符是否唯一

<https://leetcode-cn.com/problems/is-unique-lcci/>

- 解法1：暴力解法

```java
class Solution {
    public boolean isUnique(String astr) {
        int l = astr.length();
        for(int i = 0;i<l;i++){
            for(int j =0;j<l;j++){
                if (j == i) continue;
                if (astr.charAt(i)  == astr.charAt(j)) return false;
            }
        }
        return true;
    }
}
```

耗时：0

## 面试题 01.02. 判定是否互为字符重排

<https://leetcode-cn.com/problems/check-permutation-lcci/>

```java
class Solution {
    public boolean CheckPermutation(String s1, String s2) {
        if (s1.length() != s2.length()) return false;
        int[] map = new int[128];
        for(int i = 0;i<s1.length();i++) {
            map[s1.charAt(i)]++;
            map[s2.charAt(i)]--;
        }
        for(int i : map){
            if (i != 0) return false;
        }
        return true;
```

耗时：0

## 49. 字母异位词分组

<https://leetcode-cn.com/problems/group-anagrams/>

```java
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        HashMap<String,Integer> map = new HashMap<>(128);
        int i = 0;
        List<List<String>> list = new ArrayList<>();
        for(String s : strs) {
            var arr = s.toCharArray();
            Arrays.sort(arr);
            String key = Arrays.toString(arr);
            if (!map.containsKey(key)){
                map.put(key, i);
                i++;
                list.add(new ArrayList<>());
                list.get(list.size() -1).add(s);
            }else{
                int index = map.get(key);
                list.get(index).add(s);
            }
        }
        return list;
    }
}
```

耗时：10

## 804. 唯一摩尔斯密码词

<https://leetcode-cn.com/problems/unique-morse-code-words/>

```java
class Solution {
    public int uniqueMorseRepresentations(String[] words) {
        String[] map = {".-","-...","-.-.","-..",".","..-.","--.","....","..",
        ".---","-.-",".-..","--","-.","---",".--.","--.-",".-.","...","-","..-",
        "...-",".--","-..-","-.--","--.."};
        Set<String> set = new HashSet<>();
        for(String s : words){
            StringBuffer sb = new StringBuffer();
            for(int i = 0;i<s.length();i++){
                sb.append(map[s.charAt(i) - 97]);
            }
            set.add(sb.toString());
        }
        return set.size();
    }
}
```

耗时：2

## 238. 除自身以外数组的乘积

<https://leetcode-cn.com/problems/product-of-array-except-self/submissions/>

```java
class Solution {
    public int[] productExceptSelf(int[] nums) {
        int[] lMap = new int[nums.length];
        int[] rMap = new int[nums.length];
        int lAll = 1;
        int rAll = 1;
        for(int i = 0;i<nums.length;i++){
            lMap[i] = lAll;
            lAll *= nums[i];
        }
        for(int i = nums.length - 1;i>=0;i--){
            rMap[i] = rAll;
            rAll *= nums[i];
        }
        for(int i = 0;i<nums.length;i++){
            lMap[i] *= rMap[i];
        }
        return lMap;

    }
}
```

耗时：1

## 34. 在排序数组中查找元素的第一个和最后一个位置

<https://leetcode-cn.com/problems/find-first-and-last-position-of-element-in-sorted-array/>

```java
class Solution {
    public int[] searchRange(int[] nums, int target) {
        int start = -1;
        int end = -1;
        for(int i = 0;i<nums.length;i++){
            if (nums[i] == target) {
                if (start == -1) {
                    start = i;   
                }
                end = i;
            }
        }
        return new int[]{start, end};
    }
}
```

耗时：1

## 387. 字符串中的第一个唯一字符

<https://leetcode-cn.com/problems/first-unique-character-in-a-string/>

```java
class Solution {
    public int firstUniqChar(String s) {
        int[] map = new int[128];
        for(int i = 0;i<s.length();i++){
            map[s.charAt(i)]++;
        }
        for(int i = 0;i<s.length();i++){
            if (map[s.charAt(i)] == 1) return i;
        }
        return -1;
    }
}
```

耗时：7

## 1313. 解压缩编码列表

<https://leetcode-cn.com/problems/decompress-run-length-encoded-list/>

```python
class Solution(object):
    def decompressRLElist(self, nums):
        ret = []
        for i in range(len(nums)/2):
            for j in range(nums[2*i]):
                ret.append(nums[2*i+1])
        return ret
```

耗时：24

## 303. 区域和检索 - 数组不可变

<https://leetcode-cn.com/problems/range-sum-query-immutable/>

```java
class NumArray {

    private int[] nums;
    private int[] cache;

    public NumArray(int[] nums) {
        this.nums = nums;
        cache = new int[nums.length];
        int total = 0;
        for(int i = 0;i<nums.length;i++){
            total += nums[i];
            cache[i] = total;
        }
    }
    
    public int sumRange(int i, int j) {
        if (j == 0 && i == 0) return cache[0];
        if (i == 0) return cache[j];
        return cache[j] - cache[i-1];
    }
}
```

耗时：10

## 190. 颠倒二进制位

<https://leetcode-cn.com/problems/reverse-bits/>

```java
uint32_t reverseBits(uint32_t n) {
    int map[32];
    int i = 0;
    uint32_t ret = 0;
    const uint32_t p = 1;
    while(n > 0){
        map[31-i] = n%2;
        n /= 2;
        i++;
    }
    for(;i<32;i++) map[31-i] = 0;

    for(i=0;i<32;i++){
        if (map[i] != 0){
            if (i == 0) ret+=1;
            else ret += p << i;
        }
    }
    return ret;
}
```

耗时：0

## 771. 宝石与石头

<https://leetcode-cn.com/problems/jewels-and-stones/submissions/>

```java
class Solution {
    public int numJewelsInStones(String J, String S) {
        int[] map = new int[128];
        int ret = 0;
        for(int i = 0;i<J.length();i++){
            map[J.charAt(i)] = 1;
        }
        for(int i = 0;i<S.length();i++){
            if (map[S.charAt(i)] == 1) ret++;
        }
        return ret;
    }
}
```

耗时：1

## 917. 仅仅反转字母

<https://leetcode-cn.com/problems/reverse-only-letters/>

```java
class Solution {
    public String reverseOnlyLetters(String S) {
        char[] strs = new char[S.length()];
        int p = 0;
        for(int i=0;i<S.length();i++){
            char c = S.charAt(i);
            if ((c >= 97 && c <=122) || (c >= 65 && c <= 90)) {
                strs[p++] = c;
            }
        }
        StringBuilder sb = new StringBuilder(S.length());
        for(int i=0;i<S.length();i++){
            char c = S.charAt(i);
            if ((c >= 97 && c <=122) || (c >= 65 && c <= 90)) {
                sb.append(strs[--p]);
            }else{
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
```

耗时：1


## 217. 存在重复元素

<https://leetcode-cn.com/problems/contains-duplicate/>

```java
class Solution {
    public boolean containsDuplicate(int[] nums) {
        if (nums.length <= 1) return false;
        
        Set<Integer> set = new HashSet<>(nums.length);
        for(int i: nums) set.add(i);
        return set.size() != nums.length;
```

耗时：6

## 338. 比特位计数

<https://leetcode-cn.com/problems/counting-bits/>

```java
class Solution {
    public int[] countBits(int num) {
        int[] ret = new int[num+1];
        for(int i=0;i<=num;i++){
            int k = i;
            while(k > 0) {
                ret[i]+=k%2;
                k/=2;
            }
        }
        return ret;
    }
}
```

耗时：12

## 1389. 按既定顺序创建目标数组

<https://leetcode-cn.com/problems/create-target-array-in-the-given-order/>

```java
class Solution {
    public int[] createTargetArray(int[] nums, int[] index) {
        if (index.length <= 1) return nums;
        LinkedList<Integer> target = new LinkedList<>();
        for(int i = 0;i<index.length;i++) target.add(index[i], nums[i]);

        int[] ret = new int[nums.length];
        for(int i = 0;i<index.length;i++) ret[i]=target.get(i);
        return ret;
    }
}
```

耗时：2

## 1295. 统计位数为偶数的数字

<https://leetcode-cn.com/problems/find-numbers-with-even-number-of-digits/>

```java
class Solution {
    public int findNumbers(int[] nums) {
        int ret = 0;
        for(int i : nums){
            if (String.valueOf(i).length() %2 == 0) ret++;
        }
        return ret;
    }
}
```

耗时：2

## 933. 最近的请求次数

<https://leetcode-cn.com/problems/number-of-recent-calls/>

```java
class RecentCounter {

    private LinkedList<Integer> s = new LinkedList<>();

    public RecentCounter() { }
    
    public int ping(int t) {
        s.add(t);
        while(!s.isEmpty()){
            if(s.peekLast() - s.peekFirst() <= 3000){
                break;
            }else{
                s.pop();
            }
        }
        return s.size();
    }
}
```

耗时：26

## 205. 同构字符串

<https://leetcode-cn.com/problems/isomorphic-strings/>

```java
class Solution {
    public boolean isIsomorphic(String s, String t) {
       Map<Character,Character> m1 = new HashMap<>();
       Map<Character,Character> m2 = new HashMap<>();
       for(int i=0;i<s.length();i++){
           char c1 = s.charAt(i);
           char c2 = t.charAt(i);
           m1.putIfAbsent(c1,c2);
           m2.putIfAbsent(c2,c1); 
       }
       if (m1.size() != m2.size()) return false;
       for(int i=0;i<s.length();i++){
           char c1 = s.charAt(i);
           char c2 = t.charAt(i);
           if (c2 != m1.get(c1)) return false;
           if (c1 != m2.get(c2)) return false;
       }
        return true;
    }
}
```

耗时：15

## 面试题 10.01. 合并排序的数组

<https://leetcode-cn.com/problems/sorted-merge-lcci/>

```java
class Solution {
    public void merge(int[] A, int m, int[] B, int n) {
        int[] ret = new int[m + n];
        int p=0, q=0, pos = 0;
        while(pos < ret.length){
            if (p >= m) {
                ret[pos++]=B[q++];
                continue;
            }
            if (q >= n) {
                ret[pos++]=A[p++];
                continue;
            }
            if (A[p] < B[q]) ret[pos++] = A[p++];
            else ret[pos++] = B[q++];
            
        }
        for(int i=0;i<A.length;i++) A[i] = ret[i];
    }
}
```

耗时：0

## 1299. 将每个元素替换为右侧最大元素

<https://leetcode-cn.com/problems/replace-elements-with-greatest-element-on-right-side/>

```java
class Solution {
    public int[] replaceElements(int[] arr) {
        PriorityQueue<Integer> q = new PriorityQueue<>((Comparator<Integer>) (o1, o2) -> o2-o1);
        int[] ret = new int[arr.length];
        for(int i=arr.length-1;i>=0;i--){
            if (q.peek() == null) {
                ret[i]=-1;
            }else{
                ret[i]=q.peek();
            }
            q.offer(arr[i]);
        }
        return ret;
    }
}
```

耗时：10

## 228. 汇总区间

<https://leetcode-cn.com/problems/summary-ranges/>

```java
class Solution {
    public List<String> summaryRanges(int[] nums) {
        if (nums.length == 0) return List.of();
        if (nums.length == 1) return List.of(nums[0] + "");

        int n = nums.length;
        int p=0,q=0;
        List<String> ret = new ArrayList<>(20);
        for(int i=0;i<n;i++){
            q = i;
            if (i == n-1){
                ret.add(build(p, q, nums));
                break;
            }
            if (nums[i] != nums[i+1]-1){
                ret.add(build(p,q,nums));
                p = i+1;
            }
        }
        return ret;
    }
    private String build(int p, int q, int[] nums){
        if (q == p){
            return nums[p] + "";
        }else {
            return nums[p] + "->"+nums[q];
        }
    }
}
```

耗时：8

## 674. 最长连续递增序列

<https://leetcode-cn.com/problems/longest-continuous-increasing-subsequence/>

```java
class Solution {
    public int findLengthOfLCIS(int[] nums) {
        if(nums.length <= 1) return nums.length;
        int max = 0;
        int seq = 1;
        for(int i = 1;i<nums.length;i++){
            if (nums[i] > nums[i-1]) seq++;
            else seq = 1;
            if (seq > max) max = seq;
        }
        return max;
    }
}
```

耗时：0

## 724. 寻找数组的中心索引

<https://leetcode-cn.com/problems/find-pivot-index/>

<https://leetcode-cn.com/problems/tvdfij/>

- 解法1

```java
class Solution {
    public int pivotIndex(int[] nums) {
        if (nums.length == 0) return -1;
        if (nums.length == 1) return 0;
        int[] l = new int[nums.length];
        l[0] = nums[0];
        int[] r = new int[nums.length];
        r[nums.length - 1] = nums[nums.length - 1];

        for(int i = 1;i<nums.length;i++) l[i] = nums[i] + l[i-1];
        for(int i = nums.length -2;i>=0;i--) r[i] = nums[i] + r[i+1];

        for(int i = 0;i<l.length;i++){
            if (l[i] == r[i]) return i;
        }
        return -1;
    }
}
```

耗时：2

- 解法2

```java
class Solution {
    public int pivotIndex(int[] nums) {
        int rsum = 0;
        int lsum = 0;
        for(int i : nums) rsum += i;
        for(int i = 0;i < nums.length;i++) {
            rsum -= nums[i];
            if (lsum == rsum) return i;
            lsum += nums[i];
        }
        return -1;
    }
}
```

time:1 beat:87

## 1078. Bigram 分词

<https://leetcode-cn.com/problems/occurrences-after-bigram/>

```java
class Solution {
    public String[] findOcurrences(String text, String first, String second) {
        List<String> list = new ArrayList<>();
        String[] arr = text.split(" ");
        for(int i=2;i<arr.length;i++){
            if (first.equals(arr[i-2]) && second.equals(arr[i-1])) list.add(arr[i]);
        }
        return list.toArray(new String[]{});
    }
}
```

time:1 beat:93

## 643. 子数组最大平均数 I

<https://leetcode-cn.com/problems/maximum-average-subarray-i/>

```java
/*
* 滑动窗口和思路：维护两个指针，每次滑动总和就减去前一个，然后加上后一个
*/
class Solution {
    public double findMaxAverage(int[] nums, int k) {
        if (nums.length <k) return -1;
        int p=0,q=k-1;
        int sum=0;
        double max=0;
        for(int i=p;i<=q;i++) sum += nums[i];
        max = (double)sum/k;
        while(q < nums.length-1){
            sum -= nums[p++];
            sum += nums[++q];
            double t = (double)sum /k;
            if (t > max) max = t;
        }
        return max;
    }
}
```

time:4 beat:68

## LCP 17. 速算机器人

<https://leetcode-cn.com/problems/nGK0Fy/>

```java
class Solution {
    public int calculate(String s) {
        int x = 1, y = 0;
        int p = 0,q = 0;
        for(int i=0;i<s.length();i++){
            if (s.charAt(i) == 'A') x = 2 * x + y;
            else y = 2* y + x;
        }
        return x + y;
    }
}
```

time:0 beat: 100

## 剑指 Offer 40. 最小的k个数

<https://leetcode-cn.com/problems/zui-xiao-de-kge-shu-lcof/>

```java
class Solution {
    public int[] getLeastNumbers(int[] arr, int k) {
        PriorityQueue<Integer> queue = new PriorityQueue<>((o1, o2) -> o1 - o2);
        for(int i:arr) queue.offer(i);
        int[] ret = new int[k];
        for(int i=0;i<k;i++) ret[i]=queue.poll();
        return ret;
    }
}
```

time: 20 beat:31

## 448. 找到所有数组中消失的数字

<https://leetcode-cn.com/problems/find-all-numbers-disappeared-in-an-array/>

- 解法1：使用bitmap存储数字是否出现 这个方法使用了额外的存储空间

```java
class Solution {
    public List<Integer> findDisappearedNumbers(int[] nums) {
        if (nums.length <=1) return List.of();
        int[] map = new int[nums.length + 1];
        for(int i : nums){
            map[i] = 1;
        }
        List<Integer> ret = new ArrayList<>();
        for(int i = 1;i<map.length;i++){
            if (map[i] == 0 ) ret.add(i);
        }
        return ret;
    }
}
```

time: 4 beat: 98

## 剑指 Offer 09. 用两个栈实现队列

<https://leetcode-cn.com/problems/yong-liang-ge-zhan-shi-xian-dui-lie-lcof/>

使用一个辅助栈来实现FIFO的效果

```java
class CQueue {

    private LinkedList<Integer> main = new LinkedList<>();
    private LinkedList<Integer> help = new LinkedList<>();
    
    public void appendTail(int value) {
        main.push(value);
    }
    
    public int deleteHead() {
        if (main.isEmpty()) return -1;
        int ret = -1;
        while(!main.isEmpty()){
            ret = main.pop();
            help.push(ret);
        }
        help.pop();
        while(!help.isEmpty()){
            main.push(help.pop());
        }
        return ret;
    }
}
```

time:220 beat:11

## 剑指 Offer 57. 和为s的两个数字

<https://leetcode-cn.com/problems/he-wei-sde-liang-ge-shu-zi-lcof/>

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        int p = 0,q = nums.length - 1;
        while(p < q){
            int r = nums[p] + nums[q];
            if (target == r) return new int[]{nums[p],nums[q]};
            if (r < target) p++;
            else q--;
        }
        return new int[]{};
    }
}
```

time:2 beat:95

## 485. 最大连续1的个数

<https://leetcode-cn.com/problems/max-consecutive-ones/>

```java
class Solution {
    public int findMaxConsecutiveOnes(int[] nums) {
        int cnt = 0;
        int max = 0;
        for(int i : nums) {
            if (cnt >= max) max = cnt;
            if (i == 0) cnt = 0;
            else cnt++;
            if (cnt >= max) max = cnt;
        }
        return max;
    }
}
```

time:2 beat: 90

## 961. 重复 N 次的元素

<https://leetcode-cn.com/problems/n-repeated-element-in-size-2n-array/>

```java
class Solution {
    public int repeatedNTimes(int[] A) {
        int[] map = new int[10001];
        for(int i : A) map[i]++;
        int n = A.length/2;
        for(int i = 0;i<map.length;i++) if (map[i] >= n) return i;
        return -1;
    }
}
```

time:2 beat: 47

## 284. 顶端迭代器

<https://leetcode-cn.com/problems/peeking-iterator/>

```java
class PeekingIterator implements Iterator<Integer> {

    private ArrayList<Integer> list = new ArrayList<>();
    private int pos=0;

	public PeekingIterator(Iterator<Integer> iterator) {
	    while(iterator.hasNext()) list.add(iterator.next());
	}
	
	public Integer peek() {
        return list.get(pos);
	}
	
	@Override
	public Integer next() {
        return list.get(pos++);
	}
	
	@Override
	public boolean hasNext() {
	    return pos < list.size();
	}
}
```

time: 5 beat:99

## 剑指 Offer 59 - I. 滑动窗口的最大值

<https://leetcode-cn.com/problems/hua-dong-chuang-kou-de-zui-da-zhi-lcof/>

```java
class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums.length == 0) return new int[]{};
        List<Integer> ret = new ArrayList<>();
        int n = nums.length - k+1;
        for(int i =0;i<n;i++){
            int max = nums[i];
            int p = i,q = k+i;
            for(int j = p;j<q;j++) if (nums[j] > max) max = nums[j];
            ret.add(max);
        }

        int[] ra = new int[ret.size()];
        for(int i = 0;i<ret.size();i++){
            ra[i] = ret.get(i);
        }
        return ra;
    }
}
```

time: 40 beat:10

## 1672. 最富有客户的资产总量

<https://leetcode-cn.com/problems/richest-customer-wealth/>

```java
class Solution {
    public int maximumWealth(int[][] accounts) {
        int max = 0;
        for(int[] a: accounts){
            int sum = 0;
            for(int i: a) sum += i;
            if (sum > max) max = sum;
        }
        return max;
    }
}
```

time:0 beat:100

## 832. 翻转图像

<https://leetcode-cn.com/problems/flipping-an-image/>

```java
class Solution {
    public int[][] flipAndInvertImage(int[][] A) {
        for(int[] a: A){
            int p = 0,q = a.length - 1;
            while(p <= q) {
                int t = a[q];
                a[q] = a[p];
                a[p] = t;
                if (a[q] == 0) a[q]=1;
                else a[q] = 0;

                if (p == q) break;
                
                if (a[p] == 0) a[p]=1;
                else a[p] = 0;
                p++;q--;
            }
        }
        return A;
    }
}
```

time:0 beat: 100

## 867. 转置矩阵

<https://leetcode-cn.com/problems/transpose-matrix/>

```java
class Solution {
    public int[][] transpose(int[][] matrix) {
        int[][] reversed = new int[matrix[0].length][matrix.length];
        for(int i = 0;i<matrix.length;i++){
            for(int j = 0;j<matrix[i].length;j++){
                reversed[j][i] = matrix[i][j];
            }
        }
        return reversed;
    }
}
```

time: 1 beat: 38

## 面试题 16.01. 交换数字

<https://leetcode-cn.com/problems/swap-numbers-lcci/>

```py
class Solution(object):
    def swapNumbers(self, numbers):
        numbers[0] = numbers[1] + numbers[0]
        numbers[1] = numbers[0] - numbers[1]
        numbers[0] = numbers[0] - numbers[1]
        return numbers
```

time:12 beat:91

## 896. 单调数列

<https://leetcode-cn.com/problems/monotonic-array/>

```java
class Solution {
    public boolean isMonotonic(int[] A) {
        if (A.length == 1) return true;
        boolean lastIncr = false;
        boolean lastDecr = false;
        for(int i = 1;i<A.length;i++){
            int q = A[i] - A[i - 1];
            if (q > 0) { // 递增
                if (lastDecr) return false;
                lastIncr = true;
            }else if (q < 0) { // 递减
                if (lastIncr) return false;
                lastDecr = true;
            }
        }
        return true;
    }
}
```

time: 1 beat: 100

## 1470. 重新排列数组

<https://leetcode-cn.com/problems/shuffle-the-array/>

```java
class Solution {
    public int[] shuffle(int[] nums, int n) {
        int p = 0,q = n;
        int[] ret = new int[nums.length];
        for(int i = 0;i<ret.length;i+=2){
            ret[i] = nums[p++];
            ret[i + 1] = nums[q++];
        }
        return ret;
    }
}
```

time: 0 beat: 100

## 304. 二维区域和检索 - 矩阵不可变

<https://leetcode-cn.com/problems/range-sum-query-2d-immutable/>

```java
class NumMatrix {
    private int[][] cache;
    public NumMatrix(int[][] matrix) {
        if (matrix.length == 0) cache = new int[0][0];
        else cache = new int[matrix.length][matrix[0].length];
        
        for(int i = 0;i<matrix.length;i++){
            for(int j = 0;j< matrix[i].length;j++){
                cache[i][j] = matrix[i][j];
            }
        }
        for(int i = 0;i<matrix.length;i++){
            for(int j = 1;j< matrix[i].length;j++){
                cache[i][j] += cache[i][j-1];
            }
        }
        for(int i = 1;i<matrix.length;i++){
            for(int j = 0;j< matrix[i].length;j++){
                cache[i][j] += cache[i-1][j];
            }
        }
    }
    
    public int sumRegion(int row1, int col1, int row2, int col2) {
        if (cache.length == 0) return 0;
        if (row1 == 0 && col1 == 0) return cache[row2][col2];
        if (row1 == 0) return cache[row2][col2] - cache[row2][col1-1];
        if (col1 == 0) return cache[row2][col2] - cache[row1-1][col2];
        
        return cache[row2][col2] - cache[row1-1][col2] - (cache[row2][col1-1] - cache[row1-1][col1-1]);
    }
}
```

time: 14 beat: 98

## 1047. 删除字符串中的所有相邻重复项

<https://leetcode-cn.com/problems/remove-all-adjacent-duplicates-in-string/>

```java
class Solution {
    public String removeDuplicates(String S) {
        LinkedList<Character> s = new LinkedList<>();
        for(int i = 0;i<S.length();i++){
            if (s.peek() == null) {
                s.push(S.charAt(i));
                continue;
            }
            if (S.charAt(i) == s.peek()) s.pop();
            else s.push(S.charAt(i));
        }
        char[] ca = new char[s.size()];
        for(int i = s.size() - 1;i>=0;i--) ca[i] = s.pop();
        StringBuilder sb = new StringBuilder();
        for(int i = 0;i<ca.length;i++) sb.append(ca[i]);
        return sb.toString();
    }
}
```

time: 16 beat: 72

## 1512. 好数对的数目

<https://leetcode-cn.com/problems/number-of-good-pairs/>

```java
class Solution {
    public int numIdenticalPairs(int[] nums) {
        int cnt = 0;
        for(int i = 0;i<nums.length;i++){
            for(int j = i+1;j<nums.length;j++){
                if (nums[i] == nums[j]) cnt++;
            }
        }
        return cnt;
    }
}
```

time:1 beat:81

## 面试题 02.03. 删除中间节点

<https://leetcode-cn.com/problems/delete-middle-node-lcci/>

```java
class Solution {
    public void deleteNode(ListNode node) {
        ListNode prev = null;
        while(node != null){
            if (prev != null) prev.val = node.val;
            if (node.next == null) break;
            prev = node;
            node = node.next;
        }
        if (prev != null) prev.next = null;
    }
}
```

time:0 beat: 100

## 1684. 统计一致字符串的数目

<https://leetcode-cn.com/problems/count-the-number-of-consistent-strings/>

```java
class Solution {
    public int countConsistentStrings(String allowed, String[] words) {
        boolean[] map = new boolean[128];
        for(int i = 0;i<allowed.length();i++){
            map[allowed.charAt(i)] = true;
        }
        int cnt = 0;
        for(String str : words){
            boolean flag = true;
            for(int i =0;i<str.length();i++){
                if (!map[str.charAt(i)]) {
                    flag = false;
                    break;
                }
            }
            if (flag) cnt++;
        }
        return cnt;

    }
}
```

time:8 beat:74

## 1379. 找出克隆二叉树中的相同节点

<https://leetcode-cn.com/problems/find-a-corresponding-node-of-a-binary-tree-in-a-clone-of-that-tree/>

```java
class Solution {
    public final TreeNode getTargetCopy(final TreeNode original, final TreeNode cloned, final TreeNode target) {
        if (original == null) return null;
        if (original == target){
            return cloned;
        }
        TreeNode left = getTargetCopy(original.left, cloned.left, target);
        TreeNode right = getTargetCopy(original.right, cloned.right, target);
        if (left != null) return left;
        if (right != null) return right;
        return null;
    }
}
```

time:2 beat:46

## 1464. 数组中两元素的最大乘积

<https://leetcode-cn.com/problems/maximum-product-of-two-elements-in-an-array/>

```java

class Solution {
    public int maxProduct(int[] nums) {
        int max = -1;
        int second = -1;
        int maxIndex = 0;
        int secondIndex = 1;
        for(int i =0;i<nums.length;i++){
            if (nums[i] > max) {
                max = nums[i];
                maxIndex = i;
            }
        }
        for(int i =0;i<nums.length;i++){
            if (nums[i] > second && i != maxIndex) {
                second = nums[i];
                secondIndex = i;
            }
        }
        return (max-1) * (second - 1);
    }
}
```

time:1 beat:76

## 535. TinyURL 的加密与解密

<https://leetcode-cn.com/problems/encode-and-decode-tinyurl/>

```java
import java.util.concurrent.atomic.*;
public class Codec {
    private ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
    private volatile AtomicInteger cnt = new AtomicInteger();
    public String encode(String longUrl) {
        map.putIfAbsent(String.valueOf(cnt.incrementAndGet()), longUrl);
        return String.valueOf(cnt.get());
    }

    public String decode(String shortUrl) {
        return map.get(shortUrl);
    }
}
```

time:2 beat: 68

## 删除有序数组中的重复项

<https://leetcode-cn.com/problems/remove-duplicates-from-sorted-array/>

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

time:1 beat: 81

## 5734. 判断句子是否为全字母句

<https://leetcode-cn.com/problems/check-if-the-sentence-is-pangram/>

```java
class Solution {
    public boolean checkIfPangram(String sentence) {
        if (sentence.length() < 26) return false;
        boolean[] map = new boolean[26];
        for(int i = 0;i< sentence.length();i++){
            char c = sentence.charAt(i);
            map[c - 97] = true;
        }
        for(boolean i : map){
            if (!i) return false;
        }
        return true;
    }
}
```

time:2 beat:100

## 1822. 数组元素积的符号

<https://leetcode-cn.com/problems/sign-of-the-product-of-an-array/>

```java

class Solution {
    public int arraySign(int[] nums) {
        boolean n = true;
        for(int i : nums){
            if (i == 0) return 0;
            if (n && i < 0) {
                n = false;
                continue;
            }
            if (n && i > 0) {
                n = true;
                continue;
            }
            if (!n && i > 0) {
                n = false;
                continue;
            }
            if (!n && i < 0) {
                n = true;
                continue;
            }
        }
        if (n) return 1;
        else return -1;

    }
}
```
time: 1 beat:29

## 1365. 有多少小于当前数字的数字

<https://leetcode-cn.com/problems/how-many-numbers-are-smaller-than-the-current-number/>

```java
class Solution {
    public int[] smallerNumbersThanCurrent(int[] nums) {
        int[] ret = new int[nums.length];
        for(int i = 0;i < nums.length;i++){
            for(int j = 0;j < nums.length;j++){
                if (j == i) continue;
                if (nums[j] < nums[i]) ret[i]++;
            }
        }
        return ret;
    }
}
```

time:18 beat:8

## 1476. 子矩形查询

<https://leetcode-cn.com/problems/subrectangle-queries/>

```java
class SubrectangleQueries {
    private int[][] rectangle;
    public SubrectangleQueries(int[][] rectangle) {
        this.rectangle = rectangle;
    }
    
    public void updateSubrectangle(int row1, int col1, int row2, int col2, int newValue) {
        for(int i = row1;i<= row2;i++){
            for(int j = col1;j<=col2;j++){
                rectangle[i][j] = newValue;
            }
        }
    }
    
    public int getValue(int row, int col) {
        return rectangle[row][col];
    }
}
```

time: 30 beat:86

## 剑指 Offer 54. 二叉搜索树的第k大节点

<https://leetcode-cn.com/problems/er-cha-sou-suo-shu-de-di-kda-jie-dian-lcof/>

```java
class Solution {
    public int kthLargest(TreeNode root, int k) {
       LinkedList<Integer> s = new LinkedList<>();
       travel(root, s);
       int cnt = 1;
       while(!s.isEmpty()){
           int i = s.pop();
           if (cnt == k) return i;
           cnt++;
       }
       return -1;
    }

    public void travel(TreeNode root, LinkedList<Integer> s){
        if (root == null) return;
        travel(root.left, s);
        s.push(root.val);
        travel(root.right, s);
    }
}
```

time:1 beat:40

## 1603. 设计停车系统

<https://leetcode-cn.com/problems/design-parking-system/>

```java
class ParkingSystem {

    private int big;
    private int medium;
    private int small;

    public ParkingSystem(int big, int medium, int small) {
        this.big = big;
        this.medium = medium;
        this.small = small;
    }
    
    public boolean addCar(int carType) {
        if (carType == 1) {
            if (big > 0) {
                big--;
                return true;
            }
            return false;
        }
        if (carType == 2) {
            if (medium > 0) {
                medium--;
                return true;
            }
            return false;
        }
        if (carType == 3) {
            if (small > 0){
                small--;
                return true;
            }
            return false;
        }
        return false;
    }
}
```

time: 16 beat:9

## 977. 有序数组的平方

<https://leetcode-cn.com/problems/squares-of-a-sorted-array/>

```java
class Solution {
    public int[] sortedSquares(int[] nums) {
        for(int i=0;i<nums.length;i++){
            nums[i] = nums[i] * nums[i];
        }
        int p=0,q=nums.length - 1;
        int[] ret = new int[nums.length];
        for(int i = nums.length - 1; i>=0;i--){
            if (nums[p] > nums[q]){
                ret[i] = nums[p++];
            }else if (nums[p] <= nums[q]) {
                ret[i] = nums[q--];
            }
        }
        return ret;
    }
}
```

time:1 beat:100

## 1304. 和为零的N个唯一整数

```java
class Solution {
    public int[] sumZero(int n) {
        if (n == 2) return new int[]{1, -1};
        int preSum = 0;
        int[] ret = new int[n];
        for(int i = 0;i<n - 1;i++){
            preSum += i;
            ret[i] = i;
        }
        ret[n - 1] = -preSum;
        return ret;
    }
}
```

time:0 beat: 100

## 面试题 02.02. 返回倒数第 k 个节点

<https://leetcode-cn.com/problems/kth-node-from-end-of-list-lcci/>

```java
class Solution {

    private int ret;

    private int cnt;

    public int kthToLast(ListNode head, int k) {
        cnt = 0;
        process(head, k);
        return ret;
    }

    public void process(ListNode head, int k){
        if (head == null) {
            return;
        }
        process(head.next, k);
        cnt++;
        if (cnt == k) ret = head.val;
    }
}
```

time:0 beat:100


## 1261. 在受污染的二叉树中查找元素

<https://leetcode-cn.com/problems/find-elements-in-a-contaminated-binary-tree/>

- 解法1 

```java
class FindElements {

    private TreeNode root;

    public FindElements(TreeNode root) {
        this.root = root;
        if (root != null) root.val = 0;
        recover(root);
    }
    
    public boolean find(int target) {
        return find(root, target);
    }

    private boolean find(TreeNode root, int target){
        if (root == null) return false;
        if (root.val == target) return true;
        return find(root.left, target) || find(root.right, target);
    }

    private void recover(TreeNode root){
        if (root == null) return;

        if (root.left != null) root.left.val = 2*root.val+1;
        if (root.right != null) root.right.val = 2*root.val+2;

        recover(root.left);
        recover(root.right);
    }
}
```

time: 1000+ beat:20

- 解法2 优化：增加缓存

```java
class FindElements {

    private TreeNode root;
    private Map<Integer, Boolean> map = new HashMap<>();

    public FindElements(TreeNode root) {
        this.root = root;
        if (root != null) root.val = 0;
        recover(root);
    }
    
    public boolean find(int target) {
        return map.containsKey(target);
    }

    private void recover(TreeNode root){
        if (root == null) return;

        if (root.left != null) {
            root.left.val = 2*root.val+1;
            map.put(root.left.val, true);
        }
        if (root.right != null) { 
            root.right.val = 2*root.val+2;
            map.put(root.right.val, true);
        }

        recover(root.left);
        recover(root.right);
```

time:28 beat:84

## 1678. 设计 Goal 解析器

<https://leetcode-cn.com/problems/goal-parser-interpretation/>

```java
class Solution {
    public String interpret(String command) {
        StringBuilder sb = new StringBuilder();
        int p = 0,q = 1;
        for(;p<command.length();p++,q++){
            char c = command.charAt(p);
            if (c == 'G') sb.append('G');
            if (c == '(') {
                if (command.charAt(q) == ')') {
                    sb.append("o");
                    p++;
                    q++;
                }
                else {
                    sb.append("al");
                    p += 2;
                    q += 2;
                }
            }
        }
        return sb.toString();
    }
}
```

time: 0

## 905. 按奇偶排序数组

<https://leetcode-cn.com/problems/sort-array-by-parity/>

```java
class Solution {
    public int[] sortArrayByParity(int[] nums) {
        if (nums.length == 1) return nums;
        int p = 0, q = nums.length - 1;
        int[] ret = new int[nums.length];
        for(int i : nums){
            if (i % 2 == 0) ret[p++] = i;
            else ret[q--] = i;
        }
        return ret;
    }
}
```

time:1 beat:100

## 1773. 统计匹配检索规则的物品数量

<https://leetcode-cn.com/problems/count-items-matching-a-rule/>

```java
class Solution {
    public int countMatches(List<List<String>> items, String ruleKey, String ruleValue) {
        return (int)items
                .stream()
                .filter(list -> {
                    if ("type".equals(ruleKey)) return list.get(0).equals(ruleValue);
                    else if ("color".equals(ruleKey)) return list.get(1).equals(ruleValue);
                    else if ("name".equals(ruleKey)) return list.get(2).equals(ruleValue);
                    return false;
                })
                .count();
    }
}
```

time:5 beat: 57

## 1848. 到目标元素的最小距离

<https://leetcode-cn.com/problems/minimum-distance-to-the-target-element/>

```java
class Solution {
    public int getMinDistance(int[] nums, int target, int start) {
        int min = -1;
        int minVal = 0;
        int tmp = 0;
        for(int i = 0;i<nums.length;i++) {
            if (nums[i] == target) {
                tmp = Math.abs(i - start);
                if (min == -1) {
                    min = i;
                    minVal = tmp;
                    continue;
                }
                if (tmp < minVal) {
                    min = i;
                    minVal = tmp;
                }
            }
        }
        return minVal;
    }
}
```

time: 1 beat:62

## 1450. 在既定时间做作业的学生人数

<https://leetcode-cn.com/problems/number-of-students-doing-homework-at-a-given-time/>

```java
class Solution {
    public int busyStudent(int[] startTime, int[] endTime, int queryTime) {
        int cnt = 0;
        for(int i = 0;i<startTime.length;i++){
            if (startTime[i] <= queryTime && queryTime <= endTime[i]) cnt++;
        }
        return cnt;
    }
}
```

time: 0

## 1859. 将句子排序

<https://leetcode-cn.com/problems/sorting-the-sentence/>

```java
class Solution {
    public String sortSentence(String s) {
        String[] a = s.split(" ");
        String[] ret = new String[a.length];
        for(String str : a){
            int index = Integer.parseInt(str.charAt(str.length() - 1) + "");
            ret[index - 1] = str.substring(0, str.length() - 1);
        }
        StringBuilder sb = new StringBuilder();
        for(int i = 0;i<ret.length;i++){
            sb.append(ret[i]);
            if (i != ret.length - 1) sb.append(" ");
        }
        return sb.toString();
    }
}
```

time:4 beat:28

## 面试题 04.08. 首个共同祖先

<https://leetcode-cn.com/problems/first-common-ancestor-lcci/>

```java
class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        List<TreeNode> list = new ArrayList<>();
        lowestCommonAncestor1(root, p, q, list);
        return list.get(list.size() - 1);
    }

    public void lowestCommonAncestor1(TreeNode root, TreeNode p, TreeNode q, List<TreeNode> list) {
        if (root == null) return;

        if (hasChild(p, q)) list.add(p);
        if(hasChild(q, p)) list.add(q);
        if (hasChild(root, p) && hasChild(root, q)) list.add(root);;
        
        lowestCommonAncestor1(root.left, p, q, list);
        lowestCommonAncestor1(root.right, p, q, list);
    }

    private boolean hasChild(TreeNode root, TreeNode child) {
        if (root == null) return false;
        if (root == child) return true;
        return hasChild(root.left, child) || hasChild(root.right, child);
    }
}
```

time:2500+ beat:5

## 1662. 检查两个字符串数组是否相等

<https://leetcode-cn.com/problems/check-if-two-string-arrays-are-equivalent/>

```java
class Solution {
    public boolean arrayStringsAreEqual(String[] word1, String[] word2) {
        String s1 = Arrays.stream(word1)
                    .collect(Collectors.joining());
        String s2 = Arrays.stream(word2)
                    .collect(Collectors.joining());
        return s1.equals(s2);
    }
}
```

time:3 beat:11

## 342. 4的幂

<https://leetcode-cn.com/problems/power-of-four/>

```java
class Solution {
    public boolean isPowerOfFour(int n) {
        int cnt = 0;
        int lim = (int)Math.sqrt(n);
        while(cnt <= lim) {
            if (Math.pow(4, cnt) == n) return true;
            cnt++;
        }
        return false;
    }
}
```

time:10 beat:8

## 面试题 17.04. 消失的数字

<https://leetcode-cn.com/problems/missing-number-lcci/>

```java
class Solution {
    public int missingNumber(int[] nums) {
        if (nums.length < 1) return 0;
        
        boolean[] map = new boolean[nums.length + 1];
        for(int i : nums) map[i] = true;
        for(int i = 0; i< map.length;i++) {
            if (!map[i]) return i;
        }
        return -1;
    }
}
```

time:1 beat:40

## 852. 山脉数组的峰顶索引

<https://leetcode-cn.com/problems/peak-index-in-a-mountain-array/>

```java
class Solution {
    public int peakIndexInMountainArray(int[] arr) {
        int max = 0;
        for(int i = 0;i<arr.length;i++){
            if (arr[i] > arr[max]) max = i;
        }
        return max;
    }
}
```

time:1 beat: 16

## 1869. 哪种连续子字符串更长

<https://leetcode-cn.com/problems/longer-contiguous-segments-of-ones-than-zeros/>

```java
class Solution {
    public boolean checkZeroOnes(String s) {
        return getMaxSeq(s, '1') > getMaxSeq(s, '0');
    }

    private int getMaxSeq(String s, char n) {
        if (s.length() == 1) return s.charAt(0) == n ? 1 : 0;
        int p=0,q=0;
        int max = 0;
        for(int i = 0;i<s.length();i++){
            char c = s.charAt(i);
            if (c == n) q = i;
            else p = i + 1;

            if (q - p > max) max = q - p;
        }
        return max;
    }
}
```

time:1 beat:98

## 1342. 将数字变成 0 的操作次数

<https://leetcode-cn.com/problems/number-of-steps-to-reduce-a-number-to-zero/>

```java
class Solution {
    public int numberOfSteps(int num) {
        int cnt = 0;
        while(num != 0) {
            if (num % 2 == 1) num--;
            else num /= 2;
            cnt++;
        }
        return cnt;
    }
}
```

time:0 beat:100

## 1302. 层数最深叶子节点的和

<https://leetcode-cn.com/problems/deepest-leaves-sum/>

```java
class Solution {
    private int maxDepth = 0;
    private int sum;
    public int deepestLeavesSum(TreeNode root) {
        travel(root, 0);
        calc(root, 0);
        return sum;
    }

    private void calc(TreeNode root, int depth){
        if (root == null) return;
        int curDepth = depth + 1;
        calc(root.left, curDepth);
        calc(root.right, curDepth);
        if (depth == maxDepth - 1) sum += root.val;
    }

    private void travel(TreeNode root, int depth){
        if (depth > maxDepth) maxDepth = depth;
        if (root == null) return;
        int curDepth = depth + 1;
        travel(root.left, curDepth);
        travel(root.right, curDepth);
    }
}
```

time:1 beat:100

## 1833. 雪糕的最大数量

<https://leetcode-cn.com/problems/maximum-ice-cream-bars/>

```java
class Solution {
    public int maxIceCream(int[] costs, int coins) {
        PriorityQueue<Integer> q = new PriorityQueue<>(Comparator.comparingInt(o -> o));
        for (int i : costs) {
            q.offer(i);
        }
        int cnt = 0;
        while(coins > 0) {
            Integer i = q.poll();
            if (i == null) return cnt;
            if (i > coins) return cnt;
            cnt++;
            coins -= i;
        }
        return cnt;
    }
}
```

time: 60+ beat: 5

## 1929. 数组串联

<https://leetcode-cn.com/problems/concatenation-of-array/>

```java
class Solution {
    public int[] getConcatenation(int[] nums) {
        int[] ans = new int[nums.length * 2];
        for(int i = 0;i<ans.length;i++){
            ans[i] = nums[i % nums.length];
        }
        return ans;
    }
}
```

time:1 beat:100

## 1920. 基于排列构建数组

<https://leetcode-cn.com/problems/build-array-from-permutation/>

```java
class Solution {
    public int[] buildArray(int[] nums) {
        int[] ans = new int[nums.length];
        for(int i = 0;i<nums.length;i++) ans[i] = nums[nums[i]];
        return ans;
    }
}
```

## 1720. 解码异或后的数组

<https://leetcode-cn.com/problems/decode-xored-array/>

```java
class Solution {
    public int[] decode(int[] encoded, int first) {
        int[] ans = new int[encoded.length + 1];
        ans[0] = first;
        for (int i = 1;i<ans.length;i++){
            ans[i] = encoded[i - 1] ^ ans[i - 1];
        }
        return ans;
    }
}
```

time:1 beat:100

## 1431. 拥有最多糖果的孩子

<https://leetcode-cn.com/problems/kids-with-the-greatest-number-of-candies/>

```java
class Solution {
    public List<Boolean> kidsWithCandies(int[] candies, int extraCandies) {
        int max = candies[0];
        for(int i : candies) {
            if (i > max) max = i;
        }
        List<Boolean> ans = new ArrayList<>(candies.length);
        for(int i : candies) {
            ans.add(i + extraCandies >= max);
        }
        return ans;
    }
}
```

time:0 beat:100

## 1656. 设计有序流

<https://leetcode-cn.com/problems/design-an-ordered-stream/>

```java
class OrderedStream {
    private String[] data;
    private int ptr = 1;
    public OrderedStream(int n) {
        data = new String[n + 1];
    }
    
    public List<String> insert(int idKey, String value) {
        data[idKey] = value;
        List<String> ans = new ArrayList<>();
        int i = ptr;
        for (;i< data.length;i++){
            if (data[i] != null) ans.add(data[i]);
            else break;
        }
        ptr = i % data.length;
        return ans;
    }
}
```

time: 78 beat: 98

## 219. 存在重复元素 II

<https://leetcode-cn.com/problems/contains-duplicate-ii/>

```java
class Solution {
    public boolean containsNearbyDuplicate(int[] nums, int k) {
        if (k == 0) return false;
        Map<Integer, Integer> map = new HashMap<>();
        for(int i = 0;i<nums.length;i++){
            if (map.containsKey(nums[i])) {
                if (Math.abs(map.get(nums[i]) - i) <= k) return true;
                else map.put(nums[i], i);
            }else {
                map.put(nums[i], i);
            }
        }
        return false;
    }
}
```

time:17 beat:40

## 1877. 数组中最大数对和的最小值

<https://leetcode-cn.com/problems/minimize-maximum-pair-sum-in-array/>

```java
class Solution {
    public int minPairSum(int[] nums) {
        Arrays.sort(nums);
        int ans = 0;
        int n = nums.length;
        int t = 0;
        for(int i=0;i<n;i++) {
            t = nums[i] + nums[n - i - 1];
            if (t > ans) ans = t;
        }
        return ans;
    }
}
```

time: 57 beat:98

## 268. 丢失的数字

<https://leetcode-cn.com/problems/missing-number/>

```java
class Solution {
    public int missingNumber(int[] nums) {
        int n = nums.length;
        int sum = (n * (n+1)) /2;
        for(int i : nums) sum -= i;
        return sum;
    }
}
```

time:0 beat:100

## 1704. 判断字符串的两半是否相似

<https://leetcode-cn.com/problems/determine-if-string-halves-are-alike/>

```java
class Solution {
    public boolean halvesAreAlike(String s) {
        int[] map = new int[128];
        map['a'] = 1;
        map['e'] = 1;
        map['i'] = 1;
        map['o'] = 1;
        map['u'] = 1;
        map['A'] = 1;
        map['E'] = 1;
        map['I'] = 1;
        map['O'] = 1;
        map['U'] = 1;
        int front = 0;
        int back = 0;
        int n = s.length()/2;
        for(int i = 0;i<n;i++) {
            char c1 = s.charAt(i);
            char c2 = s.charAt(i + n);
            if (map[c1] == 1) front++;
            if (map[c2] == 1) back++;
        }
        return front == back;
    }
}
```

time:2 beat:95


## 260. 只出现一次的数字 III

<https://leetcode-cn.com/problems/single-number-iii/>

```java
class Solution {
    public int[] singleNumber(int[] nums) {
        Map<Integer, Integer> map = new HashMap<>();
        for(int i : nums) {
            if (map.containsKey(i)) map.remove(i);
            else map.put(i, i);
        }
        int[] ans = new int[2];
        int cnt = 0;
        for(int key: map.keySet()) ans[cnt++] = key;
        return ans;
    }
}
```

time: 5 beat: 17

## 551. 学生出勤记录 I

<https://leetcode-cn.com/problems/student-attendance-record-i/>

```java
class Solution {
    public boolean checkRecord(String s) {
        int a = 2;
        boolean lateInTripleDay = false;

        for(int i = 0;i<s.length();i++) if (s.charAt(i) == 'A') a--;

        int p = 0, q = 2;
        while(q < s.length()) {
            if (s.charAt(p) == 'L' && s.charAt(q-1) == 'L' && s.charAt(q) == 'L') lateInTripleDay = true;
            p++;q++;
        }

        return a > 0 && !lateInTripleDay;
    }
}
```

time：1 beat: 41

## 507. 完美数

<https://leetcode-cn.com/problems/perfect-number/>

```java
class Solution {
    public boolean checkPerfectNumber(int num) {
        if (num == 1 || num == 2) return false;
        long sum = 0;
        for(int i = 1;i<= num / 2;i++){
            if (num % i == 0) {
                sum += i;
            }
        }
        return sum == num ;
    }
}
```

time: 2000+ beat:20

## 71. 简化路径

<https://leetcode-cn.com/problems/simplify-path/>

```java
class Solution {
    public String simplifyPath(String path) {
        String[] dirs = path.split("/");
        LinkedList<String> s = new LinkedList<>();
        for(String dir: dirs) {
            if (dir == null || "".equals(dir)) {
                continue;
            }
            if (".".equals(dir)) {
                continue;
            }
            if ("..".equals(dir)) {
                if (!s.isEmpty()) s.pop();
                continue;
            }
            s.push(dir);
        }
        Collections.reverse(s);
        return "/" + s.stream().collect(Collectors.joining("/"));
    }
}
```

time:8 beat:16

## 1614. 括号的最大嵌套深度

<https://leetcode-cn.com/problems/maximum-nesting-depth-of-the-parentheses/>

```java
class Solution {
    public int maxDepth(String s) {
        int max = 0;
        int cur = 0;
        for(int i = 0;i<s.length();i++){
            char c = s.charAt(i);
            if (c == '('){
                cur++;
                if (cur > max) max = cur;
            }else if (c == ')'){
                cur--;
            }
        }
        return max;
    }
}
```

time:0 beat:100

## 98. 验证二叉搜索树

<https://leetcode-cn.com/problems/validate-binary-search-tree/>

```java
class Solution {
    public boolean isValidBST(TreeNode root) {
        List<Integer> list = new ArrayList<>(16);
        midTravel(root, list);
        if (list.size() < 2) return true;
        for(int i = 1; i < list.size();i++) {
            if (list.get(i) <= list.get(i - 1)) return false;
        }
        return true;
    }

    private void midTravel(TreeNode root, List<Integer> list) {
        if (root == null) return;
        if (root.left != null) midTravel(root.left, list);
        list.add(root.val);
        if (root.right != null) midTravel(root.right, list);
    }
}
```

time:2 beat: 18

## 334. 递增的三元子序列

<https://leetcode-cn.com/problems/increasing-triplet-subsequence/>

```java
class Solution {
    public boolean increasingTriplet(int[] nums) {
        if (nums.length < 3) return false;

        // 每轮循环最小的三个值
        int a = Integer.MAX_VALUE, b = Integer.MAX_VALUE, c = Integer.MAX_VALUE;
        // 记录a,b,c是否存在
        boolean a1 = false, b1 = false , c1 = false;
        for(int i : nums) {
            if (i <= a) {
                a = i;
                a1 = true;
            }
            if (i <= b && i > a) {
                b = i;
                b1 = true;
            }
            if (i <= c && i > a && i > b) {
                c = i;
                c1 = true;
            }

            if (a1 && b1 && c1 && a < b && b < c ) return true;
        }
        return false;

    }
}
```

time:3, beat:23

## 2114. 句子中的最多单词数

<https://leetcode-cn.com/problems/maximum-number-of-words-found-in-sentences/>

```java
class Solution {
    public int mostWordsFound(String[] sentences) {
        int max = 0;
        for(String s :sentences) {
            int cmax = 1;
            for(int i = 0;i<s.length();i++) if (s.charAt(i) == ' ') cmax++;
            if (cmax > max) max = cmax;
        }
        return max;
    }
}
```

time:3 beat:68

## 539. 最小时间差

<https://leetcode-cn.com/problems/minimum-time-difference/>

```java
class Solution {
    public int findMinDifference(List<String> timePoints) {
        if (timePoints.size()>1440) return 0;

        List<Integer> list = new ArrayList<>(16);
        for(String time: timePoints) {
            String[] arr = time.split(":");
            list.add(Integer.parseInt(arr[0])*60 + Integer.parseInt(arr[1]));
        }
        Collections.sort(list);
        int min = Integer.MAX_VALUE;
        for(int i = 1;i<list.size();i++) {
            min = Math.min(min, list.get(i) - list.get(i-1));
        }
        min = Math.min(min, list.get(0) + 1440 - list.get(list.size()-1));
        return min;
    }
}
```

time:4 beat:69

## 155. 最小栈

<https://leetcode-cn.com/problems/min-stack/>

```java
class MinStack {

    LinkedList<Integer> data = new LinkedList<>();

    private int min = Integer.MAX_VALUE;

    public MinStack() {

    }
    
    public void push(int val) {
        if (val < min) min = val;
        data.push(val);
    }
    
    public void pop() {
        int val = data.pop();
        if (val == min) {
            min = Integer.MAX_VALUE;
            for(int i : data) if (i < min) min = i;
        }
    }
    
    public int top() {
        return data.get(0);
    }
    
    public int getMin() {
        return min;
    }
}
```

time:4 beat:99

## 1688. 比赛中的配对次数

<https://leetcode-cn.com/problems/count-of-matches-in-tournament/>

```java
class Solution {
    public int numberOfMatches(int n) {
        int cnt = 0;
        while(n > 1) {
            if (n % 2 == 0) {
                cnt += n/2;
                n = n/2;
                continue;
            }
            if (n % 2 == 1) {
                cnt += (n-1) / 2;
                n = n - ((n-1) / 2);
            }
        }
        return cnt;
    }
}
```

time: 0 beat:100

## 383. 赎金信

<https://leetcode-cn.com/problems/ransom-note/>

```java
class Solution {
    public boolean canConstruct(String ransomNote, String magazine) {
        int[] a = new int[128];
        int[] b = new int[128];
        for(int i = 0;i<magazine.length();i++) b[magazine.charAt(i)]++;
        for(int i = 0;i<ransomNote.length();i++) a[ransomNote.charAt(i)]++;

        for(int i = 0;i<128;i++) if (b[i] < a[i]) return false;
        
        return true;
    }
}
```

time:3 beat:33

## 884. 两句话中的不常见单词

<https://leetcode-cn.com/problems/uncommon-words-from-two-sentences/>

```java
class Solution {
    public String[] uncommonFromSentences(String s1, String s2) {
        Map<String, Integer> map1 = new HashMap<>(16);
        Map<String, Integer> map2 = new HashMap<>(16);
        for(var s: s1.split(" ")){
            Integer val = map1.get(s);
            if (val != null) map1.put(s, val + 1);
            else map1.put(s, 1);
        }

        for(var s: s2.split(" ")){
            Integer val = map2.get(s);
            if (val != null) map2.put(s, val + 1);
            else map2.put(s, 1);
        }

        List<String> result = new ArrayList<>(16);
        for(var key: map1.keySet()) {
            if (map1.get(key) == 1 && map2.get(key) == null) result.add(key);
        }
        for(var key: map2.keySet()) {
            if (map2.get(key) == 1 && map1.get(key) == null) result.add(key);
        }

        return result.toArray(new String[]{});
    }
}
```

time:2 beat:99

## 1763. 最长的美好子字符串

<https://leetcode-cn.com/problems/longest-nice-substring/>

```java
class Solution {
    public String longestNiceSubstring(String s) {
        
        String result = "";
        for(int i = 0;i<s.length()-1;i++){
            for(int j = i+1;j<=s.length();j++) {
                String c = s.substring(i, j);
                if (check(c) && c.length() > result.length()) {
                    result = c;
                }
            }
        }
        return result;
    }

    private boolean check(String s) {
        if (s.length() <=1) return false;
        int[] lowerMap = new int[128];
        int[] upperMap = new int[128];

        for(int i = 0;i<s.length();i++){
            char c = s.charAt(i);
            if (c >=97 ) lowerMap[c]++;
            if (c <= 90) upperMap[c+32]++;
        }
        for(int i = 0;i<128;i++){
            if ((lowerMap[i] == 0 && upperMap[i] != 0) || (upperMap[i] == 0 && lowerMap[i] != 0)) return false;
        }
        return true;
    }
}
```

time:35 beat:32

## 2000. 反转单词前缀

<https://leetcode-cn.com/problems/reverse-prefix-of-word/>

```java
class Solution {
    public String reversePrefix(String word, char ch) {
        int index = -1;
        for(int i = 0;i<word.length();i++){
            if (word.charAt(i) == ch) {
                index = i;
                break;
            }
        }
        if (index == -1) return word;
        StringBuilder sb = new StringBuilder();
        for(int i = 0;i<word.length();i++){
            if (i <= index) sb.append(word.charAt(index - i));
            else sb.append(word.charAt(i));
        }
        return sb.toString();
    }
}
```

time:0 beat:100

## 1748. 唯一元素的和

<https://leetcode-cn.com/problems/sum-of-unique-elements/>

```java
class Solution {
    public int sumOfUnique(int[] nums) {
        int[] map = new int[101];
        for(int i : nums) map[i]++;

        int sum = 0;
        for(int i = 0; i < map.length; i++) {
            if (map[i] == 1) sum += i;
        }
        return sum;
    }
}
```

time:0 beat:100

## 2006. 差的绝对值为 K 的数对数目

<https://leetcode-cn.com/problems/count-number-of-pairs-with-absolute-difference-k/>

```java
class Solution {
    public int countKDifference(int[] nums, int k) {
        int cnt = 0;
        for(int i = 0;i<nums.length;i++) {
            for(int j = 0;j<nums.length;j++) if (i < j && Math.abs(nums[i] - nums[j]) == k) cnt++;
        }
        return cnt;
    }
}
```

time:9 beat:6

## 1380. 矩阵中的幸运数

<https://leetcode-cn.com/problems/lucky-numbers-in-a-matrix/>

```java
class Solution {
    public List<Integer> luckyNumbers (int[][] matrix) {
        List<Integer> ret = new ArrayList<>(16);
        Set<Integer> maxSet = new HashSet<>();

        for(int i = 0;i<matrix[0].length;i++) {
            int max = Integer.MIN_VALUE;
            for(int j = 0;j<matrix.length;j++) {
                if (matrix[j][i] > max) max = matrix[j][i];
            }
            maxSet.add(max);
        }

        for(int i = 0;i<matrix.length;i++) {
            int min = Integer.MAX_VALUE;
            for(int j = 0;j<matrix[i].length;j++) {
                if (matrix[i][j] < min) min = matrix[i][j];
            }

            if (maxSet.contains(min)) ret.add(min);
        }
        return ret;
    }
}
```

time:2 beat:84

## 1791. 找出星型图的中心节点

<https://leetcode-cn.com/problems/find-center-of-star-graph/>

```java
class Solution {
    public int findCenter(int[][] edges) {
        int[] map = new int[100001];
        for(int [] i: edges) {
            map[i[0]]++;
            map[i[1]]++;
        }
        for(int i = 0;i<map.length;i++) if (map[i] == edges.length) return i;
        return -1;
    }
}
```

time:3 beat:21

## 657. 机器人能否返回原点

<https://leetcode-cn.com/problems/robot-return-to-origin/>

```java
class Solution {
    public boolean judgeCircle(String moves) {
        int x = 0;
        int y = 0;
        for(int i = 0;i < moves.length(); i++) {
            char c = moves.charAt(i);
            if (c == 'U') y++;
            if (c == 'D') y--;
            if (c == 'L') x--;
            if (c == 'R') x++;
        }
        return x == 0 && y == 0;
    }
}
```

time:7 beat:41

## 1408. 数组中的字符串匹配

<https://leetcode-cn.com/problems/string-matching-in-an-array/>

```java
class Solution {
    public List<String> stringMatching(String[] words) {
        List<String> result = new ArrayList<>(16);
        for(String i : words) {
            for(String j : words) {
                if (j.equals(i)) continue;
                if (j.contains(i)) {
                    result.add(i);
                    break;
                }
            }
        }
        return result;
    }
}
```

time:4 beat:62

## 1507. 转变日期格式

<https://leetcode-cn.com/problems/reformat-date/>

```java
class Solution {
    public String reformatDate(String date) {
        String[] arr = date.split(" ");
        String year = arr[2];
        String month = "";
        String day = arr[0].replaceAll("st", "")
                            .replaceAll("nd", "")
                            .replaceAll("rd", "")
                            .replaceAll("th", "");
        if (day.length() == 1) day = "0" + day;
        String[] map = new String[]{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        for(int i = 0;i<map.length;i++) {
            if (map[i].equals(arr[1])) {
                if (i < 9) {
                    month = "0" + (i+1);
                }else {
                    month = (i+1) + "";
                }
            }
        }
        return year+"-"+month+"-"+day;
    }
}
```

time:12 beat:8

## 1207. 独一无二的出现次数

<https://leetcode-cn.com/problems/unique-number-of-occurrences/>

```java
class Solution {
    public boolean uniqueOccurrences(int[] arr) {
        int[] map1 = new int[2002];
        for(int i : arr) map1[i+1000]++;
        int[] map2 = new int[1001];
        for(int i: map1) if (i >= 1) map2[i]++;

        for(int i : map2) if (i > 1) return false;
        return true;
    }
}
```

time:1 beat:99

## 1437. 是否所有 1 都至少相隔 k 个元素

<https://leetcode-cn.com/problems/check-if-all-1s-are-at-least-length-k-places-away/>

```java
class Solution {
    public boolean kLengthApart(int[] nums, int k) {
        int previous = -1;
        for(int i = 0;i < nums.length; i++) {
            if (nums[i] == 1 && previous == -1) {
                previous = i;
                continue;
            }
            if (nums[i] == 1 && i - previous - 1 < k) return false;
            if (nums[i] == 1) previous = i;
        }
        return true;
    }
}
```

time:2 beat:11

## 482. 密钥格式化

<https://leetcode-cn.com/problems/license-key-formatting/>

```java
class Solution {
    public String licenseKeyFormatting(String s, int k) {
        s = replaceAllDash(s);
        if (s.length() < k) return s;
        int first = s.length() % k;
        StringBuilder sb = new StringBuilder();
        if (first != 0) {
            for(int i = 0;i<first;i++) sb.append(s.charAt(i));
            sb.append("-");
        }
        for(int i = first;i<s.length();i+=k) {
            for(int j =i;j <k+i;j++) {
                sb.append(s.charAt(j));
            }
            if (i < s.length()-k) sb.append("-");
        }
        return sb.toString();
    }

    private String replaceAllDash(String s) {
        StringBuilder sb = new StringBuilder();

        for(int i = 0;i<s.length();i++) {
            char c = s.charAt(i);
            if (c == '-') continue;
            sb.append(c);
        }
        return sb.toString().toUpperCase();
    }
}
```

time:14 beat:44

## 414. 第三大的数

<https://leetcode-cn.com/problems/third-maximum-number/>

```java
class Solution {
    public int thirdMax(int[] nums) {
        if (nums.length < 2) return nums[0];
        int[] cn = new int[]{0, -1, -1};

        for(int i = 0;i < nums.length; i++) {
            if (nums[cn[0]] < nums[i]) cn[0] = i;
        }
        for(int i = 0;i < nums.length; i++) {
            if (cn[1] == -1) {
                if (nums[i] < nums[cn[0]]) cn[1] = i;
                continue;
            }
            if (nums[cn[1]] < nums[i] && nums[i] < nums[cn[0]]) cn[1] = i;
        }
        for(int i = 0;i < nums.length; i++) {
            if (cn[2] == -1 && cn[1] != -1) {
                if (nums[i] < nums[cn[1]] && nums[i] < nums[cn[0]]) cn[2] = i;
                continue;
            }
            if (cn[1] != -1 && nums[cn[2]] < nums[i] && nums[i] < nums[cn[1]] && nums[i] < nums[cn[0]]) cn[2] = i;
        }
        if (cn[2] != -1) return nums[cn[2]];
        return nums[cn[0]];
    }
}
```

time:1 beat:86

## 150. 逆波兰表达式求值

<https://leetcode-cn.com/problems/evaluate-reverse-polish-notation/>

```java
class Solution {
    public int evalRPN(String[] tokens) {
        LinkedList<Integer> s = new LinkedList<>();
        for(String i: tokens) {
            if (i.equals("+")){
                int[] nums = pop2(s);
                s.push(nums[1] + nums[0]);
            }else if (i.equals("-")) {
                int[] nums = pop2(s);
                s.push(nums[1] - nums[0]);
            }else if (i.equals("*")) {
                int[] nums = pop2(s);
                s.push(nums[1] * nums[0]);
            } else if (i.equals("/")) {
                int[] nums = pop2(s);
                s.push((int)(nums[1] / nums[0]));
            }else {
                s.push(Integer.parseInt(i));
            }
        }
        return s.pop();
    }

    private int[] pop2(LinkedList<Integer> s) {
        return new int[]{s.pop(), s.pop()};
    }
}
```

time: 4 beat: 95
