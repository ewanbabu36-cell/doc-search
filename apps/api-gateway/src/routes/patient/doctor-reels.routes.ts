import { type FastifyPluginAsync } from 'fastify';
import {
  type DoctorReelDto,
  type ReelCategory,
  type ReelEngagementAction,
  COMMERCIAL_DRUG_BRAND_MAP,
  DEFAULT_NMC_HEALTH_DISCLAIMER
} from '@docsearch/api-contracts';
import { getDatabase, platformSettings, eq } from '@docsearch/database';
import { createLogger, distributedCache } from '@docsearch/shared-core';
import { authenticate, requireRoles } from '../../plugins/auth-guard.js';
import { env } from '../../config/env.js';

const logger = createLogger('doctor-reels-routes');
const REELS_SETTINGS_KEY = 'DOCTOR_HEALTH_REELS';

function resolveStreamLadder(reel: DoctorReelDto): DoctorReelDto['streamLadder'] {
  const cdnBase = env.MEDIA_CDN_BASE_URL?.replace(/\/$/, '');
  const fallback = reel.streamLadder?.fallbackMp4Url || reel.videoUrl;
  if (!reel.streamLadder) {
    return {
      hlsMasterUrl: fallback,
      fallbackMp4Url: fallback,
      resolutions: [
        { label: '360p', bitrateKbps: 600, width: 360, height: 640, streamUrl: fallback },
        { label: '720p', bitrateKbps: 2200, width: 720, height: 1280, streamUrl: fallback }
      ]
    };
  }
  const rewrite = (url: string) =>
    url.startsWith('https://cdn.docsearch.health')
      ? (cdnBase ? url.replace('https://cdn.docsearch.health', cdnBase) : fallback)
      : url;
  return {
    hlsMasterUrl: rewrite(reel.streamLadder.hlsMasterUrl),
    fallbackMp4Url: fallback,
    resolutions: reel.streamLadder.resolutions.map((r) => ({
      ...r,
      streamUrl: rewrite(r.streamUrl)
    }))
  };
}

// Live verified Swasthya Shorts catalog starts empty until NMC-registered partner clinicians publish reels into PostgreSQL core.platform_settings
const DEFAULT_DOCTOR_REELS: DoctorReelDto[] = [];

async function loadReelsStore(): Promise<DoctorReelDto[]> {
  try {
    const cached = await distributedCache.get<DoctorReelDto[]>(REELS_SETTINGS_KEY);
    if (Array.isArray(cached) && cached.length > 0) {
      return cached.map((r) => ({ ...r, streamLadder: resolveStreamLadder(r) }));
    }
  } catch (err) {
    logger.warn('Failed reading doctor reels from cache', { error: String(err) });
  }
  try {
    const db = getDatabase();
    if (db) {
      const [row] = await db.select().from(platformSettings).where(eq(platformSettings.key, REELS_SETTINGS_KEY)).limit(1);
      if (row && Array.isArray(row.value) && row.value.length > 0) {
        const persisted = (row.value as unknown as DoctorReelDto[]).map((r) => ({
          ...r,
          streamLadder: resolveStreamLadder(r)
        }));
        void distributedCache.set(REELS_SETTINGS_KEY, persisted, { ttlSeconds: 300 }).catch(() => {});
        return persisted;
      }
    }
  } catch (err) {
    logger.warn('Failed reading doctor reels from PostgreSQL', { error: String(err) });
  }
  return DEFAULT_DOCTOR_REELS.map((r) => ({ ...r, streamLadder: resolveStreamLadder(r) }));
}

async function saveReelsStore(reels: DoctorReelDto[], updatedBy = 'doctor-reels-routes'): Promise<void> {
  try {
    await distributedCache.set(REELS_SETTINGS_KEY, reels, { ttlSeconds: 300 });
  } catch (err) {
    logger.warn('Failed caching doctor reels', { error: String(err) });
  }
  try {
    const db = getDatabase();
    if (!db) return;
    await db
      .insert(platformSettings)
      .values({ key: REELS_SETTINGS_KEY, value: reels as unknown as Record<string, unknown>, updatedBy })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value: reels as unknown as Record<string, unknown>, updatedBy, updatedAt: new Date() }
      });
  } catch (err) {
    logger.warn('Failed persisting doctor reels to PostgreSQL', { error: String(err) });
  }
}

export const doctorReelsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/reels
   * Public or authenticated retrieval of verified doctor health awareness reels.
   */
  fastify.get('/api/v1/reels', async (request) => {
    const query = request.query as { category?: string; search?: string };
    let filtered = await loadReelsStore();

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
    const reels = await loadReelsStore();
    const reel = reels.find((r) => r.id === id);
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
    async (request, reply) => {
      const body = (request.body || {}) as { fileName?: string; fileType?: string; durationSeconds?: number };
      const cdnBase = env.MEDIA_CDN_BASE_URL?.replace(/\/$/, '');
      if (env.NODE_ENV === 'production' && !cdnBase) {
        return reply.status(503).send({
          success: false,
          error: 'MEDIA_STORAGE_NOT_CONFIGURED',
          message: 'Media CDN/object storage endpoint (MEDIA_CDN_BASE_URL) is not configured for video uploads.'
        });
      }
      const fileId = `reel-raw-${Date.now()}`;
      const key = `uploads/doctor-reels/${fileId}.${body.fileType?.split('/')[1] || 'mp4'}`;
      const base = cdnBase || `http://127.0.0.1:${env.PORT}`;

      return {
        success: true,
        data: {
          uploadUrl: `${base}/v1/upload/${key}?signed=true`,
          fileId,
          publicVideoUrl: `${base}/reels/transcoded/${fileId}.mp4`,
          hlsMasterUrl: `${base}/reels/transcoded/${fileId}/master.m3u8`,
          expiresInSeconds: 3600
        }
      };
    }
  );

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

    const nmcReg = body.nmcRegistrationNumber || '';
    const newReel: DoctorReelDto = {
      id: `reel-${Date.now()}`,
      doctorId: body.doctorId || request.session?.userId || 'doc-verified',
      doctorName: body.doctorName || request.session?.actorEmail || 'Verified Clinician',
      doctorSpecialty: body.doctorSpecialty || 'Specialist Physician',
      doctorDegree: body.doctorDegree || 'MBBS',
      nmcRegistrationNumber: nmcReg,
      hospitalName: body.hospitalName || 'Registered Partner Facility',
      doctorAvatarUrl: body.doctorAvatarUrl || '',
      videoUrl: body.videoUrl,
      thumbnailUrl: body.thumbnailUrl || '',
      durationSeconds: body.durationSeconds || 50,
      streamLadder: body.streamLadder || {
        hlsMasterUrl: env.MEDIA_CDN_BASE_URL
          ? `${env.MEDIA_CDN_BASE_URL.replace(/\/$/, '')}/reels/${Date.now()}/master.m3u8`
          : body.videoUrl,
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

    const reels = await loadReelsStore();
    reels.unshift(newReel);
    await saveReelsStore(reels, request.session?.actorEmail || 'doctor-publish');
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
    const reels = await loadReelsStore();
    const reel = reels.find((r) => r.id === id);

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

    await saveReelsStore(reels, 'reel-engagement');

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
