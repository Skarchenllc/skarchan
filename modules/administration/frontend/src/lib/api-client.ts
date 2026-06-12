const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add authorization token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          detail: response.statusText,
        }))
        throw new Error(error.detail || 'Request failed')
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient(API_URL)
