import { z } from 'zod'

export const addonManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  logo: z.string().optional(),
  background: z.string().optional(),
  types: z.array(z.string()).optional(),
  catalogs: z.array(z.unknown()).optional(),
  resources: z.array(z.unknown()).optional(),
  idPrefixes: z.array(z.string()).optional(),
  behaviorHints: z.object({
    adult: z.boolean().optional(),
    p2p: z.boolean().optional(),
    configurable: z.boolean().optional(),
    configurationRequired: z.boolean().optional(),
  }).optional(),
})

export const addonDescriptorSchema = z.object({
  transportUrl: z.string().url(),
  transportName: z.string().optional(),
  manifest: addonManifestSchema,
  flags: z.object({
    official: z.boolean().optional(),
    protected: z.boolean().optional(),
  }).optional(),
})

export const accountExportSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  accounts: z.array(z.object({
    name: z.string(),
    email: z.string().email().optional(),
    authKey: z.string().optional(),
    password: z.string().optional(),
    addons: z.array(addonDescriptorSchema),
    debridConfigType: z.enum(['global', 'group', 'custom']).optional(),
    debridGroupId: z.string().optional(),
  })),
  debridConfig: z.object({
    globalKeys: z.record(z.string(), z.string().nullable()),
    keys: z.record(z.string(), z.object({
      id: z.string(),
      service: z.string(),
      apiKey: z.string(),
      name: z.string(),
      createdAt: z.string(),
      lastUsed: z.string().optional(),
    })),
    groups: z.record(z.string(), z.object({
      id: z.string(),
      name: z.string(),
      debridKeys: z.record(z.string(), z.string().nullable()),
      accountIds: z.array(z.string()),
      createdAt: z.string(),
    })),
  }).optional(),
})

export const loginCredentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Debrid validation schemas

export const debridServiceSchema = z.enum(['real-debrid', 'all-debrid', 'premiumize', 'debrid-link'])

export const debridConfigTypeSchema = z.enum(['global', 'group', 'custom'])

// API key format validation per service
const realDebridKeyRegex = /^[A-Z0-9]{52}$/
const allDebridKeyRegex = /^[a-zA-Z0-9_-]{40,}$/
const premiumizeKeyRegex = /^[a-zA-Z0-9]{32,}$/
const debridLinkKeyRegex = /^[a-zA-Z0-9]{32,}$/

export const debridApiKeySchema = z.string().min(1, 'API key is required').refine((key) => {
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
