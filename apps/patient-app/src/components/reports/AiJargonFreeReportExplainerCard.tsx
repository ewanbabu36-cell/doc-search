import React, { useState } from 'react';

export interface BiomarkerItem {
  id: string;
  name: string;
  hindiName: string;
  category: 'DIABETES' | 'KIDNEY' | 'BLOOD' | 'HEART' | 'LIVER';
  value: number;
  unit: string;
  minRange: number;
  maxRange: number;
  optimalMax: number;
  borderlineMax: number;
  status: 'OPTIMAL' | 'BORDERLINE' | 'CRITICAL';
  statusLabelEn: string;
  statusLabelHi: string;
  statusLabelHinglish: string;
  explainerEn: string;
  explainerHi: string;
  explainerHinglish: string;
  clinicalActionEn: string;
  clinicalActionHi: string;
  clinicalActionHinglish: string;
}

export const BIOMARKER_DATASET: BiomarkerItem[] = [
  {
    id: 'bio-hba1c',
    name: 'HbA1c (3-Month Sugar Average)',
    hindiName: 'एचबीए१सी (३ महीने का औसत शुगर)',
    category: 'DIABETES',
    value: 8.4,
    unit: '%',
    minRange: 4.0,
    maxRange: 14.0,
    optimalMax: 5.7,
    borderlineMax: 6.4,
    status: 'CRITICAL',
    statusLabelEn: 'High Blood Sugar (Uncontrolled)',
    statusLabelHi: 'अत्यधिक शुगर (असंतुलित)',
    statusLabelHinglish: 'High Sugar Level (Dawai Badalne Ki Zaroorat)',
    explainerEn:
      'Your average blood sugar over the last 90 days is 8.4%, well above the safe ceiling of 5.7%. Sustained high sugar puts long-term stress on microvascular capillaries in the eyes, kidneys, and heart.',
    explainerHi:
      'पिछले ३ महीनों में आपका औसत रक्त शर्करा स्तर ८.४% रहा है, जो सुरक्षित स्तर ५.७% से काफी अधिक है। लगातार अधिक शुगर रहने से दिल, गुर्दे और आंखों की नसों पर दबाव बढ़ता है।',
    explainerHinglish:
      'Aapka pichhle 3 mahino ka average blood sugar 8.4% hai, jo safe limit (5.7%) se kafi upar hai. Is level par dawa ki dose badalna aur meetha band karna zaroori hai taaki kidney aur aankh safe rahein.',
    clinicalActionEn: 'Consult Diabetologist within 48 hours for insulin/oral hypoglycemic dosage titration.',
    clinicalActionHi: 'अगले ४८ घंटों में अपने डॉक्टर से मिलकर दवा की खुराक पुनः निर्धारित करवाएं।',
    clinicalActionHinglish: 'Agli 48 ghante me doctor se milkar dawai ki dose adjust karwayein.'
  },
  {
    id: 'bio-creatinine',
    name: 'Serum Creatinine (Kidney Filter)',
    hindiName: 'सीरम क्रिएटिनिन (गुर्दे की कार्यक्षमता)',
    category: 'KIDNEY',
    value: 1.8,
    unit: 'mg/dL',
    minRange: 0.4,
    maxRange: 3.5,
    optimalMax: 1.2,
    borderlineMax: 1.5,
    status: 'CRITICAL',
    statusLabelEn: 'Kidney Filtration Strain',
    statusLabelHi: 'गुर्दे के फिल्टर पर दबाव',
    statusLabelHinglish: 'Kidney Filter Thoda Slow (Painkiller Se Bachein)',
    explainerEn:
      'Creatinine is a waste product filtered by healthy nephrons. At 1.8 mg/dL (normal: 0.7-1.2), your kidneys are filtering slower than normal.',
    explainerHi:
      'क्रिएटिनिन शरीर का अपशिष्ट है जिसे गुर्दे बाहर निकालते हैं। १.८ mg/dL स्तर यह दर्शाता है कि गुर्दे धीमी गति से काम कर रहे हैं। बिना परामर्श दर्द की गोलियाँ बिल्कुल न लें।',
    explainerHinglish:
      'Creatinine 1.8 mg/dL aane ka matlab hai kidney thoda slow filter kar rahi hai (Normal 1.2 tak hota hai). Zyada paani piyein aur bina doctor se poochhe Brufen ya Combiflam jaisi painkillers bilkul mat lein.',
    clinicalActionEn: 'Avoid NSAID pain medications. Maintain optimal hydration (2.5-3L water). Book Kidney Specialist review.',
    clinicalActionHi: 'दर्द निवारक गोलियों से बचें। भरपूर पानी पिएं और नेफ्रोलॉजिस्ट से परामर्श लें।',
    clinicalActionHinglish: 'Painkiller bilkul na lein, paani khoob piyein aur Nephrologist se salah lein.'
  },
  {
    id: 'bio-platelets',
    name: 'Platelet Count (Clotting Cells)',
    hindiName: 'प्लेटलेट्स काउंट (रक्त का थक्का बनाने वाली कोशिकाएं)',
    category: 'BLOOD',
    value: 85000,
    unit: '/mcL',
    minRange: 20000,
    maxRange: 450000,
    optimalMax: 450000,
    borderlineMax: 150000,
    status: 'CRITICAL',
    statusLabelEn: 'Low Platelets (Thrombocytopenia)',
    statusLabelHi: 'प्लेटलेट्स में भारी गिरावट',
    statusLabelHinglish: 'Platelets Kam Hain (85,000)',
    explainerEn:
      'Your platelet count has dipped to 85,000/mcL (normal: 150,000 - 450,000). Common causes include viral fevers, dengue, or medication reactions. Avoid vigorous contact sports.',
    explainerHi:
      'आपके प्लेटलेट्स घटकर ८५,००० रह गए हैं (सामान्य स्तर १.५ लाख से अधिक होना चाहिए)। वायरल बुखार या डेंगू में ऐसा देखा जाता है। किसी भी रक्तस्राव की स्थिति में तत्काल अस्पताल जाएं।',
    explainerHinglish:
      'Aapke platelets 85,000 hain (Normal 1.5 lakh se zyada hote hain). Viral bukhar ya dengue me aisa hota hai. Naak ya masudo se khoon aane par turant hospital jayein. Papaya leaf aur coconut water le sakte hain.',
    clinicalActionEn: 'Serial CBC retest in 24 hours. Seek immediate ER care if any gum bleeding or red rash occurs.',
    clinicalActionHi: '२४ घंटे में पुनः सीबीसी जांच कराएं। मसूड़ों से खून आने पर आपातकालीन कक्ष जाएं।',
    clinicalActionHinglish: '24 ghante me dobara CBC test karwayein taaki platelets ka trend pata chale.'
  },
  {
    id: 'bio-hemoglobin',
    name: 'Hemoglobin (Oxygen Carrier)',
    hindiName: 'हीमोग्लोबिन (रक्त में ऑक्सीजन वाहक)',
    category: 'BLOOD',
    value: 9.2,
    unit: 'g/dL',
    minRange: 6.0,
    maxRange: 18.0,
    optimalMax: 17.0,
    borderlineMax: 12.0,
    status: 'BORDERLINE',
    statusLabelEn: 'Mild-to-Moderate Anemia',
    statusLabelHi: 'हल्की से मध्यम रक्त अल्पता (एनीमिया)',
    statusLabelHinglish: 'Khoon Ki Kami (Thakan & Kamzori)',
    explainerEn:
      'Hemoglobin at 9.2 g/dL is below the healthy benchmark of 13.0 g/dL. This causes reduced oxygen delivery to muscles and brain, explaining tiredness, breathlessness, and paleness.',
    explainerHi:
      'हीमोग्लोबिन ९.२ g/dL है जो सामान्य स्तर (१३.० g/dL) से कम है। इसके कारण मांसपेशियों में ऑक्सीजन की कमी से थकान, कमजोरी और सांस फूलने की समस्या हो सकती है।',
    explainerHinglish:
      'Aapka hemoglobin 9.2 g/dL hai, jisse sharir me khoon ki kami ho rahi hai. Isi wajah se thakan, sar dard aur sidhi chadhte waqt saans phoolna hota hai. Palak, chana, anar aur iron supplement shuru karein.',
    clinicalActionEn: 'Start oral Iron + Folic Acid supplement. Include spinach, pomegranates, and dates in diet.',
    clinicalActionHi: 'आयरन और फोलिक एसिड की खुराक लें। आहार में अनार, खजूर और हरी पत्तेदार सब्जियां शामिल करें।',
    clinicalActionHinglish: 'Iron syrup/tablet lein aur khane me kishmish, anar aur palak shamil karein.'
  },
  {
    id: 'bio-ldl',
    name: 'LDL Bad Cholesterol',
    hindiName: 'एलडीएल खराब कोलेस्ट्रॉल (हृदय जोखिम)',
    category: 'HEART',
    value: 168,
    unit: 'mg/dL',
    minRange: 40,
    maxRange: 250,
    optimalMax: 100,
    borderlineMax: 130,
    status: 'CRITICAL',
    statusLabelEn: 'Elevated Arterial Plaque Risk',
    statusLabelHi: 'धमनियों में रुकावट का खतरा',
    statusLabelHinglish: 'Kharab Cholesterol Bada Hua (168 mg/dL)',
    explainerEn:
      'Low-Density Lipoprotein (LDL) at 168 mg/dL (target: < 100) carries cholesterol particles into arterial walls, increasing long-term cardiovascular risks.',
    explainerHi:
      'एलडीएल खराब कोलेस्ट्रॉल १६८ mg/dL है (लक्ष्य १०० से कम होना चाहिए)। यह धमनियों में जमा होकर हृदय रोगों का खतरा बढ़ाता है। तले-भुने भोजन से परहेज करें।',
    explainerHinglish:
      'Aapka kharab cholesterol 168 mg/dL par hai (Normal 100 se kam hona chahiye). Refined tel, samose, mithai aur butter band karein. Daily 30 minute tez chalkar walk karein aur doctor se statin dawai par salah lein.',
    clinicalActionEn: 'Low saturated fat diet, 30 min brisk cardio 5x/week, consult cardiologist for statin evaluation.',
    clinicalActionHi: 'कम वसा वाला आहार लें, सप्ताह में ५ दिन ३० मिनट तेज टहलें और कार्डियोलॉजिस्ट से परामर्श लें।',
    clinicalActionHinglish: 'Daily 30 min walk karein, tala-bhuna band karein aur doctor se cholesterol dawai par baat karein.'
  }
];

