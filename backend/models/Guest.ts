import { db, GuestDoc, GuestSide } from '../config/db.js';

export interface CreateGuestDTO {
  fullName: string;
  phoneNumber: string;
  gender: 'male' | 'female';
  guestSide?: GuestSide;
  maleFamilyMembers: number;
  femaleFamilyMembers: number;
  invitationStatus: 'invited' | 'not_invited';
  responseStatus: 'no_response' | 'confirmed' | 'declined';
  tableNumber?: number | null;
  notes?: string;
}

export interface UpdateGuestDTO extends Partial<CreateGuestDTO> {}

export interface GuestFilterOptions {
  search?: string;
  gender?: 'male' | 'female' | 'all';
  guestSide?: 'groom' | 'bride' | 'all';
  invitationStatus?: 'invited' | 'not_invited' | 'all';
  responseStatus?: 'no_response' | 'confirmed' | 'declined' | 'all';
  tableNumber?: number | 'unassigned' | 'all';
  sortBy?: 'fullName' | 'totalGroupMembers' | 'tableNumber' | 'createdAt' | 'responseStatus';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class GuestModel {
  static validate(data: Partial<CreateGuestDTO>): { isValid: boolean; error?: string } {
    if (data.fullName !== undefined) {
      if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
        return { isValid: false, error: 'الاسم الكامل مطلوب ويجب ألا يقل عن حرفين' };
      }
    }

    if (data.phoneNumber !== undefined) {
      if (!data.phoneNumber || typeof data.phoneNumber !== 'string' || data.phoneNumber.trim().length < 7) {
        return { isValid: false, error: 'رقم الهاتف مطلوب ويجب أن يكون صالحاً' };
      }
    }

    if (data.gender !== undefined) {
      if (data.gender !== 'male' && data.gender !== 'female') {
        return { isValid: false, error: 'الجنس يجب أن يكون ذكر أو أنثى' };
      }
    }

    if (data.maleFamilyMembers !== undefined) {
      const males = Number(data.maleFamilyMembers);
      if (isNaN(males) || males < 0 || !Number.isInteger(males)) {
        return { isValid: false, error: 'عدد أفراد العائلة (ذكور) يجب أن يكون رقماً صحيحاً غير سالب (>= 0)' };
      }
    }

    if (data.femaleFamilyMembers !== undefined) {
      const females = Number(data.femaleFamilyMembers);
      if (isNaN(females) || females < 0 || !Number.isInteger(females)) {
        return { isValid: false, error: 'عدد أفراد العائلة (إناث) يجب أن يكون رقماً صحيحاً غير سالب (>= 0)' };
      }
    }

    if (data.invitationStatus !== undefined) {
      if (data.invitationStatus !== 'invited' && data.invitationStatus !== 'not_invited') {
        return { isValid: false, error: 'حالة الدعوة غير صالحة' };
      }
    }

    if (data.responseStatus !== undefined) {
      if (!['no_response', 'confirmed', 'declined'].includes(data.responseStatus)) {
        return { isValid: false, error: 'حالة الرد غير صالحة' };
      }
    }

    return { isValid: true };
  }

  static calculateTotals(gender: 'male' | 'female', maleMembers: number, femaleMembers: number) {
    const totalGroupMembers = maleMembers + femaleMembers + 1;
    const totalMales = maleMembers + (gender === 'male' ? 1 : 0);
    const totalFemales = femaleMembers + (gender === 'female' ? 1 : 0);
    return { totalGroupMembers, totalMales, totalFemales };
  }

