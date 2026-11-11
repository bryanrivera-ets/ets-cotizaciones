import type { Signer } from '../types.ts'

/**
 * Firmantes actuales (lista editable en la Fase 5).
 * `signatureFont` es la familia manuscrita de cada uno; las fuentes libres definitivas
 * se eligen en la Fase 3 (originales: Bradley Hand ITC y Dreaming Outloud Script Pro).
 */
export const ERIC_RIVERA: Signer = {
  id: 'eric-rivera',
  name: 'Eric Rivera',
  position: 'President',
  signatureFont: 'signature-1',
}

export const CARLOS_SOTO: Signer = {
  id: 'carlos-soto',
  name: 'Carlos A. Soto',
  position: 'Senior Project Manager',
  signatureFont: 'signature-2',
}

export const SEED_SIGNERS: Signer[] = [ERIC_RIVERA, CARLOS_SOTO]
