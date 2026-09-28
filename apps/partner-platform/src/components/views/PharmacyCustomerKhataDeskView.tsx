import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Badge,
  Button,
  Input,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@docsearch/ui-kit';
import {
  pharmacyCreditKhataService,
  type PharmacyKhataAccount,
  type KhataAgingSummary
} from '../../services/pharmacy-credit-khata-service.js';
import { KhataPaymentCollectionModal } from '../dialogs/KhataPaymentCollectionModal.js';
import { getVerifiedRoleProfile } from '../../utils/roleProfileResolver.js';

export const PharmacyCustomerKhataDeskView: React.FC = () => {
  const profile = useMemo(() => getVerifiedRoleProfile(), []);

  const [accounts, setAccounts] = useState<PharmacyKhataAccount[]>(() => pharmacyCreditKhataService.getAccounts());
  const [agingSummary, setAgingSummary] = useState<KhataAgingSummary>(() => pharmacyCreditKhataService.getAgingSummary());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WITH_BALANCE' | 'OVERDUE' | 'SETTLED'>('WITH_BALANCE');

  // Modals & Drawers
  const [selectedAccountForPayment, setSelectedAccountForPayment] = useState<PharmacyKhataAccount | null>(null);
  const [selectedAccountForPassbook, setSelectedAccountForPassbook] = useState<PharmacyKhataAccount | null>(null);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);

  // New Account Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newUhid, setNewUhid] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('5000');

  const reloadData = () => {
    setAccounts(pharmacyCreditKhataService.getAccounts());
    setAgingSummary(pharmacyCreditKhataService.getAgingSummary());
  };

  useEffect(() => {
    const handleUpdate = () => reloadData();
    window.addEventListener('docsearch_khata_updated', handleUpdate);
    window.addEventListener('docsearch_khata_payment_recorded', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('docsearch_khata_updated', handleUpdate);
      window.removeEventListener('docsearch_khata_payment_recorded', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Please provide customer name and phone number.');
      return;
    }

    try {
      pharmacyCreditKhataService.createOrUpdateAccount({
        customerName: newName,
        customerPhone: newPhone,
        customerAddress: newAddress.trim() || undefined,
        uhid: newUhid.trim() || undefined,
        creditLimit: Number(newCreditLimit) || 5000
      });

      setIsNewAccountModalOpen(false);
      setNewName('');
      setNewPhone('');
      setNewAddress('');
      setNewUhid('');
      setNewCreditLimit('5000');
      reloadData();
    } catch (err: any) {
      alert(`Error creating account: ${err.message}`);
    }
  };

  const handleSendWhatsAppReminder = (account: PharmacyKhataAccount) => {
    const phone = account.customerPhone.replace(/\D/g, '').slice(-10);
    const storeName = profile.entityLegalName || 'DocSearch Pharmacy';
    const upiId = profile.upiId || (profile.contactPhone ? `${profile.contactPhone.replace(/\D/g, '')}@upi` : 'pharmacy@upi');
    const amount = account.currentBalance.toFixed(2);

    const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeName)}&am=${amount}&cu=INR&tn=KhataReminder`;

    const text = encodeURIComponent(
      `*नमस्ते ${account.customerName} ji*,\n\n` +
      `आपके मेडिकल स्टोर *${storeName}* में *₹${amount}* का पुराना बिल बकाया (Credit Khata) है।\n\n` +
      `📋 *खाता विवरण:*\n` +
      `• ग्राहक का नाम: ${account.customerName}\n` +
      `• कुल बकाया: ₹${amount}\n` +
      (account.lastBilledAt ? `• अंतिम दवा खरीद: ${new Date(account.lastBilledAt).toLocaleDateString('en-IN')}\n` : '') +
      `\n📲 *घर बैठे किसी भी UPI App (GPay / PhonePe / Paytm / BHIM) से भुगतान करने के लिए नीचे दिए लिंक पर क्लिक करें:*\n` +
      `${upiPayLink}\n\n` +
      `या इस UPI ID पर ₹${amount} भेजें: *${upiId}*\n\n` +
      `_कृपया असुविधा से बचने के लिए समय पर भुगतान करें। आपका सहयोग हमारे लिए महत्वपूर्ण है। धन्यवाद!_`
    );

    window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${text}`, '_blank');
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    // Search query
    const q = searchQuery.trim().toLowerCase();
    const cleanDigits = q.replace(/\D/g, '');
    if (q) {
      const matchName = acc.customerName.toLowerCase().includes(q);
      const matchPhone = cleanDigits ? acc.customerPhone.replace(/\D/g, '').includes(cleanDigits) : false;
      const matchUhid = acc.uhid ? acc.uhid.toLowerCase().includes(q) : false;
      if (!matchName && !matchPhone && !matchUhid) return false;
    }

    // Status filter
    if (statusFilter === 'WITH_BALANCE') return acc.currentBalance > 0;
    if (statusFilter === 'OVERDUE') {
      if (acc.currentBalance <= 0) return false;
      const refDate = acc.lastBilledAt ? new Date(acc.lastBilledAt).getTime() : new Date(acc.createdAt).getTime();
      const ageDays = Math.floor((Date.now() - refDate) / (1000 * 60 * 60 * 24));
      return ageDays > (acc.maxCreditDays || 30);
    }
    if (statusFilter === 'SETTLED') return acc.currentBalance <= 0;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>📒</span>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
              Customer Credit Khata & Collections (उधार खाता बही)
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
            Customer credit ledger, repayments (जमा), WhatsApp payment links with UPI, overdue aging, and passbook printing.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsNewAccountModalOpen(true)}
          style={{ backgroundColor: '#10B981', borderColor: '#059669', fontWeight: 700 }}
        >
          + Open New Khata Account
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '14px',
          width: '100%'
        }}
      >
        {/* Card 1: Total Outstanding */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>📒</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                कुल बकाया (TOTAL OUTSTANDING)
              </span>
            </div>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 800,
                backgroundColor: 'rgba(245, 158, 11, 0.18)',
                color: '#FBBF24',
                padding: '2px 7px',
                borderRadius: '6px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                flexShrink: 0,
                letterSpacing: '0.04em'
              }}
            >
              DUE
            </span>
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: 'clamp(1.45rem, 1.8vw, 1.75rem)',
              fontWeight: 900,
              color: '#F59E0B',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            ₹{agingSummary.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Across <strong>{agingSummary.activeAccountsCount}</strong> active credit customers
          </div>
        </div>

        {/* Card 2: Collected This Month */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>💵</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                इस महीने वसूली (COLLECTED)
              </span>
            </div>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 800,
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                color: '#34D399',
                padding: '2px 7px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                flexShrink: 0,
                letterSpacing: '0.04em'
              }}
            >
              PAID
            </span>
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: 'clamp(1.45rem, 1.8vw, 1.75rem)',
              fontWeight: 900,
              color: '#10B981',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            ₹{agingSummary.totalCollectedThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Recovered via Cash, UPI & Card
          </div>
        </div>

        {/* Card 3: Overdue Risk (>30 Days) */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                समय सीमा समाप्त (OVERDUE &gt;30D)
              </span>
            </div>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 800,
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
                color: '#F87171',
                padding: '2px 7px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                flexShrink: 0,
                letterSpacing: '0.04em'
              }}
            >
              ALERT
            </span>
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: 'clamp(1.45rem, 1.8vw, 1.75rem)',
              fontWeight: 900,
              color: '#EF4444',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            ₹{agingSummary.overdueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <strong>{agingSummary.overdueAccountsCount}</strong> {agingSummary.overdueAccountsCount === 1 ? 'account requires' : 'accounts require'} follow-up
          </div>
        </div>

        {/* Card 4: Total Registered Accounts */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>👥</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                कुल खाताधारक (TOTAL ACCOUNTS)
              </span>
            </div>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 800,
                backgroundColor: 'rgba(56, 189, 248, 0.18)',
                color: '#38BDF8',
                padding: '2px 7px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                flexShrink: 0,
                letterSpacing: '0.04em'
              }}
            >
              ACCOUNTS
            </span>
          </div>

          <div
            style={{
              marginTop: '8px',
              fontSize: 'clamp(1.45rem, 1.8vw, 1.75rem)',
              fontWeight: 900,
              color: '#38BDF8',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {agingSummary.totalAccounts}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <strong>{agingSummary.totalAccounts - agingSummary.activeAccountsCount}</strong> accounts currently fully settled
          </div>
        </div>
      </div>

      {/* Aging Analysis Breakdown Bar */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
          <span>📊 Outstanding Aging Risk Radar (उधार आयु विश्लेषण):</span>
          <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>Based on last purchase timestamp</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {agingSummary.buckets.map((b) => (
            <div
              key={b.bucket}
              style={{
                backgroundColor: '#1E293B',
                borderLeft: `4px solid ${b.color}`,
                borderRadius: '6px',
                padding: '8px 12px'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>{b.label}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: b.color, marginTop: '2px' }}>
                ₹{b.amount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{b.count} customers</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Bar: Search & Status Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, mobile, or UHID..."
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'WITH_BALANCE' as const, label: `Pending Due (${accounts.filter((a) => a.currentBalance > 0).length})` },
            { id: 'OVERDUE' as const, label: `Overdue Risk (${agingSummary.overdueAccountsCount})` },
            { id: 'SETTLED' as const, label: 'Fully Settled (0 Due)' },
            { id: 'ALL' as const, label: `All Accounts (${accounts.length})` }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: statusFilter === f.id ? 800 : 500,
                backgroundColor: statusFilter === f.id ? '#0284C7' : '#1E293B',
                color: statusFilter === f.id ? '#FFFFFF' : '#94A3B8',
                border: statusFilter === f.id ? '1px solid #38BDF8' : '1px solid #334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Directory Table */}
      <Card padding="none">
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer / Phone</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Current Due (बकाया)</TableHead>
                <TableHead>Last Transaction</TableHead>
                <TableHead>Risk Status</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    {searchQuery
                      ? `No Khata accounts found matching "${searchQuery}".`
                      : 'No Khata accounts registered yet. Use "+ Open New Khata Account" or bill via CREDIT_KHATA at POS.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((acc) => {
                  const refDate = acc.lastBilledAt ? new Date(acc.lastBilledAt).getTime() : new Date(acc.createdAt).getTime();
                  const ageDays = Math.floor((Date.now() - refDate) / (1000 * 60 * 60 * 24));
                  const isOverdue = acc.currentBalance > 0 && ageDays > (acc.maxCreditDays || 30);

                  return (
                    <TableRow key={acc.id}>
                      <TableCell>
                        <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{acc.customerName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#38BDF8', fontFamily: 'monospace' }}>
                          📞 {acc.customerPhone}
                        </div>
                        {acc.uhid && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            UHID: {acc.uhid}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {acc.creditLimit > 0 ? `₹${acc.creditLimit.toLocaleString('en-IN')}` : 'Unlimited'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          Max {acc.maxCreditDays || 30} Days
                        </div>
                      </TableCell>

                      <TableCell>
                        <div
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 900,
                            color: acc.currentBalance > 0 ? '#F59E0B' : '#10B981'
                          }}
                        >
                          ₹{acc.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {acc.currentBalance > 0 && (
                          <div style={{ fontSize: '0.7rem', color: isOverdue ? '#EF4444' : '#64748B' }}>
                            {ageDays} days since bill
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div style={{ fontSize: '0.78rem' }}>
                          {acc.lastPaidAt ? (
                            <span style={{ color: '#34D399' }}>
                              Paid: {new Date(acc.lastPaidAt).toLocaleDateString('en-IN')}
                            </span>
                          ) : (
                            <span style={{ color: '#64748B' }}>No payments yet</span>
                          )}
                        </div>
                        {acc.lastBilledAt && (
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            Billed: {new Date(acc.lastBilledAt).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {acc.currentBalance <= 0 ? (
                          <Badge variant="success">Clear (नील)</Badge>
                        ) : isOverdue ? (
                          <Badge variant="danger">Overdue ({ageDays}d)</Badge>
                        ) : (
                          <Badge variant="warning">Active Due</Badge>
                        )}
                      </TableCell>

                      <TableCell style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {/* Receive Payment Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedAccountForPayment(acc)}
                            disabled={acc.currentBalance <= 0}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              backgroundColor: acc.currentBalance > 0 ? 'rgba(16, 185, 129, 0.2)' : '#1E293B',
                              border: `1px solid ${acc.currentBalance > 0 ? '#10B981' : '#334155'}`,
                              color: acc.currentBalance > 0 ? '#34D399' : '#64748B',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: acc.currentBalance > 0 ? 'pointer' : 'not-allowed'
                            }}
                            title="Collect cash, UPI, or card repayment"
                          >
                            💵 जमा करें
                          </button>

                          {/* Passbook / Ledger Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedAccountForPassbook(acc)}
                            style={{
                              padding: '5px 9px',
                              borderRadius: '6px',
                              backgroundColor: '#1E293B',
                              border: '1px solid #334155',
                              color: '#38BDF8',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="View statement passbook"
                          >
                            📋 Passbook
                          </button>

                          {/* WhatsApp Reminder Button */}
                          {acc.currentBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppReminder(acc)}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                                border: '1px solid #25D366',
                                color: '#25D366',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Send 1-Click WhatsApp payment reminder with UPI link"
                            >
                              📲 तगादा
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: RECEIVE PAYMENT COLLECTION MODAL                                */}
      {/* ========================================================================= */}
      {selectedAccountForPayment && (
        <KhataPaymentCollectionModal
          isOpen={!!selectedAccountForPayment}
          onClose={() => {
            setSelectedAccountForPayment(null);
            reloadData();
          }}
          account={selectedAccountForPayment}
          onPaymentSuccess={() => reloadData()}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CUSTOMER PASSBOOK / LEDGER DRAWER MODAL                          */}
      {/* ========================================================================= */}
      {selectedAccountForPassbook && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#1E293B'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>📖</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F8FAFC' }}>
                    Customer Khata Passbook (खाता पासबुक)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                    {selectedAccountForPassbook.customerName} (📞 {selectedAccountForPassbook.customerPhone})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAccountForPassbook(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Passbook Summary Banner */}
            <div style={{ padding: '16px 20px', backgroundColor: '#131F37', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Current Net Outstanding:</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: selectedAccountForPassbook.currentBalance > 0 ? '#F59E0B' : '#10B981' }}>
                  ₹{selectedAccountForPassbook.currentBalance.toFixed(2)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedAccountForPayment(selectedAccountForPassbook);
                  }}
                  disabled={selectedAccountForPassbook.currentBalance <= 0}
                  style={{ backgroundColor: '#10B981', borderColor: '#059669', fontSize: '0.8rem' }}
                >
                  💵 Receive Payment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  style={{ fontSize: '0.8rem' }}
                >
                  🖨️ Print Passbook
                </Button>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div style={{ padding: '20px' }}>
              {(() => {
                const entries = pharmacyCreditKhataService.getLedgerEntries(selectedAccountForPassbook.id);
                if (entries.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                      No ledger transactions recorded for this customer yet.
                    </div>
                  );
                }

                return (
                  <TableContainer>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date / Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Reference #</TableHead>
                          <TableHead>Details / Notes</TableHead>
                          <TableHead style={{ textAlign: 'right' }}>Debit (+)</TableHead>
                          <TableHead style={{ textAlign: 'right' }}>Credit (-)</TableHead>
                          <TableHead style={{ textAlign: 'right' }}>Balance Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell style={{ fontSize: '0.78rem' }}>
                              {new Date(entry.timestamp).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </TableCell>

                            <TableCell>
                              {entry.entryType === 'DEBIT_INVOICE' ? (
                                <Badge variant="warning">🧾 Bill</Badge>
                              ) : entry.entryType === 'CREDIT_PAYMENT' ? (
                                <Badge variant="success">💵 Payment</Badge>
                              ) : (
                                <Badge variant="neutral">✂️ Waiver</Badge>
                              )}
                            </TableCell>

                            <TableCell style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 600, color: '#38BDF8' }}>
                              {entry.referenceId || 'N/A'}
                            </TableCell>

                            <TableCell style={{ fontSize: '0.78rem' }}>
                              {entry.invoiceItemsSummary && (
                                <div style={{ color: '#CBD5E1' }}>{entry.invoiceItemsSummary}</div>
                              )}
                              {entry.takenBy && (
                                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Taken by: {entry.takenBy}</div>
                              )}
                              {entry.paymentMode && (
                                <div style={{ fontSize: '0.7rem', color: '#34D399' }}>Mode: {entry.paymentMode}</div>
                              )}
                              {entry.notes && (
                                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>{entry.notes}</div>
                              )}
                            </TableCell>

                            <TableCell style={{ textAlign: 'right', fontWeight: 700, color: entry.entryType === 'DEBIT_INVOICE' ? '#EF4444' : '#64748B' }}>
                              {entry.entryType === 'DEBIT_INVOICE' ? `+₹${entry.amount.toFixed(2)}` : '—'}
                            </TableCell>

                            <TableCell style={{ textAlign: 'right', fontWeight: 700, color: entry.entryType !== 'DEBIT_INVOICE' ? '#10B981' : '#64748B' }}>
                              {entry.entryType !== 'DEBIT_INVOICE' ? `-₹${entry.amount.toFixed(2)}` : '—'}
                            </TableCell>

                            <TableCell style={{ textAlign: 'right', fontWeight: 900, color: '#FCD34D' }}>
                              ₹{entry.newBalance.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW KHATA ACCOUNT MODAL                                   */}
      {/* ========================================================================= */}
      {isNewAccountModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              color: '#F8FAFC'
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#1E293B'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#F8FAFC' }}>
                + Open New Customer Khata (नया खाता खोलें)
              </div>
              <button
                type="button"
                onClick={() => setIsNewAccountModalOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Customer Full Name *
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Sharma"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Mobile Number (10 Digits) *
                </label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 9820144910"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Credit Limit (₹)
                  </label>
                  <Input
                    type="number"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    Hospital UHID / MRN
                  </label>
                  <Input
                    value={newUhid}
                    onChange={(e) => setNewUhid(e.target.value)}
                    placeholder="e.g. UHID-1049"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Residential Address / Locality
                </label>
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Flat 302, Green Park Society"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  style={{ flex: 1, backgroundColor: '#10B981', borderColor: '#059669', fontWeight: 700 }}
                >
                  Create Khata Account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewAccountModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
