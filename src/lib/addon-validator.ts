import { AddonDescriptor } from '@/types/addon'
import { fetchAddonManifest } from '@/api/addons'

/**
 * Addon Validator
 *
 * Provides validation and fetching of addon manifests for saved addons.
 */

export interface ValidationResult {
  valid: boolean
  error?: string
  manifest?: AddonDescriptor
}

/**
 * Validate and fetch manifest from an addon URL
 */
export async function validateAddonUrl(url: string): Promise<ValidationResult> {
  try {
    // Basic URL validation
    if (!url || typeof url !== 'string') {
      return {
        valid: false,
        error: 'URL is required',
      }
    }

    // Check if it's a valid URL
    try {
      new URL(url)
    } catch {
      return {
        valid: false,
        error: 'Invalid URL format',
      }
    }

    // Fetch the manifest
    const manifest = await fetchAddonManifest(url)

    // Validate manifest structure
    if (!manifest || !manifest.manifest) {
      return {
        valid: false,
        error: 'Invalid addon manifest',
      }
    }

    if (!manifest.manifest.id) {
      return {
        valid: false,
        error: 'Addon manifest missing required field: id',
      }
    }

    if (!manifest.manifest.name) {
      return {
        valid: false,
        error: 'Addon manifest missing required field: name',
      }
    }

    return {
      valid: true,
      manifest,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to fetch addon manifest',
    }
  }
}

/**
 * Validate saved addon name
 */
export function validateSavedAddonName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Saved addon name is required'
  }

  const trimmed = name.trim()

  if (trimmed.length === 0) {
    return 'Saved addon name cannot be empty'
  }

  if (trimmed.length > 100) {
    return 'Saved addon name is too long (max 100 characters)'
  }

  return null
}

/**
 * Validate tag name
 */
export function validateTagName(tag: string): string | null {
  if (!tag || typeof tag !== 'string') {
    return 'Tag name is required'
  }

  const trimmed = tag.trim()

  if (trimmed.length === 0) {
    return 'Tag name cannot be empty'
  }

  if (trimmed.length > 50) {
    return 'Tag name is too long (max 50 characters)'
  }

  // Tags should be lowercase alphanumeric with hyphens
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    return 'Tag name must be lowercase alphanumeric with hyphens only'
  }

  return null
}

/**
 * Normalize tag name
 */
export function normalizeTagName(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Validate tags array
 */
export function validateTags(tags: string[]): string | null {
  if (!Array.isArray(tags)) {
    return 'Tags must be an array'
  }

  for (const tag of tags) {
    const error = validateTagName(tag)
    if (error) {
      return error
    }
  }

  return null
}
