import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { TableModel } from '../models/Table.js';

export class StatsController {
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const confirmedOnlyOccupancy = req.query.confirmedOnly === 'true';
      const guestSide = (req.query.guestSide as string) || 'all';

      const allGuests = db.guests;
      
      // Groom vs Bride Global Counts
      const groomGuestsCount = allGuests.filter((g) => (g.guestSide || 'groom') === 'groom').length;
      const brideGuestsCount = allGuests.filter((g) => (g.guestSide || 'groom') === 'bride').length;
      const groomPeopleCount = allGuests
        .filter((g) => (g.guestSide || 'groom') === 'groom')
        .reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const bridePeopleCount = allGuests
        .filter((g) => (g.guestSide || 'groom') === 'bride')
        .reduce((sum, g) => sum + g.totalGroupMembers, 0);

      // Filtered guests if guestSide is selected
      const guests = guestSide === 'all'
        ? allGuests
        : allGuests.filter((g) => (g.guestSide || 'groom') === guestSide);

      const tablesWithStats = await TableModel.getAllWithStats();

      // Total Card Counts
      const totalGuests = guests.length;
      const invitedGuestsCount = guests.filter((g) => g.invitationStatus === 'invited').length;
      const notInvitedGuestsCount = guests.filter((g) => g.invitationStatus === 'not_invited').length;

      // Group totals & people
      const totalPeopleExpected = guests.reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const totalMales = guests.reduce((sum, g) => sum + g.totalMales, 0);
      const totalFemales = guests.reduce((sum, g) => sum + g.totalFemales, 0);

      // Breakdown by response status
      const confirmedGuests = guests.filter((g) => g.responseStatus === 'confirmed');
      const confirmedGuestsCount = confirmedGuests.length;
      const confirmedPeople = confirmedGuests.reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const confirmedMales = confirmedGuests.reduce((sum, g) => sum + g.totalMales, 0);
      const confirmedFemales = confirmedGuests.reduce((sum, g) => sum + g.totalFemales, 0);

      const declinedGuests = guests.filter((g) => g.responseStatus === 'declined');
      const declinedGuestsCount = declinedGuests.length;
      const declinedPeople = declinedGuests.reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const declinedMales = declinedGuests.reduce((sum, g) => sum + g.totalMales, 0);
      const declinedFemales = declinedGuests.reduce((sum, g) => sum + g.totalFemales, 0);

      const noResponseGuests = guests.filter((g) => g.responseStatus === 'no_response');
      const noResponseGuestsCount = noResponseGuests.length;
      const noResponsePeople = noResponseGuests.reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const noResponseMales = noResponseGuests.reduce((sum, g) => sum + g.totalMales, 0);
      const noResponseFemales = noResponseGuests.reduce((sum, g) => sum + g.totalFemales, 0);

      // Breakdown by invitation status (people)
      const invitedPeople = guests
        .filter((g) => g.invitationStatus === 'invited')
        .reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const notInvitedPeople = guests
        .filter((g) => g.invitationStatus === 'not_invited')
        .reduce((sum, g) => sum + g.totalGroupMembers, 0);

      // Tables stats
      const totalTables = tablesWithStats.length;
      const totalCapacity = tablesWithStats.reduce((sum, t) => sum + t.maxCapacity, 0);

      // Used tables: tables with at least 1 seated person
      const usedTablesCount = tablesWithStats.filter((t) =>
        confirmedOnlyOccupancy ? t.confirmedPeople > 0 : t.currentPeople > 0
      ).length;

      const emptyTablesCount = totalTables - usedTablesCount;

      const fullTablesCount = tablesWithStats.filter((t) =>
        confirmedOnlyOccupancy ? t.confirmedPeople >= t.maxCapacity : t.currentPeople >= t.maxCapacity
      ).length;

      const totalOccupiedSeats = tablesWithStats.reduce((sum, t) =>
        sum + (confirmedOnlyOccupancy ? t.confirmedPeople : t.currentPeople), 0
      );

      const availableSeats = Math.max(0, totalCapacity - totalOccupiedSeats);

      // Table occupancies list
      const tableOccupancies = tablesWithStats.map((t) => {
        const count = confirmedOnlyOccupancy ? t.confirmedPeople : t.currentPeople;
        const remaining = Math.max(0, t.maxCapacity - count);
        const percent = Math.min(100, Math.round((count / t.maxCapacity) * 100));

        return {
          tableNumber: t.tableNumber,
          tableName: t.tableName,
          maxCapacity: t.maxCapacity,
          currentPeople: count,
          allAssignedPeople: t.currentPeople,
          confirmedPeople: t.confirmedPeople,
          remainingSeats: remaining,
          occupancyPercent: percent,
          displayLabel: `طاولة ${t.tableNumber} — ${count} / ${t.maxCapacity}`,
          status: count === 0 ? 'empty' : count >= t.maxCapacity ? 'full' : 'partial',
          assignedGuestsCount: t.assignedGuests.length,
        };
      });

      // Seating status for guests
      const seatedGuestsCount = guests.filter((g) => g.tableNumber !== null).length;
      const unseatedGuestsCount = guests.filter((g) => g.tableNumber === null).length;
      const seatedPeopleCount = guests
        .filter((g) => g.tableNumber !== null)
        .reduce((sum, g) => sum + g.totalGroupMembers, 0);
      const unseatedPeopleCount = guests
        .filter((g) => g.tableNumber === null)
        .reduce((sum, g) => sum + g.totalGroupMembers, 0);

      return res.status(200).json({
        success: true,
        stats: {
          // Guests Cards
          totalGuests,
          invitedGuestsCount,
          notInvitedGuestsCount,
          confirmedGuestsCount,
          declinedGuestsCount,
          noResponseGuestsCount,

          // People Numbers
          totalPeopleExpected,
          invitedPeople,
          notInvitedPeople,
          confirmedPeople,
          declinedPeople,
          noResponsePeople,

          // Gender Analytics
          totalMales,
          totalFemales,
          confirmedMales,
          confirmedFemales,
          declinedMales,
          declinedFemales,
          noResponseMales,
          noResponseFemales,

          // Tables
          totalTables,
          totalCapacity,
          usedTablesCount,
          emptyTablesCount,
          fullTablesCount,
          totalOccupiedSeats,
          availableSeats,
          tableOccupancies,

          // Seating Summary
          seatedGuestsCount,
          unseatedGuestsCount,
          seatedPeopleCount,
          unseatedPeopleCount,

          // Mode & Affiliation
          confirmedOnlyOccupancy,
          currentSide: guestSide,
          groomGuestsCount,
          brideGuestsCount,
          groomPeopleCount,
          bridePeopleCount,
        },
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'حدث خطأ أثناء تجميع إحصائيات لوحة التحكم',
      });
    }
  }
}
