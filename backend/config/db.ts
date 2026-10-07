import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  password: string; // hashed
  role: 'admin' | 'organizer';
  createdAt: string;
  updatedAt: string;
}

export interface TableDoc {
  _id: string;
  tableNumber: number;
  tableName?: string;
  maxCapacity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type GuestSide = 'groom' | 'bride';

export interface GuestDoc {
  _id: string;
  fullName: string;
  phoneNumber: string;
  gender: 'male' | 'female';
  guestSide: GuestSide; // 'groom' (ضيوف العريس) | 'bride' (ضيوف العروس)
  maleFamilyMembers: number; // >= 0
  femaleFamilyMembers: number; // >= 0
  totalGroupMembers: number; // calculated: maleFamilyMembers + femaleFamilyMembers + 1
  totalMales: number; // calculated: maleFamilyMembers + (gender === 'male' ? 1 : 0)
  totalFemales: number; // calculated: femaleFamilyMembers + (gender === 'female' ? 1 : 0)
  invitationStatus: 'invited' | 'not_invited';
  responseStatus: 'no_response' | 'confirmed' | 'declined';
  tableNumber: number | null; // null if unassigned
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: UserDoc[];
  tables: TableDoc[];
  guests: GuestDoc[];
  indexes: Record<string, string[]>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class MongoDatabase {
  private data: DatabaseSchema = {
    users: [],
    tables: [],
    guests: [],
    indexes: {
      guests: ['fullName', 'phoneNumber', 'responseStatus', 'tableNumber'],
      tables: ['tableNumber'],
      users: ['email']
    }
  };

  private isLoaded = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        
        // Ensure 40 tables exist
        if (!this.data.tables || this.data.tables.length < 40) {
          const now = new Date().toISOString();
          const existingNums = new Set((this.data.tables || []).map((t) => t.tableNumber));
          for (let i = 1; i <= 40; i++) {
            if (!existingNums.has(i)) {
              this.data.tables.push({
                _id: `table_${i}`,
                tableNumber: i,
                tableName: `طاولة رقم ${i}`,
                maxCapacity: 10,
                notes: i <= 20 ? 'قسم ضيوف العريس' : 'قسم ضيوف العروس',
                createdAt: now,
                updatedAt: now,
              });
            }
          }
          this.data.tables.sort((a, b) => a.tableNumber - b.tableNumber);
          this.saveSync();
        }

        // Clean up any remaining "طاولة كبار الشخصيات" in existing tables
        if (this.data.tables) {
          let updatedTables = false;
          this.data.tables.forEach((t) => {
            if (t.tableName && (t.tableName.includes('كبار الشخصيات') || t.tableName.includes('طاولة الضباط') || t.tableName.trim() === `${t.tableNumber}`)) {
              t.tableName = `طاولة رقم ${t.tableNumber}`;
              updatedTables = true;
            }
          });
          if (updatedTables) this.saveSync();
        }

        // Ensure all guests have guestSide
        if (this.data.guests) {
          let updated = false;
          this.data.guests.forEach((g, idx) => {
            if (!g.guestSide) {
              g.guestSide = (idx % 2 === 0 || (g.notes && g.notes.includes('عريس'))) ? 'groom' : 'bride';
              updated = true;
            }
          });
          if (updated) this.saveSync();
        }

        this.isLoaded = true;
      } else {
        this.seedInitialData();
        this.saveSync();
        this.isLoaded = true;
      }
    } catch (err) {
      console.error('Error initializing database, seeding fallback:', err);
      this.seedInitialData();
      this.isLoaded = true;
    }
  }

  public save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveSync();
    }, 150);
  }

  private saveSync() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  public get users() {
    return this.data.users;
  }

  public get tables() {
    return this.data.tables;
  }

  public get guests() {
    return this.data.guests;
  }

  public resetData() {
    this.seedInitialData();
    this.saveSync();
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('admin123', salt);

    const now = new Date().toISOString();

    const adminUser: UserDoc = {
      _id: 'user_admin_1',
      name: 'مشرف الحفل',
      email: 'admin@wedding.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    };

    // Seed 40 tables, default capacity 10
    const initialTables: TableDoc[] = [];
    for (let i = 1; i <= 40; i++) {
      initialTables.push({
        _id: `table_${i}`,
        tableNumber: i,
        tableName: `طاولة رقم ${i}`,
        maxCapacity: 10,
        notes: i <= 20 ? 'قسم ضيوف العريس' : 'قسم ضيوف العروس',
        createdAt: now,
        updatedAt: now,
      });
    }

    // Seed realistic Arabic wedding guests
    const rawGuests = [
      {
        fullName: 'د. خالد بن فهد المنصور',
        phoneNumber: '0501234567',
        gender: 'male' as const,
        maleFamilyMembers: 1,
        femaleFamilyMembers: 2,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 1,
        notes: 'عم العريس',
      },
      {
        fullName: 'سعادة الأستاذ سلطان الرشيد',
        phoneNumber: '0559876543',
        gender: 'male' as const,
        maleFamilyMembers: 2,
        femaleFamilyMembers: 1,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 1,
        notes: 'خال العروس',
      },
      {
        fullName: 'أ. منيرة بنت ناصر السبيعي',
        phoneNumber: '0543219876',
        gender: 'female' as const,
        maleFamilyMembers: 0,
        femaleFamilyMembers: 1,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 1,
        notes: 'صديقة العائلة',
      },
      {
        fullName: 'م. طارق بن عبدالمحسن العتيبي',
        phoneNumber: '0567891234',
        gender: 'male' as const,
        maleFamilyMembers: 2,
        femaleFamilyMembers: 2,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 2,
        notes: 'عائلة العتيبي',
      },
      {
        fullName: 'د. نورة بنت عبدالعزيز الحمد',
        phoneNumber: '0534567890',
        gender: 'female' as const,
        maleFamilyMembers: 1,
        femaleFamilyMembers: 2,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 2,
        notes: '',
      },
      {
        fullName: 'أ. فيصل بن عبدالله الدوسري',
        phoneNumber: '0598765432',
        gender: 'male' as const,
        maleFamilyMembers: 3,
        femaleFamilyMembers: 1,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 3,
        notes: '',
      },
      {
        fullName: 'أ. ريم بنت أحمد الغامدي',
        phoneNumber: '0512348765',
        gender: 'female' as const,
        maleFamilyMembers: 1,
        femaleFamilyMembers: 1,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 3,
        notes: '',
      },
      {
        fullName: 'أ. بدر بن محمد القحطاني',
        phoneNumber: '0523456781',
        gender: 'male' as const,
        maleFamilyMembers: 1,
        femaleFamilyMembers: 0,
        invitationStatus: 'invited' as const,
        responseStatus: 'no_response' as const,
        tableNumber: 4,
        notes: 'في انتظار التأكيد هاتفياً',
      },
      {
        fullName: 'أ. سارة بنت إبراهيم الزهراني',
        phoneNumber: '0578912345',
        gender: 'female' as const,
        maleFamilyMembers: 0,
        femaleFamilyMembers: 2,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 4,
        notes: '',
      },
      {
        fullName: 'م. عمر بن سليمان الشمري',
        phoneNumber: '0587654321',
        gender: 'male' as const,
        maleFamilyMembers: 1,
        femaleFamilyMembers: 1,
        invitationStatus: 'invited' as const,
        responseStatus: 'declined' as const,
        tableNumber: null,
        notes: 'اعتذر لظروف السفر خارج المملكة',
      },
      {
        fullName: 'أ. حصة بنت سعد الحربي',
        phoneNumber: '0545678901',
        gender: 'female' as const,
        maleFamilyMembers: 1,
        femaleFamilyMembers: 1,
        invitationStatus: 'invited' as const,
        responseStatus: 'declined' as const,
        tableNumber: null,
        notes: 'اعتذار رسمي',
      },
      {
        fullName: 'أ. وليد بن صالح الشهري',
        phoneNumber: '0532109876',
        gender: 'male' as const,
        maleFamilyMembers: 0,
        femaleFamilyMembers: 0,
        invitationStatus: 'invited' as const,
        responseStatus: 'no_response' as const,
        tableNumber: null,
        notes: 'مدعو فردي',
      },
      {
        fullName: 'أ. لما بنت خالد التميمي',
        phoneNumber: '0561234567',
        gender: 'female' as const,
        maleFamilyMembers: 0,
        femaleFamilyMembers: 1,
        invitationStatus: 'not_invited' as const,
        responseStatus: 'no_response' as const,
        tableNumber: null,
        notes: 'قائمة احتياطية لم ترسل بعد',
      },
      {
        fullName: 'د. زياد بن منصور العمري',
        phoneNumber: '0509871234',
        gender: 'male' as const,
        maleFamilyMembers: 2,
        femaleFamilyMembers: 1,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 5,
        notes: '',
      },
      {
        fullName: 'أ. هند بنت عبدالرحمن المطيري',
        phoneNumber: '0551122334',
        gender: 'female' as const,
        maleFamilyMembers: 1,
        femaleFamilyMembers: 2,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 5,
        notes: '',
      },
      {
        fullName: 'أ. ماجد بن تركي الخالدي',
        phoneNumber: '0544556677',
        gender: 'male' as const,
        maleFamilyMembers: 1,
        femaleFamilyMembers: 1,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 6,
        notes: '',
      },
      {
        fullName: 'أ. هيفاء بنت فهد السديري',
        phoneNumber: '0533445566',
        gender: 'female' as const,
        maleFamilyMembers: 0,
        femaleFamilyMembers: 3,
        invitationStatus: 'invited' as const,
        responseStatus: 'confirmed' as const,
        tableNumber: 6,
        notes: '',
      }
    ];

    const initialGuests: GuestDoc[] = rawGuests.map((g, idx) => {
      const totalGroupMembers = g.maleFamilyMembers + g.femaleFamilyMembers + 1;
      const totalMales = g.maleFamilyMembers + (g.gender === 'male' ? 1 : 0);
      const totalFemales = g.femaleFamilyMembers + (g.gender === 'female' ? 1 : 0);

      const guestSide: GuestSide =
        (g.notes && g.notes.includes('عروس')) || idx % 2 === 1 ? 'bride' : 'groom';

      return {
        _id: `guest_${idx + 1}`,
        fullName: g.fullName,
        phoneNumber: g.phoneNumber,
        gender: g.gender,
        guestSide,
        maleFamilyMembers: g.maleFamilyMembers,
        femaleFamilyMembers: g.femaleFamilyMembers,
        totalGroupMembers,
        totalMales,
        totalFemales,
        invitationStatus: g.invitationStatus,
        responseStatus: g.responseStatus,
        tableNumber: g.tableNumber,
        notes: g.notes,
        createdAt: now,
        updatedAt: now,
      };
    });

    this.data.users = [adminUser];
    this.data.tables = initialTables;
    this.data.guests = initialGuests;
  }
}

export const db = new MongoDatabase();
