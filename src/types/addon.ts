export interface AddonManifest {
  id: string
  name: string
  version: string
  description: string
  logo?: string
  background?: string
  types?: string[]
  catalogs?: unknown[]
  resources?: unknown[]
  idPrefixes?: string[]
  behaviorHints?: {
    adult?: boolean
    p2p?: boolean
    configurable?: boolean
    configurationRequired?: boolean
  }
}

export interface AddonDescriptor {
  transportUrl: string
  transportName?: string
  manifest: AddonManifest
  flags?: {
    official?: boolean
    protected?: boolean
  }
}
