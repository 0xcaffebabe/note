import { jsPDF } from "jspdf"
import html2Canvas from 'html2canvas'

function downloadPdf(title: string, isPrint: boolean = false) {
  // let title = "银行协查-身份证协查"
    // 如果这个页面有左右移动,canvas 也要做响应的移动，不然会出现canvas 内容不全
    const xOffset = window.pageXOffset
    // 避免笔下误 灯下黑 统一写
    const A4_WIDTH = 592.28
    // const A4_HEIGHT = 841.89
    const A4_HEIGHT = 880
    let printDom:HTMLElement = document.querySelector('.markdown-section')!;
    // 根据A4的宽高计算DOM页面一页应该对应的高度
    let pageHeight = printDom.offsetWidth / A4_WIDTH * A4_HEIGHT
    // 以上完成dom层面的分页 可以转为图片进一步处理了
    html2Canvas(printDom, { height: printDom.offsetHeight, width: printDom.offsetWidth, scrollX: -xOffset, allowTaint: true, scale: window.devicePixelRatio }).then(canvas => {
      // 有一点重复的代码
      let contentWidth = canvas.width
      let contentHeight = canvas.height
      let pageHeight = contentWidth / A4_WIDTH * A4_HEIGHT
      let leftHeight = contentHeight
      let position = 0

      let imgWidth = A4_WIDTH
      let imgHeight = A4_WIDTH / contentWidth * contentHeight
      let pageData = canvas.toDataURL('image/jpeg', 1.0)
      //计算分页的pdf 
      let PDF = new jsPDF('p', 'px', [imgWidth, imgHeight])
      PDF.addImage(pageData, 'JPEG', 0, 0, imgWidth, imgHeight)
      // if (leftHeight <= pageHeight) {
      // } else {
      //   while (leftHeight > 0) {
      //     PDF.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight)
      //     leftHeight -= pageHeight
      //     position -= A4_HEIGHT
      //     if (leftHeight > 0) {
      //       PDF.addPage()
      //     }
      //   }
      // }
      if(isPrint) {
        // save方法直接下载
        PDF.save(title + '.pdf')
      }else {
        // 打开新页签预览
        PDF.output('dataurlnewwindow')
      }
    })
}

export default {
  downloadPdf
}