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

/**
 * Get a nested value from an object using dot notation
 * 
 * @param obj - The object to get the value from
 * @param path - The dot-separated path to the value (e.g., "exif.DateTimeOriginal")
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(object: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = object;
  
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

/**
 * Apply a template with variable substitution, supporting nested paths like exif.field_name.
 * Recursively resolves variables until no more substitutions can be made.
 * 
 * @param template - The template string with {{{variable}}} placeholders
 * @param imageKeys - Per-image keys for substitution
 * @param globalVariables - Global variables that apply to all images
 * @param exifData - EXIF data extracted from the image
 * @param maxIterations - Maximum number of recursive iterations (default: 10)
 * @returns The template with all resolvable variables substituted
 */
export function applyTemplate(
  template: string,
  imageKeys: Record<string, string>,
  globalVariables: Record<string, string>,
  exifData: Record<string, unknown> = {},
  maxIterations: number = 10
): string {
  const regex = /\{\{\{(.*?)\}\}\}/g;
  const MISSING_PLACEHOLDER = '<<<missing>>>';
  
  let result = template;
  let previousResult = '';
  let iteration = 0;
  
  // Keep resolving until no more substitutions can be made or max iterations reached
  while (result !== previousResult && iteration < maxIterations) {
    previousResult = result;
    iteration++;
    
    result = result.replaceAll(regex, (fullMatch, key) => {
      const trimmedKey = (key as string).trim();
      
      // Check for explicit global.* prefix first
      if (trimmedKey.startsWith('global.')) {
        const globalKey = trimmedKey.slice(7); // Remove 'global.' prefix
        const value = globalVariables[globalKey];
        if (value !== undefined && value !== '') {
          return value;
        }
      }
      
      // First check image-specific keys
      if (trimmedKey in imageKeys) {
        const value = imageKeys[trimmedKey];
        if (value !== undefined && value !== '') {
          return value;
        }
      }
      
      // Then check global variables (implicit fallback)
      if (trimmedKey in globalVariables) {
        const value = globalVariables[trimmedKey];
        if (value !== undefined && value !== '') {
          return value;
        }
      }
      
      // Check for special prefixed paths like exif.field_name
      if (trimmedKey.startsWith('exif.')) {
        const exifPath = trimmedKey.slice(5); // Remove 'exif.' prefix
        const value = getNestedValue(exifData, exifPath);
        if (value !== undefined && value !== null && value !== '') {
          return String(value);
        }
      }
      
      // On the last iteration, show missing placeholder
      // For intermediate iterations, keep the variable for potential resolution
      if (iteration === maxIterations) {
        return MISSING_PLACEHOLDER;
      }
      
      // Keep the variable unchanged for potential resolution in next iteration
      return fullMatch;
    });
  }
  
  // Final pass to mark any remaining unresolved variables as missing
  result = result.replaceAll(regex, () => MISSING_PLACEHOLDER);
  
  return result;
}
