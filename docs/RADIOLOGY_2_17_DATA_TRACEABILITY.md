# DOC SEARCH — Phase 2.17 Radiology Data Traceability

| UI View / Field | API Route | Service Method | Repository Method | PostgreSQL Table & Field |
|---|---|---|---|---|
| Order Number | `GET /api/v1/partner/radiology/orders/:id` | `RadiologyService.getOrderById` | `RadiologyRepository.findById` | `clinical.radiology_orders.order_number` |
| Modality Type | `POST /api/v1/partner/radiology/orders` | `RadiologyService.createOrder` | `RadiologyRepository.create` | `clinical.radiology_orders.modality_type` |
| Order Status | `PATCH /api/v1/partner/radiology/orders/:id/status` | `RadiologyService.updateOrderStatus` | `RadiologyRepository.updateStatus` | `clinical.radiology_orders.status` |
| Scheduled Time | `PATCH /api/v1/partner/radiology/orders/:id/status` | `RadiologyService.updateOrderStatus` | `RadiologyRepository.updateStatus` | `clinical.radiology_orders.scheduled_time` |
| Technologist Study | `GET /api/v1/partner/radiology/orders` | `RadiologyService.getOrders` | `RadiologyRepository.findMany` | `clinical.radiology_studies` |
| Radiologist Report | `POST /api/v1/partner/radiology/orders` | `RadiologyService.createOrder` | `RadiologyRepository.create` | `clinical.radiology_reports` |
| Audit Trail Hash | SHA-256 Chained Event | `AuditRepository.recordEvent` | `AuditRepository.recordEvent` | `core.audit_events.integrity_hash` |
