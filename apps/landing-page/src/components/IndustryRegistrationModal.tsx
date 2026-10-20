import React, { useState } from 'react';
import {
  resolveIndustryPreset,
  type IndustryVertical
} from '@docsearch/shared-core';

export interface IndustryRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVertical?: IndustryVertical;
}

export const IndustryRegistrationModal: React.FC<IndustryRegistrationModalProps> = ({
  isOpen,
  onClose,
  initialVertical = 'SALON_SPA'
}) => {
  const [selectedVertical, setSelectedVertical] = useState<IndustryVertical>(initialVertical);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [portalSlug, setPortalSlug] = useState('');
  const [staffCount, setStaffCount] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen) return null;

  const currentPreset = resolveIndustryPreset(selectedVertical);

  // Auto-generate portal slug as user types business name
  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBusinessName(val);
    const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setPortalSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!businessName.trim() || !ownerName.trim() || !email.trim() || !phone.trim()) {
      setSubmitError('Please complete all required fields (*)');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/auth/register-industry-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryType: selectedVertical,
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          city: city.trim(),
          portalSlug: portalSlug.trim() || undefined,
          staffCount: Number(staffCount) || 1,
          notes: notes.trim() || undefined
        })
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error?.message || resJson.message || 'Registration failed');
      }

      setSuccessData(resJson.data);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verticalOptions: Array<{ id: IndustryVertical; label: string; icon: string }> = [
    { id: 'SALON_SPA', label: 'Salon & Spa', icon: '💇' },
    { id: 'AUTO_SERVICE', label: 'Auto Workshop', icon: '🚗' },
    { id: 'LEGAL_CONSULTING', label: 'Legal & CA', icon: '⚖️' },
    { id: 'FITNESS_SPORTS', label: 'Fitness & Sports', icon: '🏸' },
    { id: 'EDUCATION_COACHING', label: 'Education & Tutors', icon: '🎓' },
    { id: 'HEALTHCARE', label: 'Healthcare & Clinic', icon: '🏥' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          background: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#F8FAFC'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.025em', color: '#FFFFFF' }}>
                Universal Appointment Super ERP Onboarding
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
              Configure your dedicated business appointment engine with dynamic industry ontology
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              color: '#94A3B8',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px' }}>
          {successData ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10B981',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  margin: '0 auto 20px'
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', color: '#FFFFFF' }}>
                Application Queued for Review & Approval
              </h3>
              <p style={{ fontSize: '14px', color: '#94A3B8', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                Thank you, <strong style={{ color: '#F8FAFC' }}>{ownerName}</strong>! Your application for{' '}
                <strong style={{ color: currentPreset.accentColor }}>{businessName}</strong> has been received with status{' '}
                <span style={{ background: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: '#F59E0B' }}>
                  PENDING_APPROVAL
                </span>.
              </p>

              <div
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  marginBottom: '24px',
                  maxWidth: '520px',
                  margin: '0 auto 24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Industry Vertical:</span>
                  <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{currentPreset.badgeIcon} {currentPreset.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Portal URL:</span>
                  <span style={{ color: '#38BDF8', fontWeight: 600, fontFamily: 'monospace' }}>
                    docsearch.health/{successData.portalSlug || portalSlug}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Admin Activation Email:</span>
                  <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{email}</span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '13px',
                  color: '#93C5FD',
                  lineHeight: 1.5,
                  maxWidth: '520px',
                  margin: '0 auto 24px'
                }}
              >
                📩 DocSearch Company HQ will review your business credentials. Once approved, you will receive an activation email containing a secure 24-hour cryptographic one-click activation link to set your password and access your dashboard.
              </div>

              <button
                onClick={onClose}
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Industry Selector */}
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Your Industry Vertical
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '20px'
                }}
              >
                {verticalOptions.map((opt) => {
                  const isSelected = selectedVertical === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedVertical(opt.id)}
                      style={{
                        padding: '12px',
                        background: isSelected ? 'rgba(37, 99, 235, 0.15)' : '#1E293B',
                        border: isSelected ? '2px solid #38BDF8' : '1px solid #334155',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: isSelected ? '#FFFFFF' : '#94A3B8',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '13px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Terminology Preview Pill */}
              <div
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '12px'
                }}
              >
                <span style={{ fontSize: '16px' }}>✨</span>
                <div>
                  <div style={{ color: currentPreset.accentColor, fontWeight: 700, marginBottom: '2px' }}>
                    {currentPreset.badgeIcon} Customized for {currentPreset.name}
                  </div>
                  <div style={{ color: '#94A3B8' }}>
                    Appointments will be managed as <strong>{currentPreset.vocabulary.appointment.plural}</strong> for{' '}
                    <strong>{currentPreset.vocabulary.customer.plural}</strong> served by{' '}
                    <strong>{currentPreset.vocabulary.provider.plural}</strong> at{' '}
                    <strong>{currentPreset.vocabulary.resource.plural}</strong>.
                  </div>
                </div>
              </div>

              {/* Form Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                    Business / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Glamour Spa & Hair Lounge"
                    value={businessName}
                    onChange={handleBusinessNameChange}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                    Desired Portal Slug *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ background: '#334155', padding: '10px 10px', fontSize: '12px', color: '#94A3B8', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                      /portal/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="glamour-spa"
                      value={portalSlug}
                      onChange={(e) => setPortalSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: '#1E293B',
                        border: '1px solid #334155',
                        borderLeft: 'none',
                        borderTopRightRadius: '8px',
                        borderBottomRightRadius: '8px',
                        color: '#38BDF8',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                    Owner / Administrator Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Priya Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                    Official Work Email * (For Activation Link)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="priya@glamourspa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                    City / Metro
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Mumbai / Bengaluru / Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Resource Count & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                    {currentPreset.vocabulary.provider.plural} Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={staffCount}
                    onChange={(e) => setStaffCount(parseInt(e.target.value, 10) || 1)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                    Special Scheduling Requirements
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Need multi-chair parallel booking & WhatsApp SMS reminders"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {submitError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #EF4444',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#FCA5A5',
                    fontSize: '13px',
                    marginBottom: '16px'
                  }}
                >
                  ⚠️ {submitError}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    color: '#94A3B8',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: isSubmitting ? '#475569' : '#2563EB',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {isSubmitting ? 'Submitting Application...' : '🚀 Submit Onboarding Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
