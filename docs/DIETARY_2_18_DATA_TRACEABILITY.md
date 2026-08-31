# DOC SEARCH — Phase 2.18 Dietary Data Traceability

| UI Field / Metric | API Endpoint | Service Method | Repository Method | DB Table & Column |
|---|---|---|---|---|
| Active Diet Orders | `GET /api/v1/partner/dietary/overview` | `getOverviewMetrics` | `getOverviewMetrics` | `count() FROM clinical.dietary_orders` |
| Kitchen Capacity | `GET /api/v1/partner/dietary/kitchens` | `getKitchens` | `getKitchens` | `clinical.dietary_kitchens.max_meal_capacity_per_slot` |
| Patient BMI & Risk Score | `GET /api/v1/partner/dietary/assessments` | `getAssessments` | `getAssessments` | `clinical.dietary_assessments.nutritional_risk_score` |
| Diet Order Status | `GET /api/v1/partner/dietary/orders/:id` | `getOrderById` | `getOrderById` | `clinical.dietary_orders.status` |
| Production Quantity | `POST /api/v1/partner/dietary/production-plans` | `createProductionPlan` | `createProductionPlan` | `clinical.dietary_production_plans.planned_quantity` |
| Quality Check Result | `POST /api/v1/partner/dietary/quality-checks` | `recordQualityCheck` | `recordQualityCheck` | `clinical.dietary_quality_checks.result` |
| Tray Barcode | `POST /api/v1/partner/dietary/tray-assemblies` | `createTrayAssembly` | `createTrayAssembly` | `clinical.dietary_tray_assemblies.tray_barcode` |
| Dispatch Status | `POST /api/v1/partner/dietary/dispatches` | `dispatchMeal` | `dispatchMeal` | `clinical.dietary_meal_dispatches.delivery_status` |
| Delivery Confirmation | `PATCH /api/v1/partner/dietary/dispatches/:id/deliver` | `confirmMealDelivery` | `updateDispatchStatus` | `clinical.dietary_meal_dispatches.delivered_at` |
| Billing Code Reference | `POST /api/v1/partner/dietary/billing-references` | `createBillingReference` | `createBillingReference` | `clinical.dietary_billing_references.billing_code` |
