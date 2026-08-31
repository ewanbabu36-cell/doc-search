import React from 'react';
import { Card, Button, Badge } from '@docsearch/ui-kit';
import type { DietaryMenuTemplateDto } from '@docsearch/api-contracts';

interface Props {
  templates: DietaryMenuTemplateDto[];
  onNewTemplate: () => void;
}

export const MenuManagementView: React.FC<Props> = ({ templates, onNewTemplate }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hospital Menu Master Templates</h1>
          <p className="text-xs text-gray-500">Configurable meal slot templates, standardized portions, ingredient breakdowns, and estimated costs</p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewTemplate}>+ Create Menu Template</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <Card key={t.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{t.templateName}</h3>
                <p className="text-xs text-blue-600 font-semibold">{t.templateCode} | {t.dietCategory}</p>
              </div>
              <Badge variant="primary">{t.mealSlot}</Badge>
            </div>
            <p className="text-xs text-gray-700"><strong>Included Items:</strong> {t.menuItemsDescription}</p>
            <div className="p-2.5 bg-gray-50 rounded-lg text-xs flex justify-between">
              <span>Portion: <strong>{t.portionSize}</strong></span>
              <span>Calories: <strong>{t.estimatedCalories} kcal</strong></span>
              <span>Cost: <strong>₹{t.estimatedCost}</strong></span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
