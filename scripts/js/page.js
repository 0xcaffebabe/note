console.log("hello page");

gitbook.events.on('page.change', replaceTocMenu);
gitbook.events.on('page.change', dirNavigate);


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
      if ($(window).scrollTop() > $(idList[i]).offset().top - 100 || $(this).scrollTop() + $(this).height() == $(document).height()) {
        node = idList[i];
      }
    }
    if (node != null) {
      const previousNode = document.querySelector('.page-toc-menu1 .active');
      if (previousNode != null) {
        previousNode.classList.remove("active");
      }
      console.log(node);
      document.querySelector(`.page-toc-menu1 a[href='#${node.id}']`).classList.add("active");
    }
  });
}

replaceTocMenu();