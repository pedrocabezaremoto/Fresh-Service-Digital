export const USERNAME_REGEX = /^[a-z0-9._]{4,30}$/;

export const USERNAME_MESSAGE =
  'El nombre de usuario solo puede tener letras minúsculas, números, puntos y guiones bajos (4 a 30 caracteres)';

/** Vacío → null. Valor → minúsculas recortadas. undefined se deja pasar. */
export function normalizeUsername(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim().toLowerCase();
  return trimmed === '' ? null : trimmed;
}

export function assertUsernameFormat(username: string) {
  if (!USERNAME_REGEX.test(username)) {
    return USERNAME_MESSAGE;
  }
  return null;
}
