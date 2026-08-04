const POLICY = {
  client_identification: {
    name: "Client Identification",
    key: "client_identification",
    order: 1,
    checklist:
      [
        {
          key: "clientNameConfirmed",
          title: "Client Name And Legal Entity Confirmed",
          desc: "Full registered name required",
          isRequired: true,
          requiredDoc: "opr_document"
        },
        {
          key: "industryClass",
          title: "Industry & Regulatory Classification Noted",
          desc: "Banking / Fintech / MFB / Other",
          isRequired: true,
          requiredDoc: "opr_document"
        },
        {
          key: "contactIdentified",
          title: "Point of Contact (Sponsor) Identified",
          desc: "Executive sponsor name and role",
          isRequired: true,
          requiredDoc: "opr_document"
        },
        {
          key: "initialNeedsDocumented",
          title: "Initial Needs Assessment Documented",
          desc: "Brief on client pain points / requirements",
          isRequired: true,
          requiredDoc: "opr_document"
        },
        {
          key: "confidentialitySigned",
          title: "NDA / Confidentiality Agreement Signed",
          desc: "Required before sharing any proprietary material",
          isRequired: true,
          requiredDoc: "nda_document"
        },
        {
          key: "kycAmlScreeningCompleted",
          title: "KYC / AML Screening Completed",
          desc: "Compliance clearance before engagement",
          isRequired: true,
          requiredDoc: "kyc_document"
        },
        {
          key: "conflictOfInterestCleared",
          title: "Conflict Of Interest Check Cleared",
          desc: "Internal Compliance sign-off",
          isRequired: true,
          requiredDoc: "kyc_document"
        },
        {
          key: "opportunityLogged",
          title: "Opportunity Logged In Pipeline Register",
          desc: "Assigned opportunity reference number",
          isRequired: false,
          requiredDoc: "opr_document"
        }
      ],
    requiredDocs: [
      {key: "nda_document", title: "NDA"},
      {key: "kyc_document", title: "KYC Form"},
      {key: "opr_document", title: "Opportunity Register"}
    ],
    rolesAllowedToSubmit: ["PROJECTMANAGER"],
    rolesAllowedToApprove: ["HEADOFOPS"]
  },

  client_engagement: {
    name: "Client Engagement",
    key: "client_engagement",
    order: 2,
    checklist:
      [
        {
          key: "rfpReviewed",
          title: "RFP / Tender Document Received & Reviewed",
          desc: "Log receipt date",
          isRequired: true,
          requiredDoc: "proposal_document"
        },
        {
          key: "technicalAssessment",
          title: "Technical Pre-assessment Conducted",
          desc: "Solution architect sign-off",
          isRequired: true,
          requiredDoc: "proposal_document"
        },
        {
          key: "commercialProposal",
          title: "Commercial Proposal / Bid Prepared",
          desc: "Pricing reviewed by Finance",
          isRequired: true,
          requiredDoc: "proposal_document"
        },
        {
          key: "proposalApproved",
          title: "Proposal Reviewed And Approved Internally",
          desc: "MD / CEO approval before submission",
          isRequired: true,
          requiredDoc: "proposal_document"
        },
        {
          key: "proposalSubmitted",
          title: "Proposal Submitted To Client",
          desc: "Record submission date and version",
          isRequired: true,
          requiredDoc: "proposal_document"
        },
        {
          key: "clientDemoCompleted",
          title: "Client Presentations / Demos Completed",
          desc: "Log dates and attendees",
          isRequired: false,
          requiredDoc: "proposal_document"
        },
        {
          key: "awardReceived",
          title: "Award / Intent Letter Received From Client",
          desc: "Triggers formal project initiation",
          isRequired: true,
          requiredDoc: "award_letter"
        },
        {
          key: "commercialTermsAgreed",
          title: "Commercial Terms Negotiated And Agreed",
          desc: "Payment milestones, SLA, penalties",
          isRequired: true,
          requiredDoc: "commercial_terms_sheet"
        }
      ],
    requiredDocs: [
      {key: "proposal_document", title: "Proposal"}, 
      {key: "award_letter", title: "Award Letter"}, 
      {key: "commercial_terms_sheet", title: "Commercial Terms Sheet"}
    ],
    rolesAllowedToSubmit: ["PROJECTMANAGER"],
    rolesAllowedToApprove: ["HEADOFOPS"]
  },

  project_initiation: {
    name: "Project Initiation",
    key: "project_initiation",
    order: 3,
    checklist:
      [
        {
          key: "awardLetterOnFile",
          title: "Order / Award Letter On File",
          desc: "Original signed copy required",
          isRequired: true,
          requiredDoc: "award_letter"
        },
        {
          key: "invoiceIssued",
          title: "Invoice Issued With Agreed Payment Terms",
          desc: "Must match commercial terms sheet",
          isRequired: true,
          requiredDoc: "commercial_terms_sheet"
        },
        {
          key: "signedScopeDoc",
          title: "Signed RFP / Project Scope Document",
          desc: "Client-countersigned copy",
          isRequired: true,
          requiredDoc: "scope_document"
        },
        {
          key: "paymentReceived",
          title: "Evidence Of Advance Payment Received",
          desc: "60% advance per policy (or waiver from GCEO)",
          isRequired: true,
          requiredDoc: "scope_document"
        },
        {
          key: "deferralObtained",
          title: "GCEO Waiver / Deferral Obtained (If Applicable)",
          desc: "Required if payment conditions deviate from policy",
          isRequired: false
        },
        {
          key: "projectSigned",
          title: "Project Initiation Form Fully Signed",
          desc: "Project Head, Legal & Compliance, Finance, Marketing",
          isRequired: true,
          requiredDoc: "initiation_document"
        },
        {
          key: "projectIdAssigned",
          title: "Project ID Assigned",
          desc: "Format: [CLIENT]/[STREAM]/[SEQ]",
          isRequired: true,
          requiredDoc: "initiation_document"
        },
        {
          key: "deployedToProject",
          title: "Resources Deployed To Project",
          desc: "Team roster confirmed",
          isRequired: true,
          requiredDoc: "initiation_document"
        }
      ],
    requiredDocs: [
      {key:"initiation_document", title: "Project Initiation Form"}, 
      {key:"scope_document", title: "Scope Document"}, 
      {key:"award_letter", title: "Award Letter"},
      {key:"commercial_terms_sheet", title: "Commercial Terms Sheet"}
    ],
    rolesAllowedToSubmit: ["PROJECTMANAGER"],
    rolesAllowedToApprove: ["HEADOFOPS"]
  },

  project_planning: {
    name: "Project Planning",
    key: "project_planning",
    order: 4,
    checklist:
      [
        {
          key: "charterSigned",
          title: "Project Charter signed By Client",
          desc: "Scope, objectives, assumptions, exclusions",
          isRequired: true,
          requiredDoc: "project_charter"
        },
        {
          key: "projectPlanReady",
          title: "Project Plan (MS Project / Tracker) shared",
          desc: "Milestones, dependencies, critical path",
          isRequired: true,
          requiredDoc: "project_plan"
        },
        {
          key: "resourcePlanApproved",
          title: "Resource Plan Approved",
          desc: "Onsite vs remote, third-party vendors",
          isRequired: true,
          requiredDoc: "project_plan"
        },
        {
          key: "riskDefined",
          title: "Risk Register Initiated",
          desc: "Min. 5 risks identified with mitigations",
          isRequired: true,
          requiredDoc: "risk_register"
        },
        {
          key: "commPlanApproved",
          title: "Communication Plan Agreed With Client",
          desc: "Meeting cadence, escalation matrix",
          isRequired: true,
          requiredDoc: "comms_plan"
        },
        {
          key: "processDefined",
          title: "Change Management Process Defined",
          desc: "CR template, approval workflow",
          isRequired: true,
          requiredDoc: "project_plan"
        },
        {
          key: "setupCompleted",
          title: "Environment Setup Checklist Completed",
          desc: "DEV / UAT / PROD access confirmed",
          isRequired: true,
          requiredDoc: "project_plan"
        },
        {
          key: "migrationPlanReviewed",
          title: "Data Migration Plan Reviewed",
          desc: "Required for core banking projects",
          isRequired: false
        },
        {
          key: "kickoffHeld",
          title: "Kick-off Meeting Held And Minuted",
          desc: "Client attendees captured",
          isRequired: true,
          requiredDoc: "comms_plan"
        }
      ],
    requiredDocs: [
      {key:"project_charter", title: "Project Charter"}, 
      {key:"project_plan", title: "Project Plan"}, 
      {key:"risk_register", title: "Risk Register"},
      {key:"comms_plan", title: "Comms Plan"}
    ],
    rolesAllowedToSubmit: ["PROJECTMANAGER"],
    rolesAllowedToApprove: ["HEADOFOPS"]
  },

  project_execution: {
    name: "Execution & Delivery",
    key: "project_execution",
    order: 5,
    checklist:
      [
        {
          key: "weeklyReports",
          title: "Weekly Status Reports Issued",
          desc: "Format: RAG status, issues, next steps",
          isRequired: true,
          requiredDoc: "status_report"
        },
        {
          key: "milestone1Signoff",
          title: "Milestone 1 Sign-Off Received",
          desc: "Client-signed delivery acceptance",
          isRequired: true,
          requiredDoc: "status_report"
        },
        {
          key: "milestone2Signoff",
          title: "Milestone 2 Sign-Off Received",
          desc: "Client-signed delivery acceptance",
          isRequired: false
        },
        {
          key: "changeRequestsApproved",
          title: "Change Requests Logged And Approved",
          desc: "No scope changes without signed CR",
          isRequired: true,
          requiredDoc: "cr_form"
        },
        {
          key: "issueLogActive",
          title: "Issue Log Maintained And Current",
          desc: "Open issues reviewed weekly",
          isRequired: false,
          requiredDoc: "issue_log"
        },
        {
          key: "migrationCompleted",
          title: "Data Migration Completed (If Applicable)",
          desc: "Migration sign-off from client DBA",
          isRequired: false
        },
        {
          key: "trainingExecuted",
          title: "Training Plan Executed",
          desc: "Attendance register captured",
          isRequired: true,
          requiredDoc: "sit_report"
        },
        {
          key: "sitCompleted",
          title: "SIT (System Integration Testing) Completed",
          desc: "Test results report signed off",
          isRequired: true,
          requiredDoc: "sit_report"
        },
        {
          key: "preUatHandoverDone",
          title: "Pre-UAT Environment Handover Done",
          desc: "Access credentials issued to client team",
          isRequired: true,
          requiredDoc: "sit_report"
        }
      ],
    requiredDocs: [
      {key:"status_report", title: "Status Report"}, 
      {key:"cr_form", title: "CR Form"}, 
      {key:"issue_log", title: "Issue Log"},
      {key:"sit_report", title: "SIT Report"}
    ],
    rolesAllowedToSubmit: ["PROJECTMANAGER"],
    rolesAllowedToApprove: ["HEADOFOPS"]
  },

  project_uat: {
    name: "User Acceptance Testing",
    key: "project_uat",
    order: 6,
    checklist:
      [
        {
          key: "uatStarted",
          title: "UAT Test Plan Approved By Client",
          desc: "Scenarios, expected outcomes, acceptance criteria",
          isRequired: true,
          requiredDoc: "uat_test_plan"
        },
        {
          key: "uatStable",
          title: "UAT Environment Certified And Stable",
          desc: "No open P1 environment issues",
          isRequired: true,
          requiredDoc: "uat_test_plan"
        },
        {
          key: "issuesLogCreated",
          title: "UAT Issues Log Created And Shared",
          desc: "Using UAT Issues Log template",
          isRequired: false,
          // requiredDoc: "uat_issues_log"
        },
        {
          key: "defectsResolved",
          title: "All Critical (P1) Issues Resolved",
          desc: "Zero open P1 before go-live gate",
          isRequired: true,
          requiredDoc: "uat_issues_log"
        },
        {
          key: "issuesResolved",
          title: "High-priority (P2) Issues Resolved Or Waived",
          desc: "Client written waiver required for any P2 carryover",
          isRequired: true,
          requiredDoc: "uat_issues_log"
        },
        {
          key: "clientSignoff",
          title: "UAT Sign-off Document Received From Client",
          desc: "Named client signatories required",
          isRequired: true,
          requiredDoc: "uat_sign_off"
        },
        {
          key: "testCompleted",
          title: "Regression Test Completed Post-Fixes",
          desc: "Re-test evidence on file",
          isRequired: false
        }
      ],
    requiredDocs: [
      {key: "uat_test_plan", title: "UAT Test Plan"}, 
      {key: "uat_issues_log", title: "UAT Issues Log"}, 
      {key: "uat_sign_off", title: "UAT Sign-Off Form"}
    ],
    rolesAllowedToSubmit: ["PROJECTMANAGER"],
    rolesAllowedToApprove: ["HEADOFOPS"]
  },

  go_live: {
    name: "Go-Live & Cut-Over",
    key: "go_live",
    order: 7,
    checklist:
      [
        {
          key: "readinessComplete",
          title: "Go-live Readiness Assessment Completed",
          desc: "All P1 UAT issues resolved",
          isRequired: true,
          requiredDoc: "uat_issues_log"
        },
        {
          key: "cutoverApproved",
          title: "Cut-over Plan Approved",
          desc: "Rollback procedure documented",
          isRequired: true,
          requiredDoc: "uat_test_plan"
        },
        {
          key: "productionValidated",
          title: "Production Environment Validated",
          desc: "Infra team sign-off",
          isRequired: true,
          requiredDoc: "uat_sign_off"
        },
        {
          key: "productionLive",
          title: "Go-live Authorization From Client Obtained",
          desc: "Written approval — email or signed form",
          isRequired: true,
          requiredDoc: "uat_sign_off"
        },
        {
          key: "cutoverExecuted",
          title: "Cut-over Executed Within Maintenance Window",
          desc: "Log start and end time",
          isRequired: true,
          requiredDoc: "uat_issues_log"
        },
        {
          key: "smokeTestsPassed",
          title: "Smoke Tests Passed Post-Cut-Over",
          desc: "Critical transactions verified",
          isRequired: true,
          requiredDoc: "uat_issues_log"
        },
        {
          key: "certIssuedToClient",
          title: "Go-Live Certificate Issued To Client",
          desc: "Triggers post-live support SLA",
          isRequired: true,
          requiredDoc: "uat_sign_off"
        },
        {
          key: "periodDefined",
          title: "Hypercare / Post-Live Support Period Defined",
          desc: "Duration, team, escalation path",
          isRequired: true,
          requiredDoc: "uat_test_plan"
        },
        {
          key: "milestoneTriggered",
          title: "Invoice Milestone Triggered",
          desc: "Based on commercial terms",
          isRequired: false
        }
      ],
    requiredDocs: [
      {key: "uat_test_plan", title: "UAT Test Plan"}, 
      {key: "uat_issues_log", title: "UAT Issues Log"}, 
      {key: "uat_sign_off", title: "UAT Sign-Off Form"}
    ],
    rolesAllowedToSubmit: ["PROJECTMANAGER"],
    rolesAllowedToApprove: ["HEADOFOPS"]
  },

  project_closure: {
    name: "Closure",
    key: "project_closure",
    order: 8,
    checklist:
      [
        {
          key: "finalReportReady",
          title: "Go-live Readiness Assessment Completed",
          desc: "All P1 UAT issues resolved",
          isRequired: true,
          requiredDoc: "uat_issues_log"
        },
        {
          key: "clientHandoverDone",
          title: "Cut-over Plan Approved",
          desc: "Rollback procedure documented",
          isRequired: true,
          requiredDoc: "uat_test_plan"
        },
        {
          key: "documentationDone",
          title: "Production Environment Validated",
          desc: "Infra team sign-off",
          isRequired: true,
          requiredDoc: "uat_sign_off"
        },
        {
          key: "financialClosure",
          title: "Go-live Authorization From Client Obtained",
          desc: "Written approval — email or signed form",
          isRequired: true,
          requiredDoc: "uat_sign_off"
        },
        {
          key: "resourceReleased",
          title: "Cut-over Executed Within Maintenance Window",
          desc: "Log start and end time",
          isRequired: true,
          requiredDoc: "uat_issues_log"
        }
      ],
    requiredDocs: [
      {key: "uat_test_plan", title: "UAT Test Plan"}, 
      {key: "uat_issues_log", title: "UAT Issues Log"}, 
      {key: "uat_sign_off", title: "UAT Sign-Off Form"}
    ],
    rolesAllowedToSubmit: ["PROJECTMANAGER"],
    rolesAllowedToApprove: ["HEADOFOPS"]
  }
};

