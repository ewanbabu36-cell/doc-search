import React, { useState, useEffect } from 'react';
import type { PartnerProfileDto } from '@docsearch/api-contracts';
import {
  Dialog,
  Button,
  FormField,
  Input,
  Select,
  Badge,
  Alert,
  Spinner,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';
import { partnerService } from '../../services/partner-service.js';

export interface PartnerStaffDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: PartnerProfileDto;
  onStaffChanged?: () => void;
}

interface StaffMember {
  id: string;
  staffCode: string;
  fullName: string;
  workEmail: string;
  workPhone?: string;
  staffType: string;
  primaryRole: string;
  employmentType: string;
  employmentStatus: string;
  departmentName?: string;
  joiningDate: string;
}

export const PartnerStaffDirectoryModal: React.FC<PartnerStaffDirectoryModalProps> = ({
  isOpen,
  onClose,
  partner,
  onStaffChanged
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [primaryRole, setPrimaryRole] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');

  const partnerType = (partner.partnerType || '').toUpperCase();
  const isPharmacy = partnerType.includes('PHARMACY');
  const isPathology = partnerType.includes('LAB') || partnerType.includes('PATHOLOGY');
  const isClinic = partnerType.includes('CLINIC');
  const isDiagnostic = partnerType.includes('DIAGNOSTIC');

  const getProfileRoleOptions = () => {
    if (isPharmacy) {
      return [
        { value: 'CHIEF_PHARMACIST', label: '💊 Chief Registered Pharmacist (Licensee)', type: 'PHARMACIST' },
        { value: 'DISPENSING_PHARMACIST', label: '⚕️ Dispensing Pharmacist / Chemist', type: 'PHARMACIST' },
        { value: 'CASHIER_BILLING_OFFICER', label: '💵 POS Billing Cashier', type: 'BILLING_OFFICER' },
        { value: 'OPERATIONAL_SUPPORT', label: '📦 Storekeeper / Stockist Assistant', type: 'OPERATIONAL_SUPPORT' }
      ];
    }
    if (isPathology) {
      return [
        { value: 'LAB_DIRECTOR', label: '🔬 Consulting Pathologist (Signatory)', type: 'DOCTOR' },
        { value: 'SENIOR_LAB_TECH', label: '🧪 Senior Medical Lab Technician (MLT)', type: 'LAB_TECHNICIAN' },
        { value: 'OPERATIONAL_SUPPORT', label: '🩸 Phlebotomist / Sample Collector', type: 'OPERATIONAL_SUPPORT' },
        { value: 'RECEPTIONIST', label: '📋 Lab Receptionist / Intake Desk', type: 'RECEPTIONIST' }
      ];
    }
    if (isClinic) {
      return [
        { value: 'CONSULTANT_PHYSICIAN', label: '🩺 Consulting Doctor / Specialist', type: 'DOCTOR' },
        { value: 'STAFF_NURSE', label: '🩹 Clinic Nurse / Compounder', type: 'NURSE' },
        { value: 'RECEPTIONIST', label: '📋 Frontdesk Patient Coordinator', type: 'RECEPTIONIST' },
        { value: 'CASHIER_BILLING_OFFICER', label: '💵 Consultation Cashier', type: 'BILLING_OFFICER' }
      ];
    }
    if (isDiagnostic) {
      return [
        { value: 'RADIOLOGIST', label: '🩻 Consultant Radiologist (MD/DNB)', type: 'DOCTOR' },
        { value: 'OPERATIONAL_SUPPORT', label: '⚙️ CT / MRI / X-Ray Technician', type: 'OPERATIONAL_SUPPORT' },
        { value: 'STAFF_NURSE', label: '🩹 Daycare / Contrast Nurse', type: 'NURSE' },
        { value: 'RECEPTIONIST', label: '📅 Imaging Scheduling Desk', type: 'RECEPTIONIST' }
      ];
    }
    // Hospital Network / Tertiary
    return [
      { value: 'HEAD_OF_DEPARTMENT', label: '🏥 Head of Department (HOD)', type: 'DOCTOR' },
      { value: 'ATTENDING_DOCTOR', label: '🩺 Attending Physician / Surgeon', type: 'DOCTOR' },
      { value: 'CHARGE_NURSE', label: '🩹 Ward / ICU Charge Nurse', type: 'NURSE' },
      { value: 'BILLING_MANAGER', label: '📊 TPA & Insurance Desk Lead', type: 'BILLING_OFFICER' },
      { value: 'RECEPTIONIST', label: '🏨 Emergency / Admission Desk', type: 'RECEPTIONIST' }
    ];
  };

  const roleOptions = getProfileRoleOptions();

  useEffect(() => {
    if (roleOptions.length > 0 && !primaryRole) {
      setPrimaryRole(roleOptions[0]!.value);
    }
  }, [partnerType]);

  const loadStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await partnerService.getPartnerStaff(partner.id);
      setStaffList(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && partner?.id) {
      void loadStaff();
    }
  }, [isOpen, partner?.id]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !workEmail.trim()) {
      setError('Staff full name and email are mandatory.');
      return;
    }

    const selectedOption = roleOptions.find((r) => r.value === primaryRole) || roleOptions[0];
    const staffType = selectedOption ? selectedOption.type : 'DOCTOR';

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await partnerService.addPartnerStaff(partner.id, {
        fullName: fullName.trim(),
        workEmail: workEmail.trim().toLowerCase(),
        workPhone: workPhone.trim() || undefined,
        primaryRole,
        staffType,
        employmentType
      });

      setSuccessMsg(`Staff member ${fullName.trim()} provisioned successfully.`);
      setFullName('');
      setWorkEmail('');
      setWorkPhone('');
      setShowAddForm(false);
      await loadStaff();
      onStaffChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provision staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await partnerService.updatePartnerStaffStatus(
        partner.id,
        staffId,
        nextStatus,
        `HQ Admin ${nextStatus === 'ACTIVE' ? 'Reactivation' : 'Suspension'}`
      );
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, employmentStatus: nextStatus } : s))
      );
      setSuccessMsg(`Staff member status updated to ${nextStatus}.`);
      onStaffChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff status');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`👥 Staff Directory & Team Governance — ${partner.tradeName}`}
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            DOC SEARCH Enterprise HQ Governance Console • Partner ID: {partner.id.substring(0, 8)}...
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Console
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Partner Context Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '12px 16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.75rem' }}>
              {isPharmacy ? '💊' : isPathology ? '🧪' : isClinic ? '🩺' : isDiagnostic ? '🔬' : '🏥'}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '1rem' }}>
                  {partner.tradeName}
                </span>
                <Badge variant="primary">{partner.partnerType}</Badge>
                <Badge variant={partner.lifecycleStatus === 'ACTIVE' ? 'success' : 'neutral'}>
                  {partner.lifecycleStatus}
                </Badge>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                Contact: {partner.primaryContact.name} • {partner.primaryContact.email}
              </p>
            </div>
          </div>
          <Button
            variant={showAddForm ? 'outline' : 'primary'}
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Close Form' : '➕ Provision Staff Member'}
          </Button>
        </div>

        {error && (
          <Alert type="error" title="Action Error">
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert type="info" title="Success">
            {successMsg}
          </Alert>
        )}

        {/* Provision New Staff Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddStaff}
            style={{
              backgroundColor: '#1E293B',
              border: '1.5px solid #38BDF8',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.875rem' }}>
                ➕ Provision New Staff Member ({isPharmacy ? 'Pharmacy Team' : isPathology ? 'Lab Team' : isClinic ? 'Clinic Care Team' : 'Operational Staff'})
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>* Required fields</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <FormField label="Full Name" required>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isPharmacy ? 'e.g. Ramesh Verma' : 'e.g. Dr. Sunita Rao'}
                  required
                />
              </FormField>

              <FormField label="Work Email" required>
                <Input
                  type="email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  placeholder="staff@facility.local"
                  required
                />
              </FormField>

              <FormField label="Work Phone">
                <Input
                  value={workPhone}
                  onChange={(e) => setWorkPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </FormField>

              <FormField label="Designated Role" required>
                <Select
                  options={roleOptions.map((r) => ({ value: r.value, label: r.label }))}
                  value={primaryRole}
                  onChange={(e) => setPrimaryRole(e.target.value)}
                />
              </FormField>

              <FormField label="Employment Basis" required>
                <Select
                  options={[
                    { value: 'FULL_TIME', label: 'Full Time' },
                    { value: 'PART_TIME', label: 'Part Time' },
                    { value: 'VISITING_CONSULTANT', label: 'Visiting / Consultant' },
                    { value: 'CONTRACTOR', label: 'Contractor / Locum' }
                  ]}
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                />
              </FormField>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                Save & Enroll Staff
              </Button>
            </div>
          </form>
        )}

        {/* Live Staff Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.875rem' }}>
              Registered Personnel ({staffList.length})
            </span>
            <Button variant="outline" size="sm" onClick={loadStaff} isLoading={isLoading}>
              🔄 Refresh List
            </Button>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
              <Spinner size="md" />
            </div>
          ) : staffList.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                backgroundColor: '#1E293B',
                borderRadius: '8px',
                border: '1px dashed #334155'
              }}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>
                {isPharmacy ? '💊' : isPathology ? '🧪' : '👥'}
              </span>
              <p style={{ margin: 0, fontWeight: 700, color: '#F1F5F9' }}>
                No staff members provisioned yet for {partner.tradeName}
              </p>
              <p style={{ margin: '4px 0 16px 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
                Click "Provision Staff Member" above to add registered pharmacists, lab technicians, or consulting staff.
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
                ➕ Add First Staff Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Designated Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <code style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>
                        {staff.staffCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#F8FAFC', fontSize: '0.8125rem' }}>
                          {staff.fullName}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          Dept: {staff.departmentName || 'General Operations'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#E2E8F0' }}>
                        {staff.primaryRole.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
                        <span style={{ color: '#94A3B8' }}>{staff.workEmail}</span>
                        {staff.workPhone && <span style={{ color: '#64748B' }}>{staff.workPhone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                        {staff.employmentType.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.employmentStatus === 'ACTIVE' ? 'success' : 'neutral'}>
                        {staff.employmentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={staff.employmentStatus === 'ACTIVE' ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleStatus(staff.id, staff.employmentStatus)}
                      >
                        {staff.employmentStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Dialog>
  );
};
