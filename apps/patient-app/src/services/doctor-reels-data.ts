import { type DoctorReelDto, type ReelCategory } from '@docsearch/api-contracts';

export const INITIAL_DOCTOR_REELS: DoctorReelDto[] = [
  {
    id: 'reel-cardio-01',
    doctorId: 'doc-vikram-malhotra',
    doctorName: 'Dr. Vikram Malhotra',
    doctorSpecialty: 'Senior Interventional Cardiologist',
    doctorDegree: 'MBBS, MD, DM (Cardiology, AIIMS New Delhi)',
    nmcRegistrationNumber: 'NMC-CARD-184920',
    hospitalName: 'DocSearch Apex Heart Institute',
    doctorAvatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-doctor-explaining-a-treatment-to-a-patient-40543-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 52,
    title: 'सुबह खाली पेट BP स्पाइक और हार्ट अटैक का खतरा — 3 कार्डियोलॉजी गोल्डन रूल्स',
    summaryHindi: 'सुबह 5 से 8 बजे के बीच कॉर्टिसोल और एड्रेनालिन हार्मोन नैचुरली हाई होते हैं। अगर आप अचानक तेज एक्सरसाइज या भारी तनाव लेते हैं तो बीपी खतरनाक स्तर पर पहुंच सकता है।',
    summaryEnglish: 'Morning blood pressure surges naturally between 5 AM and 8 AM due to cortisol peaks. Avoid abrupt high-intensity strain before basic hydration.',
    category: 'CARDIOLOGY',
    tags: ['#HeartCare', '#BloodPressure', '#CardioAlert', '#AIIMSDoctor'],
    clinicalDos: [
      'उठने के तुरंत बाद 1 गिलास सामान्य गुनगुना पानी पिएं।',
      'अपनी बीपी की गोली डॉक्टर द्वारा निर्धारित समय पर रोज नियम से लें।',
      'हल्की 15 मिनट की वॉक से शुरुआत करें, अचानक हेवी वेटलिफ्टिंग न करें।'
    ],
    clinicalDonts: [
      'सुबह खाली पेट कड़क काली चाय या 2 से ज्यादा सिगरेट कभी न पिएं।',
      'छाती में हल्का भारीपन, जबड़े या बाएं कंधे में दर्द को गैस समझकर इग्नोर न करें।'
    ],
    opdConsultationFee: 500,
    nextAvailableSlot: 'Today 4:30 PM',
    isTeleconsultAvailable: true,
    viewsCount: 14280,
    likesCount: 1142,
    sharesCount: 428,
    consultsBookedCount: 38,
    isLikedByPatient: false,
    isSavedByPatient: false,
    isNmcVerified: true,
    publishedAt: '2026-11-18T10:30:00Z'
  },
  {
    id: 'reel-pedia-02',
    doctorId: 'doc-ananya-sharma',
    doctorName: 'Dr. Ananya Sharma',
    doctorSpecialty: 'Pediatrician & Neonatal Specialist',
    doctorDegree: 'MBBS, DCH, DNB (Pediatrics)',
    nmcRegistrationNumber: 'NMC-PED-294011',
    hospitalName: 'DocSearch Mother & Child Care Hospital',
    doctorAvatarUrl: 'https://images.unsplash.com/photo-1594824813583-000b213b5a79?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-doctor-checking-a-little-girl-in-a-clinic-40545-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 48,
    title: 'बच्चों में 102°F तेज बुखार: कब घबराएं और कौन सी 2 गलतियां कभी न करें!',
    summaryHindi: 'बुखार बच्चे के इम्यून सिस्टम की बीमारी से लड़ने की प्राकृतिक प्रतिक्रिया है। बुखार होने पर बच्चे को भारी कंबलों में लपेटना सबसे बड़ी गलती है।',
    summaryEnglish: 'Fever is your child\'s immune defense mechanism. Do not overbundle the child in heavy blankets or give unprescribed aspirin.',
    category: 'PEDIATRICS',
    tags: ['#PediatricFever', '#ChildHealth', '#BabyCare', '#Vaccination'],
    clinicalDos: [
      'कमरे का तापमान सामान्य रखें और बच्चे को सूती हल्के कपड़े पहनाएं।',
      'माथे, हथेलियों और पैरों पर सामान्य ताजे पानी की पट्टियां (Tepid Sponging) रखें।',
      'ORS, नारियल पानी और पर्याप्त लिक्विड डाइट देते रहें।'
    ],
    clinicalDonts: [
      'बर्फ का ठंडा पानी कभी इस्तेमाल न करें, इससे बच्चे को कंपकंपी हो सकती है।',
      'बिना बाल रोग विशेषज्ञ की पर्ची के ओवर-द-काउंटर एंटीबायोटिक कभी न दें।'
    ],
    opdConsultationFee: 400,
    nextAvailableSlot: 'Today 5:15 PM',
    isTeleconsultAvailable: true,
    viewsCount: 22400,
    likesCount: 1890,
    sharesCount: 890,
    consultsBookedCount: 54,
    isLikedByPatient: true,
    isSavedByPatient: true,
    isNmcVerified: true,
    publishedAt: '2026-11-17T14:15:00Z'
  },
  {
    id: 'reel-diab-03',
    doctorId: 'doc-rajesh-verma',
    doctorName: 'Dr. Rajesh Verma',
    doctorSpecialty: 'Senior Diabetologist & Endocrinologist',
    doctorDegree: 'MBBS, MD (Medicine), Fellowship in Diabetology (UK)',
    nmcRegistrationNumber: 'NMC-ENDO-105829',
    hospitalName: 'DocSearch Diabetes & Metabolic Center',
    doctorAvatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-medical-staff-working-in-a-laboratory-40540-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 58,
    title: 'रोटी vs चावल: डायबिटीज और HbA1c कंट्रोल करने का असली क्लिनिकल फॉर्मूला',
    summaryHindi: 'सिर्फ चावल छोड़ने से शुगर कंट्रोल नहीं होती। 2 पतली चपाती और 1 छोटी कटोरी बासमती चावल का ग्लाइसेमिक लोड लगभग बराबर होता है। सीक्रेट है "प्लेट मेथड"।',
    summaryEnglish: 'Managing diabetes is not just eliminating rice. The real secret is the Plate Method: 50% fiber salad, 25% protein dal/paneer, 25% complex carbs.',
    category: 'DIABETES_METABOLIC',
    tags: ['#DiabetesCare', '#HbA1c', '#SugarControl', '#ClinicalDiet'],
    clinicalDos: [
      'खाने की प्लेट में 50% हरी सलाद और सब्जियां पहले खाएं।',
      'कार्बोहाइड्रेट से पहले दाल, स्प्राउट्स या पनीर (प्रोटीन) खाएं ताकि ग्लूकोज स्पाइक धीमा हो।',
      'रात के खाने के बाद 10 मिनट की नॉर्मल धीमी वॉक जरूर करें।'
    ],
    clinicalDonts: [
      'मैदा, बेकरी बिस्किट और पैकेट वाले जूस को "हेल्दी" समझकर न लें।',
      'फास्टिंग शुगर देखने के बाद अपनी मर्जी से इंसुलिन या मेटफॉर्मिन का डोज न बदलें।'
    ],
    opdConsultationFee: 450,
    nextAvailableSlot: 'Tomorrow 10:00 AM',
    isTeleconsultAvailable: true,
    viewsCount: 31200,
    likesCount: 2650,
    sharesCount: 1340,
    consultsBookedCount: 71,
    isLikedByPatient: false,
    isSavedByPatient: false,
    isNmcVerified: true,
    publishedAt: '2026-11-16T18:00:00Z'
  },
  {
    id: 'reel-ortho-04',
    doctorId: 'doc-arvind-kumar',
    doctorName: 'Dr. Arvind Kumar',
    doctorSpecialty: 'Spine & Joint Replacement Surgeon',
    doctorDegree: 'MBBS, MS (Ortho), MCh (Spine Surgery, UK)',
    nmcRegistrationNumber: 'NMC-ORTH-440192',
    hospitalName: 'DocSearch Bone & Joint Institute',
    doctorAvatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-doctor-talking-to-a-patient-in-an-office-40544-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 45,
    title: 'कंप्यूटर और मोबाइल नेक (Text Neck): 30 सेकंड का पोस्चर रीसेट एक्सरसाइज',
    summaryHindi: 'जब सिर 45 डिग्री आगे झुकता है, तो गर्दन पर 22 किलो का वजन पड़ता है। इसी से सर्वाइकल स्पोंडिलोसिस और कंधों का जकड़न शुरू होता है।',
    summaryEnglish: 'Looking down at mobile phones at 45° adds 22 kg of load to cervical vertebrae. Practice the Chin Tuck exercise every 45 minutes.',
    category: 'ORTHOPEDICS',
    tags: ['#CervicalPain', '#SpineHealth', '#PostureReset', '#Ergonomics'],
    clinicalDos: [
      'मोबाइल को हमेशा आंखों के समानांतर (Eye Level) पर रखकर इस्तेमाल करें।',
      'हर 45 मिनट के बाद "Chin Tuck": ठोड़ी को पीछे खींचकर 5 सेकंड रोकें।',
      'सोते समय बहुत मोटा या 2 तकिया लगाने से बचें, केवल गर्दन को सपोर्ट देने वाला पतला तकिया लें।'
    ],
    clinicalDonts: [
      'गर्दन में तेज कटक-कटक आवाज निकालकर जबरदस्ती ट्विस्ट कभी न करें।',
      'बिना जांच कराए गर्दन में अचानक शुरू हुए सुन्नपन (Numbness) को नजरअंदाज न करें।'
    ],
    opdConsultationFee: 600,
    nextAvailableSlot: 'Today 6:00 PM',
    isTeleconsultAvailable: true,
    viewsCount: 18900,
    likesCount: 1420,
    sharesCount: 650,
    consultsBookedCount: 29,
    isLikedByPatient: false,
    isSavedByPatient: false,
    isNmcVerified: true,
    publishedAt: '2026-11-15T09:45:00Z'
  },
  {
    id: 'reel-obgyn-05',
    doctorId: 'doc-sunita-rao',
    doctorName: 'Dr. Sunita Rao',
    doctorSpecialty: 'Senior Gynecologist & High-Risk Obstetrics',
    doctorDegree: 'MBBS, MS (OB-GYN, Lady Hardinge), FICOG',
    nmcRegistrationNumber: 'NMC-GYN-330198',
    hospitalName: 'DocSearch Women Health Pavilion',
    doctorAvatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-pregnant-woman-talking-with-a-doctor-40547-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 50,
    title: 'प्रेग्नेंसी का पहला तिमाही (First Trimester): 3 गलतियां जो बिल्कुल न करें!',
    summaryHindi: 'शुरुआती 12 हफ्तों में भ्रूण के प्रमुख अंगों का निर्माण होता है। फॉलिक एसिड सप्लीमेंट समय पर लेना न्यूरल ट्यूब डिफेक्ट से 90% सुरक्षा देता है।',
    summaryEnglish: 'The first 12 weeks of pregnancy are critical for fetal organogenesis. Daily Folic Acid intake is non-negotiable for neural tube protection.',
    category: 'WOMEN_HEALTH',
    tags: ['#PregnancyCare', '#FolicAcid', '#Motherhood', '#WomenHealth'],
    clinicalDos: [
      'डॉक्टर की सलाह से 5mg फॉलिक एसिड पहले दिन से ही शुरू करें।',
      'दिन भर में 8-10 गिलास पानी और ताजे घर के बने पौष्टिक सूप पिएं।',
      'कोई भी दवा (सिरदर्द या उल्टी की भी) बिना अपने स्त्री रोग विशेषज्ञ से पूछे न लें।'
    ],
    clinicalDonts: [
      'कच्चा पपीता, अनानास या अधपका भोजन खाने से बचें।',
      'भारी वजन उठाना, तेज झटके वाली यात्रा या अत्यधिक गर्म पानी से नहाना टालें।'
    ],
    opdConsultationFee: 550,
    nextAvailableSlot: 'Tomorrow 11:30 AM',
    isTeleconsultAvailable: true,
    viewsCount: 27500,
    likesCount: 2310,
    sharesCount: 1120,
    consultsBookedCount: 62,
    isLikedByPatient: true,
    isSavedByPatient: false,
    isNmcVerified: true,
    publishedAt: '2026-11-14T11:20:00Z'
  }
];

