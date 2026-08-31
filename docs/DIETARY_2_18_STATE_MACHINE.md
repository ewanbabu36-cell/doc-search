# DOC SEARCH — Phase 2.18 Dietary State Machine & Safety Gates

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Assessment
    DRAFT --> IN_REVIEW : Submit for Review
    IN_REVIEW --> FINALIZED : Dietitian Finalization
    
    [*] --> ORDERED : Physician Diet Order
    ORDERED --> APPROVED : Dietitian Review & Approval
    ORDERED --> CANCELLED : Clinician Cancellation
    APPROVED --> ACTIVE : Meal Scheduling
    
    ACTIVE --> PLANNED : Production Plan Created
    PLANNED --> RELEASED : Production Release
    RELEASED --> PREPARED : Kitchen Meal Preparation
    
    PREPARED --> QUALITY_PASSED : Quality Check PASS
    PREPARED --> QUALITY_FAILED : Quality Check FAIL (BLOCKED)
    
    QUALITY_PASSED --> ASSEMBLED : Tray Assembly (Allergen Check)
    ASSEMBLED --> DISPATCHED : Meal Dispatch (NPO Check)
    
    DISPATCHED --> DELIVERED : Bedside Delivery Confirmed
    DISPATCHED --> REFUSED : Patient Refusal Recorded
    DISPATCHED --> MISSED : Missed Meal Recorded
    
    DELIVERED --> [*]
    REFUSED --> [*]
    MISSED --> [*]
```

### Safety Gates:
1. **Clinical Allergen Safety Gate**: Incompatible diet containing known patient allergens is rejected immediately at order creation.
2. **Quality Inspection Gate**: Meals that fail temperature, texture, or visual quality checks are blocked from tray assembly.
3. **NPO Safety Gate**: Patients with active Nil Per Os orders are blocked at dispatch from receiving oral meal trays.
