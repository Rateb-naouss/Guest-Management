import { db, TableDoc, GuestDoc } from '../config/db.js';

export interface CreateTableDTO {
  tableNumber: number;
  tableName?: string;
  maxCapacity?: number;
  notes?: string;
}

export interface UpdateTableDTO {
  tableName?: string;
  maxCapacity?: number;
  notes?: string;
}

export interface TableWithStats extends TableDoc {
  currentPeople: number;
  confirmedPeople: number;
  remainingSeats: number;
  remainingConfirmedSeats: number;
  assignedGuests: GuestDoc[];
  isFull: boolean;
}

export class TableModel {
  static validate(data: Partial<CreateTableDTO>): { isValid: boolean; error?: string } {
    if (data.tableNumber !== undefined) {
      const num = Number(data.tableNumber);
      if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
        return { isValid: false, error: 'رقم الطاولة يجب أن يكون رقماً صحيحاً موجباً (>= 1)' };
      }
    }

    if (data.maxCapacity !== undefined) {
      const cap = Number(data.maxCapacity);
      if (isNaN(cap) || cap < 1 || !Number.isInteger(cap)) {
        return { isValid: false, error: 'سعة الطاولة يجب أن تكون رقماً صحيحاً أكبر من الصفر' };
      }
    }

    return { isValid: true };
  }

  static async find(): Promise<TableDoc[]> {
    return [...db.tables].sort((a, b) => a.tableNumber - b.tableNumber);
  }

  static async findByNumber(tableNumber: number): Promise<TableDoc | null> {
    const table = db.tables.find((t) => t.tableNumber === tableNumber);
    return table ? { ...table } : null;
  }

  static async findById(id: string): Promise<TableDoc | null> {
    const table = db.tables.find((t) => t._id === id);
    return table ? { ...table } : null;
  }

  static async getTableStats(tableNumber: number): Promise<TableWithStats | null> {
    const table = await this.findByNumber(tableNumber);
    if (!table) return null;

    const assignedGuests = db.guests.filter((g) => g.tableNumber === tableNumber);
    
    // Total assigned (all responses)
    const currentPeople = assignedGuests.reduce((sum, g) => sum + g.totalGroupMembers, 0);
    
    // Confirmed assigned only
    const confirmedPeople = assignedGuests
      .filter((g) => g.responseStatus === 'confirmed')
      .reduce((sum, g) => sum + g.totalGroupMembers, 0);

    const remainingSeats = Math.max(0, table.maxCapacity - currentPeople);
    const remainingConfirmedSeats = Math.max(0, table.maxCapacity - confirmedPeople);

    return {
      ...table,
      currentPeople,
      confirmedPeople,
      remainingSeats,
      remainingConfirmedSeats,
      assignedGuests,
      isFull: currentPeople >= table.maxCapacity,
    };
  }

  static async getAllWithStats(): Promise<TableWithStats[]> {
    const tables = await this.find();
    const result: TableWithStats[] = [];

    for (const table of tables) {
      const stats = await this.getTableStats(table.tableNumber);
      if (stats) {
        result.push(stats);
      }
    }

    return result;
  }

  static async create(data: CreateTableDTO): Promise<TableDoc> {
    const tableNumber = Number(data.tableNumber);
    const existing = await this.findByNumber(tableNumber);
    if (existing) {
      throw new Error(`طاولة رقم ${tableNumber} موجودة بالفعل`);
    }

    const maxCapacity = data.maxCapacity !== undefined ? Math.max(1, Number(data.maxCapacity)) : 10;
    const now = new Date().toISOString();

    const newTable: TableDoc = {
      _id: `table_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tableNumber,
      tableName: data.tableName?.trim() || `طاولة رقم ${tableNumber}`,
      maxCapacity,
      notes: data.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    db.tables.push(newTable);
    db.tables.sort((a, b) => a.tableNumber - b.tableNumber);
    db.save();
    return { ...newTable };
  }

  static async update(tableNumber: number, data: UpdateTableDTO): Promise<TableDoc | null> {
    const index = db.tables.findIndex((t) => t.tableNumber === tableNumber);
    if (index === -1) return null;

    const existing = db.tables[index];
    const newCapacity = data.maxCapacity !== undefined ? Math.max(1, Number(data.maxCapacity)) : existing.maxCapacity;

    // Check if lowering capacity would be less than currently seated people
    if (data.maxCapacity !== undefined && newCapacity < existing.maxCapacity) {
      const stats = await this.getTableStats(tableNumber);
      if (stats && stats.currentPeople > newCapacity) {
        throw new Error(
          `لا يمكن تقليل سعة الطاولة إلى ${newCapacity} لأن عدد الأفراد الحالي المسكن بها هو ${stats.currentPeople} فرداً.`
        );
      }
    }

    const updated: TableDoc = {
      ...existing,
      tableName: data.tableName !== undefined ? data.tableName.trim() : existing.tableName,
      maxCapacity: newCapacity,
      notes: data.notes !== undefined ? data.notes.trim() : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    db.tables[index] = updated;
    db.save();
    return { ...updated };
  }

  static async delete(tableNumber: number): Promise<boolean> {
    const index = db.tables.findIndex((t) => t.tableNumber === tableNumber);
    if (index === -1) return false;

    // Check if table has seated guests
    const seated = db.guests.filter((g) => g.tableNumber === tableNumber);
    if (seated.length > 0) {
      // Unseat guests from this table
      db.guests.forEach((g) => {
        if (g.tableNumber === tableNumber) {
          g.tableNumber = null;
          g.updatedAt = new Date().toISOString();
        }
      });
    }

    db.tables.splice(index, 1);
    db.save();
    return true;
  }
}
