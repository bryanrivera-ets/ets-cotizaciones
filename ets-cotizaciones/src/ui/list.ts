/** Mueve un elemento dentro de una lista (para usar dentro de un borrador de immer). */
export function move<T>(list: T[], from: number, to: number): void {
  if (to < 0 || to >= list.length) return
  const [item] = list.splice(from, 1)
  list.splice(to, 0, item)
}
