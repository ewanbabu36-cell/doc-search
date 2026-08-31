# DOC SEARCH — Phase 2.18 Dietary & Nutrition RBAC Matrix

| Role | Assessment | Diet Order | Kitchen / Production | Quality Inspection | Tray Assembly | Meal Dispatch | Bedside Delivery | Billing / Cost |
|---|---|---|---|---|---|---|---|---|
| **Dietitian** | Read, Create, Finalize | Read, Review, Approve | Read, Plan | Read | Read | Read | Read | Read |
| **Dietary Supervisor** | Read | Read | Read, Create, Release | Read, Create, Pass/Fail | Read, Supervise | Read | Read | Read, Cost |
| **Kitchen Manager** | Read | Read | Read, Create, Release | Read, Create | Read | Read | Read | Read, Procurement |
| **Kitchen Staff** | Read | Read | Read, Prepare | Read | Read, Assemble | Read | Read | No Access |
| **Dietary Technician** | Read | Read | Read | Read | Read, Assemble | Read, Dispatch | Read | No Access |
| **Delivery Staff** | No Access | Read | No Access | No Access | Read | Read, Dispatch | Read, Confirm Delivery, Refusal | No Access |
| **Hospital / Partner Admin** | Read | Read, Manage | Read, Manage | Read, Audit | Read, Audit | Read, Audit | Read, Audit | Read, Manage |
| **Physician / Clinician** | Read | Create, Modify, Cancel | No Access | No Access | No Access | No Access | No Access | No Access |
