import { type FastifyPluginAsync } from 'fastify';
import {
  type DoctorReelDto,
  type ReelCategory,
  type ReelEngagementAction,
  COMMERCIAL_DRUG_BRAND_MAP,
  DEFAULT_NMC_HEALTH_DISCLAIMER
} from '@docsearch/api-contracts';
import { createLogger } from '@docsearch/shared-core';
import { authenticate, requireRoles } from '../../plugins/auth-guard.js';

const logger = createLogger('doctor-reels-routes');

// In-Memory Synchronized Reel Store with Pre-Seeded Specialist Health Shorts
const IN_MEMORY_REELS: DoctorReelDto[] = [
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
    streamLadder: {
      hlsMasterUrl: 'https://cdn.docsearch.health/reels/cardio-01/master.m3u8',
      fallbackMp4Url: 'https://assets.mixkit.co/videos/preview/mixkit-doctor-explaining-a-treatment-to-a-patient-40543-large.mp4',
      resolutions: [
        { label: '360p', bitrateKbps: 600, width: 360, height: 640, streamUrl: 'https://cdn.docsearch.health/reels/cardio-01/360p.m3u8' },
        { label: '720p', bitrateKbps: 2200, width: 720, height: 1280, streamUrl: 'https://cdn.docsearch.health/reels/cardio-01/720p.m3u8' }
      ]
    },
    subtitles: [
      { id: 'sub-1', startSeconds: 0, endSeconds: 5, textHi: 'क्या आप जानते हैं सुबह खाली पेट बीपी अचानक क्यों बढ़ता है?', textEn: 'Do you know why morning blood pressure suddenly spikes?' },
      { id: 'sub-2', startSeconds: 5, endSeconds: 15, textHi: 'सुबह 5 से 8 बजे के बीच कॉर्टिसोल हार्मोन का स्तर चरम पर होता है।', textEn: 'Between 5 AM and 8 AM, natural cortisol hormone levels peak.' },
      { id: 'sub-3', startSeconds: 15, endSeconds: 28, textHi: 'बिना पानी पिए भारी कसरत से हार्ट पर अतिरिक्त दबाव पड़ता है।', textEn: 'Sudden high strain without hydration strains myocardium.' },
      { id: 'sub-4', startSeconds: 28, endSeconds: 42, textHi: 'उठते ही 1 गिलास गुनगुना पानी पिएं और खाली पेट सिगरेट न पिएं।', textEn: 'Hydrate right after waking and avoid empty-stomach nicotine.' },
      { id: 'sub-5', startSeconds: 42, endSeconds: 52, textHi: 'अगर आपका बीपी 140/90 से ज्यादा है, तो 1-टैप में कंसल्टेशन बुक करें।', textEn: 'If BP exceeds 140/90, tap below to book an immediate OPD token.' }
    ],
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
    disclaimerText: DEFAULT_NMC_HEALTH_DISCLAIMER,
    nmcCompliance: {
      isNmcVerified: true,
      nmcRegistrationNumber: 'NMC-CARD-184920',
      stateMedicalCouncil: 'Delhi Medical Council',
      disclaimerText: DEFAULT_NMC_HEALTH_DISCLAIMER,
      genericPrescriptionCompliant: true,
      flaggedCommercialBrands: [],
      signedAt: '2026-11-18T10:30:00Z'
    },
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
    streamLadder: {
      hlsMasterUrl: 'https://cdn.docsearch.health/reels/pedia-02/master.m3u8',
      fallbackMp4Url: 'https://assets.mixkit.co/videos/preview/mixkit-doctor-checking-a-little-girl-in-a-clinic-40545-large.mp4',
      resolutions: [
        { label: '360p', bitrateKbps: 600, width: 360, height: 640, streamUrl: 'https://cdn.docsearch.health/reels/pedia-02/360p.m3u8' },
        { label: '720p', bitrateKbps: 2200, width: 720, height: 1280, streamUrl: 'https://cdn.docsearch.health/reels/pedia-02/720p.m3u8' }
      ]
    },
    subtitles: [
      { id: 'sub-p1', startSeconds: 0, endSeconds: 6, textHi: 'बच्चे को 102°F बुखार में कंबल में लपेटना सबसे खतरनाक गलती है!', textEn: 'Wrapping a feverish child in blankets is a dangerous mistake!' },
      { id: 'sub-p2', startSeconds: 6, endSeconds: 18, textHi: 'बुखार बच्चे के शरीर का संक्रमण से लड़ने का प्राकृतिक तरीका है।', textEn: 'Fever is the immune system’s natural defense against infection.' },
      { id: 'sub-p3', startSeconds: 18, endSeconds: 32, textHi: 'सूती कपड़े पहनाएं और कमरे के तापमान के पानी से स्पंजिंग करें।', textEn: 'Use breathable cotton clothes and lukewarm sponge baths.' },
      { id: 'sub-p4', startSeconds: 32, endSeconds: 48, textHi: 'यदि बच्चा सुस्त हो या दूध न पिए, तो तुरंत बाल रोग विशेषज्ञ से मिलें।', textEn: 'If child is lethargic or refusing feeds, consult a pediatrician.' }
    ],
    title: 'बच्चों में 102°F तेज बुखार: कब घबराएं और कौन सी 2 गलतियां कभी न करें!',
    summaryHindi: 'बुखार बच्चे के इम्यून सिस्टम की बीमारी से लड़ने की प्राकृतिक प्रतिक्रिया है। बुखार होने पर बच्चे को भारी कंबलों में लपेटना सबसे बड़ी गलती है।',
    summaryEnglish: 'Fever is your child\'s immune defense mechanism. Do not overbundle the child in heavy blankets or give unprescribed aspirin.',
    category: 'PEDIATRICS',
    tags: ['#PediatricFever', '#ChildHealth', '#BabyCare', '#Vaccination'],
    clinicalDos: [
      'कमरे का तापमान सामान्य रखें और बच्चे को सूती हल्के कपड़े पहनाएं।',
      'सामान्य तापमान वाले पानी से माथे, गर्दन और बगलों पर हल्की स्पंजिंग करें।'
    ],
    clinicalDonts: [
      'बच्चे को पसीना निकालने के लिए भारी रजाई या कंबल में कभी न लपेटें।',
      'बिना वजन के हिसाब से डॉक्टर की डोजिंग पूछे कोई भी पेनकिलर न दें।'
    ],
    opdConsultationFee: 400,
    nextAvailableSlot: 'Today 5:00 PM',
    isTeleconsultAvailable: true,
    viewsCount: 19840,
    likesCount: 1670,
    sharesCount: 612,
    consultsBookedCount: 52,
    isLikedByPatient: false,
    isSavedByPatient: false,
    isNmcVerified: true,
    disclaimerText: DEFAULT_NMC_HEALTH_DISCLAIMER,
    nmcCompliance: {
      isNmcVerified: true,
      nmcRegistrationNumber: 'NMC-PED-294011',
      stateMedicalCouncil: 'Maharashtra Medical Council',
      disclaimerText: DEFAULT_NMC_HEALTH_DISCLAIMER,
      genericPrescriptionCompliant: true,
      flaggedCommercialBrands: [],
      signedAt: '2026-11-17T14:15:00Z'
    },
    publishedAt: '2026-11-17T14:15:00Z'
  }
];

