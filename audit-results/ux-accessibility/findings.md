# DOC SEARCH — UX / ACCESSIBILITY AUDIT FINDINGS

- **Audit Date**: 2026-09-29T16:21:00+05:30
- **Auditor**: Senior Accessibility & UX Systems Engineer
- **Scope**: `apps/partner-platform`, `apps/company-platform`, `apps/landing-page`, `packages/ui-kit`

---

## 1. Executive Summary

A project-wide forensic audit across the 3 frontend web applications and the shared `@docsearch/ui-kit` design system identified key UX and accessibility defects across 7 primary categories:

1. **Semantic HTML & Keyboard Navigation**: Interactive non-semantic elements (`<div onClick=...>`) missing `role="button"`, `tabIndex={0}`, and `onKeyDown` handlers (e.g. Asset Roster items, Prescription Queue cards, MRR/ARR drilldown metrics).
2. **Modal & Dialog Accessibility**: 208 dialog components in `partner-platform` and 29 modals in `company-platform` implemented using raw `<div className="fixed inset-0...">` overlays instead of the standard accessible `<Dialog>` component from `@docsearch/ui-kit`. These raw overlays lack `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `Escape` key listeners.
3. **Form & Input Accessibility**: Form inputs in custom dialogs lack explicit `<label htmlFor={id}>` or `aria-label` associations, causing screen readers to announce generic unlabeled textboxes.
4. **Accessible Button Names & Touch Targets**: Icon-only action buttons (such as dialog close '✕' buttons, quick-filter triggers) missing `aria-label` or `<span className="sr-only">`, and touch targets below 44×44px on mobile viewports.
5. **Focus Management & Indicators**: Global focus indicators are enforced by `@docsearch/ui-kit`'s `base.css` (`:focus-visible` with 3px focus ring), but raw modal overlays prevent focus traps, allowing background DOM elements to receive focus while modals are open.
6. **Mobile Responsive UX & Clipping**: Large multi-column modals and desktop tables require verified responsive layout wrapping and horizontal scrolling isolation without breaking layout flow on mobile (320px–414px).
7. **Theme Consistency & Visual Contrast**: Raw dialog overlays with hardcoded `bg-white text-gray-900` clash with the application's CSS design system tokens (`--ds-color-surface`, `--ds-color-text-primary`).

---

## 2. Detailed Findings Register

### Finding UX-A11Y-001: Clickable Non-Semantic Equipment Roster Elements
- **Location**: `apps/partner-platform/src/components/views/AssetOverviewView.tsx` (Line 136)
- **Category**: Semantic HTML & Keyboard Navigation
- **Severity**: HIGH
- **Defect**: Equipment roster items use `<div onClick={() => onSelectAsset(asset)}>` without `role="button"`, `tabIndex={0}`, `aria-label`, or `onKeyDown` handlers. Keyboard users navigating via `Tab` cannot reach or activate the asset detail drawer.
- **Classification**: KEYBOARD & SEMANTIC ERROR

### Finding UX-A11Y-002: Clickable Prescription Queue Header
- **Location**: `apps/partner-platform/src/components/views/PharmacyPrescriptionQueueView.tsx` (Line 372)
- **Category**: Semantic HTML & Keyboard Navigation
- **Severity**: HIGH
- **Defect**: Prescription number uses `<div style={{ cursor: 'pointer', fontWeight: 800 }} onClick={() => onSelectPrescription(rx.id)}>` without keyboard handlers.
- **Classification**: KEYBOARD & SEMANTIC ERROR

### Finding UX-A11Y-003: Executive Command Center Metric Ledger Triggers
- **Location**: `apps/company-platform/src/components/executive/MediSphereCommandCenterDashboard.tsx` (Lines 1830, 1842)
- **Category**: Semantic HTML & Keyboard Navigation
- **Severity**: HIGH
- **Defect**: MRR and ARR diagnostic ledger cards use `<div onClick=...>` without `role="button"`, `tabIndex={0}`, or keyboard listener.
- **Classification**: KEYBOARD & SEMANTIC ERROR

### Finding UX-A11Y-004: Unified Healthcare SSO Login Modal Lacks Dialog Semantics & Escape Dismissal
- **Location**: `apps/landing-page/src/components/UnifiedHealthcareLoginModal.tsx` (Lines 1113–1245)
- **Category**: Dialog / Modal Accessibility & Keyboard
- **Severity**: HIGH
- **Defect**:
  1. The outer overlay is a raw `<div>` missing `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
  2. The close button `✕` (line 1212) has no `aria-label="Close dialog"`.
  3. The close button touch target is `34px × 34px`, failing the 44px mobile touch target standard.
- **Classification**: ACCESSIBILITY & DIALOG ERROR

### Finding UX-A11Y-005: Raw Overlay Dialogs in Clinical & Administrative Modules
- **Location**: `apps/partner-platform/src/components/dialogs/` (e.g. `AcknowledgeCriticalFindingDialog.tsx`, `AcknowledgePanicValueDialog.tsx`, `AcknowledgeSepsisAlertDialog.tsx`, `ActivateDisasterModeDialog.tsx`)
- **Category**: Dialog Semantics & Keyboard Focus
- **Severity**: HIGH
- **Defect**: 192 partner dialogs use raw `<div className="fixed inset-0...">` overlays instead of standard `<Dialog>` or accessible attributes. They lack `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape dismissal, and input label bindings.
- **Classification**: ACCESSIBILITY & FOCUS ERROR

---

## 3. Remediation Strategy

1. **Remediation 1 (Finding UX-A11Y-001)**: Refactor `AssetOverviewView.tsx` to provide `role="button"`, `tabIndex={0}`, `aria-label`, and `onKeyDown` handlers for asset cards.
2. **Remediation 2 (Finding UX-A11Y-002)**: Refactor `PharmacyPrescriptionQueueView.tsx` to wrap prescription item in keyboard-accessible button or provide full ARIA button semantics.
3. **Remediation 3 (Finding UX-A11Y-003)**: Refactor `MediSphereCommandCenterDashboard.tsx` MRR/ARR cards to add `role="button"`, `tabIndex={0}`, and `onKeyDown` Enter/Space triggers.
4. **Remediation 4 (Finding UX-A11Y-004)**: Upgrade `UnifiedHealthcareLoginModal.tsx` to include `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, accessible `aria-label="Close healthcare login dialog"`, and expand close button hit-area to 44px minimum.
5. **Remediation 5 (Finding UX-A11Y-005)**: Upgrade clinical critical alert dialogs (`AcknowledgeCriticalFindingDialog`, `AcknowledgePanicValueDialog`, `AcknowledgeSepsisAlertDialog`, `AcknowledgeVitalBreachDialog`, etc.) to use accessible dialog attributes, `Escape` key dismissal, backdrop click closing, and explicit input-label associations.
