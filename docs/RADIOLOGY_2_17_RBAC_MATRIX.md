# DOC SEARCH — Phase 2.17 Radiology RBAC Matrix

| Role | Order Read | Order Create | Order Schedule | Study Acquisition | Report Create | Report Finalize | Report Amend | Result Release | Admin |
|---|---|---|---|---|---|---|---|---|---|
| **Ordering Clinician** | Read | Create | No Access | No Access | Read | No Access | No Access | Read | No Access |
| **Scheduler / Reception** | Read | No Access | Schedule | No Access | No Access | No Access | No Access | No Access | No Access |
| **Radiology Technologist**| Read | No Access | Update | Create Study | Read | No Access | No Access | No Access | No Access |
| **Radiologist** | Read | No Access | No Access | Read | Create / Edit | Finalize | Amend | Release | No Access |
| **Radiology Admin** | Read | Manage | Manage | Manage | Read | Audit | Audit | Audit | Manage |
