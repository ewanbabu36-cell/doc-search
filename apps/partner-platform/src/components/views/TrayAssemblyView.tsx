import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryTrayAssemblyDto } from '@docsearch/api-contracts';

interface Props {
  trayAssemblies: DietaryTrayAssemblyDto[];
  onNewTrayAssembly: () => void;
  onDispatchTray: (tray: DietaryTrayAssemblyDto) => void;
}

export const TrayAssemblyView: React.FC<Props> = ({ trayAssemblies, onNewTrayAssembly, onDispatchTray }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Patient Tray Assembly & Quality Tagging</h1>
          <p className="text-xs text-gray-500">Meal plating, allergy warning labels, barcode identification, and pre-dispatch verification</p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewTrayAssembly}>+ Assemble Meal Tray</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trayAssemblies.map((t) => (
          <Card key={t.id} className="p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">{t.patientName} ({t.patientMrn})</span>
                <Badge variant="primary">{t.status}</Badge>
              </div>
              <p className="text-xs text-blue-600 font-semibold">{t.trayBarcode} — {t.mealSlot}</p>
              <p className="text-xs text-gray-600"><strong>Location:</strong> {t.wardName} - {t.roomBedNumber}</p>
              <p className="text-xs text-gray-600"><strong>Prescribed Diet:</strong> {t.dietTypeName}</p>
              <p className="text-xs text-gray-600"><strong>Plated Items:</strong> {t.itemsIncluded}</p>
              {t.allergyNotice && (
                <p className="text-xs text-red-700 font-bold bg-red-50 p-1.5 rounded">🚨 {t.allergyNotice}</p>
              )}
            </div>
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-xs text-gray-500">Assembled by {t.assembledByStaff}</span>
              <Button variant="primary" size="sm" onClick={() => onDispatchTray(t)}>Dispatch Tray</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
