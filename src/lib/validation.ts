import { z } from 'zod'

export const addonManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  logo: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
  background: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
  types: z.array(z.string()).optional(),
  catalogs: z.array(z.unknown()).optional(),
  resources: z.array(z.unknown()).optional(),
  idPrefixes: z
    .array(z.string())
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
  behaviorHints: z
    .object({
      adult: z.boolean().optional(),
      p2p: z.boolean().optional(),
      configurable: z.boolean().optional(),
      configurationRequired: z.boolean().optional(),
    })
    .optional(),
})

export const addonDescriptorSchema = z.object({
  transportUrl: z.string().url(),
  transportName: z.string().optional(),
  manifest: addonManifestSchema,
  flags: z
    .object({
      official: z.boolean().optional(),
      protected: z.boolean().optional(),
    })
    .optional(),
})

export const savedAddonSchema = z.object({
  id: z.string(),
  name: z.string(),
  installUrl: z.string(),
  manifest: addonManifestSchema,
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastUsed: z.string().optional(),
  sourceType: z.enum(['manual', 'cloned-from-account']),
  sourceAccountId: z.string().optional(),
  health: z
    .object({
      isOnline: z.boolean(),
      lastChecked: z.number(),
    })
    .optional(),
})

// API key schema for export/import
export const apiKeyExportSchema = z.object({
  id: z.string(),
  service: z.string(),
  apiKey: z.string(), // Plain text in export (if credentials included)
  label: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
})

export const accountExportSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  accounts: z.array(
    z.object({
      name: z.string(),
      email: z.string().email().optional(),
      authKey: z.string().optional(),
      password: z.string().optional(),
      addons: z.array(addonDescriptorSchema),
      apiKeys: z.array(apiKeyExportSchema).optional(),
    })
  ),
  savedAddons: z.array(savedAddonSchema).optional(),
  // Legacy fields for backwards compatibility - will be ignored on import
  debridConfig: z.any().optional(),
  debridConfigType: z.any().optional(),
  debridGroupId: z.any().optional(),
})

export const loginCredentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Debrid validation schemas

export const debridServiceSchema = z.enum([
  'real-debrid',
  'all-debrid',
  'premiumize',
  'debrid-link',
])

export const debridConfigTypeSchema = z.enum(['global', 'group', 'custom'])

// API key format validation per service
const realDebridKeyRegex = /^[A-Z0-9]{52}$/
const allDebridKeyRegex = /^[a-zA-Z0-9_-]{40,}$/
const premiumizeKeyRegex = /^[a-zA-Z0-9]{32,}$/
const debridLinkKeyRegex = /^[a-zA-Z0-9]{32,}$/

export const debridApiKeySchema = z
  .string()
  .min(1, 'API key is required')
  .refine((key) => {
    // Basic validation - at least some content
    return key.trim().length > 0
  }, 'API key cannot be empty')

export const validateDebridApiKey = (service: string, apiKey: string): boolean => {
  switch (service) {
    case 'real-debrid':
      return realDebridKeyRegex.test(apiKey)
    case 'all-debrid':
      return allDebridKeyRegex.test(apiKey)
    case 'premiumize':
      return premiumizeKeyRegex.test(apiKey)
    case 'debrid-link':
      return debridLinkKeyRegex.test(apiKey)
    default:
      return false
  }
}

export const debridKeySchema = z.object({
  id: z.string().uuid(),
  service: debridServiceSchema,
  apiKey: z.string(), // Encrypted, so we don't validate format here
  name: z.string().min(1, 'Key name is required'),
  createdAt: z.coerce.date(),
  lastUsed: z.coerce.date().optional(),
})

export const debridKeyGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Group name is required'),
  debridKeys: z.record(debridServiceSchema, z.string().nullable()),
  accountIds: z.array(z.string()),
  createdAt: z.coerce.date(),
})

export const accountDebridOverrideSchema = z.object({
  accountId: z.string(),
  groupId: z.string().optional(),
  keys: z.record(debridServiceSchema, z.string().nullable()).optional(),
})

export const debridConfigurationSchema = z.object({
  globalKeys: z.record(debridServiceSchema, z.string().nullable()),
  keys: z.record(z.string(), debridKeySchema),
  groups: z.record(z.string(), debridKeyGroupSchema),
  accountOverrides: z.record(z.string(), accountDebridOverrideSchema),
})
