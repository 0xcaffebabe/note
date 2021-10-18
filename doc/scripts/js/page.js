console.log("hello page");

gitbook.events.on('page.change', replaceTocMenu);
gitbook.events.on('page.change', dirNavigate);
gitbook.events.on('page.change', hijackSearch);


/**
 * 覆盖toc插件样式
 */
function replaceTocMenu() {
  const menu = document.querySelector(".page-toc-menu");
  const button = document.querySelector(".page-toc-button")
  if (menu) {
    menu.classList.replace('page-toc-menu', 'page-toc-menu1');
  }
  if (button) {
    button.classList.replace('page-toc-button', 'page-toc-button1');
  }
}

/**
 * 添加事件以实现目录导航
 */
function dirNavigate() {
  $('.book-body,.body-inner').on('scroll', function () {
    const idList = document.querySelectorAll('.markdown-section h1, .markdown-section h2, .markdown-section h3, .markdown-section h4 .markdown-section h5, .markdown-section h6');
    let node = null;
    for (let i = 0; i < idList.length; i++) {
      if ($(window).scrollTop() > $(idList[i]).offset().top - 100) {
        node = idList[i];
      }
      // 滚动到顶部特殊处理
      if ($(this).scrollTop() + $(this).height() == $(document).height()) {
        node = idList[0];
      }
    }
    if (node != null) {
      const previousNode = document.querySelector('.page-toc-menu1 .active');
      if (previousNode != null) {
        previousNode.classList.remove("active");
      }
      document.querySelector(`.page-toc-menu1 a[href='#${node.id}']`).classList.add("active");
    }
  });
}

let searchTimer = null;
const MAX_DESCRIPTION_SIZE = 500;

/**
 * 劫持已有的搜索功能 覆写实现
 *
 */
function hijackSearch(){
  let elm = document.querySelector('#book-search-input')
  if (elm) {
    $(elm.querySelector("input")).replaceWith("<input placeholder='键入以搜索' type='text'/>")
    elm.id = 'book-search-input1';
    $(elm.querySelector("input")).on("keyup", function(e){
      clearTimeout(searchTimer);
      const kw = $(elm.querySelector("input")).val();
      searchTimer = setTimeout(() => {
        search(kw)
        .then(results => {
          displayResults({
            count: results.length,
            query: kw,
            results: results.map(v => {
              v.title = v.hurl;
              v.body = v.hbody;
              return v;
            })
          })
        })
      }, 1000);
    });
  }
}

/**
 * 展示搜索结果
 * @param {*} res
 * {count: 搜索得到的数量, query: 搜索关键词, results: [
 *  {
 *    title: 页面标题
 *    url: 页面url
 *    body: 页面内容
 *  }
 * ] }
 */
function displayResults(res) {
  
  $bookSearchResults = $('#book-search-results');
  $searchList = $bookSearchResults.find('.search-results-list');
  $searchTitle = $bookSearchResults.find('.search-results-title');
  $searchResultsCount = $searchTitle.find('.search-results-count');
  $searchQuery = $searchTitle.find('.search-query');

  $bookSearchResults.addClass('open');

  var noResults = res.count == 0;
  $bookSearchResults.toggleClass('no-results', noResults);

  // Clear old results
  $searchList.empty();

  // Display title for research
  $searchResultsCount.text(res.count);
  $searchQuery.text(res.query);

  // Create an <li> element for each result
  res.results.forEach(function(item) {
      var $li = $('<li>', {
          'class': 'search-results-item'
      });

      var $title = $('<h3>');

      var $link = $('<a>', {
          'href': gitbook.state.basePath + '/' + item.url.replace(".md", ".html") + '?h=' + encodeURIComponent(res.query),
          'html': item.title,
          'data-is-search': 1
      });

      if ($link[0].href.split('?')[0] === location.href.split('?')[0]) {
          $link[0].setAttribute('data-need-reload', 1);
      }

      const contentList = splitContent(item.body.trim());
      let $content = $("<p>");
      for(let content of contentList) {
        if (content.length == MAX_DESCRIPTION_SIZE) {
          $("<p>").html(content + "...").appendTo($content);
        }else{
          $("<p>").html(content).appendTo($content);
        }
      }

      $link.appendTo($title);
      $title.appendTo($li);
      $content.appendTo($li);
      $li.appendTo($searchList);
  });
  $('.body-inner').scrollTop(0);
}

function splitContent(content){
  if (!content) {
    return [""];
  }
  if (content.length < MAX_DESCRIPTION_SIZE) {
    return [content];
  }
  let strs = []
  for(let i = 0; i < content.length; i+= 500) {
    strs.push(content.substring(i, Math.min(i + 500, content.length)))
  }
  return strs.filter(s => s.indexOf("<em>") !== -1);
}

async function search(kw) {
  const client = algoliasearch('K9I7PAT3CY', '8f3ec5043331dedbccce916154fc0162');
  const index = client.initIndex('note');
  const hits = await index.search(kw, {hitsPerPage: 200});
  if (hits) {
    return hits.hits.map(v => {
      return {url: v.url, body: v.txt, hurl:v._highlightResult.url.value, hbody: v._highlightResult.txt.value}
    })
  }
}

replaceTocMenu();