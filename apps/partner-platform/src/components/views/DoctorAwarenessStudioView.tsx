import React, { useState, useRef, useEffect } from 'react';
import type { HospitalStaffUser } from '../auth/HospitalStaffLogin.js';
import type { ReelCategory, DoctorReelDto } from '@docsearch/api-contracts';

interface Props {
  currentUser?: HospitalStaffUser;
}

interface TeleprompterSection {
  timeRange: string;
  phase: string;
  color: string;
  scriptHi: string;
  scriptEn: string;
}

const TELEPROMPTER_GUIDE_PRESETS: Record<ReelCategory, TeleprompterSection[]> = {
  CARDIOLOGY: [
    {
      timeRange: '0 - 5s',
      phase: '1. Hook / ध्यान खींचें',
      color: '#EF4444',
      scriptHi: 'क्या आप जानते हैं कि 40% हार्ट अटैक सुबह 5 से 8 बजे के बीच क्यों होते हैं?',
      scriptEn: 'Did you know 40% of cardiovascular emergencies strike between 5 AM and 8 AM?'
    },
    {
      timeRange: '5 - 25s',
      phase: '2. Clinical Science / चिकित्सीय कारण',
      color: '#38BDF8',
      scriptHi: 'सुबह शरीर में कॉर्टिसोल और एड्रेनालिन हार्मोन चरम पर होते हैं, जिससे बीपी अचानक बढ़ता है। बिना पानी पिए भारी कसरत से धमनियों पर दबाव पड़ता है।',
      scriptEn: 'Morning cortisol surges constrict arterial walls. Engaging in sudden heavy exertion without prior hydration stresses the myocardium.'
    },
    {
      timeRange: '25 - 45s',
      phase: '3. Do\'s & Don\'ts / क्या करें और क्या न करें',
      color: '#10B981',
      scriptHi: 'उठते ही 1 गिलास गुनगुना पानी पिएं। खाली पेट कड़क चाय या सिगरेट बिल्कुल न लें और जबड़े में दर्द को गैस न समझें।',
      scriptEn: 'Hydrate immediately upon waking. Do not smoke or consume heavy caffeine on an empty stomach. Never ignore radiating jaw pain.'
    },
    {
      timeRange: '45 - 60s',
      phase: '4. CTA / अपॉइंटमेंट बुलावा',
      color: '#A855F7',
      scriptHi: 'अगर आपका बीपी 140/90 से ज्यादा रहता है, तो नीचे दिए गए बटन से सीधे ओपीडी टोकन बुक करें।',
      scriptEn: 'If your morning BP regularly exceeds 140/90, tap the button below to book an immediate OPD consultation.'
    }
  ],
  PEDIATRICS: [
    {
      timeRange: '0 - 5s',
      phase: '1. Hook / ध्यान खींचें',
      color: '#EF4444',
      scriptHi: 'बच्चे को 102°F बुखार में भारी कंबल में लपेटना सबसे खतरनाक गलती क्यों है?',
      scriptEn: 'Why bundling a feverish infant under heavy blankets can trigger febrile convulsions.'
    },
    {
      timeRange: '5 - 25s',
      phase: '2. Clinical Science / चिकित्सीय कारण',
      color: '#38BDF8',
      scriptHi: 'बुखार संक्रमण से लड़ने की प्राकृतिक प्रक्रिया है। कंबल ओढ़ाने से बच्चे का तापमान 104°F पार जा सकता है।',
      scriptEn: 'Fever is the immune system actively fighting microbes. Over-wrapping traps heat and rapidly spikes body temperature.'
    },
    {
      timeRange: '25 - 45s',
      phase: '3. Do\'s & Don\'ts / क्या करें और क्या न करें',
      color: '#10B981',
      scriptHi: 'हल्के सूती कपड़े पहनाएं, माथे पर गुनगुने पानी की पट्टी रखें। बिना वजन के हिसाब से डॉक्टर की सलाह के दवा न दें।',
      scriptEn: 'Dress in breathable cotton, use room-temperature sponge baths, and dose paracetamol strictly per weight.'
    },
    {
      timeRange: '45 - 60s',
      phase: '4. CTA / अपॉइंटमेंट बुलावा',
      color: '#A855F7',
      scriptHi: 'अगर बच्चा सुस्त है या खाना छोड़ दिया है, तो तुरंत 1-टैप में बाल रोग विशेषज्ञ टोकन बुक करें।',
      scriptEn: 'If your child is lethargic or refusing feeds, tap below for an instant pediatric consultation.'
    }
  ],
  DIABETES_METABOLIC: [
    {
      timeRange: '0 - 5s',
      phase: '1. Hook / ध्यान खींचें',
      color: '#EF4444',
      scriptHi: 'क्या खाली पेट शुगर 120 आने पर भी आपको तुरंत दवा बदलने की जरूरत है?',
      scriptEn: 'Is a fasting glucose of 120 mg/dL a sign your medication needs an urgent change?'
    },
    {
      timeRange: '5 - 25s',
      phase: '2. Clinical Science / चिकित्सीय कारण',
      color: '#38BDF8',
      scriptHi: 'इसे डॉन फेनोमेनन (Dawn Phenomenon) कहते हैं। लिवर सुबह ग्लूकोज रिलीज करता है। अकेले फास्टिंग देखकर दवा न बढ़ाएं।',
      scriptEn: 'This is the dawn phenomenon where hepatic gluconeogenesis peaks. Single fasting readings don\'t reflect HbA1c.'
    },
    {
      timeRange: '25 - 45s',
      phase: '3. Do\'s & Don\'ts / क्या करें और क्या न करें',
      color: '#10B981',
      scriptHi: 'रात का खाना 8 बजे तक खाएं। खाली पेट सीधे मीठे फल या फ्रूट जूस न पिएं। रोज 20 मिनट तेज कदम चलें।',
      scriptEn: 'Finish dinner by 8 PM. Avoid concentrated fruit juices on an empty stomach. Commit to 20 minutes brisk walking.'
    },
    {
      timeRange: '45 - 60s',
      phase: '4. CTA / अपॉइंटमेंट बुलावा',
      color: '#A855F7',
      scriptHi: 'अपने HbA1c और दवा की सही डोज़िंग के लिए आज ही डायबिटोलॉजी स्लॉट बुक करें।',
      scriptEn: 'Get your HbA1c evaluated and insulin titration reviewed with 1 tap.'
    }
  ],
  WOMEN_HEALTH: [
    {
      timeRange: '0 - 5s',
      phase: '1. Hook / ध्यान खींचें',
      color: '#EF4444',
      scriptHi: 'प्रेगनेंसी की पहली तिमाही में उल्टी और जी मिचलाना: कब यह नॉर्मल है और कब डेंजर?',
      scriptEn: 'First trimester morning sickness: when is nausea benign and when is it Hyperemesis Gravidarum?'
    },
    {
      timeRange: '5 - 25s',
      phase: '2. Clinical Science / चिकित्सीय कारण',
      color: '#38BDF8',
      scriptHi: 'बीटा-hCG हार्मोन के कारण शुरुआती 12 हफ्तों में उल्टी होना सामान्य है, लेकिन पेशाब कम होना डिहाइड्रेशन का संकेत है।',
      scriptEn: 'Elevated beta-hCG causes physiological nausea, but ketone accumulation and dark urine require intervention.'
    },
    {
      timeRange: '25 - 45s',
      phase: '3. Do\'s & Don\'ts / क्या करें और क्या न करें',
      color: '#10B981',
      scriptHi: 'सुबह बिस्तर छोड़ने से पहले सादा बिस्किट या भुना चना खाएं। ज्यादा तेल-मसाले से बचें और फोलिक एसिड समय पर लें।',
      scriptEn: 'Nibble dry toast or roasted gram before getting out of bed. Never skip your daily folic acid.'
    },
    {
      timeRange: '45 - 60s',
      phase: '4. CTA / अपॉइंटमेंट बुलावा',
      color: '#A855F7',
      scriptHi: 'एंटीनेटल चेकअप या अल्ट्रासाउंड स्कैन के लिए तुरंत अपनी गायनेकोलॉजिस्ट से अपॉइंटमेंट बुक करें।',
      scriptEn: 'Book your antenatal screening scan or OB-GYN consult with 1 tap.'
    }
  ],
  ORTHOPEDICS: [
    {
      timeRange: '0 - 5s',
      phase: '1. Hook / ध्यान खींचें',
      color: '#EF4444',
      scriptHi: 'क्या घुटने के दर्द में जमीन पर पालथी मारकर बैठना सही है?',
      scriptEn: 'Should you sit cross-legged if you are experiencing knee osteoarthritis pain?'
    },
    {
      timeRange: '5 - 25s',
      phase: '2. Clinical Science / चिकित्सीय कारण',
      color: '#38BDF8',
      scriptHi: 'पालथी मारने या उकड़ू बैठने से घुटने के कार्टिलेज पर शरीर के वजन का 7 गुना दबाव पड़ता है।',
      scriptEn: 'Deep knee flexion and squatting multiply cartilage contact stress up to seven-fold.'
    },
    {
      timeRange: '25 - 45s',
      phase: '3. Do\'s & Don\'ts / क्या करें और क्या न करें',
      color: '#10B981',
      scriptHi: 'कुर्सी पर बैठकर भोजन करें। वेस्टर्न टॉयलेट का उपयोग करें। क्वाड्स स्ट्रेंथनिंग एक्सरसाइज नियमित करें।',
      scriptEn: 'Use high chairs, prefer western commodes, and practice isometric quadriceps strengthening daily.'
    },
    {
      timeRange: '45 - 60s',
      phase: '4. CTA / अपॉइंटमेंट बुलावा',
      color: '#A855F7',
      scriptHi: 'दर्द निवारक गोलियां खाकर किडनी खराब न करें। ऑर्थोपेडिक कंसल्टेशन बुक करें।',
      scriptEn: 'Avoid chronic NSAID misuse. Tap below to book an orthopedic joint evaluation.'
    }
  ],
  SEASONAL_INFECTIONS: [
    {
      timeRange: '0 - 5s',
      phase: '1. Hook / ध्यान खींचें',
      color: '#EF4444',
      scriptHi: 'डेंगू बुखार में प्लेटलेट्स गिरते ही क्या तुरंत प्लेटलेट चढ़वाना जरूरी है?',
      scriptEn: 'Does a platelet drop in Dengue fever always warrant immediate platelet transfusion?'
    },
    {
      timeRange: '5 - 25s',
      phase: '2. Clinical Science / चिकित्सीय कारण',
      color: '#38BDF8',
      scriptHi: 'गाइडलाइंस के अनुसार जब तक एक्टिव ब्लीडिंग न हो या प्लेटलेट 10,000 से नीचे न जाए, प्लेटलेट ट्रांसफ्यूजन की जरूरत नहीं होती।',
      scriptEn: 'Unless there is overt mucosal bleeding or platelets fall below 10,000, intensive hydration is the primary priority.'
    },
    {
      timeRange: '25 - 45s',
      phase: '3. Do\'s & Don\'ts / क्या करें और क्या न करें',
      color: '#10B981',
      scriptHi: 'ओआरएस, नारियल पानी और पर्याप्त तरल पदार्थ लें। पैरासिटामोल के अलावा कोई पेनकिलर (ब्रुफेन आदि) कभी न लें।',
      scriptEn: 'Drink adequate ORS and fluids. Take only Paracetamol; strictly avoid NSAIDs like Brufen or Aspirin.'
    },
    {
      timeRange: '45 - 60s',
      phase: '4. CTA / अपॉइंटमेंट बुलावा',
      color: '#A855F7',
      scriptHi: 'सीबीसी और हेमैटोक्रिट मॉनिटरिंग के लिए फिजिशियन टोकन तुरंत बुक करें।',
      scriptEn: 'Book a physician OPD token for continuous CBC and hematocrit tracking.'
    }
  ],
  EYE_CARE: [
    {
      timeRange: '0 - 5s',
      phase: '1. Hook / ध्यान खींचें',
      color: '#EF4444',
      scriptHi: 'कंप्यूटर और मोबाइल स्क्रीन से आंखें सूखना और धुंधला दिखना: 20-20-20 नियम क्या है?',
      scriptEn: 'Screen strain and digital eye dryness: what is the evidence-based 20-20-20 ophthalmology rule?'
    },
    {
      timeRange: '5 - 25s',
      phase: '2. Clinical Science / चिकित्सीय कारण',
      color: '#38BDF8',
      scriptHi: 'स्क्रीन देखते समय ब्लिंक रेट 60% घट जाता है, जिससे टीयर फिल्म जल्दी सूख जाती है।',
      scriptEn: 'Blinking frequency drops by 60% during focused screen use, accelerating tear film evaporation.'
    },
    {
      timeRange: '25 - 45s',
      phase: '3. Do\'s & Don\'ts / क्या करें और क्या न करें',
      color: '#10B981',
      scriptHi: 'हर 20 मिनट बाद 20 सेकंड के लिए 20 फीट दूर देखें। बिना प्रिस्क्रिप्शन के स्टेरॉयड आई ड्रॉप्स न डालें।',
      scriptEn: 'Every 20 mins, look 20 feet away for 20 secs. Avoid OTC steroid eye drops without slit-lamp checks.'
    },
    {
      timeRange: '45 - 60s',
      phase: '4. CTA / अपॉइंटमेंट बुलावा',
      color: '#A855F7',
      scriptHi: 'नेत्र रोग विशेषज्ञ से आई प्रेशर और विजन जांच के लिए आज ही स्लॉट बुक करें।',
      scriptEn: 'Book an ophthalmology evaluation for intraocular pressure and refractions.'
    }
  ],
  MENTAL_WELLNESS: [
    {
      timeRange: '0 - 5s',
      phase: '1. Hook / ध्यान खींचें',
      color: '#EF4444',
      scriptHi: 'क्या लगातार सिरदर्द, घबराहट और नींद न आना केवल शारीरिक थकान है या एंग्जाइटी?',
      scriptEn: 'Are chronic tension headaches, palpitations and insomnia mere fatigue or clinical anxiety?'
    },
    {
      timeRange: '5 - 25s',
      phase: '2. Clinical Science / चिकित्सीय कारण',
      color: '#38BDF8',
      scriptHi: 'क्रोनिक स्ट्रेस से सिम्पैथेटिक नर्वस सिस्टम ओवरएक्टिव हो जाता है। मन और शरीर का गहरा संबंध है।',
      scriptEn: 'Chronic psychosocial stress dysregulates the autonomic axis and neuroendocrine balance.'
    },
    {
      timeRange: '25 - 45s',
      phase: '3. Do\'s & Don\'ts / क्या करें और क्या न करें',
      color: '#10B981',
      scriptHi: 'रोज 10 मिनट डीप ब्रीदिंग करें, स्क्रीन डिटॉक्स करें और अपनी समस्याओं को किसी पेशेवर से साझा करें।',
      scriptEn: 'Practice diaphragmatic breathing, limit doom-scrolling, and seek professional counseling early.'
    },
    {
      timeRange: '45 - 60s',
      phase: '4. CTA / अपॉइंटमेंट बुलावा',
      color: '#A855F7',
      scriptHi: 'गोपनीय मेंटल हेल्थ काउंसलिंग व कंसल्टेशन के लिए 1-टैप में स्लॉट बुक करें।',
      scriptEn: 'Book a 100% confidential teleconsult with our behavioral health specialist.'
    }
  ],
  PRE_POST_SURGERY: [
    {
      timeRange: '0 - 5s',
      phase: '1. Hook / ध्यान खींचें',
      color: '#EF4444',
      scriptHi: 'सर्जरी से पहले 8 घंटे खाली पेट (NPO) रहना एनेस्थीसिया के लिए अनिवार्य क्यों है?',
      scriptEn: 'Why fasting (NPO) 8 hours prior to surgery is non-negotiable for safe general anesthesia.'
    },
    {
      timeRange: '5 - 25s',
      phase: '2. Clinical Science / चिकित्सीय कारण',
      color: '#38BDF8',
      scriptHi: 'एनेस्थीसिया में गले के रिफ्लेक्स शांत हो जाते हैं। पेट में खाना होने पर वह फेफड़ों में एस्पिरेट हो सकता है।',
      scriptEn: 'Anesthesia blunts protective laryngeal reflexes, creating a severe risk of pulmonary aspiration.'
    },
    {
      timeRange: '25 - 45s',
      phase: '3. Do\'s & Don\'ts / क्या करें और क्या न करें',
      color: '#10B981',
      scriptHi: 'डॉक्टर द्वारा बताए गए समय के बाद एक घूंट पानी भी न पिएं। अपनी ब्लड थिनर दवाएं डॉक्टर को बताएं।',
      scriptEn: 'Observe strict fasting timelines. Disclose all anticoagulants, antiplatelets, and herbal supplements.'
    },
    {
      timeRange: '45 - 60s',
      phase: '4. CTA / अपॉइंटमेंट बुलावा',
      color: '#A855F7',
      scriptHi: 'प्री-एनेस्थीसिया चेकअप (PAC) या पोस्ट-सर्जिकल ड्रेसिंग के लिए ओपीडी टोकन बुक करें।',
      scriptEn: 'Schedule your Pre-Anesthesia Checkup (PAC) or post-op wound evaluation with 1 tap.'
    }
  ]
};