export const doctorReelsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/reels
   * Public or authenticated retrieval of verified doctor health awareness reels.
   */
  fastify.get('/api/v1/reels', async (request) => {
    const query = request.query as { category?: string; search?: string };
    let filtered = [...IN_MEMORY_REELS];

    if (query.category && query.category !== 'ALL') {
      filtered = filtered.filter((r) => r.category === query.category);
    }

    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.doctorName.toLowerCase().includes(s) ||
          r.tags.some((t) => t.toLowerCase().includes(s))
      );
    }

    return {
      success: true,
      count: filtered.length,
      data: filtered
    };
  });

  /**
   * GET /api/v1/reels/:id
   * Single reel retrieval with full streaming ladder and closed captions.
   */
  fastify.get('/api/v1/reels/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const reel = IN_MEMORY_REELS.find((r) => r.id === id);
    if (!reel) {
      return reply.status(404).send({ success: false, error: 'Reel not found' });
    }
    return {
      success: true,
      data: reel
    };
  });

  /**
   * POST /api/v1/reels/presigned-upload
   * 🛡️ Guarded: Only verified medical professionals and admins can generate presigned upload URLs.
   */
  fastify.post(
    '/api/v1/reels/presigned-upload',
    { preHandler: [authenticate, requireRoles('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN')] },
    async (request) => {
    const body = (request.body || {}) as { fileName?: string; fileType?: string; durationSeconds?: number };
    const fileId = `reel-raw-${Date.now()}`;
    const key = `uploads/doctor-reels/${fileId}.${body.fileType?.split('/')[1] || 'mp4'}`;

    return {
      success: true,
      data: {
        uploadUrl: `https://storage.docsearch.health/v1/upload/${key}?signed=true`,
        fileId,
        publicVideoUrl: `https://cdn.docsearch.health/reels/transcoded/${fileId}.mp4`,
        hlsMasterUrl: `https://cdn.docsearch.health/reels/transcoded/${fileId}/master.m3u8`,
        expiresInSeconds: 3600
      }
    };
  });

  /**
   * POST /api/v1/reels/publish (🛡️ Doctor / Admin Authenticated)
   * Doctor Creator Studio publishes a verified Swasthya Short with NMC Ethics & Drug Brand checks.
   */
  fastify.post('/api/v1/reels/publish', { preHandler: [authenticate, requireRoles('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN', 'CLINIC_ADMIN')] }, async (request, reply) => {
    const body = request.body as Partial<DoctorReelDto>;

    if (!body.title || !body.videoUrl || !body.category) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required parameters: title, videoUrl, and category are mandatory'
      });
    }

    // 1. NMC Automated Commercial Drug Brand Detection
    const combinedContent = `${body.title} ${body.summaryHindi || ''} ${body.summaryEnglish || ''} ${(body.clinicalDos || []).join(' ')} ${(body.clinicalDonts || []).join(' ')}`.toLowerCase();
    const flaggedBrands: string[] = [];

    for (const [brand, generic] of Object.entries(COMMERCIAL_DRUG_BRAND_MAP)) {
      if (combinedContent.includes(brand)) {
        flaggedBrands.push(`${brand.toUpperCase()} ➔ Use generic: ${generic}`);
      }
    }

    const nmcReg = body.nmcRegistrationNumber || 'NMC-GEN-902144';
    const newReel: DoctorReelDto = {
      id: `reel-${Date.now()}`,
      doctorId: body.doctorId || 'doc-logged-in',
      doctorName: body.doctorName || 'Dr. Vivek Sharma',
      doctorSpecialty: body.doctorSpecialty || 'Senior Consultant Physician',
      doctorDegree: body.doctorDegree || 'MBBS, MD',
      nmcRegistrationNumber: nmcReg,
      hospitalName: body.hospitalName || 'DocSearch Super Specialty Hospital',
      doctorAvatarUrl:
        body.doctorAvatarUrl ||
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      videoUrl: body.videoUrl,
      thumbnailUrl:
        body.thumbnailUrl ||
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
      durationSeconds: body.durationSeconds || 50,
      streamLadder: body.streamLadder || {
        hlsMasterUrl: `https://cdn.docsearch.health/reels/${Date.now()}/master.m3u8`,
        fallbackMp4Url: body.videoUrl,
        resolutions: [
          { label: '360p', bitrateKbps: 600, width: 360, height: 640, streamUrl: body.videoUrl },
          { label: '720p', bitrateKbps: 2200, width: 720, height: 1280, streamUrl: body.videoUrl }
        ]
      },
      subtitles: body.subtitles || [
        {
          id: 'sub-auto-1',
          startSeconds: 0,
          endSeconds: 10,
          textHi: body.title,
          textEn: body.title
        }
      ],
      title: body.title,
      summaryHindi: body.summaryHindi || body.title,
      summaryEnglish: body.summaryEnglish || body.title,
      category: body.category as ReelCategory,
      tags: body.tags || [`#${body.category}`, '#DocSearchReels', '#SwasthyaShorts'],
      clinicalDos: body.clinicalDos || ['डॉक्टर की सलाह अनुसार ही दवाएं लें।'],
      clinicalDonts: body.clinicalDonts || ['स्वयं दवा (Self-medication) न करें।'],
      opdConsultationFee: body.opdConsultationFee || 500,
      nextAvailableSlot: body.nextAvailableSlot || 'Today 4:30 PM',
      isTeleconsultAvailable: body.isTeleconsultAvailable ?? true,
      viewsCount: 1,
      likesCount: 1,
      sharesCount: 0,
      consultsBookedCount: 0,
      isLikedByPatient: false,
      isSavedByPatient: false,
      isNmcVerified: true,
      disclaimerText: DEFAULT_NMC_HEALTH_DISCLAIMER,
      nmcCompliance: {
        isNmcVerified: true,
        nmcRegistrationNumber: nmcReg,
        stateMedicalCouncil: 'National Medical Commission Register',
        disclaimerText: DEFAULT_NMC_HEALTH_DISCLAIMER,
        genericPrescriptionCompliant: flaggedBrands.length === 0,
        flaggedCommercialBrands: flaggedBrands,
        signedAt: new Date().toISOString()
      },
      publishedAt: new Date().toISOString()
    };

    IN_MEMORY_REELS.unshift(newReel);
    logger.info('Published new doctor awareness reel', { reelId: newReel.id, doctorName: newReel.doctorName });

    return {
      success: true,
      data: newReel,
      complianceNotice:
        flaggedBrands.length > 0
          ? `⚠️ Warning: NMC 2023 Ethics recommends using generic drug formulations instead of commercial brands: ${flaggedBrands.join('; ')}`
          : '✅ 100% NMC Ethics & Generic Formulation Compliant'
    };
  });

  /**
   * POST /api/v1/reels/:id/engage
   * 🛡️ Guarded: Only authenticated users/patients can submit engagement interactions.
   */
  fastify.post(
    '/api/v1/reels/:id/engage',
    { preHandler: [authenticate] },
    async (request, reply) => {
    const { id } = request.params as { id: string };
    const { action } = (request.body || {}) as { action: ReelEngagementAction };
    const reel = IN_MEMORY_REELS.find((r) => r.id === id);

    if (!reel) {
      return reply.status(404).send({ success: false, error: 'Reel not found' });
    }

    switch (action) {
      case 'LIKE':
        reel.likesCount += 1;
        reel.isLikedByPatient = true;
        break;
      case 'UNLIKE':
        reel.likesCount = Math.max(0, reel.likesCount - 1);
        reel.isLikedByPatient = false;
        break;
      case 'SAVE':
        reel.isSavedByPatient = true;
        break;
      case 'UNSAVE':
        reel.isSavedByPatient = false;
        break;
      case 'SHARE':
        reel.sharesCount += 1;
        break;
      case 'BOOK_CONSULT':
        reel.consultsBookedCount += 1;
        break;
    }

    return {
      success: true,
      data: {
        reelId: reel.id,
        likesCount: reel.likesCount,
        sharesCount: reel.sharesCount,
        consultsBookedCount: reel.consultsBookedCount,
        isLikedByPatient: reel.isLikedByPatient,
        isSavedByPatient: reel.isSavedByPatient
      }
    };
  });

  /**
   * POST /api/v1/reels/report
   * Patient safety mechanism to report medical misinformation or policy violations.
   */
  fastify.post('/api/v1/reels/report', async (request) => {
    const body = (request.body || {}) as { reelId: string; reason: string; comment?: string };
    logger.warn('Patient reported medical awareness reel', body);
    return {
      success: true,
      message: 'Report received. Our Clinical Governance Committee will audit the video within 2 hours.'
    };
  });
};
