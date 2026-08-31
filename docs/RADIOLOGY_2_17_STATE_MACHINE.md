# DOC SEARCH — Phase 2.17 Radiology State Machine & Transitions

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Draft
    DRAFT --> ORDERED : Place Order
    DRAFT --> CANCELLED : Cancel
    
    ORDERED --> SCHEDULED : Schedule Appointment
    ORDERED --> IN_PROGRESS : Direct Acquisition
    ORDERED --> CANCELLED : Cancel Order
    
    SCHEDULED --> IN_PROGRESS : Patient in Modality Room
    SCHEDULED --> CANCELLED : Cancel Appointment
    
    IN_PROGRESS --> COMPLETED : Study Complete
    IN_PROGRESS --> CANCELLED : Abort Study
    
    COMPLETED --> REPORTED : Radiologist Interpretation
    REPORTED --> VERIFIED : Clinical Verification
    
    VERIFIED --> [*]
    CANCELLED --> [*]
```

### Invariants:
1. Backward transitions (e.g. `REPORTED -> DRAFT`) are strictly forbidden (HTTP 400 Bad Request).
2. Finalized reports cannot be overwritten; amendments generate an immutable version record.
3. Every state transition writes an immutable SHA-256 audit event.
