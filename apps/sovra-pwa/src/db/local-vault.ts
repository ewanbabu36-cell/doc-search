// Sovra Local-First Zero-Cost Vault (IndexedDB Engine)
// Stores chat history, clinical cards, and offline outbox locally on the client.
// Cost to hospital & developer: $0.00 / INR 0.00.

import { Conversation, Message, MessageStatus, OutboxSyncItem, UserProfile } from '../types.js';

const DB_NAME = 'sovra_local_vault_v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this device/browser'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Conversations store
      if (!db.objectStoreNames.contains('conversations')) {
        const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
        convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 2. Messages store
      if (!db.objectStoreNames.contains('messages')) {
        const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
        msgStore.createIndex('conversationId', 'conversationId', { unique: false });
        msgStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 3. Offline Outbox store (for basement/offline retry)
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' });
      }

      // 4. User Profile store
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export const localVault = {
  // -------------------------------------------------------------
  // Conversations
  // -------------------------------------------------------------
  async getConversations(): Promise<Conversation[]> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readonly');
      const store = tx.objectStore('conversations');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as Conversation[]) || [];
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async saveConversation(conv: Conversation): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readwrite');
      const store = tx.objectStore('conversations');
      const req = store.put(conv);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getConversationById(id: string): Promise<Conversation | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('conversations', 'readonly');
      const store = tx.objectStore('conversations');
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as Conversation) || null);
      req.onerror = () => reject(req.error);
    });
  },

  // -------------------------------------------------------------
  // Messages
  // -------------------------------------------------------------
  async getMessages(conversationId: string): Promise<Message[]> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const index = store.index('conversationId');
      const req = index.getAll(conversationId);
      req.onsuccess = () => {
        const list = (req.result as Message[]) || [];
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async saveMessage(message: Message): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['messages', 'conversations'], 'readwrite');
      const msgStore = tx.objectStore('messages');
      const convStore = tx.objectStore('conversations');

      msgStore.put(message);

      // Update conversation's lastMessage & updatedAt
      const convReq = convStore.get(message.conversationId);
      convReq.onsuccess = () => {
        const conv = convReq.result as Conversation | undefined;
        if (conv) {
          conv.lastMessage = {
            text: message.text,
            timestamp: message.timestamp,
            status: message.status,
            isOutgoing: message.isOutgoing,
            cardType: message.clinicalCard?.type
          };
          conv.updatedAt = message.timestamp;
          if (!message.isOutgoing && message.status !== 'READ') {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          convStore.put(conv);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['messages', 'conversations'], 'readwrite');
      const msgStore = tx.objectStore('messages');
      const req = msgStore.get(messageId);
      req.onsuccess = () => {
        const msg = req.result as Message | undefined;
        if (msg) {
          msg.status = status;
          msgStore.put(msg);

          // Update in conversation too if it's the last message
          const convStore = tx.objectStore('conversations');
          const convReq = convStore.get(msg.conversationId);
          convReq.onsuccess = () => {
            const conv = convReq.result as Conversation | undefined;
            if (conv && conv.lastMessage) {
              conv.lastMessage.status = status;
              convStore.put(conv);
            }
          };
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async markConversationAsRead(conversationId: string): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['messages', 'conversations'], 'readwrite');
      const msgStore = tx.objectStore('messages');
      const convStore = tx.objectStore('conversations');
      const index = msgStore.index('conversationId');
      const req = index.getAll(conversationId);

      req.onsuccess = () => {
        const msgs = (req.result as Message[]) || [];
        for (const m of msgs) {
          if (!m.isOutgoing && m.status !== 'READ') {
            m.status = 'READ';
            msgStore.put(m);
          }
        }

        const convReq = convStore.get(conversationId);
        convReq.onsuccess = () => {
          const conv = convReq.result as Conversation | undefined;
          if (conv) {
            conv.unreadCount = 0;
            if (conv.lastMessage) {
              conv.lastMessage.status = 'READ';
            }
            convStore.put(conv);
          }
        };
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // -------------------------------------------------------------
  // Offline Outbox
  // -------------------------------------------------------------
  async queueOutbox(item: OutboxSyncItem): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getOutbox(): Promise<OutboxSyncItem[]> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as OutboxSyncItem[]) || []);
      req.onerror = () => reject(req.error);
    });
  },

  async removeFromOutbox(id: string): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // -------------------------------------------------------------
  // Active Persona / User Profile
  // -------------------------------------------------------------
  async getUserProfile(id = 'active_user'): Promise<UserProfile | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('userProfile', 'readonly');
      const store = tx.objectStore('userProfile');
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as UserProfile) || null);
      req.onerror = () => reject(req.error);
    });
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('userProfile', 'readwrite');
      const store = tx.objectStore('userProfile');
      const req = store.put({ ...profile, id: 'active_user' });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // -------------------------------------------------------------
  // Seed Default Demo Healthcare Conversations & Cards
  // -------------------------------------------------------------
  async seedDemoDataIfEmpty(): Promise<void> {
    const existing = await this.getConversations();
    if (existing && existing.length > 0) return;

    console.log('[Sovra LocalVault] Initializing lifetime free demo chats & clinical cards');

    const defaultProfile: UserProfile = {
      id: 'active_user',
      name: 'Mohit Kumar',
      role: 'PATIENT',
      phone: '+91 98765 43210',
      uhid: 'UHID-2026-8819',
      hospitalOrClinicName: 'DocSearch Apex Super Specialty Hospital',
      isVerified: true
    };
    await this.saveUserProfile(defaultProfile);

    const now = new Date();
    const minAgo = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();

    // 1. Dr. Ramesh Sharma (Cardiologist) - Digital Rx conversation
    const conv1: Conversation = {
      id: 'conv-dr-sharma',
      participantId: 'doc-001',
      participantName: 'Dr. Ramesh Sharma, MD (Cardiology)',
      participantRole: 'DOCTOR',
      participantSubtitle: 'Chief Interventional Cardiologist • Reg #MCI-48192',
      participantPhone: '+91 98111 22334',
      participantAvatar: '👨‍⚕️',
      unreadCount: 1,
      isOnline: true,
      updatedAt: minAgo(5),
      lastMessage: {
        text: 'Prescription for your Hypertension consultation has been generated.',
        timestamp: minAgo(5),
        status: 'DELIVERED',
        isOutgoing: false,
        cardType: 'PRESCRIPTION'
      }
    };

    const msg1_1: Message = {
      id: 'msg-dr-1',
      conversationId: 'conv-dr-sharma',
      senderId: 'doc-001',
      senderName: 'Dr. Ramesh Sharma',
      senderRole: 'DOCTOR',
      recipientId: 'active_user',
      text: 'Namaste Mohit ji. Please continue Telmisartan 40mg daily after breakfast. Here is your official e-Prescription with digital signature.',
      timestamp: minAgo(25),
      status: 'READ',
      isOutgoing: false
    };

    const msg1_2: Message = {
      id: 'msg-dr-2',
      conversationId: 'conv-dr-sharma',
      senderId: 'doc-001',
      senderName: 'Dr. Ramesh Sharma',
      senderRole: 'DOCTOR',
      recipientId: 'active_user',
      text: 'Digital Prescription (Rx) — OPD Consultation #OPD-2026-1049',
      timestamp: minAgo(5),
      status: 'DELIVERED',
      isOutgoing: false,
      clinicalCard: {
        type: 'PRESCRIPTION',
        prescription: {
          rxId: 'RX-2026-90412',
          consultationId: 'OPD-2026-1049',
          uhid: 'UHID-2026-8819',
          patientName: 'Mohit Kumar',
          patientAge: 46,
          patientGender: 'M',
          doctorName: 'Dr. Ramesh Sharma, MD, DM',
          doctorSpecialty: 'Cardiology & Vascular Medicine',
          doctorRegNo: 'MCI-48192',
          clinicOrHospitalName: 'DocSearch Apex Super Specialty Hospital',
          prescribedAt: minAgo(5),
          diagnosis: ['Essential Hypertension (Grade 1)', 'Mild Dyslipidemia'],
          vitals: {
            bp: '136/88 mmHg',
            pulse: '74 bpm',
            temp: '98.4 °F',
            spO2: '99%',
            weight: '72 kg'
          },
          medicines: [
            {
              id: 'med-1',
              name: 'Telmisartan Tablets IP (Telma 40)',
              dosage: '40 mg',
              frequency: '1-0-0 (Morning)',
              duration: '30 Days',
              instructions: 'Take after breakfast with water'
            },
            {
              id: 'med-2',
              name: 'Atorvastatin Tablets IP (Atorva 10)',
              dosage: '10 mg',
              frequency: '0-0-1 (Night)',
              duration: '30 Days',
              instructions: 'Take at bedtime'
            }
          ],
          generalAdvice: 'Low sodium salt diet (<3g/day). 30 mins brisk morning walk. Avoid heavy oily foods.',
          followUpDate: 'In 30 days or if BP > 140/90',
          isSigned: true,
          signatureStamp: 'SHA256:7a9f8b2c1d3e4f5a...VERIFIED-ABDM-SIGNATURE'
        }
      }
    };

    // 2. DocSearch Pathology Lab (LIMS) - Lab Report card
    const conv2: Conversation = {
      id: 'conv-lims-lab',
      participantId: 'lab-001',
      participantName: 'DocSearch Central Pathology LIMS',
      participantRole: 'LAB_TECH',
      participantSubtitle: 'NABL Accredited Lab #MC-2940 • Automated Dispatch',
      participantAvatar: '🔬',
      unreadCount: 0,
      isOnline: true,
      updatedAt: minAgo(60),
      lastMessage: {
        text: 'Your Complete Blood Count (CBC) with ESR report is now verified.',
        timestamp: minAgo(60),
        status: 'READ',
        isOutgoing: false,
        cardType: 'LAB_REPORT'
      }
    };

    const msg2_1: Message = {
      id: 'msg-lab-1',
      conversationId: 'conv-lims-lab',
      senderId: 'lab-001',
      senderName: 'Pathology Lab LIMS',
      senderRole: 'LAB_TECH',
      recipientId: 'active_user',
      text: 'Verified Diagnostic Report — Barcode #LIMS-2026-44120',
      timestamp: minAgo(60),
      status: 'READ',
      isOutgoing: false,
      clinicalCard: {
        type: 'LAB_REPORT',
        labReport: {
          reportId: 'REP-2026-8819-CBC',
          accessionNumber: 'ACC-89102-CBC',
          uhid: 'UHID-2026-8819',
          patientName: 'Mohit Kumar',
          testName: 'Complete Blood Count (CBC) & ESR 6-Part Differential',
          testCategory: 'Clinical Hematology & Flow Cytometry',
          sampleCollectedAt: minAgo(240),
          reportedAt: minAgo(60),
          hospitalName: 'DocSearch Diagnostic Excellence Hub',
          pathologistName: 'Dr. Sunita Mehta, MD (Pathology)',
          pathologistDegrees: 'NABL Technical Signatory',
          parameters: [
            {
              name: 'Hemoglobin (Hb)',
              observedValue: '14.8',
              unit: 'g/dL',
              biologicalReferenceRange: '13.5 - 17.5',
              status: 'NORMAL'
            },
            {
              name: 'Total Leukocyte Count (TLC / WBC)',
              observedValue: '7,800',
              unit: '/cumm',
              biologicalReferenceRange: '4,000 - 11,000',
              status: 'NORMAL'
            },
            {
              name: 'Platelet Count',
              observedValue: '2.45',
              unit: 'Lakhs/cumm',
              biologicalReferenceRange: '1.50 - 4.50',
              status: 'NORMAL'
            },
            {
              name: 'Erythrocyte Sedimentation Rate (ESR)',
              observedValue: '18',
              unit: 'mm/1st hr',
              biologicalReferenceRange: '0 - 15',
              status: 'HIGH'
            },
            {
              name: 'Neutrophils',
              observedValue: '62',
              unit: '%',
              biologicalReferenceRange: '40 - 70',
              status: 'NORMAL'
            }
          ],
          overallInterpretation: 'Normal blood cell indices. Mild borderline ESR elevation.',
          isAbnormal: false,
          pdfDownloadUrl: '/api/v1/lims/reports/REP-2026-8819-CBC.pdf',
          verificationHash: 'NABL-SHA256:4b912c40e1f37...OK'
        }
      }
    };

    // 3. Hospital OPD Cashier - 1-Click Consultation Payment Card
    const conv3: Conversation = {
      id: 'conv-opd-billing',
      participantId: 'bill-001',
      participantName: 'Apex Hospital OPD Billing Counter',
      participantRole: 'RECEPTIONIST',
      participantSubtitle: 'Counter #4 • Zero-Fee Instant UPI Gateway',
      participantAvatar: '💳',
      unreadCount: 0,
      isOnline: true,
      updatedAt: minAgo(120),
      lastMessage: {
        text: 'Consultation Fee Request (Token #A-24) — ₹500',
        timestamp: minAgo(120),
        status: 'READ',
        isOutgoing: false,
        cardType: 'OPD_PAYMENT'
      }
    };

    const msg3_1: Message = {
      id: 'msg-bill-1',
      conversationId: 'conv-opd-billing',
      senderId: 'bill-001',
      senderName: 'OPD Cashier',
      senderRole: 'RECEPTIONIST',
      recipientId: 'active_user',
      text: 'Dear Mohit ji, please find your 1-click consultation payment link for Dr. Ramesh Sharma OPD Slot #A-24. You can pay via GPay / PhonePe / Paytm directly.',
      timestamp: minAgo(120),
      status: 'READ',
      isOutgoing: false,
      clinicalCard: {
        type: 'OPD_PAYMENT',
        opdPayment: {
          paymentId: 'PAY-2026-00418',
          appointmentId: 'APP-99120',
          tokenNumber: 'A-24',
          uhid: 'UHID-2026-8819',
          patientName: 'Mohit Kumar',
          doctorName: 'Dr. Ramesh Sharma',
          doctorSpecialty: 'Cardiology',
          clinicName: 'DocSearch Apex Super Specialty Hospital',
          department: 'Cardiology OPD Suite 204',
          feeAmount: 500,
          currency: 'INR',
          upiId: 'docsearch.hospital@icici',
          payeeName: 'DocSearch Apex Super Specialty Hospital',
          qrPayload: 'upi://pay?pa=docsearch.hospital@icici&pn=ApexHospital&am=500.00&cu=INR&tn=OPD-Token-A24',
          upiIntentUrl: 'upi://pay?pa=docsearch.hospital@icici&pn=ApexHospital&am=500.00&cu=INR&tn=OPD-Token-A24',
          paymentStatus: 'PAID',
          paidAt: minAgo(110),
          transactionRef: 'UPI/629104882190/ICICI'
        }
      }
    };

    // Save all to local-vault
    await this.saveConversation(conv1);
    await this.saveConversation(conv2);
    await this.saveConversation(conv3);

    await this.saveMessage(msg1_1);
    await this.saveMessage(msg1_2);
    await this.saveMessage(msg2_1);
    await this.saveMessage(msg3_1);

    console.log('[Sovra LocalVault] Demo conversations successfully loaded into client-side IndexedDB');
  }
};
