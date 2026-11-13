import type { UserProfile } from '../types.ts'
import { CARLOS_SOTO, ERIC_RIVERA } from './signers.ts'
import { TERMS_A } from './terms.ts'

/** Perfiles iniciales (se podrán editar en la Fase 5). */
export const SEED_PROFILES: UserProfile[] = [
  {
    id: 'dmr',
    name: 'Domardi Machin',
    initials: 'DMR',
    preferredTitle: 'ETS CORP. P R O P O S A L',
    preferredTermsId: TERMS_A.id,
    defaultSignerId: ERIC_RIVERA.id,
  },
  {
    id: 'csn',
    name: 'Carlos Soto Navarro',
    initials: 'CSN',
    preferredTitle: 'P R O P O S A L',
    preferredTermsId: TERMS_A.id,
    defaultSignerId: CARLOS_SOTO.id,
  },
]
