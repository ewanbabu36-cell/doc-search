import {
  type DoctorReelDto,
  type ReelCategory
} from '@docsearch/api-contracts';

export const INITIAL_DOCTOR_REELS: DoctorReelDto[] = [];

export const REEL_CATEGORY_CONFIG: Record<
  ReelCategory | 'ALL',
  { labelHi: string; labelEn: string; icon: string }
> = {
  ALL: { labelHi: 'सभी रील्स', labelEn: 'All Health Shorts', icon: '🎬' },
  CARDIOLOGY: { labelHi: 'दिल की सेहत (Cardio)', labelEn: 'Cardiology', icon: '❤️' },
  PEDIATRICS: { labelHi: 'शिशु एवं बाल रोग', labelEn: 'Pediatrics', icon: '👶' },
  DIABETES_METABOLIC: { labelHi: 'शुगर & थायरॉइड', labelEn: 'Diabetes & Metabolic', icon: '🩸' },
  WOMEN_HEALTH: { labelHi: 'महिला स्वास्थ्य & मातृत्व', labelEn: 'Women Health', icon: '🤰' },
  ORTHOPEDICS: { labelHi: 'हड्डी, जोड़ व पीठ दर्द', labelEn: 'Orthopedics', icon: '🦴' },
  SEASONAL_INFECTIONS: { labelHi: 'मौसमी संक्रमण & फ्लू', labelEn: 'Seasonal Infections', icon: '🌡️' },
  EYE_CARE: { labelHi: 'आँखों की देखभाल', labelEn: 'Eye Care', icon: '👁️' },
  MENTAL_WELLNESS: { labelHi: 'मानसिक स्वास्थ्य & तनाव', labelEn: 'Mental Wellness', icon: '🧠' },
  PRE_POST_SURGERY: { labelHi: 'सर्जरी पूर्व व पश्चात देखभाल', labelEn: 'Pre/Post Surgery', icon: '🏥' }
};

class DoctorReelsService {
  private reels: DoctorReelDto[] = [];

  constructor() {
    this.loadReels();
  }

  private loadReels() {
    try {
      const stored = localStorage.getItem('docsearch_doctor_reels_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.reels = parsed;
          return;
        }
      }
    } catch {
      // Ignore corrupt cache and start clean
    }
    this.reels = [];
  }

  private saveReels() {
    try {
      localStorage.setItem('docsearch_doctor_reels_v2', JSON.stringify(this.reels));
    } catch {
      // Ignore storage quota errors
    }
  }

  public async fetchReels(category?: ReelCategory | 'ALL'): Promise<DoctorReelDto[]> {
    try {
      const qs = category && category !== 'ALL' ? `?category=${encodeURIComponent(category)}` : '';
      const res = await fetch(`/api/v1/reels${qs}`);
      if (res.ok) {
        const json = (await res.json()) as { success?: boolean; data?: DoctorReelDto[] };
        if (json.success && Array.isArray(json.data)) {
          if (!category || category === 'ALL') {
            this.reels = json.data;
            this.saveReels();
          }
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[DoctorReelsService] Unable to load live reels:', err);
    }
    return this.getReels(category);
  }

  public getReels(category?: ReelCategory | 'ALL'): DoctorReelDto[] {
    if (!category || category === 'ALL') {
      return [...this.reels];
    }
    return this.reels.filter((r) => r.category === category);
  }

  public getReelById(id: string): DoctorReelDto | undefined {
    return this.reels.find((r) => r.id === id);
  }

  public toggleLike(reelId: string): { isLiked: boolean; newCount: number } {
    const reel = this.reels.find((r) => r.id === reelId);
    if (!reel) return { isLiked: false, newCount: 0 };

    reel.isLikedByPatient = !reel.isLikedByPatient;
    reel.likesCount += reel.isLikedByPatient ? 1 : -1;
    this.saveReels();

    // Async sync to backend
    void fetch(`/api/v1/reels/${reelId}/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: reel.isLikedByPatient ? 'LIKE' : 'UNLIKE' })
    }).catch(() => {});

    return { isLiked: reel.isLikedByPatient, newCount: reel.likesCount };
  }

  public toggleSave(reelId: string): boolean {
    const reel = this.reels.find((r) => r.id === reelId);
    if (!reel) return false;

    reel.isSavedByPatient = !reel.isSavedByPatient;
    this.saveReels();

    void fetch(`/api/v1/reels/${reelId}/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: reel.isSavedByPatient ? 'SAVE' : 'UNSAVE' })
    }).catch(() => {});

    return reel.isSavedByPatient;
  }

  public incrementShares(reelId: string): number {
    const reel = this.reels.find((r) => r.id === reelId);
    if (!reel) return 0;
    reel.sharesCount += 1;
    this.saveReels();

    void fetch(`/api/v1/reels/${reelId}/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SHARE' })
    }).catch(() => {});

    return reel.sharesCount;
  }

  public recordConsultationBooking(reelId: string): void {
    const reel = this.reels.find((r) => r.id === reelId);
    if (reel) {
      reel.consultsBookedCount += 1;
      this.saveReels();

      void fetch(`/api/v1/reels/${reelId}/engage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BOOK_CONSULT' })
      }).catch(() => {});
    }
  }

  public addDoctorReel(newReel: DoctorReelDto): void {
    this.reels.unshift(newReel);
    this.saveReels();
  }
}

export const doctorReelsService = new DoctorReelsService();
