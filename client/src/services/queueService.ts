import { API_CONFIG } from '../config/api';

export interface QueueItem {
  id: string;
  userId: string;
  postId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  post: {
    id: string;
    title: string;
    description?: string;
    filePath: string;
    coverArt?: string;
    createdAt: string;
    user: {
      id: string;
      username: string;
      profilePhoto?: string;
    };
    tags: Array<{
      id: string;
      name: string;
    }>;
  };
}

export interface QueueSettings {
  id: string;
  userId: string;
  shuffleMode: boolean;
  repeatMode: 'off' | 'one' | 'all';
  createdAt: string;
  updatedAt: string;
}

export interface QueueResponse {
  queue: QueueItem[];
  settings: QueueSettings;
}

class QueueService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async getUserQueue(): Promise<QueueResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/queue`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch queue');
    }

    return response.json();
  }

  async addToQueue(postId: string): Promise<{ message: string; queueItem: QueueItem }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/queue`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ postId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to queue');
    }

    return response.json();
  }

  async removeFromQueue(postId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/queue/${postId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove from queue');
    }

    return response.json();
  }

  async reorderQueue(fromIndex: number, toIndex: number): Promise<{ message: string }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/queue/reorder`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ fromIndex, toIndex })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reorder queue');
    }

    return response.json();
  }

  async clearQueue(): Promise<{ message: string }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/queue`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to clear queue');
    }

    return response.json();
  }

  async getQueueSettings(): Promise<QueueSettings> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/queue/settings`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch queue settings');
    }

    return response.json();
  }

  async updateQueueSettings(settings: Partial<Pick<QueueSettings, 'shuffleMode' | 'repeatMode'>>): Promise<QueueSettings> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/queue/settings`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update queue settings');
    }

    return response.json();
  }
}

export const queueService = new QueueService();
