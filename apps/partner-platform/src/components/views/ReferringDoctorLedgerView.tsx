import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, TableContainer, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@docsearch/ui-kit';

export interface ReferringDoctor {
  id: string;
  name: string;
  clinicName: string;
  specialty: string;
  phone: string;
  email: string;
  commissionType: 'PERCENTAGE' | 'FLAT';
  commissionRate: number; // e.g. 15 for 15%, or 150 for flat ₹150
  totalCases: number;
  totalBusiness: number;
  totalCommission: number;
  pendingPayout: number;
  upiId?: string;
}

export interface ReferralTransaction {
  id: string;
  date: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  patientMrn: string;
  testsOrdered: string[];
  billAmount: number;
  commissionAmount: number;
  status: 'PAID' | 'UNPAID';
}

const INITIAL_DOCTORS: ReferringDoctor[] = [
  {
    id: 'doc-01',
    name: 'Dr. Rajiv Kapoor, MD',
    clinicName: 'Kapoor Heart & Chest Care Clinic',
    specialty: 'Cardiology & Internal Medicine',
    phone: '+91 98201 12345',
    email: 'dr.kapoor@heartcare.org',
    commissionType: 'PERCENTAGE',
    commissionRate: 15,
    totalCases: 0,
    totalBusiness: 0,
    totalCommission: 0,
    pendingPayout: 0,
    upiId: 'drkapoor@icici'
  },
  {
    id: 'doc-02',
    name: 'Dr. Ananya Sen, MS, DGO',
    clinicName: 'Sen Women Wellness & Maternity',
    specialty: 'Obstetrics & Gynecology',
    phone: '+91 98311 54321',
    email: 'dr.sen@wellness.org',
    commissionType: 'PERCENTAGE',
    commissionRate: 15,
    totalCases: 0,
    totalBusiness: 0,
    totalCommission: 0,
    pendingPayout: 0,
    upiId: 'ananyasen@oksbi'
  },
  {
    id: 'doc-03',
    name: 'Dr. Praveen Mehta, MBBS, DNB',
    clinicName: 'Mehta Diabetes & Endocrine Center',
    specialty: 'Diabetology',
    phone: '+91 98402 98765',
    email: 'dr.mehta@diabeticcare.in',
    commissionType: 'PERCENTAGE',
    commissionRate: 20,
    totalCases: 0,
    totalBusiness: 0,
    totalCommission: 0,
    pendingPayout: 0,
    upiId: 'praveenmehta@paytm'
  },
  {
    id: 'doc-04',
    name: 'Dr. Alok Sharma, MD',
    clinicName: 'Dr. Sharma General OPD Clinic',
    specialty: 'General Medicine',
    phone: '+91 98111 22334',
    email: 'doctor@docsearch.health',
    commissionType: 'PERCENTAGE',
    commissionRate: 15,
    totalCases: 0,
    totalBusiness: 0,
    totalCommission: 0,
    pendingPayout: 0,
    upiId: 'aloksharma@upi'
  }
];

const INITIAL_TRANSACTIONS: ReferralTransaction[] = [];

