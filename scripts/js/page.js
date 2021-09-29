console.log("hello page");

gitbook.events.on('page.change', replaceTocMenu);

function replaceTocMenu(){
  const menu = document.querySelector(".page-toc-menu");
  const button = document.querySelector(".page-toc-button")
  if (menu) {
    menu.classList.replace('page-toc-menu', 'page-toc-menu1');
  }
  if (button) {
    button.classList.replace('page-toc-button', 'page-toc-button1');
  }
}

replaceTocMenu();