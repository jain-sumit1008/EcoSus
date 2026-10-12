export function isoDate(value = new Date()) {
  return new Date(value).toISOString();
}
