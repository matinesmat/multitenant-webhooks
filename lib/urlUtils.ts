/**
 * Utility functions for handling URL parameters
 */

/**
 * Safely decodes a URL-encoded string
 * @param encodedString - The URL-encoded string to decode
 * @returns The decoded string, or the original string if decoding fails
 */
export function safeDecodeURIComponent(encodedString: string): string {
  try {
    return decodeURIComponent(encodedString);
  } catch (error) {
    console.warn('Failed to decode URI component:', encodedString, error);
    return encodedString;
  }
}

/**
 * Safely encodes a string for use in URLs
 * @param string - The string to encode
 * @returns The URL-encoded string
 */
export function safeEncodeURIComponent(string: string): string {
  try {
    return encodeURIComponent(string);
  } catch (error) {
    console.warn('Failed to encode URI component:', string, error);
    return string;
  }
}