export const DoctorAwarenessStudioView: React.FC<Props> = ({ currentUser }) => {
  const doctorName = currentUser?.name || 'Dr. Vikram Malhotra';
  const hospitalName = currentUser?.tenantName || 'DocSearch Super Specialty Hospital';
  const department = currentUser?.department || 'Cardiology';

  // State
  const [activeTab, setActiveTab] = useState<'RECORD' | 'DRAFT' | 'ANALYTICS'>('RECORD');
  const [category, setCategory] = useState<ReelCategory>('CARDIOLOGY');
  const [title, setTitle] = useState('सुबह खाली पेट BP स्पाइक और हार्ट अटैक का खतरा — 3 कार्डियोलॉजी गोल्डन रूल्स');
  const [summaryHi, setSummaryHi] = useState('सुबह 5 से 8 बजे के बीच कॉर्टिसोल और एड्रेनालिन हार्मोन नैचुरली हाई होते हैं।');
  const [summaryEn, setSummaryEn] = useState('Morning blood pressure surges naturally between 5 AM and 8 AM due to cortisol peaks.');
  const [dosList, setDosList] = useState<string[]>([
    'उठने के तुरंत बाद 1 गिलास सामान्य गुनगुना पानी पिएं।',
    'अपनी बीपी की गोली डॉक्टर द्वारा निर्धारित समय पर रोज नियम से लें।'
  ]);
  const [dontsList, setDontsList] = useState<string[]>([
    'सुबह खाली पेट कड़क काली चाय या 2 से ज्यादा सिगरेट कभी न पिएं।',
    'छाती में हल्का भारीपन या जबड़े में दर्द को गैस समझकर इग्नोर न करें।'
  ]);
  const [newDoInput, setNewDoInput] = useState('');
  const [newDontInput, setNewDontInput] = useState('');
  const [opdFee, setOpdFee] = useState(500);
  const [slotTime, setSlotTime] = useState('Today 4:30 PM');
  const [teleconsultEnabled, setTeleconsultEnabled] = useState(true);

  // Recording & Teleprompter
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [prompterSpeed, setPrompterSpeed] = useState<'SLOW' | 'MEDIUM' | 'FAST'>('MEDIUM');
  const [prompterPlaying, setPrompterPlaying] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const prompterBoxRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<any>(null);

  // Switch category presets
  const handleCategoryChange = (cat: ReelCategory) => {
    setCategory(cat);
    const guide = TELEPROMPTER_GUIDE_PRESETS[cat] || TELEPROMPTER_GUIDE_PRESETS.CARDIOLOGY;
    setTitle(`${cat.replace(/_/g, ' ')}: ${guide[0]?.scriptHi.slice(0, 50)}...`);
    setSummaryHi(guide[1]?.scriptHi || '');
    setSummaryEn(guide[1]?.scriptEn || '');
  };

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 60) {
            setIsRecording(false);
            setPrompterPlaying(false);
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Teleprompter Auto-scroll
  useEffect(() => {
    if (!prompterPlaying) return;
    const speedMs = prompterSpeed === 'SLOW' ? 40 : prompterSpeed === 'MEDIUM' ? 24 : 14;
    const interval = setInterval(() => {
      if (prompterBoxRef.current) {
        prompterBoxRef.current.scrollTop += 1;
      }
    }, speedMs);
    return () => clearInterval(interval);
  }, [prompterPlaying, prompterSpeed]);

  const toggleRecording = () => {
    if (!isRecording) {
      setRecordSeconds(0);
      setIsRecording(true);
      setPrompterPlaying(true);
      if (prompterBoxRef.current) prompterBoxRef.current.scrollTop = 0;
    } else {
      setIsRecording(false);
      setPrompterPlaying(false);
      // Generate synthetic video preview
      setVideoPreviewUrl('https://assets.mixkit.co/videos/preview/mixkit-doctor-explaining-a-treatment-to-a-patient-40543-large.mp4');
    }
  };

  const addDo = () => {
    if (!newDoInput.trim()) return;
    setDosList([...dosList, newDoInput.trim()]);
    setNewDoInput('');
  };

  const removeDo = (index: number) => {
    setDosList(dosList.filter((_, i) => i !== index));
  };

  const addDont = () => {
    if (!newDontInput.trim()) return;
    setDontsList([...dontsList, newDontInput.trim()]);
    setNewDontInput('');
  };

  const removeDont = (index: number) => {
    setDontsList(dontsList.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    const newReel: DoctorReelDto = {
      id: `reel-${Date.now()}`,
      doctorId: currentUser?.id || 'doc-current',
      doctorName,
      doctorSpecialty: department || 'Clinical Specialist',
      doctorDegree: 'MBBS, MD',
      nmcRegistrationNumber: 'NMC-REG-982144',
      hospitalName,
      doctorAvatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      videoUrl: videoPreviewUrl || 'https://assets.mixkit.co/videos/preview/mixkit-doctor-explaining-a-treatment-to-a-patient-40543-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
      durationSeconds: recordSeconds || 52,
      title,
      summaryHindi: summaryHi,
      summaryEnglish: summaryEn,
      category,
      tags: [`#${category}`, '#DocSearchReels', '#PatientAwareness', '#HealthShorts'],
      clinicalDos: dosList,
      clinicalDonts: dontsList,
      opdConsultationFee: opdFee,
      nextAvailableSlot: slotTime,
      isTeleconsultAvailable: teleconsultEnabled,
      viewsCount: 1,
      likesCount: 1,
      sharesCount: 0,
      consultsBookedCount: 0,
      isLikedByPatient: false,
      isSavedByPatient: false,
      isNmcVerified: true,
      publishedAt: new Date().toISOString()
    };

    // Store in local storage for patient app consumption
    try {
      const existing = JSON.parse(localStorage.getItem('docsearch_doctor_reels') || '[]');
      localStorage.setItem('docsearch_doctor_reels', JSON.stringify([newReel, ...existing]));
    } catch {
      // safe fallback
    }

    setShowPublishSuccess(true);
    setTimeout(() => {
      setShowPublishSuccess(false);
      setActiveTab('ANALYTICS');
    }, 2500);
  };

  return (
    <div style={{ backgroundColor: '#0B0F19', color: '#F8FAFC', minHeight: '100%', padding: '20px' }}>
      {/* Top Banner / Studio Header */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              boxShadow: '0 8px 24px rgba(244, 63, 94, 0.4)'
            }}
          >
            🎬
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                DocSearch Swasthya Shorts — Doctor Awareness Studio
              </h1>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.6875rem',
                  fontWeight: 800
                }}
              >
                ✓ NMC Verified Studio
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px' }}>
              Clinician: <strong style={{ color: '#F8FAFC' }}>{doctorName}</strong> • {department} • {hospitalName}
            </div>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#0F172A', padding: '4px', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('RECORD')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'RECORD' ? '#E11D48' : 'transparent',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📹 Record & Guide</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DRAFT')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'DRAFT' ? '#E11D48' : 'transparent',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📝 Clinical Metadata & CTA</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'ANALYTICS' ? '#E11D48' : 'transparent',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📊 Impact & OPD Conversion</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {showPublishSuccess && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.95)',
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🚀</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>Swasthya Short Published to DocSearch Patient Feed!</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                Reel is live across patient mobile apps with instant OPD Token Booking attached.
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '8px' }}>
            NMC Compliance Signed
          </span>
        </div>
      )}

      {/* TAB 1: RECORD & TELEPROMPTER */}
      {activeTab === 'RECORD' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Column: Camera Preview & Record Controller */}
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔴 Live Studio Video Capture</span>
                {isRecording && (
                  <span
                    style={{
                      backgroundColor: '#EF4444',
                      color: '#FFF',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      animation: 'pulse 1s infinite'
                    }}
                  >
                    REC • {recordSeconds}s / 60s
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Vertical 9:16 Format</span>
            </div>

            {/* Video Viewport Box */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '9/16',
                maxHeight: '480px',
                margin: '0 auto',
                backgroundColor: '#000000',
                borderRadius: '16px',
                overflow: 'hidden',
                border: isRecording ? '3px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isRecording ? '0 0 30px rgba(239, 68, 68, 0.35)' : 'none'
              }}
            >
              {videoPreviewUrl ? (
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  controls
                  loop
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    textAlign: 'center',
                    color: '#94A3B8'
                  }}
                >
                  <span style={{ fontSize: '3rem', marginBottom: '12px' }}>🩺</span>
                  <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '1rem', marginBottom: '6px' }}>
                    {isRecording ? 'Doctor In-Frame Recording...' : 'Doctor Camera Standby'}
                  </div>
                  <div style={{ fontSize: '0.75rem', maxWidth: '280px', lineHeight: 1.4 }}>
                    {isRecording
                      ? 'Looking straight into the lens maintains direct clinical eye contact with patients.'
                      : 'Press Start Recording to begin 60-second video with auto-scrolling teleprompter.'}
                  </div>
                </div>
              )}

              {/* In-Frame Doctor Verification Watermark */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '0.6875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🛡️ NMC Verified</span>
                <span style={{ color: '#38BDF8', fontWeight: 800 }}>DOCSEARCH SHORTS</span>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={toggleRecording}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isRecording ? '#DC2626' : '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>{isRecording ? '⏹ Stop Recording' : '🔴 Start 60s Recording'}</span>
              </button>
              <label
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#334155',
                  color: '#F8FAFC',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📁 Upload Video</span>
                <input
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setVideoPreviewUrl(url);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Right Column: Teleprompter Guide & Medical Script */}
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>📜 Clinical Teleprompter Guide</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Bilingual Indian Doctor Script (60s Structure)</div>
              </div>

              {/* Speed Controller */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Speed:</span>
                {(['SLOW', 'MEDIUM', 'FAST'] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPrompterSpeed(spd)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: prompterSpeed === spd ? '#38BDF8' : '#334155',
                      color: prompterSpeed === spd ? '#0F172A' : '#F8FAFC',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Pill Selector for Instant Script Loading */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
              {(['CARDIOLOGY', 'PEDIATRICS', 'DIABETES_METABOLIC', 'WOMEN_HEALTH', 'ORTHOPEDICS', 'SEASONAL_INFECTIONS', 'EYE_CARE', 'MENTAL_WELLNESS', 'PRE_POST_SURGERY'] as ReelCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: category === cat ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: category === cat ? '#38BDF8' : '#94A3B8',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: category === cat ? '#38BDF8' : 'transparent',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Teleprompter Scroll Box */}
            <div
              ref={prompterBoxRef}
              style={{
                flex: 1,
                minHeight: '360px',
                maxHeight: '440px',
                overflowY: 'auto',
                backgroundColor: '#0F172A',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              {(TELEPROMPTER_GUIDE_PRESETS[category] || TELEPROMPTER_GUIDE_PRESETS.CARDIOLOGY).map((sec, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '20px',
                    borderLeft: `4px solid ${sec.color}`,
                    paddingLeft: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: sec.color }}>{sec.phase}</span>
                    <span style={{ fontSize: '0.6875rem', backgroundColor: '#1E293B', padding: '2px 6px', borderRadius: '4px', color: '#CBD5E1' }}>
                      ⏱️ {sec.timeRange}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px', lineHeight: 1.5 }}>
                    🇮🇳 {sec.scriptHi}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.4 }}>
                    🇬🇧 {sec.scriptEn}
                  </div>
                </div>
              ))}
            </div>

            {/* Prompter Control Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setPrompterPlaying(!prompterPlaying)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: prompterPlaying ? '#F59E0B' : '#38BDF8',
                  color: '#0F172A',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {prompterPlaying ? '⏸ Pause Script' : '▶ Auto-Scroll Script'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('DRAFT')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#E11D48',
                  color: '#FFFFFF',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Proceed to Attach OPD CTA ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: METADATA, CLINICAL DOS & DONTS, OPD TOKEN ATTACHMENT */}
      {activeTab === 'DRAFT' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
          {/* Metadata & Do's & Don'ts Form */}
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: 900, marginBottom: '16px', color: '#F8FAFC' }}>
              📝 Reel Metadata & Clinical Do's & Don'ts
            </h2>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                Video Reel Title (Engaging Clinical Hook)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#F8FAFC',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Hindi & English Summaries */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  🇮🇳 Hindi Summary / संक्षेप
                </label>
                <textarea
                  rows={3}
                  value={summaryHi}
                  onChange={(e) => setSummaryHi(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#F8FAFC',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  🇬🇧 English Summary
                </label>
                <textarea
                  rows={3}
                  value={summaryEn}
                  onChange={(e) => setSummaryEn(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#F8FAFC',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>
            </div>

            {/* Do's Builder */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#10B981', marginBottom: '6px' }}>
                ✅ Clinical Do's / क्या करें (Patient Guidance)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. सुबह खाली पेट 1 गिलास गुनगुना पानी पिएं"
                  value={newDoInput}
                  onChange={(e) => setNewDoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDo()}
                  style={{
                    flex: 1,
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#F8FAFC',
                    fontSize: '0.8125rem'
                  }}
                />
                <button
                  type="button"
                  onClick={addDo}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Add
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dosList.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.8125rem',
                      color: '#A7F3D0'
                    }}
                  >
                    <span>✓ {item}</span>
                    <button
                      type="button"
                      onClick={() => removeDo(idx)}
                      style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontWeight: 800 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Don'ts Builder */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#EF4444', marginBottom: '6px' }}>
                ❌ Clinical Don'ts / क्या न करें (Critical Warnings)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. छाती के दर्द को गैस समझकर एंटासिड खाकर न बैठें"
                  value={newDontInput}
                  onChange={(e) => setNewDontInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDont()}
                  style={{
                    flex: 1,
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#F8FAFC',
                    fontSize: '0.8125rem'
                  }}
                />
                <button
                  type="button"
                  onClick={addDont}
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Add
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dontsList.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.8125rem',
                      color: '#FECACA'
                    }}
                  >
                    <span>✕ {item}</span>
                    <button
                      type="button"
                      onClick={() => removeDont(idx)}
                      style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontWeight: 800 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OPD Token Slot & CTA Auto-Attachment Card */}
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 900, marginBottom: '16px', color: '#38BDF8' }}>
                🎫 Auto-Attach OPD Token & Teleconsult CTA
              </h2>

              <div
                style={{
                  backgroundColor: '#0F172A',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  marginBottom: '16px'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>Linked Clinician</div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#F8FAFC' }}>{doctorName}</div>
                <div style={{ fontSize: '0.6875rem', color: '#10B981', marginTop: '2px' }}>
                  ✓ Official NMC Registered • Token Dispatch Active
                </div>
              </div>

              {/* Fee & Slot Configuration */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  OPD Consultation Fee (₹)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[300, 500, 800, 1000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setOpdFee(fee)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: opdFee === fee ? '#38BDF8' : '#334155',
                        color: opdFee === fee ? '#0F172A' : '#F8FAFC',
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ₹{fee}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  Immediate Token Slot Tag
                </label>
                <input
                  type="text"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#F8FAFC',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#0F172A',
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '20px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F8FAFC' }}>Allow Video Teleconsultation</div>
                  <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Patients outside clinic radius can book 1:1 call</div>
                </div>
                <input
                  type="checkbox"
                  checked={teleconsultEnabled}
                  onChange={(e) => setTeleconsultEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Publish Action Button */}
            <button
              type="button"
              onClick={handlePublish}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(244, 63, 94, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>🚀 Publish Verified Swasthya Short</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE ANALYTICS & REVENUE CONVERSION */}
      {activeTab === 'ANALYTICS' && (
        <div>
          {/* 4 Key Performance Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '14px',
                padding: '18px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Total Video Views</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>38,420</div>
              <div style={{ fontSize: '0.6875rem', color: '#34D399', marginTop: '4px' }}>↑ +24% vs last week</div>
            </div>

            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '14px',
                padding: '18px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Patient Likes & Saves</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F43F5E', marginTop: '4px' }}>2,840</div>
              <div style={{ fontSize: '0.6875rem', color: '#34D399', marginTop: '4px' }}>94% positive sentiment</div>
            </div>

            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '14px',
                padding: '18px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>WhatsApp Family Shares</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>912</div>
              <div style={{ fontSize: '0.6875rem', color: '#38BDF8', marginTop: '4px' }}>Viral health awareness reach</div>
            </div>

            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '14px',
                padding: '18px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(30, 41, 59, 1) 100%)'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 700 }}>Direct OPD Consults Booked</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34D399', marginTop: '4px' }}>114 Tokens</div>
              <div style={{ fontSize: '0.6875rem', color: '#FCD34D', fontWeight: 800, marginTop: '4px' }}>
                ₹57,000 OPD Revenue Generated
              </div>
            </div>
          </div>

          {/* Published Video Reels Feed Table */}
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '14px', color: '#F8FAFC' }}>
              🎬 Your Published Swasthya Shorts & Conversion Tracker
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8' }}>
                    <th style={{ padding: '10px 12px' }}>Short Title & Category</th>
                    <th style={{ padding: '10px 12px' }}>Views</th>
                    <th style={{ padding: '10px 12px' }}>Likes</th>
                    <th style={{ padding: '10px 12px' }}>Shares</th>
                    <th style={{ padding: '10px 12px' }}>OPD Bookings</th>
                    <th style={{ padding: '10px 12px' }}>Revenue (₹)</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#F8FAFC' }}>
                        सुबह खाली पेट BP स्पाइक और हार्ट अटैक का खतरा — 3 कार्डियोलॉजी गोल्डन रूल्स
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800 }}>CARDIOLOGY</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>14,280</td>
                    <td style={{ padding: '12px', color: '#F43F5E' }}>1,142</td>
                    <td style={{ padding: '12px', color: '#10B981' }}>428</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#34D399' }}>38 Tokens</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#FCD34D' }}>₹19,000</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>
                        ● Active Feed
                      </span>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#F8FAFC' }}>
                        डायबिटीज में खाली पेट फल खाने की 3 सबसे बड़ी गलतियां
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800 }}>DIABETOLOGY</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>11,940</td>
                    <td style={{ padding: '12px', color: '#F43F5E' }}>890</td>
                    <td style={{ padding: '12px', color: '#10B981' }}>274</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#34D399' }}>42 Tokens</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#FCD34D' }}>₹21,000</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>
                        ● Active Feed
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#F8FAFC' }}>
                        घुटने के कार्टिलेज को घिसने से बचाने वाली 2 रोजमर्रा की आदतें
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 800 }}>ORTHOPEDICS</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>12,200</td>
                    <td style={{ padding: '12px', color: '#F43F5E' }}>808</td>
                    <td style={{ padding: '12px', color: '#10B981' }}>210</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#34D399' }}>34 Tokens</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#FCD34D' }}>₹17,000</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 800 }}>
                        ● Active Feed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
