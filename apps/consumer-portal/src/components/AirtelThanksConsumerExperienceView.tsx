import React, { useState } from 'react';
import { HeroActiveHealthCard } from './HeroActiveHealthCard.js';
import { Header, type FamilyMemberProfile } from './common/Header.js';
import { QuickActionGrid } from './dashboard/QuickActionGrid.js';
import { FinancialHealthStrip } from './dashboard/FinancialHealthStrip.js';
import { LiveServiceTrackerCard } from './tracking/LiveServiceTrackerCard.js';
import { SmartNudgeBanner } from './dashboard/SmartNudgeBanner.js';
import { TierPrivilegeCard } from './membership/TierPrivilegeCard.js';

export interface AirtelThanksConsumerExperienceViewProps {
  initialMember?: FamilyMemberProfile;
  initialFamilyMembers?: FamilyMemberProfile[];
  onNavigateAction?: (actionId: string) => void;
  isDarkMode?: boolean;
}

const defaultFamily: FamilyMemberProfile[] = [
  {
    id: 'FAM-001',
    fullName: 'Rahul Sharma',
    relationship: 'SELF',
    age: 34,
    gender: 'MALE',
    uhid: 'UHID-2026-9901',
    chronicTags: ['Hypertension (Stage 1)'],
    carePassBadge: 'ANNUAL SHIELD',
    walletAllowanceMonthly: 15000,
    walletAllowanceSpent: 4250,
    avatarColor: '#4F46E5'
  },
  {
    id: 'FAM-002',
    fullName: 'Pooja Sharma',
    relationship: 'SPOUSE',
    age: 31,
    gender: 'FEMALE',
    uhid: 'UHID-2026-9902',
    chronicTags: ['Post-Natal Followup Due'],
    carePassBadge: 'ANNUAL SHIELD',
    walletAllowanceMonthly: 10000,
    walletAllowanceSpent: 1200,
    avatarColor: '#EC4899'
  },
  {
    id: 'FAM-003',
    fullName: 'Ram Swaroop Sharma',
    relationship: 'FATHER',
    age: 68,
    gender: 'MALE',
    uhid: 'UHID-2026-9903',
    chronicTags: ['Diabetic Care Pass Active', 'Cardio Regular'],
    carePassBadge: 'SENIOR PLATINUM',
    walletAllowanceMonthly: 20000,
    walletAllowanceSpent: 9400,
    avatarColor: '#10B981'
  },
  {
    id: 'FAM-004',
    fullName: 'Aarav Sharma',
    relationship: 'SON',
    age: 4,
    gender: 'MALE',
    uhid: 'UHID-2026-9904',
    chronicTags: ['MMR Booster Due in 5 Days'],
    walletAllowanceMonthly: 5000,
    walletAllowanceSpent: 450,
    avatarColor: '#F59E0B'
  }
];

