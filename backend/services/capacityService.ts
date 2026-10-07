import { TableModel } from '../models/Table.js';
import { GuestModel } from '../models/Guest.js';

export interface CapacityCheckResult {
  allowed: boolean;
  tableNumber: number;
  maxCapacity: number;
  currentPeople: number;
  guestGroupSize: number;
  remainingSeats: number;
  errorMessage?: string;
  errorMessageArabic?: string;
}

export class CapacityService {
  /**
   * Verifies if a guest group of size `guestGroupSize` can be seated at `tableNumber`.
   * If `guestId` is provided, their currently occupied seats at this table (if any) are excluded from `currentPeople`.
   */
  static async canAssignGuestToTable(
    tableNumber: number,
    guestGroupSize: number,
    guestId?: string
  ): Promise<CapacityCheckResult> {
    const tableStats = await TableModel.getTableStats(tableNumber);
    if (!tableStats) {
      return {
        allowed: false,
        tableNumber,
        maxCapacity: 0,
        currentPeople: 0,
        guestGroupSize,
        remainingSeats: 0,
        errorMessage: `Table ${tableNumber} does not exist.`,
        errorMessageArabic: `طاولة رقم ${tableNumber} غير موجودة في النظام.`,
      };
    }

    let currentOccupancy = tableStats.currentPeople;

    // If this guest is already assigned to this table, subtract their previous group count
    if (guestId) {
      const currentGuest = await GuestModel.findById(guestId);
      if (currentGuest && currentGuest.tableNumber === tableNumber) {
        currentOccupancy = Math.max(0, currentOccupancy - currentGuest.totalGroupMembers);
      }
    }

    const remainingSeats = Math.max(0, tableStats.maxCapacity - currentOccupancy);

    if (currentOccupancy + guestGroupSize > tableStats.maxCapacity) {
      const errorMsgEn = `Cannot assign this guest to Table ${tableNumber}. The table capacity is ${tableStats.maxCapacity} people and only ${remainingSeats} seats remain.`;
      const errorMsgAr = `لا يمكن تعيين هذا الضيف إلى طاولة ${tableNumber}. سعة الطاولة ${tableStats.maxCapacity} أشخاص والمتبقي فقط ${remainingSeats} مقاعد.`;

      return {
        allowed: false,
        tableNumber,
        maxCapacity: tableStats.maxCapacity,
        currentPeople: currentOccupancy,
        guestGroupSize,
        remainingSeats,
        errorMessage: errorMsgEn,
        errorMessageArabic: errorMsgAr,
      };
    }

    return {
      allowed: true,
      tableNumber,
      maxCapacity: tableStats.maxCapacity,
      currentPeople: currentOccupancy,
      guestGroupSize,
      remainingSeats,
    };
  }
}
