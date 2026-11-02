import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@docsearch/ui-kit';

export interface VacutainerItem {
  id: string;
  tubeKey: string;
  name: string;
  additive: string;
  colorName: string;
  capHex: string;
  glowHex: string;
  volume: string;
  inversions: string;
  commonTests?: string[];
  isActive: boolean;
}

export const VacutainerCatalogMasterView: React.FC = () => {
  const [tubes, setTubes] = useState<VacutainerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tubeKey: '',
    name: '',
    additive: '',
    colorName: '',
    capHex: '#8B5CF6',
    glowHex: '#C084FC',
    volume: '3.0 mL',
    inversions: '8 - 10 times',
    testsText: 'CBC, ESR, HbA1c'
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  const fetchTubes = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch('/api/v1/company/masters/vacutainer-tubes', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setTubes(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load vacutainer catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTubes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const tests = formData.testsText.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await fetch('/api/v1/company/masters/vacutainer-tubes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          tubeKey: formData.tubeKey,
          name: formData.name,
          additive: formData.additive,
          colorName: formData.colorName,
          capHex: formData.capHex,
          glowHex: formData.glowHex,
          volume: formData.volume,
          inversions: formData.inversions,
          commonTests: tests,
          keywords: [formData.colorName.toLowerCase(), formData.additive.toLowerCase()]
        })
      });

      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: 'Vacutainer specification created and synced to all partner pathology labs!' });
        setIsModalOpen(false);
        setFormData({
          tubeKey: '',
          name: '',
          additive: '',
          colorName: '',
          capHex: '#8B5CF6',
          glowHex: '#C084FC',
          volume: '3.0 mL',
          inversions: '8 - 10 times',
          testsText: 'CBC, ESR, HbA1c'
        });
        await fetchTubes();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'ERROR', text: errJson.message || 'Failed to create vacutainer spec' });
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Network error saving vacutainer specification' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this vacutainer specification from the master catalog?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('docsearch_company_token') : null;
      const res = await fetch(`/api/v1/company/masters/vacutainer-tubes/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setStatusMsg({ type: 'SUCCESS', text: 'Vacutainer specification deleted from master catalog' });
        await fetchTubes();
      }
    } catch {
      setStatusMsg({ type: 'ERROR', text: 'Failed to delete vacutainer tube' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pathology Vacutainer Master Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Centrally govern standard blood collection tubes, cap color codes, additives, and inversion guidelines synced across all lab cockpit workstations.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
        >
          + Add Vacutainer Spec
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
          <div className="flex items-center justify-center p-12 text-gray-400">Loading master vacutainers...</div>
        ) : tubes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No vacutainer tube specifications configured in database</p>
            <p className="text-sm mt-1">Add official phlebotomy collection standards to populate partner pathology terminals.</p>
            <Button onClick={() => setIsModalOpen(true)} className="mt-4 bg-indigo-600 text-white">
              Create First Vacutainer Spec
            </Button>
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cap / Color</TableHead>
                  <TableHead>Specification Name</TableHead>
                  <TableHead>Tube Key</TableHead>
                  <TableHead>Additive</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Inversions</TableHead>
                  <TableHead>Common Tests</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tubes.map((tube) => (
                  <TableRow key={tube.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-5 h-5 rounded-full inline-block border border-gray-300 shadow-sm"
                          style={{ backgroundColor: tube.capHex }}
                        />
                        <span className="text-xs font-semibold text-gray-700">{tube.colorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">{tube.name}</TableCell>
                    <TableCell>
                      <Badge variant="neutral" className="font-mono text-xs">
                        {tube.tubeKey}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">{tube.additive}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{tube.volume}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{tube.inversions}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Array.isArray(tube.commonTests) ? (
                          tube.commonTests.map((t, idx) => (
                            <Badge key={idx} variant="neutral" className="text-xs">
                              {typeof t === 'string' ? t : (t as any).testName || 'Test'}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(tube.id)}
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
            <h2 className="text-xl font-bold text-gray-900">Add Vacutainer Specification</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tube Key</label>
                  <Input
                    placeholder="e.g. SST_GEL"
                    value={formData.tubeKey}
                    onChange={(e) => setFormData({ ...formData, tubeKey: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Color Name</label>
                  <Input
                    placeholder="e.g. Gold / Yellow"
                    value={formData.colorName}
                    onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tube Name</label>
                <Input
                  placeholder="e.g. Serum Separator Tube (SST)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Additive</label>
                  <Input
                    placeholder="e.g. Clot Activator & Gel"
                    value={formData.additive}
                    onChange={(e) => setFormData({ ...formData, additive: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Volume</label>
                  <Input
                    placeholder="e.g. 5.0 mL"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cap Hex Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.capHex}
                      onChange={(e) => setFormData({ ...formData, capHex: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border"
                    />
                    <Input
                      value={formData.capHex}
                      onChange={(e) => setFormData({ ...formData, capHex: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Inversions</label>
                  <Input
                    placeholder="e.g. 5 times"
                    value={formData.inversions}
                    onChange={(e) => setFormData({ ...formData, inversions: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Common Tests (Comma separated)</label>
                <Input
                  placeholder="e.g. Lipid Profile, LFT, KFT, Thyroid Profile"
                  value={formData.testsText}
                  onChange={(e) => setFormData({ ...formData, testsText: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white">
                  Save Specification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
