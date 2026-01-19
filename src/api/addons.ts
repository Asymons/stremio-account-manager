import { stremioClient } from './stremio-client'
import { AddonDescriptor } from '@/types/addon'

export async function getAddons(authKey: string): Promise<AddonDescriptor[]> {
  return stremioClient.getAddonCollection(authKey)
}

export async function updateAddons(
  authKey: string,
  addons: AddonDescriptor[]
): Promise<void> {
  return stremioClient.setAddonCollection(authKey, addons)
}

export async function installAddon(
  authKey: string,
  addonUrl: string
): Promise<AddonDescriptor[]> {
  // First, fetch the addon manifest
  const newAddon = await stremioClient.fetchAddonManifest(addonUrl)

  // Get current addons
  const currentAddons = await getAddons(authKey)

  // Check if addon already installed
  const existingIndex = currentAddons.findIndex(
    (addon) => addon.manifest.id === newAddon.manifest.id
  )

  let updatedAddons: AddonDescriptor[]

  if (existingIndex >= 0) {
    // Update existing addon
    updatedAddons = [...currentAddons]
    updatedAddons[existingIndex] = newAddon
  } else {
    // Add new addon
    updatedAddons = [...currentAddons, newAddon]
  }

  // Update the collection
  await updateAddons(authKey, updatedAddons)

  return updatedAddons
}

export async function removeAddon(
  authKey: string,
  addonId: string
): Promise<AddonDescriptor[]> {
  // Get current addons
  const currentAddons = await getAddons(authKey)

  // Remove the addon
  const updatedAddons = currentAddons.filter(
    (addon) => addon.manifest.id !== addonId
  )

  // Update the collection
  await updateAddons(authKey, updatedAddons)

  return updatedAddons
}

export async function fetchAddonManifest(url: string): Promise<AddonDescriptor> {
  return stremioClient.fetchAddonManifest(url)
}