export const ReferringDoctorLedgerView: React.FC = () => {
  const [doctors, setDoctors] = useState<ReferringDoctor[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('docsearch_referral_doctors');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return INITIAL_DOCTORS;
  });

  const [transactions, setTransactions] = useState<ReferralTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('docsearch_referral_transactions');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('docsearch_referral_doctors', JSON.stringify(doctors));
      } catch {}
    }
  }, [doctors]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('docsearch_referral_transactions', JSON.stringify(transactions));
      } catch {}
    }
  }, [transactions]);
  const [activeSubTab, setActiveSubTab] = useState<'DIRECTORY' | 'TRANSACTIONS' | 'SETTLEMENTS'>('DIRECTORY');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Doctor Dialog State
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newClinic, setNewClinic] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('General Medicine');
  const [newPhone, setNewPhone] = useState('');
  const [newCommissionRate, setNewCommissionRate] = useState('15');
  const [newUpi, setNewUpi] = useState('');

  // Selected Doctor for Settlement Slip
  const [selectedDocForSettlement, setSelectedDocForSettlement] = useState<ReferringDoctor | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const created: ReferringDoctor = {
      id: `doc-${Date.now()}`,
      name: newDocName.startsWith('Dr.') ? newDocName : `Dr. ${newDocName}`,
      clinicName: newClinic || 'Private OPD Clinic',
      specialty: newSpecialty,
      phone: newPhone || '+91 98000 00000',
      email: `${newDocName.toLowerCase().replace(/[^a-z]/g, '')}@docsearch.health`,
      commissionType: 'PERCENTAGE',
      commissionRate: parseFloat(newCommissionRate) || 15,
      totalCases: 0,
      totalBusiness: 0,
      totalCommission: 0,
      pendingPayout: 0,
      upiId: newUpi
    };

    setDoctors((prev) => [created, ...prev]);
    setIsAddDoctorOpen(false);
    setNewDocName('');
    setNewClinic('');
    setNewPhone('');
    setNewUpi('');
    triggerToast(`✓ ${created.name} successfully added to Referring Doctor Master!`);
  };

  const handleMarkAsPaid = (txId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === txId) {
          return { ...t, status: 'PAID' };
        }
        return t;
      })
    );
    triggerToast('✓ Transaction commission marked as SETTLED / PAID.');
  };

  const handleSendWhatsAppStatement = (doc: ReferringDoctor) => {
    const text = encodeURIComponent(
      `Dear ${doc.name},\n\nGreetings from Apex Pathology Lab! Here is your Referral Summary:\n\n` +
      `📊 Total Patients Referred: ${doc.totalCases}\n` +
      `💰 Total Gross Billing: ₹${doc.totalBusiness.toLocaleString('en-IN')}\n` +
      `🎁 Total Commission (${doc.commissionRate}%): ₹${doc.totalCommission.toLocaleString('en-IN')}\n` +
      `⚡ Pending Settlement: ₹${doc.pendingPayout.toLocaleString('en-IN')}\n\n` +
      `Thank you for trusting Doc Search Diagnostic Network.`
    );
    window.open(`https://wa.me/${doc.phone.replace(/\D/g, '')}?text=${text}`, '_blank');
    triggerToast(`💬 WhatsApp Statement dispatched to ${doc.name}!`);
  };

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm)
  );

  const totalMonthlyBusiness = doctors.reduce((acc, d) => acc + d.totalBusiness, 0);
  const totalMonthlyCommission = doctors.reduce((acc, d) => acc + d.totalCommission, 0);
  const totalPendingPayout = doctors.reduce((acc, d) => acc + d.pendingPayout, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Toast */}
      {notification && (
        <div style={{
          backgroundColor: '#064E3B',
          border: '1.5px solid #10B981',
          color: '#A7F3D0',
          padding: '12px 18px',
          borderRadius: '10px',
          fontWeight: 700,
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
        }}>
          {notification}
        </div>
      )}

      {/* Header Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Active Referring Doctors</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8', marginTop: '4px' }}>{doctors.length} Doctors</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Local clinics, OPD consultants & hospitals</div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Total Referral Business</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34D399', marginTop: '4px' }}>₹{totalMonthlyBusiness.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Gross test billing from B2B referrals</div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Total Commission Accrued</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FBBF24', marginTop: '4px' }}>₹{totalMonthlyCommission.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>Avg. 15% - 20% doctor referral slab</div>
        </div>

        <div style={{ backgroundColor: '#0F172A', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 700, textTransform: 'uppercase' }}>Pending Payouts Due</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F87171', marginTop: '4px' }}>₹{totalPendingPayout.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '0.72rem', color: '#FECACA', marginTop: '2px' }}>Ready for UPI / Bank NEFT Settlement</div>
        </div>
      </div>

      {/* Sub-Tabs & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('DIRECTORY')}
            style={{
              backgroundColor: activeSubTab === 'DIRECTORY' ? '#0284C7' : 'rgba(255,255,255,0.06)',
              color: activeSubTab === 'DIRECTORY' ? '#FFF' : '#CBD5E1',
              border: `1px solid ${activeSubTab === 'DIRECTORY' ? '#38BDF8' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            👨‍⚕️ Doctors Directory ({doctors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('TRANSACTIONS')}
            style={{
              backgroundColor: activeSubTab === 'TRANSACTIONS' ? '#0284C7' : 'rgba(255,255,255,0.06)',
              color: activeSubTab === 'TRANSACTIONS' ? '#FFF' : '#CBD5E1',
              border: `1px solid ${activeSubTab === 'TRANSACTIONS' ? '#38BDF8' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            📋 Case Transactions ({transactions.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by doctor name, clinic, specialty or phone..."
            style={{ width: '280px' }}
          />
          <Button
            variant="primary"
            onClick={() => setIsAddDoctorOpen(true)}
            style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#064E3B', fontWeight: 900, fontSize: '0.8125rem' }}
          >
            ➕ Register Referring Doctor
          </Button>
        </div>
      </div>

      {/* VIEW 1: DOCTORS DIRECTORY */}
      {activeSubTab === 'DIRECTORY' && (
        <Card title="Referring Doctors Master Directory" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor Details</TableHead>
                  <TableHead>Clinic / Hospital</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Commission Rate</TableHead>
                  <TableHead>Referred Cases</TableHead>
                  <TableHead>Total Business</TableHead>
                  <TableHead>Pending Payout</TableHead>
                  <TableHead>Settlement Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC', fontSize: '0.85rem', display: 'block' }}>{doc.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>📞 {doc.phone}</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>{doc.clinicName}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{doc.specialty}</Badge>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#38BDF8' }}>{doc.commissionRate}%</strong>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC' }}>{doc.totalCases} cases</strong>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#34D399' }}>₹{doc.totalBusiness.toLocaleString('en-IN')}</strong>
                    </TableCell>
                    <TableCell>
                      {doc.pendingPayout > 0 ? (
                        <span style={{ color: '#F87171', fontWeight: 800 }}>₹{doc.pendingPayout.toLocaleString('en-IN')}</span>
                      ) : (
                        <span style={{ color: '#34D399', fontWeight: 700 }}>✓ Settled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppStatement(doc)}
                          style={{
                            backgroundColor: '#25D366',
                            color: '#070C16',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Share statement on WhatsApp"
                        >
                          💬 WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDocForSettlement(doc)}
                          style={{
                            backgroundColor: 'rgba(2, 132, 199, 0.2)',
                            color: '#38BDF8',
                            border: '1px solid #0284C7',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          📄 Statement
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* VIEW 2: CASE TRANSACTIONS */}
      {activeSubTab === 'TRANSACTIONS' && (
        <Card title="Individual Referral Case Transactions" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tx ID & Date</TableHead>
                  <TableHead>Patient Details</TableHead>
                  <TableHead>Referring Doctor</TableHead>
                  <TableHead>Tests Ordered</TableHead>
                  <TableHead>Gross Bill</TableHead>
                  <TableHead>Commission Amount</TableHead>
                  <TableHead>Payout Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <strong style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{tx.id}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block' }}>{tx.date}</span>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC' }}>{tx.patientName}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block' }}>UHID: {tx.patientMrn}</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem', color: '#CBD5E1', fontWeight: 600 }}>{tx.doctorName}</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{tx.testsOrdered.join(', ')}</span>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#F8FAFC' }}>₹{tx.billAmount}</strong>
                    </TableCell>
                    <TableCell>
                      <strong style={{ color: '#FBBF24' }}>₹{tx.commissionAmount}</strong>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.status === 'PAID' ? 'success' : 'warning'}>
                        {tx.status === 'PAID' ? '✓ SETTLED' : '⏳ UNPAID'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tx.status === 'UNPAID' && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsPaid(tx.id)}
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#34D399',
                            border: '1px solid #10B981',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Paid
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* MODAL 1: ADD NEW REFERRING DOCTOR */}
      {isAddDoctorOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            color: '#FFF',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.15)',
            width: '100%',
            maxWidth: '520px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#38BDF8' }}>
              ➕ Register New Referring Doctor
            </h3>
            <form onSubmit={handleAddDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                  Doctor Full Name & Degree *
                </label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Verma, MD"
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                  Clinic / Hospital Name
                </label>
                <input
                  type="text"
                  value={newClinic}
                  onChange={(e) => setNewClinic(e.target.value)}
                  placeholder="e.g. Verma Health Clinic"
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Specialty
                  </label>
                  <select
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Diabetology">Diabetology</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    Mobile / WhatsApp No
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                    UPI ID for Payout
                  </label>
                  <input
                    type="text"
                    value={newUpi}
                    onChange={(e) => setNewUpi(e.target.value)}
                    placeholder="doctor@upi"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button variant="outline" onClick={() => setIsAddDoctorOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Doctor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE DOCTOR SETTLEMENT SLIP */}
      {selectedDocForSettlement && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '560px',
            padding: '30px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ borderBottom: '2px solid #0284C7', paddingBottom: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0369A1', fontWeight: 900 }}>
                  DOC SEARCH APEX PATHOLOGY LAB
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Monthly B2B Referral Settlement Statement
                </span>
              </div>
              <Badge variant="success">CONFIDENTIAL</Badge>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.8125rem' }}>
              <div><strong>Referring Doctor:</strong> {selectedDocForSettlement.name}</div>
              <div><strong>Clinic / Practice:</strong> {selectedDocForSettlement.clinicName}</div>
              <div><strong>Settlement Period:</strong> {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
              <div><strong>Payout UPI ID:</strong> {selectedDocForSettlement.upiId || 'Not specified'}</div>
            </div>

            <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>
                <span>Total Referred Patients:</span>
                <strong>{selectedDocForSettlement.totalCases} cases</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>
                <span>Gross Laboratory Business:</span>
                <strong>₹{selectedDocForSettlement.totalBusiness.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F0F9FF' }}>
                <span>Agreed Referral Slab ({selectedDocForSettlement.commissionRate}%):</span>
                <strong style={{ color: '#0369A1' }}>₹{selectedDocForSettlement.totalCommission.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FEF2F2' }}>
                <span>Current Pending Payout:</span>
                <strong style={{ color: '#DC2626', fontSize: '0.95rem' }}>₹{selectedDocForSettlement.pendingPayout.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedDocForSettlement(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFF', cursor: 'pointer', fontWeight: 700 }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#0284C7', color: '#FFF', cursor: 'pointer', fontWeight: 800 }}
              >
                🖨️ Print Statement Slip
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
