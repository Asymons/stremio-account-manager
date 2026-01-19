import axios, { AxiosInstance } from 'axios'
import { AddonDescriptor } from '@/types/addon'

// API endpoint - we'll test CORS first, may need to use a proxy
const API_BASE = 'https://api.strem.io'

export interface LoginResponse {
  authKey: string
  user: {
    _id: string
    email: string
    avatar?: string
  }
}

export interface AddonCollectionResponse {
  addons: AddonDescriptor[]
  lastModified: number
}

export class StremioClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.client.post('/api/login', {
        type: 'Auth',
        email,
        password,
      })

      if (!response.data?.result?.authKey) {
        throw new Error('Invalid login response - no auth key')
      }

      return response.data.result
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid email or password')
        }
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Network error - check your internet connection or CORS configuration')
        }
        throw new Error(error.response?.data?.error || error.message || 'Login failed')
      }
      throw error
    }
  }

  /**
   * Get user's addon collection
   */
  async getAddonCollection(authKey: string): Promise<AddonDescriptor[]> {
    try {
      const response = await this.client.post('/api/addonCollectionGet', {
        type: 'AddonCollectionGet',
        authKey,
        update: true,
      })

      if (!response.data?.result?.addons) {
        // If no addons, return empty array
        return []
      }

      return response.data.result.addons
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid or expired auth key')
        }
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Network error - check your internet connection or CORS configuration')
        }
        throw new Error(error.response?.data?.error || error.message || 'Failed to get addon collection')
      }
      throw error
    }
  }

  /**
   * Update user's addon collection
   */
  async setAddonCollection(authKey: string, addons: AddonDescriptor[]): Promise<void> {
    try {
      const response = await this.client.post('/api/addonCollectionSet', {
        type: 'AddonCollectionSet',
        authKey,
        addons,
      })

      if (!response.data?.success && response.data?.result?.success === false) {
        throw new Error('Failed to update addon collection')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid or expired auth key')
        }
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Network error - check your internet connection or CORS configuration')
        }
        throw new Error(error.response?.data?.error || error.message || 'Failed to set addon collection')
      }
      throw error
    }
  }

  /**
   * Fetch addon manifest from URL
   */
  async fetchAddonManifest(transportUrl: string): Promise<AddonDescriptor> {
    try {
      // Addon manifest is at /manifest.json
      const manifestUrl = new URL('/manifest.json', transportUrl).toString()
      const response = await axios.get(manifestUrl, {
        timeout: 10000,
      })

      if (!response.data?.id || !response.data?.name || !response.data?.version) {
        throw new Error('Invalid addon manifest - missing required fields')
      }

      return {
        transportUrl,
        manifest: response.data,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Cannot reach addon URL - check the URL and your internet connection')
        }
        if (error.response?.status === 404) {
          throw new Error('Addon manifest not found at this URL')
        }
        throw new Error(error.message || 'Failed to fetch addon manifest')
      }
      throw error
    }
  }

  /**
   * Test CORS access to the API
   */
  async testCORS(): Promise<boolean> {
    try {
      await this.client.post('/api/addonCollectionGet', {
        type: 'AddonCollectionGet',
        authKey: 'test',
      })
      return true
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // If we get a response (even error response), CORS is working
        if (error.response) {
          return true
        }
        // Network error likely means CORS issue
        if (error.code === 'ERR_NETWORK') {
          return false
        }
      }
      return false
    }
  }
}

export const stremioClient = new StremioClient()
