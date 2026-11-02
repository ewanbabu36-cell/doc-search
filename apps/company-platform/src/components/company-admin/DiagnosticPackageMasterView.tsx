import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface DiagnosticPackageItem {
  id: string;
  packageCode: string;
  packageName: string;
  parametersCount: number;
  packageMrp: string | number;
  bundledTestNames?: string[];
  fastingRequired: boolean;
  vialsRequired?: string[];
  isActive: boolean;
}

export const DiagnosticPackageMasterView: React.FC = () => {
  const [packages, setPackages] = useState<DiagnosticPackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    packageCode: '',
    packageName: '',
    parametersCount: 65,
    packageMrp: 1499,
    bundledTestsText: 'Complete Hemogram, Lipid Profile, Liver Function Test, Renal Function Test, Thyroid (TSH)',
    fastingRequired: true,
    vialsText: 'SST Gold Gel, EDTA Purple'
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch('/api/v1/company/masters/diagnostic-packages', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setPackages(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load diagnostic packages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPackages();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const tests = formData.bundledTestsText.split(',').map((t) => t.trim()).filter(Boolean);
      const vials = formData.vialsText.split(',').map((v) => v.trim()).filter(Boolean);

      const res = await fetch('/api/v1/company/masters/diagnostic-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          packageCode: formData.packageCode,
          packageName: formData.packageName,
          parametersCount: Number(formData.parametersCount),
          packageMrp: Number(formData.packageMrp),
          bundledTestNames: tests,
          fastingRequired: formData.fastingRequired,
          vialsRequired: vials
        })
      });

      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: 'Diagnostic health package created and synchronized to partner labs & consumer app!' });
        setIsModalOpen(false);
        setFormData({
          packageCode: '',
          packageName: '',
          parametersCount: 65,
          packageMrp: 1499,
          bundledTestsText: 'Complete Hemogram, Lipid Profile, Liver Function Test, Renal Function Test, Thyroid (TSH)',
          fastingRequired: true,
          vialsText: 'SST Gold Gel, EDTA Purple'
        });
        await fetchPackages();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'ERROR', text: errJson.message || 'Failed to create diagnostic package' });
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Network error saving diagnostic package' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this health package from the master catalog?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch(`/api/v1/company/masters/diagnostic-packages/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: 'Diagnostic package deleted from master catalog' });
        await fetchPackages();
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Failed to delete diagnostic package' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Diagnostic Health Packages Master</h1>
          <p className="text-sm text-gray-500 mt-1">
            Centrally curate, price, and distribute preventive health checkup packages and bundled diagnostic panels across all partner diagnostic centers and consumer apps.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
        >
          + Create Health Package
        </Button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between ${
            statusMsg.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-sm font-semibold hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-gray-400">Loading master packages...</div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No diagnostic packages in database</p>
            <p className="text-sm mt-1">Add curated health checkup packages to enable partner lab ordering & consumer booking.</p>
            <Button onClick={() => setIsModalOpen(true)} className="mt-4 bg-indigo-600 text-white">
              Create First Package
            </Button>
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Parameters</TableHead>
                  <TableHead>Standard MRP</TableHead>
                  <TableHead>Fasting</TableHead>
                  <TableHead>Vials Required</TableHead>
                  <TableHead>Included Test Panels</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <Badge variant="neutral" className="font-mono text-xs">
                        {pkg.packageCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">{pkg.packageName}</TableCell>
                    <TableCell className="text-gray-700 font-medium">{pkg.parametersCount} Tests</TableCell>
                    <TableCell className="font-semibold text-emerald-600">₹{Number(pkg.packageMrp).toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.fastingRequired ? 'warning' : 'neutral'}>
                        {pkg.fastingRequired ? '10-12h Fasting' : 'Non-Fasting'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(pkg.vialsRequired) ? (
                          pkg.vialsRequired.map((v, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                              {v}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">Standard</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Array.isArray(pkg.bundledTestNames) ? (
                          pkg.bundledTestNames.map((t, idx) => (
                            <Badge key={idx} variant="neutral" className="text-xs">
                              {t}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">Standard</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(pkg.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Create Master Diagnostic Package</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Package Code</label>
                  <Input
                    placeholder="e.g. FULL_BODY_ADV_65"
                    value={formData.packageCode}
                    onChange={(e) => setFormData({ ...formData, packageCode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Parameter Count</label>
                  <Input
                    type="number"
                    value={formData.parametersCount}
                    onChange={(e) => setFormData({ ...formData, parametersCount: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Package Name</label>
                <Input
                  placeholder="e.g. Comprehensive Full Body Checkup (Advanced)"
                  value={formData.packageName}
                  onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Standard MRP (₹)</label>
                  <Input
                    type="number"
                    value={formData.packageMrp}
                    onChange={(e) => setFormData({ ...formData, packageMrp: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fasting Requirement</label>
                  <select
                    className="w-full h-10 px-3 border rounded-md text-sm bg-white"
                    value={formData.fastingRequired ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, fastingRequired: e.target.value === 'true' })}
                  >
                    <option value="true">10-12 Hours Fasting Required</option>
                    <option value="false">Non-Fasting (Random)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Collection Tubes / Vials (Comma separated)</label>
                <Input
                  placeholder="e.g. SST Gold Gel, EDTA Purple, Sodium Fluoride Grey"
                  value={formData.vialsText}
                  onChange={(e) => setFormData({ ...formData, vialsText: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bundled Tests / Profiles (Comma separated)</label>
                <Input
                  placeholder="e.g. CBC, Lipid Profile, LFT, KFT, HbA1c, Vitamin D3"
                  value={formData.bundledTestsText}
                  onChange={(e) => setFormData({ ...formData, bundledTestsText: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white">
                  Publish Package
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