export const REEL_CATEGORY_CONFIG: Record<
  ReelCategory | 'ALL',
  { labelHi: string; labelEn: string; icon: string }
> = {
  ALL: { labelHi: 'सभी', labelEn: 'All Topics', icon: '🌟' },
  CARDIOLOGY: { labelHi: 'हार्ट केयर', labelEn: 'Heart', icon: '🫀' },
  PEDIATRICS: { labelHi: 'शिशु रोग', labelEn: 'Child Care', icon: '👶' },
  DIABETES_METABOLIC: { labelHi: 'डायबिटीज', labelEn: 'Diabetes', icon: '🩸' },
  WOMEN_HEALTH: { labelHi: 'महिला स्वास्थ्य', labelEn: 'Women Health', icon: '🤰' },
  ORTHOPEDICS: { labelHi: 'हड्डी व जोड़', labelEn: 'Bones & Spine', icon: '🦴' },
  SEASONAL_INFECTIONS: { labelHi: 'वायरल व फ्लू', labelEn: 'Flu & Infections', icon: '🦠' },
  EYE_CARE: { labelHi: 'नेत्र सुरक्षा', labelEn: 'Eye Care', icon: '👁️' },
  MENTAL_WELLNESS: { labelHi: 'मानसिक तनाव', labelEn: 'Mental Peace', icon: '🧠' },
  PRE_POST_SURGERY: { labelHi: 'सर्जरी देखभाल', labelEn: 'Post Surgery', icon: '🩺' }
};

