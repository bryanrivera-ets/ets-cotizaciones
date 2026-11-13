import type { Quote } from '../../domain/types.ts'

/**
 * Función para modificar la cotización: recibe un "borrador" (immer) que se puede mutar
 * directamente; immer produce un objeto nuevo sin tocar el anterior.
 */
export type Update<T = Quote> = (recipe: (draft: T) => void) => void
