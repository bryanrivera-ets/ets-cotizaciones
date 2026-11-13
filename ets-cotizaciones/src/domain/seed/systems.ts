import type { ScopeLevel, SystemTemplate } from '../types.ts'

/** Carga inicial de la biblioteca de sistemas, tomada de referencia/ejemplos/. */
const sc = (prefix: string, items: [ScopeLevel, string][]) =>
  items.map(([level, text], i) => ({ id: `${prefix}-${i + 1}`, level, text }))

const TBP = (system: string) => `Installation of ${system} on the reference project which consist on the following:`

export const SEED_SYSTEMS: SystemTemplate[] = [
  {
    id: 'sys-epoxy-terrazzo',
    name: 'Epoxy Terrazzo (reemplazo)',
    toBePerformed: TBP('Epoxy Terrazzo System'),
    scope: sc('sys-et', [
      [1, 'Removal of existing Terrazzo System'],
      [1, 'Installation of Sikafloor Purcem 22NA @ ½”'],
      [1, 'Surface preparation with diamond grinder'],
      [1, 'Euco 700 (For Joints as needed)'],
      [1, 'Installation of:'],
      [3, 'Epoxy Terrazzo System @ ¼”'],
      [1, 'Polish surface with diamond #30 & 80'],
      [1, 'Application of Epoxy terrazzo Grout'],
      [1, 'Polish surface with diamond #50, #100 & #200'],
      [1, 'Application of Non-Skid Urethane Sealer'],
    ]),
  },
  {
    id: 'sys-sikafloor-264',
    name: 'Sikafloor 264 (Base Coat + Top Coat)',
    toBePerformed: TBP('Sikafloor System'),
    scope: sc('sys-264', [
      [1, 'Removal of existing top coating'],
      [1, 'Surface preparation with diamond grinder'],
      [1, 'Installation of:'],
      [2, 'Sikafloor 264 (Color Traffic Gray) Base Coat'],
      [2, 'Sikafloor 264 (Color Traffic Gray) Top Coat'],
    ]),
  },
  {
    id: 'sys-sikagard-hygiene',
    name: 'Sikagard Hygiene HD Wall Coating',
    toBePerformed: TBP('Sikagard Hygiene HD Wall Coating System'),
    scope: sc('sys-sg', [
      [1, 'Surface preparation with diamond grinder'],
      [1, 'Installation of:'],
      [2, 'Sikafloor 2570 WB Primer Coat'],
      [2, 'Sikagard-203W Body Coat'],
      [2, 'Sikagard-307W Topcoat'],
    ]),
  },
  {
    id: 'sys-sikafloor-tg-joint',
    name: 'Sikafloor TG + Joint Repair',
    toBePerformed: TBP('Sikafloor and Joint Repair Systems'),
    scope: sc('sys-tg', [
      [1, 'Surface preparation with diamond grinder'],
      [2, 'Installation of:'],
      [3, 'Sikafloor TG System @ ¼”:'],
      [3, 'Sikafloor 265 Membrane Base Coat'],
      [3, 'Sikafloor 265 Membrane Grout Coat'],
      [3, 'Sikafloor 264 (Color Light Gray) Topcoat'],
      [3, 'Euco 700 for Joint Repair'],
    ]),
  },
  {
    id: 'sys-sikafloor-264-patch',
    name: 'Sikafloor 264 (Patch Repair)',
    toBePerformed: TBP('Sikafloor System'),
    scope: sc('sys-264p', [
      [1, 'Surface preparation with diamond grinder'],
      [2, 'Installation of:'],
      [3, 'Sikafloor 264 (Color Light Gray) Base Coat'],
      [3, 'Sikafloor 264 (Color Light Gray) Topcoat'],
    ]),
  },
  {
    id: 'sys-re-flake',
    name: 'Re-Flake (Sikafloor 264 + Flake + 217 + 315)',
    toBePerformed: 'Re-Flake on the reference project, which consists of the following:',
    scope: sc('sys-rf', [
      [1, 'Surface preparation with diamond grinder'],
      [1, 'Installation of:'],
      [2, 'Sikafloor 264 (Color Light Gray) Base Coat + Sikafloor Flake (Color Salt & Pepper)'],
      [2, 'Sikafloor 217 Grout Coat'],
      [2, 'Sikafloor 217 2nd Grout Coat'],
      [2, 'Sikafloor 217 Topcoat'],
      [2, 'Sikafloor 315 2nd Topcoat'],
    ]),
  },
]
