/** 原生配对产生的授权；同一 id 仅可访问与之绑定的精确 Origin。 */
export type Authorization = {
  id: string;
  origin: string;
};
