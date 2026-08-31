import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '@docsearch/ui-kit';
import type { DietaryKitchenDto } from '@docsearch/api-contracts';

interface Props {
  kitchens: DietaryKitchenDto[];
  onOpenKitchen: (kitchen: DietaryKitchenDto) => void;
  onEditKitchen: (kitchen: DietaryKitchenDto) => void;
  onNewKitchen: () => void;
}

export const KitchenDirectoryView: React.FC<Props> = ({
  kitchens,
  onOpenKitchen,
  onEditKitchen,
  onNewKitchen
}) => {
  const [search, setSearch] = useState('');

  const filtered = kitchens.filter(
    (k) =>
      k.kitchenName.toLowerCase().includes(search.toLowerCase()) ||
      k.kitchenCode.toLowerCase().includes(search.toLowerCase()) ||
      k.responsibleManager.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hospital Kitchen Facilities Directory</h1>
          <p className="text-xs text-gray-500">Central kitchens, satellite ward pantries, and specialized enteral preparation units</p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewKitchen}>+ Register Kitchen</Button>
      </div>

      <Card className="p-4">
        <Input placeholder="Search kitchens by name, code, manager..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((k) => (
          <Card key={k.id} className="p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">{k.kitchenName}</span>
                <Badge variant={k.status === 'ACTIVE' ? 'primary' : 'neutral'}>{k.status}</Badge>
              </div>
              <p className="text-xs text-blue-600 font-semibold">{k.kitchenCode} — {k.kitchenType}</p>
              <p className="text-xs text-gray-600"><strong>Location:</strong> {k.location}</p>
              <p className="text-xs text-gray-600"><strong>Capacity:</strong> {k.dailyCapacity} Meals / Day</p>
              <p className="text-xs text-gray-600"><strong>Hours:</strong> {k.operatingHours}</p>
              <p className="text-xs text-gray-600"><strong>Manager:</strong> {k.responsibleManager} ({k.contactPhone})</p>
              <p className="text-xs text-green-700 font-medium"><strong>Safety:</strong> {k.foodSafetyStatus}</p>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button variant="outline" size="sm" onClick={() => onEditKitchen(k)}>Edit Settings</Button>
              <Button variant="primary" size="sm" onClick={() => onOpenKitchen(k)}>Open Workspace</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
