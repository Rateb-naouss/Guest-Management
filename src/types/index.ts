export type Gender = 'male' | 'female';
export type GuestSide = 'groom' | 'bride';
export type InvitationStatus = 'invited' | 'not_invited';
export type ResponseStatus = 'no_response' | 'confirmed' | 'declined';

export interface Guest {
  _id: string;
  fullName: string;
  phoneNumber: string;
  gender: Gender;
  guestSide: GuestSide; // 'groom' (ضيوف العريس) | 'bride' (ضيوف العروس)
  maleFamilyMembers: number;
  femaleFamilyMembers: number;
  totalGroupMembers: number; // maleFamilyMembers + femaleFamilyMembers + 1
  totalMales: number; // maleFamilyMembers + (gender === 'male' ? 1 : 0)
  totalFemales: number; // femaleFamilyMembers + (gender === 'female' ? 1 : 0)
  invitationStatus: InvitationStatus;
  responseStatus: ResponseStatus;
  tableNumber: number | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  _id: string;
  tableNumber: number;
  tableName?: string;
  maxCapacity: number;
  notes?: string;
  currentPeople: number;
  confirmedPeople: number;
  remainingSeats: number;
  remainingConfirmedSeats: number;
  assignedGuests: Guest[];
  isFull: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableOccupancy {
  tableNumber: number;
  tableName?: string;
  maxCapacity: number;
  currentPeople: number;
  allAssignedPeople: number;
  confirmedPeople: number;
  remainingSeats: number;
  occupancyPercent: number;
  displayLabel: string;
  status: 'empty' | 'partial' | 'full';
  assignedGuestsCount: number;
}

export interface DashboardStats {
  totalGuests: number;
  invitedGuestsCount: number;
  notInvitedGuestsCount: number;
  confirmedGuestsCount: number;
  declinedGuestsCount: number;
  noResponseGuestsCount: number;

  totalPeopleExpected: number;
  invitedPeople: number;
  notInvitedPeople: number;
  confirmedPeople: number;
  declinedPeople: number;
  noResponsePeople: number;

  totalMales: number;
  totalFemales: number;
  confirmedMales: number;
  confirmedFemales: number;
  declinedMales: number;
  declinedFemales: number;
  noResponseMales: number;
  noResponseFemales: number;

  totalTables: number;
  totalCapacity: number;
  usedTablesCount: number;
  emptyTablesCount: number;
  fullTablesCount: number;
  totalOccupiedSeats: number;
  availableSeats: number;
  tableOccupancies: TableOccupancy[];

  seatedGuestsCount: number;
  unseatedGuestsCount: number;
  seatedPeopleCount: number;
  unseatedPeopleCount: number;

  confirmedOnlyOccupancy: boolean;
  currentSide?: string;
  groomGuestsCount?: number;
  brideGuestsCount?: number;
  groomPeopleCount?: number;
  bridePeopleCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'organizer';
}

export interface GuestFilters {
  search: string;
  gender: 'male' | 'female' | 'all';
  guestSide: 'groom' | 'bride' | 'all';
  invitationStatus: 'invited' | 'not_invited' | 'all';
  responseStatus: 'no_response' | 'confirmed' | 'declined' | 'all';
  tableNumber: number | 'unassigned' | 'all';
  sortBy: 'fullName' | 'totalGroupMembers' | 'tableNumber' | 'createdAt' | 'responseStatus';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}
