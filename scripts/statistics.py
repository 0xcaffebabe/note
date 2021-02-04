# -*- coding: utf-8 -*
import os, _thread, jieba, re, base
from wordcloud import WordCloud
from PIL import Image, ImageFont, ImageDraw

all_file_list = base.listAllFile('./')
md_file_list = base.listAllMdFile()

def noteLineCount():
    count = 0
    for item in md_file_list:
        file = open(item, 'rb')
        count = count + len(file.readlines())
    print("笔记行数:", count)


def noteWorldFrequency():
    map = {}
    for item in md_file_list:
        file = open(item, 'rb')
        text = str(file.read(), encoding="utf-8")
        text = filterSpecialSymbol(text)
        seg_list = jieba.cut_for_search(text.strip())  # 默认是精确模式
        for j in seg_list:
            if j == '':
                continue
            if isStopWord(j):
                continue
            if map.get(j) == None:
                map[j] = 1
            else:
                map[j] = map[j]+1
    map = sorted(map.items(), key=lambda item: item[1], reverse=True)
    return map


def filterSpecialSymbol(str):
    r = '[’!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]+'
    str = re.sub(r, '', str)
    r1 = "[\u0060|\u0021-\u002c|\u002e-\u002f|\u003a-\u003f|\u2200-\u22ff|\uFB00-\uFFFD|\u2E80-\u33FF]"
    str = re.sub(r1, '', str)
    str = re.sub(' ', '', str)
    str = re.sub('\n', '', str)
    str = re.sub('\t', '', str)
    return str


def isStopWord(str):
    if len(str) <= 1:
        return True
    stopWords = ['的', '是', '在', '一个', '和',
                 '与', '批注', '可以', '使用', '通过', 'md', '据库', '这个', '截图', '没有',
                 '进行', '如果', '需要', '务器', '屏幕', '不会', '就是'
                 ]
    for item in stopWords:
        if item == str:
            return True
    return False


def generateWordCloud():
    list = noteWorldFrequency()
    # 设置词云
    wc = WordCloud(background_color="white",  # 设置背景颜色
                   # mask = "图片",  #设置背景图片
                   max_words=200000,  # 设置最大显示的字数
                   # stopwords = "", #设置停用词
                   font_path="font.ttf",
                   width=1000, height=500, margin=2,
                   # 设置中文字体，使得词云可以显示（词云默认字体是“DroidSansMono.ttf字体库”，不支持中文）
                   max_font_size=120,  # 设置字体最大值
                   relative_scaling=.8,
                   prefer_horizontal=90,
                   random_state=256,  # 设置有多少种随机生成状态，即有多少种配色方案
                   )
    text = ''
    total = 0
    count = 0
    map = {}
    for i, j in list:
        total = total+j
    for i, j in list:
        count = count + 1
        if count == 1:
            continue
        map[i] = j/total*1000.0
    myword = wc.generate_from_frequencies(map)  # 生成词云
    myword.to_file('./wordcloud.png')
    base.log('笔记词云生成成功')


def statisticNote():
    text = ''
    chapterCount = len(md_file_list)
    for item in md_file_list:
        file = open(item, 'rb')
        text += str(file.read(), encoding="utf-8") + '\n'
        file.close()
    text = filterSpecialSymbol(text)
    wordNum = len(text.strip())
    return chapterCount, wordNum


def statisticImg():
    count = 0
    suffix = ['png', 'jpg', 'svg', 'jpeg', 'jiff', 'bmp']
    for item in all_file_list:
        if item[item.rfind('.')+1:] in suffix:
            count += 1
    return count


def generateNoteInfo():
    chapterCount, wordNum = statisticNote()
    text = \
        u'生成时间:' + base.current_time() + "\n"\
        + '仓库尺寸:' + str(getRepositorySize()) + 'MB' + '\n'\
        + '章节数:' + str(chapterCount) + '章' + '\n'\
        + '总字数:' + "{:,}".format(wordNum) + '字' + '\n'\
        + '图片数:' + str(statisticImg()) + '张图片\n'\
        + '代码统计:' + codeFrequency()
    im = Image.new("RGB", (1000, 140), (255, 255, 255))
    dr = ImageDraw.Draw(im)
    font = ImageFont.truetype('font.ttf', 16)
    dr.text((10, 5), text, font=font, fill="#000000")
    im.save('info.png')
    base.log('笔记统计信息生成成功')


def codeFrequency():
    map = {}
    alias = {'js': 'javascript', 'sh': 'shell', 'py': 'python'}
    total = 0
    for item in md_file_list:
        file = open(item, 'rb')
        for item1 in file.readlines():
            text = str(item1, encoding='utf-8')
            text = text.strip()
            if '```' in text:
                text = text.replace('```', '')
                if text:
                    if '`' in text or len(text) > 11:
                        continue
                    total = total + 1
                    if text in alias:
                        text = alias[text]
                    if text in map:
                        map[text] = map[text] + 1
                    else:
                        map[text] = 1
    # 排序
    map = sorted(map.items(), key=lambda item: item[1], reverse=True)
    text = ''
    count = 0
    for i, j in map:
        if count > 7:
            break
        text = text + i + ':' + str(int(j/total*100)) + '% '
        count = count + 1
    return text


def getRepositorySize():
    total = 0
    for item in all_file_list:
        total += os.path.getsize(item)
    return round(total/float(1024*1024), 2)


generateWordCloud()
generateNoteInfo()
