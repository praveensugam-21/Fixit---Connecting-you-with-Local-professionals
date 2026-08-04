import { apiClient } from './client'
import type { ServiceCategory } from '../types'

export const categoriesApi = {
  async list(): Promise<ServiceCategory[]> {
    const { data } = await apiClient.get<ServiceCategory[]>('/categories')
    return data
  },
}
