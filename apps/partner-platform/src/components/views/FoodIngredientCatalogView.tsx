import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '@docsearch/ui-kit';
import type { DietaryFoodItemDto } from '@docsearch/api-contracts';

interface Props {
  foodItems: DietaryFoodItemDto[];
  onNewFoodItem: () => void;
}

export const FoodIngredientCatalogView: React.FC<Props> = ({ foodItems, onNewFoodItem }) => {
  const [search, setSearch] = useState('');

  const filtered = foodItems.filter(
    (fi) =>
      fi.itemName.toLowerCase().includes(search.toLowerCase()) ||
      fi.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      fi.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Food Ingredients & Recipe Catalog</h1>
          <p className="text-xs text-gray-500">Nutritional values, allergen disclosures, storage specifications, and cost parameters</p>
        </div>
        <Button variant="primary" size="sm" onClick={onNewFoodItem}>+ Add Food Item</Button>
      </div>

      <Card className="p-4">
        <Input placeholder="Search food items by name, code, category..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="py-2.5 px-3">Item Code</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Calories</th>
                <th className="py-2.5 px-3">Protein (g)</th>
                <th className="py-2.5 px-3">Carbs / Fat (g)</th>
                <th className="py-2.5 px-3">Storage</th>
                <th className="py-2.5 px-3 text-right">Est. Unit Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((fi) => (
                <tr key={fi.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-semibold text-blue-600">{fi.itemCode}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">{fi.itemName}</td>
                  <td className="py-2.5 px-3 text-gray-600">{fi.category}</td>
                  <td className="py-2.5 px-3 text-gray-600">{fi.unit}</td>
                  <td className="py-2.5 px-3 font-medium text-gray-900">{fi.caloriesPerUnit} kcal</td>
                  <td className="py-2.5 px-3 font-medium text-gray-900">{fi.proteinPerUnit}g</td>
                  <td className="py-2.5 px-3 text-gray-600">{fi.carbsPerUnit}g / {fi.fatPerUnit}g</td>
                  <td className="py-2.5 px-3"><Badge variant="primary">{fi.storageType}</Badge></td>
                  <td className="py-2.5 px-3 text-right font-bold text-gray-900">₹{fi.estimatedUnitCost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