export interface AiJargonFreeReportExplainerCardProps {
  initialLanguage?: 'en' | 'hi' | 'hinglish' | undefined;
  onBookConsultation?: (() => void) | undefined;
  onOrderRetest?: (() => void) | undefined;
  onShareWhatsApp?: (() => void) | undefined;
}

export const AiJargonFreeReportExplainerCard: React.FC<AiJargonFreeReportExplainerCardProps> = ({
  initialLanguage = 'hinglish',
  onBookConsultation,
  onOrderRetest,
  onShareWhatsApp
}) => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>(initialLanguage);
  const [selectedBiomarkerId, setSelectedBiomarkerId] = useState<string>('bio-hba1c');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const selectedBiomarker =
    BIOMARKER_DATASET.find((b) => b.id === selectedBiomarkerId) || BIOMARKER_DATASET[0]!;

  // Speedometer calculation
  const getSpeedometerPercentage = (item: BiomarkerItem) => {
    const range = item.maxRange - item.minRange;
    const clampedValue = Math.min(Math.max(item.value, item.minRange), item.maxRange);
    return Math.round(((clampedValue - item.minRange) / range) * 100);
  };

  // Text-To-Speech audio synthesizer for patients
  const handlePlayVoiceExplainer = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Voice assistant not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak =
      language === 'hi'
        ? selectedBiomarker.explainerHi
        : language === 'hinglish'
        ? selectedBiomarker.explainerHinglish
        : selectedBiomarker.explainerEn;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        border: '1.5px solid #0284C7',
        borderRadius: '16px',
        padding: '20px',
        color: '#F8FAFC',
        boxShadow: '0 12px 36px rgba(2, 132, 199, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* HEADER: AI BADGE & LANGUAGE TOGGLE */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #1E293B',
          paddingBottom: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}
          >
            🤖
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#38BDF8' }}>
              DocSearch AI Patient Lab Explainer
            </h3>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Zero-Medical-Jargon • Plain Language Interpretation • Clinical Safety Radar
            </div>
          </div>
        </div>

        {/* 3-Way Language Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#1E293B',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid #334155'
          }}
        >
          {(
            [
              { key: 'hinglish', label: 'Hinglish (बोलचाल)' },
              { key: 'hi', label: 'हिन्दी' },
              { key: 'en', label: 'English' }
            ] as const
          ).map((lang) => (
            <button
              key={lang.key}
              type="button"
              onClick={() => setLanguage(lang.key)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 800,
                backgroundColor: language === lang.key ? '#0284C7' : 'transparent',
                color: language === lang.key ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.15s ease'
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* BIOMARKER SELECTOR CAROUSEL PILLS */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {BIOMARKER_DATASET.map((item) => {
          const isSelected = item.id === selectedBiomarkerId;
          const statusColor =
            item.status === 'CRITICAL' ? '#EF4444' : item.status === 'BORDERLINE' ? '#F59E0B' : '#10B981';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedBiomarkerId(item.id)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.2)' : '#1E293B',
                border: isSelected ? '1.5px solid #0284C7' : '1px solid #334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: statusColor,
                  boxShadow: `0 0 6px ${statusColor}`
                }}
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isSelected ? '#38BDF8' : '#F1F5F9' }}>
                  {item.name.split(' ')[0]}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                  {item.value} {item.unit}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE BIOMARKER VISUAL SPEEDOMETER & RANGE GAUGE */}
      <div
        style={{
          backgroundColor: '#090D16',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC' }}>
              {language === 'hi' ? selectedBiomarker.hindiName : selectedBiomarker.name}
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                marginTop: '4px',
                color:
                  selectedBiomarker.status === 'CRITICAL'
                    ? '#F87171'
                    : selectedBiomarker.status === 'BORDERLINE'
                    ? '#FBBF24'
                    : '#34D399'
              }}
            >
              ●{' '}
              {language === 'hi'
                ? selectedBiomarker.statusLabelHi
                : language === 'hinglish'
                ? selectedBiomarker.statusLabelHinglish
                : selectedBiomarker.statusLabelEn}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace', lineHeight: 1 }}>
              {selectedBiomarker.value}
              <span style={{ fontSize: '1rem', color: '#94A3B8', marginLeft: '4px' }}>{selectedBiomarker.unit}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
              Target Normal: &lt; {selectedBiomarker.optimalMax} {selectedBiomarker.unit}
            </div>
          </div>
        </div>

        {/* 3-ZONE RANGE BAR WITH ACTIVE SPEEDOMETER NEEDLE */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748B', marginBottom: '6px' }}>
            <span style={{ color: '#10B981', fontWeight: 700 }}>🟢 Optimal (&lt; {selectedBiomarker.optimalMax})</span>
            <span style={{ color: '#F59E0B', fontWeight: 700 }}>🟡 Borderline ({selectedBiomarker.optimalMax} - {selectedBiomarker.borderlineMax})</span>
            <span style={{ color: '#EF4444', fontWeight: 700 }}>🔴 Critical (&gt; {selectedBiomarker.borderlineMax})</span>
          </div>

          <div
            style={{
              height: '14px',
              borderRadius: '8px',
              background: 'linear-gradient(to right, #10B981 0%, #10B981 35%, #F59E0B 35%, #F59E0B 65%, #EF4444 65%, #EF4444 100%)',
              position: 'relative',
              overflow: 'visible',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
            }}
          >
            {/* Speedometer Position Pointer Pin */}
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                left: `${getSpeedometerPercentage(selectedBiomarker)}%`,
                transform: 'translateX(-50%)',
                width: '6px',
                height: '26px',
                backgroundColor: '#FFFFFF',
                borderRadius: '3px',
                border: '1.5px solid #000000',
                boxShadow: '0 0 10px #FFFFFF',
                transition: 'left 0.4s ease'
              }}
              title={`Your Value: ${selectedBiomarker.value} ${selectedBiomarker.unit}`}
            />
          </div>
        </div>

        {/* PLAIN LANGUAGE EXPLAINER SECTION */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
              💡 {language === 'hi' ? 'सरल भाषा में इसका मतलब:' : language === 'hinglish' ? 'Aasaan Bhasha Me Matlab:' : 'What This Means In Plain Words:'}
            </span>

            {/* Audio Read-Out Button */}
            <button
              type="button"
              onClick={handlePlayVoiceExplainer}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: isSpeaking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.12)',
                border: `1px solid ${isSpeaking ? '#EF4444' : '#0284C7'}`,
                color: isSpeaking ? '#FCA5A5' : '#38BDF8',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>{isSpeaking ? '⏹️ Stop Voice' : '🔊 Suniye (Audio)'}</span>
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5, color: '#E2E8F0' }}>
            {language === 'hi'
              ? selectedBiomarker.explainerHi
              : language === 'hinglish'
              ? selectedBiomarker.explainerHinglish
              : selectedBiomarker.explainerEn}
          </p>

          <div
            style={{
              marginTop: '4px',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '0.78rem',
              color: '#FCD34D',
              fontWeight: 700
            }}
          >
            👉 {language === 'hi'
              ? selectedBiomarker.clinicalActionHi
              : language === 'hinglish'
              ? selectedBiomarker.clinicalActionHinglish
              : selectedBiomarker.clinicalActionEn}
          </div>
        </div>
      </div>

      {/* 1-TAP CLINICAL ACTION BUTTONS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}
      >
        {/* 1-Tap Book Specialist Consult */}
        <button
          type="button"
          onClick={onBookConsultation || (() => alert('Opening Direct Specialist OPD Booking for ' + selectedBiomarker.name))}
          style={{
            backgroundColor: '#0284C7',
            border: 'none',
            color: '#FFFFFF',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}
        >
          <span>🩺</span>
          <span>{language === 'hi' ? 'डॉक्टर से परामर्श लें' : language === 'hinglish' ? 'Doctor Ko Dikhayein' : 'Consult Specialist Now'}</span>
        </button>

        {/* 1-Tap Order Home Retest via 1mg / DocSearch */}
        <button
          type="button"
          onClick={onOrderRetest || (() => alert('Booking NABL Verified Home Lab Retest via Tata 1mg for ' + selectedBiomarker.name))}
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1.5px solid #10B981',
            color: '#34D399',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🧪</span>
          <span>{language === 'hi' ? 'घर बैठे टेस्ट री-चेक कराएं' : language === 'hinglish' ? 'Home Retest Book Karein' : 'Book Home Retest (1mg)'}</span>
        </button>

        {/* 1-Tap WhatsApp Share with Family / Doctor */}
        <button
          type="button"
          onClick={onShareWhatsApp || (() => {
            const summary = `*DocSearch AI Lab Report Summary*\nTest: ${selectedBiomarker.name}\nValue: ${selectedBiomarker.value} ${selectedBiomarker.unit} (${selectedBiomarker.status})\nInterpretation: ${selectedBiomarker.explainerHinglish}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(summary)}`, '_blank');
          })}
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1.5px solid #22C55E',
            color: '#4ADE80',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>💬</span>
          <span>{language === 'hi' ? 'व्हाट्सएप पर रिपोर्ट भेजें' : language === 'hinglish' ? 'WhatsApp Par Bhejein' : 'Share on WhatsApp'}</span>
        </button>
      </div>
    </div>
  );
};
