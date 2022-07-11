import Content from "@/dto/Content";
import MindNode from "@/dto/mind/MindNode";

export namespace MindUtils {
  function _mindConvert(toc: Content[]): MindNode[] {
    let counter: number = 0;
    return toc.map((i) => {
      return {
        id: i.link,
        topic: i.name,
        children: _mindConvert(i.chidren),
        direction: counter++ % 2 == 0 ? "right" : "left",
      } as MindNode;
    });
  }

  export function mindConvert(toc: Content[]): MindNode[] {
    const minds = _mindConvert(toc);
    if (minds.length > 1) {
      return [{
        id: "root",
        topic: "root",
        expanded: true,
        children: minds,
        direction: "left",
      }];
    } else {
      return minds;
    }
  }
}