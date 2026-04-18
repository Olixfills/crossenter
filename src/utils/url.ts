/**
 * Resolves a media URL, ensuring local files are prefixed with the custom protocol.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  
  // If it's already a full URL or protocol-prefixed, return as-is
  if (
    url.startsWith('http://') || 
    url.startsWith('https://') || 
    url.startsWith('crossenter://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url
  }

  // Prepend crossenter protocol for absolute local paths
  // Electron handles these correctly if passed to the custom protocol handler
  return `crossenter://${url}`
}
