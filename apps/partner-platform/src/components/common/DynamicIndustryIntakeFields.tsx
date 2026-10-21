import React from 'react';
import {
  resolveIndustryPreset,
  type IntakeFieldDefinition,
  type IndustryPresetConfig
} from '@docsearch/shared-core';

export interface DynamicIndustryIntakeFieldsProps {
  industryType?: string | null;
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  readOnly?: boolean;
  className?: string;
}

export const DynamicIndustryIntakeFields: React.FC<DynamicIndustryIntakeFieldsProps> = ({
  industryType,
  values,
  onChange,
  errors = {},
  readOnly = false,
  className = ''
}) => {
  const preset: IndustryPresetConfig = resolveIndustryPreset(industryType);
  const intakeFields: IntakeFieldDefinition[] = preset.customIntakeFields || [];

  if (intakeFields.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 backdrop-blur-sm ${className}`}
      data-testid="dynamic-industry-intake-fields"
    >
      <div className="mb-3.5 flex items-center justify-between border-b border-slate-700/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none" role="img" aria-label={preset.name}>
            {preset.badgeIcon}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">
              {preset.name} {preset.vocabulary.intakeNote.singular} Details
            </h4>
            <p className="text-xs text-slate-400">
              Industry-specific intake parameters tailored for {preset.vocabulary.customer.plural.toLowerCase()}
            </p>
          </div>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase"
          style={{
            backgroundColor: `${preset.accentColor}22`,
            color: preset.accentColor,
            border: `1px solid ${preset.accentColor}44`
          }}
        >
          {preset.vertical}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {intakeFields.map((def) => {
          const fieldId = `intake-${def.field}`;
          const currentVal = values[def.field] ?? '';
          const hasError = Boolean(errors[def.field]);

          if (def.type === 'boolean') {
            return (
              <div
                key={def.field}
                className="col-span-1 flex items-center gap-3 sm:col-span-2 rounded-lg border border-slate-700/40 bg-slate-900/40 p-3"
              >
                <input
                  id={fieldId}
                  type="checkbox"
                  disabled={readOnly}
                  checked={Boolean(values[def.field])}
                  onChange={(e) => onChange(def.field, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
                />
                <label htmlFor={fieldId} className="cursor-pointer text-xs font-medium text-slate-200">
                  {def.label} {def.required && <span className="text-rose-400">*</span>}
                </label>
              </div>
            );
          }

          if (def.type === 'select') {
            return (
              <div key={def.field} className="space-y-1.5">
                <label htmlFor={fieldId} className="block text-xs font-medium text-slate-300">
                  {def.label} {def.required && <span className="text-rose-400">*</span>}
                </label>
                <select
                  id={fieldId}
                  disabled={readOnly}
                  value={currentVal}
                  onChange={(e) => onChange(def.field, e.target.value)}
                  className={`w-full rounded-lg border bg-slate-900/90 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition focus:outline-none focus:ring-1 ${
                    hasError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                  }`}
                >
                  <option value="">-- Select {def.label} --</option>
                  {(def.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {hasError && <p className="text-[11px] text-rose-400">{errors[def.field]}</p>}
              </div>
            );
          }

          if (def.type === 'number') {
            return (
              <div key={def.field} className="space-y-1.5">
                <label htmlFor={fieldId} className="block text-xs font-medium text-slate-300">
                  {def.label} {def.required && <span className="text-rose-400">*</span>}
                </label>
                <input
                  id={fieldId}
                  type="number"
                  disabled={readOnly}
                  value={currentVal}
                  placeholder={`Enter ${def.label.toLowerCase()}`}
                  onChange={(e) => onChange(def.field, e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full rounded-lg border bg-slate-900/90 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition focus:outline-none focus:ring-1 ${
                    hasError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                  }`}
                />
                {hasError && <p className="text-[11px] text-rose-400">{errors[def.field]}</p>}
              </div>
            );
          }

          // Default: Text input
          return (
            <div key={def.field} className="space-y-1.5">
              <label htmlFor={fieldId} className="block text-xs font-medium text-slate-300">
                {def.label} {def.required && <span className="text-rose-400">*</span>}
              </label>
              <input
                id={fieldId}
                type="text"
                disabled={readOnly}
                value={currentVal}
                placeholder={`Enter ${def.label.toLowerCase()}`}
                onChange={(e) => onChange(def.field, e.target.value)}
                className={`w-full rounded-lg border bg-slate-900/90 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition focus:outline-none focus:ring-1 ${
                  hasError
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                }`}
              />
              {hasError && <p className="text-[11px] text-rose-400">{errors[def.field]}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
