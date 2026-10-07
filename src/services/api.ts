import { Guest, Table, DashboardStats, GuestFilters, User } from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('wedding_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User; message: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async resetDemoData(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-data`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Guests
  async getGuests(filters: Partial<GuestFilters> = {}): Promise<{
    guests: Guest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.gender && filters.gender !== 'all') params.append('gender', filters.gender);
    if (filters.guestSide && filters.guestSide !== 'all') params.append('guestSide', filters.guestSide);
    if (filters.invitationStatus && filters.invitationStatus !== 'all') params.append('invitationStatus', filters.invitationStatus);
    if (filters.responseStatus && filters.responseStatus !== 'all') params.append('responseStatus', filters.responseStatus);
    if (filters.tableNumber !== undefined && filters.tableNumber !== 'all') params.append('tableNumber', String(filters.tableNumber));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const res = await fetch(`${API_BASE}/guests?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getGuestById(id: string): Promise<{ guest: Guest }> {
    const res = await fetch(`${API_BASE}/guests/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createGuest(guestData: {
    fullName: string;
    phoneNumber: string;
    gender: 'male' | 'female';
    guestSide?: 'groom' | 'bride';
    maleFamilyMembers: number;
    femaleFamilyMembers: number;
    invitationStatus: 'invited' | 'not_invited';
    responseStatus: 'no_response' | 'confirmed' | 'declined';
    tableNumber?: number | null;
    notes?: string;
  }): Promise<{ guest: Guest; message: string }> {
    const res = await fetch(`${API_BASE}/guests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(guestData),
    });
    return handleResponse(res);
  },

  async updateGuest(
    id: string,
    guestData: Partial<{
      fullName: string;
      phoneNumber: string;
      gender: 'male' | 'female';
      guestSide: 'groom' | 'bride';
      maleFamilyMembers: number;
      femaleFamilyMembers: number;
      invitationStatus: 'invited' | 'not_invited';
      responseStatus: 'no_response' | 'confirmed' | 'declined';
      tableNumber: number | null;
      notes: string;
    }>
  ): Promise<{ guest: Guest; message: string }> {
    const res = await fetch(`${API_BASE}/guests/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(guestData),
    });
    return handleResponse(res);
  },

  async deleteGuest(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/guests/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async assignTable(id: string, tableNumber: number | null): Promise<{ guest: Guest; message: string }> {
    const res = await fetch(`${API_BASE}/guests/${id}/assign-table`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tableNumber }),
    });
    return handleResponse(res);
  },

  async updateInvitation(id: string, invitationStatus: 'invited' | 'not_invited'): Promise<{ guest: Guest; message: string }> {
    const res = await fetch(`${API_BASE}/guests/${id}/invitation`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ invitationStatus }),
    });
    return handleResponse(res);
  },

  async updateResponse(id: string, responseStatus: 'no_response' | 'confirmed' | 'declined'): Promise<{ guest: Guest; message: string }> {
    const res = await fetch(`${API_BASE}/guests/${id}/response`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ responseStatus }),
    });
    return handleResponse(res);
  },

  // Tables
  async getTables(): Promise<{ tables: Table[]; count: number }> {
    const res = await fetch(`${API_BASE}/tables`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getTableByNumber(tableNumber: number): Promise<{ table: Table }> {
    const res = await fetch(`${API_BASE}/tables/${tableNumber}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createTable(tableData: {
    tableNumber: number;
    tableName?: string;
    maxCapacity?: number;
    notes?: string;
  }): Promise<{ table: Table; message: string }> {
    const res = await fetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tableData),
    });
    return handleResponse(res);
  },

  async updateTable(
    tableNumber: number,
    data: {
      tableName?: string;
      maxCapacity?: number;
      notes?: string;
    }
  ): Promise<{ table: Table; message: string }> {
    const res = await fetch(`${API_BASE}/tables/${tableNumber}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteTable(tableNumber: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/tables/${tableNumber}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async assignGuestDirectlyToTable(tableNumber: number, guestId: string): Promise<{ table: Table; message: string }> {
    const res = await fetch(`${API_BASE}/tables/${tableNumber}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ guestId }),
    });
    return handleResponse(res);
  },

  async removeGuestFromTable(tableNumber: number, guestId: string): Promise<{ table: Table; message: string }> {
    const res = await fetch(`${API_BASE}/tables/${tableNumber}/guests/${guestId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Stats
  async getStats(confirmedOnly: boolean = false, guestSide: string = 'all'): Promise<{ stats: DashboardStats }> {
    const res = await fetch(`${API_BASE}/stats/dashboard?confirmedOnly=${confirmedOnly}&guestSide=${guestSide}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Excel Export
  async downloadExcel(type: string): Promise<void> {
    const res = await fetch(`${API_BASE}/export/excel?type=${type}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'فشل تحميل ملف الإكسل');
    }

    const blob = await res.blob();
    // Extract filename from header or provide fallback
    const disposition = res.headers.get('content-disposition');
    let filename = `Wedding_Guests_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
    if (disposition && disposition.includes('filename*=')) {
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    } else if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