/**
 * =========================
 * GET STAGE POLICY
 * =========================
 */
export const getPolicy = (stageKey) => {
  const key = stageKey;
  const policy = POLICY[key];

  if (!policy) {
    throw new Error(`Invalid stageId: ${stageKey}`);
  }

  return policy;
};

/**
 * =========================
 * VALIDATE CHECKLIST
 * =========================
 */
export const validateChecklist = (stageKey, stageData) => {
  const policy = getPolicy(stageKey);

  if (!stageData?.checklist) {
    return false;
  }

  const result = policy.checklist.every((policyItem) => {
    const item = stageData.checklist.find(
      (c) => c.key === policyItem.key
    );

    const ok = policyItem.isRequired
      ? item?.completed === true
      : true;

    return ok;
  });

  return result;
};

/**
 * =========================
 * VALIDATE DOCUMENTS
 * =========================
 */
export const validateDocuments = (stageId, stageData) => {

  const policy = getPolicy(stageId);

  if (!policy?.requiredDocs?.length) {
    return true;
  }

  const docs = stageData?.requiredDocs || [];

  const result = policy.requiredDocs.every((requiredDoc) => {
    const match = docs.find((d) => d.key === requiredDoc.key);

    const ok = Boolean(match?.fileURL);

    return ok;
  });

  return result;
};

/**
 * =========================
 * CAN SUBMIT STAGE
 * =========================
 */
export const canSubmitStage = (stageKey, stageData, role) => {
  const policy = POLICY[stageKey];

  if (!policy) {
    return false;
  }

  const roleAllowed = policy.rolesAllowedToSubmit.includes(role);
  const checklistOk = validateChecklist(stageKey, stageData);
  const docsOk = validateDocuments(stageKey, stageData);

  return roleAllowed && checklistOk && docsOk;
};
/**
 * =========================
 * CAN APPROVE STAGE
 * =========================
 */
export const canApproveStage = (stageKey, stageData, role) => {
  const policy = POLICY[stageKey];
  if (!policy) return false;

  return policy.rolesAllowedToApprove.includes(role);
};

/**
 * =========================
 * EXPORT FULL POLICY
 * =========================
 */
export { POLICY };