  static async find(filter: GuestFilterOptions = {}): Promise<{
    guests: GuestDoc[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let result = [...db.guests];

    // Search by name or phone
    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      result = result.filter(
        (g) =>
          g.fullName.toLowerCase().includes(q) ||
          g.phoneNumber.toLowerCase().includes(q) ||
          (g.notes && g.notes.toLowerCase().includes(q))
      );
    }

    // Filter by gender
    if (filter.gender && filter.gender !== 'all') {
      result = result.filter((g) => g.gender === filter.gender);
    }

    // Filter by guestSide (groom / bride)
    if (filter.guestSide && filter.guestSide !== 'all') {
      result = result.filter((g) => (g.guestSide || 'groom') === filter.guestSide);
    }

    // Filter by invitation status
    if (filter.invitationStatus && filter.invitationStatus !== 'all') {
      result = result.filter((g) => g.invitationStatus === filter.invitationStatus);
    }

    // Filter by response status
    if (filter.responseStatus && filter.responseStatus !== 'all') {
      result = result.filter((g) => g.responseStatus === filter.responseStatus);
    }

    // Filter by table
    if (filter.tableNumber !== undefined && filter.tableNumber !== 'all') {
      if (filter.tableNumber === 'unassigned') {
        result = result.filter((g) => g.tableNumber === null || g.tableNumber === undefined);
      } else {
        const tableNum = Number(filter.tableNumber);
        result = result.filter((g) => g.tableNumber === tableNum);
      }
    }

    // Sorting
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      let valA: any = a[sortBy as keyof GuestDoc];
      let valB: any = b[sortBy as keyof GuestDoc];

      if (valA === null || valA === undefined) valA = sortOrder === 1 ? Infinity : -Infinity;
      if (valB === null || valB === undefined) valB = sortOrder === 1 ? Infinity : -Infinity;

      if (typeof valA === 'string') {
        return sortOrder * valA.localeCompare(String(valB), 'ar');
      }
      return sortOrder * (valA > valB ? 1 : valA < valB ? -1 : 0);
    });

    const total = result.length;
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Number(filter.limit) || 10);
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedGuests = result.slice(startIndex, startIndex + limit);

    return {
      guests: paginatedGuests,
      total,
      page,
      totalPages,
    };
  }

  static async findById(id: string): Promise<GuestDoc | null> {
    const guest = db.guests.find((g) => g._id === id);
    return guest ? { ...guest } : null;
  }

  static async findByTable(tableNumber: number): Promise<GuestDoc[]> {
    return db.guests.filter((g) => g.tableNumber === tableNumber);
  }

  static async create(data: CreateGuestDTO): Promise<GuestDoc> {
    const males = Math.max(0, Math.floor(Number(data.maleFamilyMembers) || 0));
    const females = Math.max(0, Math.floor(Number(data.femaleFamilyMembers) || 0));
    const totals = this.calculateTotals(data.gender, males, females);

    const now = new Date().toISOString();
    const newGuest: GuestDoc = {
      _id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      gender: data.gender,
      guestSide: data.guestSide || 'groom',
      maleFamilyMembers: males,
      femaleFamilyMembers: females,
      totalGroupMembers: totals.totalGroupMembers,
      totalMales: totals.totalMales,
      totalFemales: totals.totalFemales,
      invitationStatus: data.invitationStatus || 'invited',
      responseStatus: data.responseStatus || 'no_response',
      tableNumber: data.tableNumber !== undefined && data.tableNumber !== null ? Number(data.tableNumber) : null,
      notes: data.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    db.guests.unshift(newGuest);
    db.save();
    return { ...newGuest };
  }

  static async update(id: string, data: UpdateGuestDTO): Promise<GuestDoc | null> {
    const index = db.guests.findIndex((g) => g._id === id);
    if (index === -1) return null;

    const existing = db.guests[index];
    const gender = data.gender !== undefined ? data.gender : existing.gender;
    const males = data.maleFamilyMembers !== undefined ? Math.max(0, Math.floor(Number(data.maleFamilyMembers))) : existing.maleFamilyMembers;
    const females = data.femaleFamilyMembers !== undefined ? Math.max(0, Math.floor(Number(data.femaleFamilyMembers))) : existing.femaleFamilyMembers;
    const totals = this.calculateTotals(gender, males, females);

    const updated: GuestDoc = {
      ...existing,
      fullName: data.fullName !== undefined ? data.fullName.trim() : existing.fullName,
      phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber.trim() : existing.phoneNumber,
      gender,
      guestSide: data.guestSide !== undefined ? data.guestSide : (existing.guestSide || 'groom'),
      maleFamilyMembers: males,
      femaleFamilyMembers: females,
      totalGroupMembers: totals.totalGroupMembers,
      totalMales: totals.totalMales,
      totalFemales: totals.totalFemales,
      invitationStatus: data.invitationStatus !== undefined ? data.invitationStatus : existing.invitationStatus,
      responseStatus: data.responseStatus !== undefined ? data.responseStatus : existing.responseStatus,
      tableNumber: data.tableNumber !== undefined ? (data.tableNumber === null ? null : Number(data.tableNumber)) : existing.tableNumber,
      notes: data.notes !== undefined ? data.notes.trim() : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    db.guests[index] = updated;
    db.save();
    return { ...updated };
  }

  static async delete(id: string): Promise<boolean> {
    const index = db.guests.findIndex((g) => g._id === id);
    if (index === -1) return false;

    db.guests.splice(index, 1);
    db.save();
    return true;
  }
}
