export function extractTemplateKeys(template: string): string[] {
  const regex = /\{\{\{(.*?)\}\}\}/g;
  const keys = new Set<string>();
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (match[1]) {
      keys.add(match[1].trim());
    }
  }
  return [...keys];
}
