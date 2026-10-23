/**
 * Utility to generate content previews from file content
 * Extracts meaningful summary of changes
 */

export class PreviewGenerator {
  /**
   * Generate a preview from document content
   * Returns first non-empty line or first 100 chars
   */
  static fromContent(content: string, maxLength: number = 100): string {
    if (!content) {
      return '';
    }

    // Try to find first meaningful line
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
        return trimmed.substring(0, maxLength);
      }
    }

    // Fallback to first non-empty content
    const trimmed = content.trim();
    return trimmed.substring(0, maxLength);
  }

  /**
   * Generate preview from file path
   */
  static fromPath(filePath: string): string {
    const fileName = filePath.split('/').pop() || filePath;
    return `modified ${fileName}`;
  }

  /**
   * Generate preview from multiple changes
   */
  static fromChanges(
    changes: Array<{ oldText: string; newText: string }>,
    maxLength: number = 100
  ): string {
    if (changes.length === 0) {
      return '';
    }

    const firstChange = changes[0];
    if (firstChange.newText) {
      return this.fromContent(firstChange.newText, maxLength);
    }

    if (firstChange.oldText) {
      return `removed: ${firstChange.oldText.substring(0, 50)}`;
    }

    return '';
  }
}
