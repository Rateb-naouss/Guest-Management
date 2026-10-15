import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { MongoClient, Db } from 'mongodb';

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
  private mongoClient: MongoClient | null = null;
  private atlasDb: Db | null = null;
  private isAtlasConnected = false;
  private atlasStatusMessage = 'جاري الاتصال بقاعدة بيانات MongoDB Atlas...';
  private reconnectInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
    this.initMongoAtlas().catch((err) => {
      console.warn('Initial Atlas connection check:', err?.message || err);
    });
  }

  public async initMongoAtlas() {
    const uri = process.env.MONGODB_URI;
    if (!uri || !uri.startsWith('mongodb')) return;

    try {
      if (this.mongoClient) {
        try { await this.mongoClient.close(); } catch {}
      }

      this.mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      await this.mongoClient.connect();
      this.atlasDb = this.mongoClient.db('wedding_guest_manager');
      this.isAtlasConnected = true;
      this.atlasStatusMessage = 'متصل بنجاح مع MongoDB Atlas (مباشر ومفعّل)';
      console.log('✓ Successfully connected to user live MongoDB Atlas database (wedding_guest_manager)!');

      // Create indexes
      try {
        await this.atlasDb.collection('guests').createIndex({ fullName: 1 });
        await this.atlasDb.collection('guests').createIndex({ phoneNumber: 1 });
        await this.atlasDb.collection('tables').createIndex({ tableNumber: 1 });
      } catch (idxErr) {
        // index creation error ignored
      }

      // Sync data bidirectionally
      await this.syncWithAtlas();

      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    } catch (err: any) {
      this.isAtlasConnected = false;
      const isSslAlert = err.message && (err.message.includes('SSL') || err.message.includes('alert'));
      this.atlasStatusMessage = isSslAlert
        ? 'يتطلب السماح بالوصول لعنوان IP في MongoDB Atlas (Network Access -> Add 0.0.0.0/0)'
        : (err.message || 'فشل الاتصال بـ MongoDB Atlas');
      
      console.warn('MongoDB Atlas status notice:', this.atlasStatusMessage);

      if (!this.reconnectInterval) {
        this.reconnectInterval = setInterval(() => {
          if (!this.isAtlasConnected) {
            this.initMongoAtlas().catch(() => {});
          } else if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
          }
        }, 15000);
      }
    }
  }

  private async syncWithAtlas() {
    if (!this.atlasDb || !this.isAtlasConnected) return;

    try {
      const atlasGuestsCount = await this.atlasDb.collection('guests').countDocuments();
      const atlasTablesCount = await this.atlasDb.collection('tables').countDocuments();

      if (atlasGuestsCount > 0 || atlasTablesCount > 0) {
        // Atlas has data, hydrate local memory from Atlas
        const atlasGuests = (await this.atlasDb.collection('guests').find({}).toArray()) as any[];
        const atlasTables = (await this.atlasDb.collection('tables').find({}).toArray()) as any[];
        const atlasUsers = (await this.atlasDb.collection('users').find({}).toArray()) as any[];

        if (atlasGuests.length > 0) this.data.guests = atlasGuests;
        if (atlasTables.length > 0) this.data.tables = atlasTables;
        if (atlasUsers.length > 0) this.data.users = atlasUsers;
        this.saveSync();
        console.log(`✓ Hydrated ${atlasGuests.length} guests and ${atlasTables.length} tables from MongoDB Atlas.`);
      } else {
        // Atlas is fresh, upload current tables and guests to Atlas
        if (this.data.tables.length > 0) {
          await this.atlasDb.collection('tables').insertMany(this.data.tables.map(t => ({ ...t })) as any);
        }
        if (this.data.guests.length > 0) {
          await this.atlasDb.collection('guests').insertMany(this.data.guests.map(g => ({ ...g })) as any);
        }
        if (this.data.users.length > 0) {
          await this.atlasDb.collection('users').insertMany(this.data.users.map(u => ({ ...u })) as any);
        }
        console.log(`✓ Seeded ${this.data.guests.length} guests and ${this.data.tables.length} tables directly into your MongoDB Atlas!`);
      }
    } catch (err: any) {
      console.error('Atlas sync error:', err.message);
    }
  }

  public getAtlasStatus() {
    return {
      connected: this.isAtlasConnected,
      message: this.atlasStatusMessage,
      database: 'wedding_guest_manager',
      cluster: 'cluster0.kgpxuyz.mongodb.net',
      tablesCount: this.data.tables.length,
      guestsCount: this.data.guests.length,
    };
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

      // Asynchronously push to Atlas if connected
      if (this.atlasDb && this.isAtlasConnected) {
        this.persistToAtlasAsync().catch(err => console.warn('Atlas async persist error:', err.message));
      }
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  private async persistToAtlasAsync() {
    if (!this.atlasDb || !this.isAtlasConnected) return;

    try {
      // Bulk write guests
      const guestBulk = this.data.guests.map(g => ({
        replaceOne: {
          filter: { _id: g._id },
          replacement: g,
          upsert: true,
        }
      }));
      if (guestBulk.length > 0) {
        await this.atlasDb.collection('guests').bulkWrite(guestBulk as any);
      }

      // Bulk write tables
      const tableBulk = this.data.tables.map(t => ({
        replaceOne: {
          filter: { _id: t._id },
          replacement: t,
          upsert: true,
        }
      }));
      if (tableBulk.length > 0) {
        await this.atlasDb.collection('tables').bulkWrite(tableBulk as any);
      }
    } catch (err: any) {
      console.warn('Atlas bulk write notice:', err.message);
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
