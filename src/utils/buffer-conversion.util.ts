/**
 * Utility functions for converting between different buffer types
 * to handle TypeScript strict type checking in updated libraries
 *
 * Note: These use controlled type assertions to handle library incompatibilities
 * after updates. This is a common pattern when dealing with Buffer type changes.
 */

/**
 * Convert Node.js Buffer to ArrayBuffer for ExcelJS
 * Uses controlled type assertion to handle library compatibility
 */
export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  // Create a proper ArrayBuffer copy to avoid type issues
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

/**
 * Convert Node.js Buffer to Uint8Array for Blob
 * Uses controlled type assertion to handle library compatibility
 */
export function bufferToUint8Array(buffer: Buffer): Uint8Array {
  // Create a clean Uint8Array to avoid type conflicts
  return new Uint8Array(buffer);
}

/**
 * Convert Buffer for file system operations
 * Uses controlled type assertion to handle library compatibility
 */
export function bufferForFileSystem(buffer: Buffer): Buffer {
  // For file operations, we can safely return the Buffer as-is with assertion
  return buffer as any;
}

/**
 * Helper to ensure Buffer compatibility
 */
export function ensureBuffer(data: Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}