// In-Memory & LocalStorage Service for Patient Engagement Tracking
class DoctorReelsService {
  private reels: DoctorReelDto[] = [];

  constructor() {
    this.loadReels();
  }

  private loadReels() {
    try {
      const stored = localStorage.getItem('docsearch_doctor_reels');
      if (stored) {
        this.reels = JSON.parse(stored);
      } else {
        this.reels = [...INITIAL_DOCTOR_REELS];
        this.saveReels();
      }
    } catch {
      this.reels = [...INITIAL_DOCTOR_REELS];
    }
  }

  private saveReels() {
    try {
      localStorage.setItem('docsearch_doctor_reels', JSON.stringify(this.reels));
    } catch {}
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
    return { isLiked: reel.isLikedByPatient, newCount: reel.likesCount };
  }

  public toggleSave(reelId: string): boolean {
    const reel = this.reels.find((r) => r.id === reelId);
    if (!reel) return false;

    reel.isSavedByPatient = !reel.isSavedByPatient;
    this.saveReels();
    return reel.isSavedByPatient;
  }

  public incrementShares(reelId: string): number {
    const reel = this.reels.find((r) => r.id === reelId);
    if (!reel) return 0;
    reel.sharesCount += 1;
    this.saveReels();
    return reel.sharesCount;
  }

  public recordConsultationBooking(reelId: string): void {
    const reel = this.reels.find((r) => r.id === reelId);
    if (reel) {
      reel.consultsBookedCount += 1;
      this.saveReels();
    }
  }

  public addDoctorReel(newReel: DoctorReelDto): void {
    this.reels.unshift(newReel);
    this.saveReels();
  }
}

export const doctorReelsService = new DoctorReelsService();
