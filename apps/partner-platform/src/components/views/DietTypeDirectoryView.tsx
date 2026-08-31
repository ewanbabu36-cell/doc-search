import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '@docsearch/ui-kit';
import type { DietaryDietTypeDto } from '@docsearch/api-contracts';

interface Props {
  dietTypes: DietaryDietTypeDto[];
  onNewDietType: () => void;
}

export const DietTypeDirectoryView: React.FC<Props> = ({ dietTypes, onNewDietType }) => {
  const [search, setSearch] = useState('');

  const filtered = dietTypes.filter(
    (dt) =>
      dt.dietName.toLowerCase().includes(search.toLowerCase()) ||
      dt.dietCode.toLowerCase().includes(search.toLowerCase()) ||
      dt.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clinical Diet Master Catalog</h1>
          <p className="text-xs text-gray-500">Therapeutic meal categories, nutritional targets, allowed/restricted foods, and texture standards</p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewDietType}>+ Define Diet Type</Button>
      </div>

      <Card className="p-4">
        <Input placeholder="Search diet types by name, code, category..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((dt) => (
          <Card key={dt.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{dt.dietName}</h3>
                <p className="text-xs text-blue-600 font-semibold">{dt.dietCode} | {dt.category}</p>
              </div>
              <Badge variant="primary">{dt.texture}</Badge>
            </div>
            <p className="text-xs text-gray-600"><strong>Clinical Purpose:</strong> {dt.clinicalPurpose}</p>
            <div className="p-2.5 bg-gray-50 rounded-lg text-xs space-y-1">
              <p className="text-green-800"><strong>Permitted:</strong> {dt.allowedFoods}</p>
              <p className="text-red-800"><strong>Restricted:</strong> {dt.restrictedFoods}</p>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2 border-t text-center text-xs">
              <div className="bg-blue-50 p-1.5 rounded"><p className="text-gray-500 text-[10px]">Calories</p><p className="font-bold text-blue-900">{dt.targetCalories} kcal</p></div>
              <div className="bg-blue-50 p-1.5 rounded"><p className="text-gray-500 text-[10px]">Protein</p><p className="font-bold text-blue-900">{dt.targetProteinGrams}g</p></div>
              <div className="bg-blue-50 p-1.5 rounded"><p className="text-gray-500 text-[10px]">Carbs</p><p className="font-bold text-blue-900">{dt.targetCarbsGrams}g</p></div>
              <div className="bg-blue-50 p-1.5 rounded"><p className="text-gray-500 text-[10px]">Fat</p><p className="font-bold text-blue-900">{dt.targetFatGrams}g</p></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