export const AirtelThanksConsumerExperienceView: React.FC<AirtelThanksConsumerExperienceViewProps> = ({
  initialMember,
  initialFamilyMembers,
  onNavigateAction,
  isDarkMode = true
}) => {
  const initialList = initialFamilyMembers && initialFamilyMembers.length > 0 ? initialFamilyMembers : defaultFamily;
  const [family, setFamily] = useState<FamilyMemberProfile[]>(initialList);
  const [activeMember, setActiveMember] = useState<FamilyMemberProfile>(
    initialMember || initialList[0]!
  );

  const [walletBalance, setWalletBalance] = useState<number>(4250);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTopUp = (amount: number) => {
    const bonus = Math.round(amount * 0.1);
    setWalletBalance((prev) => prev + amount + bonus);
    showToast(`💰 ₹${amount} topup successful! +₹${bonus} (10%) promotional bonus credited!`);
  };

  const handleEmiApply = (pkgAmt: number, tenure: number) => {
    const monthly = Math.round(pkgAmt / tenure);
    showToast(`🏥 0% Surgery EMI Approved! ₹${pkgAmt.toLocaleString('en-IN')} split into ₹${monthly.toLocaleString('en-IN')}/mo (${tenure} mo).`);
  };

  const handleSelectMember = (member: FamilyMemberProfile) => {
    setActiveMember(member);
    showToast(`Switched active profile to ${member.fullName} (${member.relationship})`);
  };

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#0B0F19' : '#F8FAFC',
        color: isDarkMode ? '#F8FAFC' : '#0F172A',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Pillar 2: 1-Tap Family Health Tree Switcher Header */}
      <Header
        hospitalName="Apex Medicity Multi-Specialty Hospital"
        branchName="South Delhi Super Care Hub"
        activeMember={activeMember}
        familyMembers={family}
        onSelectMember={handleSelectMember}
        onAddFamilyMember={() => {
          const newId = `FAM-00${family.length + 1}`;
          const newMem: FamilyMemberProfile = {
            id: newId,
            fullName: 'Sarita Sharma',
            relationship: 'MOTHER',
            age: 64,
            gender: 'FEMALE',
            uhid: `UHID-2026-990${family.length + 1}`,
            chronicTags: ['Thyroid Care'],
            avatarColor: '#8B5CF6'
          };
          setFamily((prev) => [...prev, newMem]);
          setActiveMember(newMem);
          showToast('Added Mother Sarita Sharma to Family Health Tree!');
        }}
        onEmergencySos={() => showToast('🚨 Emergency SOS Dispatched! GPS dispatched to Nearest Ambulance.')}
        onOpenNotifications={() => showToast('Notifications: 2 new reports available')}
        isDarkMode={isDarkMode}
      />

      <main style={{ padding: '12px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Pillar 6: Contextual "Action Required" Smart Nudge Banner */}
        <SmartNudgeBanner isDarkMode={isDarkMode} />

        {/* Pillar 1: Hero Active Health Metric & Appointment Countdown Card */}
        <HeroActiveHealthCard
          patientName={activeMember.fullName}
          uhid={activeMember.uhid}
          healthPassTitle={activeMember.carePassBadge ? `DocSearch ${activeMember.carePassBadge}` : 'DocSearch Standard Care'}
          validityDaysLeft={activeMember.relationship === 'FATHER' ? 312 : 248}
          adherenceRatePct={activeMember.relationship === 'FATHER' ? 96 : 88}
          ringMode="VALIDITY"
          upNextMilestone={{
            doctorName: 'Dr. Vivek Sharma',
            department: 'General Surgery & OPD',
            chamberNumber: 'Chamber 04 (1st Floor)',
            patientTokenNumber: '#18',
            currentRunningToken: '#14',
            estimatedWaitMinutes: 12,
            opdStatus: 'CONSULTING'
          }}
          onManagePass={() => showToast('Navigating to Care Pass Manager...')}
          onViewDirections={() => showToast('Opening Turn-by-Turn Indoor Hospital Chamber Map...')}
          onRefreshQueue={() => showToast('OPD Queue refreshed from live hospital server')}
          isDarkMode={isDarkMode}
        />

        {/* Pillar 4: Floating Health Wallet & 0% Surgery EMI Carousel Strip */}
        <FinancialHealthStrip
          walletBalance={walletBalance}
          walletBonusRatePct={10}
          monthlyBudgetRemaining={activeMember.walletAllowanceMonthly ? activeMember.walletAllowanceMonthly - (activeMember.walletAllowanceSpent || 0) : 10000}
          monthlyTotalBudget={activeMember.walletAllowanceMonthly || 15000}
          preApprovedEmiAmount={250000}
          onTopUpWallet={handleTopUp}
          onViewWalletLedger={() => showToast('Opening Wallet Passbook & Transaction Ledger...')}
          onApplyEmiFinancing={handleEmiApply}
          isDarkMode={isDarkMode}
        />

        {/* Pillar 3: 4x2 Squircle Quick-Action Grid with Micro-Badges */}
        <QuickActionGrid
          onActionClick={(actionId) => {
            showToast(`Triggered: ${actionId}`);
            onNavigateAction?.(actionId);
          }}
          isDarkMode={isDarkMode}
        />

        {/* Pillar 5: Real-Time Service Stepper (OPD Token & Phlebotomy Tracker) */}
        <LiveServiceTrackerCard
          onAlertDelay={(mins) => showToast(`Doctor alerted: Patient delayed by ${mins} minutes. Slot preserved.`)}
          onCallRider={(phone) => showToast(`Dialing phlebotomist rider at ${phone}...`)}
          isDarkMode={isDarkMode}
        />

        {/* Pillar 7: DocSearch Black / Platinum Health Shield Privilege Card */}
        <TierPrivilegeCard
          currentTier={activeMember.relationship === 'FATHER' ? 'BLACK' : 'PLATINUM'}
          membershipId={activeMember.relationship === 'FATHER' ? 'DS-BLK-88219-VIP' : 'DS-PLT-99482-VIP'}
          patientName={activeMember.fullName}
          validThroughDate="OCT 2027"
          currentTierSpend={activeMember.relationship === 'FATHER' ? 24500 : 18450}
          nextTierSpendThreshold={25000}
          onExplorePrivileges={() => showToast('Opening DocSearch VIP Health Club Privileges Catalog...')}
          onUpgradeTier={() => showToast('Upgraded to DocSearch Black Tier! VIP Concierge Activated.')}
          isDarkMode={isDarkMode}
        />
      </main>

      {/* Floating Interactive Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: isDarkMode ? '#1E293B' : '#0F172A',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '10px 18px',
            fontSize: '0.8125rem',
            fontWeight: 800,
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            zIndex: 100,
            whiteSpace: 'nowrap',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
