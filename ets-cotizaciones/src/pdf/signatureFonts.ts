/** Letras manuscritas disponibles para las firmas (sin dependencias del motor PDF). */
/** Clave guardada en cada firmante → familia manuscrita. */
export const SIGNATURE_FONTS: Record<string, { family: string; label: string; size: number }> = {
  'signature-1': { family: 'Kalam', label: 'Kalam', size: 14 },
  'signature-2': { family: 'Dancing Script', label: 'Dancing Script', size: 15 },
}

export const signatureFontOf = (key: string) => SIGNATURE_FONTS[key] ?? SIGNATURE_FONTS['signature-1']
