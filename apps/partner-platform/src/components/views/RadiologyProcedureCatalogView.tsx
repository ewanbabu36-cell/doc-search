import React from 'react';
import { Card, Badge } from '@docsearch/ui-kit';
import type { RadiologyProcedureCatalogDto } from '@docsearch/api-contracts';

interface Props {
  procedures: RadiologyProcedureCatalogDto[];
}

export const RadiologyProcedureCatalogView: React.FC<Props> = ({ procedures }) => {
  return (
    <Card className="p-5 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Radiology Procedure Master Catalog</h3>
          <p className="text-xs text-gray-500">CPT codes, modality mapping, prep instructions & billing tariffs</p>
        </div>
        <Badge variant="primary">{procedures.length} Active Procedures</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 font-bold">
              <th className="py-2.5 px-3">Code</th>
              <th className="py-2.5 px-3">Procedure Name</th>
              <th className="py-2.5 px-3">Modality</th>
              <th className="py-2.5 px-3">Body Part</th>
              <th className="py-2.5 px-3">Contrast</th>
              <th className="py-2.5 px-3">CPT Ref</th>
              <th className="py-2.5 px-3 text-right">Tariff Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {procedures.map((proc) => (
              <tr key={proc.id} className="hover:bg-gray-50/70 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{proc.procedureCode}</td>
                <td className="py-2.5 px-3 font-semibold text-gray-900">{proc.procedureName}</td>
                <td className="py-2.5 px-3 font-semibold text-blue-700">{proc.modalityType.split('_')[0]}</td>
                <td className="py-2.5 px-3 text-gray-700">{proc.bodyPart}</td>
                <td className="py-2.5 px-3">{proc.requiresContrast ? '⚠️ IV Contrast' : 'Non-Contrast'}</td>
                <td className="py-2.5 px-3 font-mono text-gray-600">{proc.cptCodeReference || 'N/A'}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-green-700 text-right">${proc.priceAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
