/* ==========================================================================
   Mock data — swap for real API responses when the backend is ready.
   ========================================================================== */

const EMAILS = [
  { id: 1, name: "Rahul Mehta", domain: "vendorcorp.com", subject: "Q3 Vendor Contract Renewal", preview: "Following up on the contract renewal, could you confirm the updated pricing sheet...", category: "Invoice", status: "Safe", risk: "Safe", time: "9:24 AM", spf: true, dkim: true, dmarc: true, confidence: 96, sentiment: "Professional" },
  { id: 2, name: "Priya Sharma", domain: "company.com", subject: "Leave Application Approval", preview: "Requesting approval for planned leave from 14th to 18th July...", category: "HR", status: "Safe", risk: "Safe", time: "9:10 AM", spf: true, dkim: true, dmarc: true, confidence: 98, sentiment: "Neutral" },
  { id: 3, name: "unknown-billing", domain: "secure-paypa1.net", subject: "Urgent: Verify Your Account Now", preview: "Your account will be suspended unless you verify immediately by clicking...", category: "Spam", status: "High Risk", risk: "High Risk", time: "8:52 AM", spf: false, dkim: false, dmarc: false, confidence: 91, sentiment: "Urgent" },
  { id: 4, name: "Sneha Iyer", domain: "company.com", subject: "Client Escalation — TechNova Account", preview: "The client is unhappy with the response times this week, we need...", category: "Complaint", status: "Medium Risk", risk: "Medium Risk", time: "8:30 AM", spf: true, dkim: true, dmarc: false, confidence: 74, sentiment: "Aggressive" },
  { id: 5, name: "Amit Verma", domain: "company.com", subject: "Sprint Planning — Monday 10 AM", preview: "Sharing the agenda for Monday's sprint planning session, please review...", category: "Meeting", status: "Safe", risk: "Safe", time: "Yesterday", spf: true, dkim: true, dmarc: true, confidence: 99, sentiment: "Neutral" },
  { id: 6, name: "Finance Team", domain: "company.com", subject: "Reimbursement Processed", preview: "Your March travel reimbursement of ₹12,400 has been processed...", category: "Finance", status: "Safe", risk: "Safe", time: "Yesterday", spf: true, dkim: true, dmarc: true, confidence: 97, sentiment: "Positive" },
  { id: 7, name: "Legal Dept", domain: "company.com", subject: "NDA Signature Required", preview: "Please review and sign the attached NDA before the partner call...", category: "Legal", status: "Safe", risk: "Safe", time: "2 days ago", spf: true, dkim: true, dmarc: true, confidence: 95, sentiment: "Formal" },
  { id: 8, name: "no-reply", domain: "quick-loan-approve.ru", subject: "You've Been Pre-Approved!", preview: "Congratulations, click below to claim your instant loan approval...", category: "Spam", status: "High Risk", risk: "High Risk", time: "2 days ago", spf: false, dkim: false, dmarc: false, confidence: 88, sentiment: "Urgent" },
  { id: 9, name: "Karan Gill", domain: "resigned-hr.com", subject: "Resignation Letter — Notice Period", preview: "I would like to formally submit my resignation effective 30 days from...", category: "HR", status: "Safe", risk: "Safe", time: "3 days ago", spf: true, dkim: true, dmarc: true, confidence: 93, sentiment: "Formal" },
  { id: 10, name: "Sales Ops", domain: "company.com", subject: "New Enterprise Lead — Acme Corp", preview: "Acme Corp has requested a demo for the enterprise plan next week...", category: "Sales", status: "Safe", risk: "Safe", time: "3 days ago", spf: true, dkim: true, dmarc: true, confidence: 96, sentiment: "Positive" },
];

const CATEGORIES = [
  { name: "Invoice", icon: "fa-file-invoice-dollar", color: "blue", count: 1842 },
  { name: "HR", icon: "fa-users", color: "purple", count: 964 },
  { name: "Support", icon: "fa-headset", color: "green", count: 2310 },
  { name: "Sales", icon: "fa-chart-line", color: "amber", count: 1523 },
  { name: "Complaint", icon: "fa-triangle-exclamation", color: "red", count: 318 },
  { name: "Meeting", icon: "fa-calendar-days", color: "blue", count: 1187 },
  { name: "Legal", icon: "fa-scale-balanced", color: "purple", count: 402 },
  { name: "Finance", icon: "fa-sack-dollar", color: "green", count: 876 },
  { name: "Spam", icon: "fa-ban", color: "red", count: 3425 },
];

const SENTIMENTS = [
  { label: "Positive", icon: "fa-face-smile-beam", color: "green", value: "38%" },
  { label: "Neutral", icon: "fa-face-meh", color: "blue", value: "31%" },
  { label: "Negative", icon: "fa-face-frown", color: "red", value: "9%" },
  { label: "Urgent", icon: "fa-bolt", color: "amber", value: "12%" },
  { label: "Aggressive", icon: "fa-fire", color: "red", value: "4%" },
  { label: "Professional", icon: "fa-briefcase", color: "purple", value: "6%" },
];

const ORG_STATS = [
  { icon: "fa-user-group", label: "Total Users", value: "312" },
  { icon: "fa-building-columns", label: "Departments", value: "8" },
  { icon: "fa-people-group", label: "Teams", value: "24" },
  { icon: "fa-user-shield", label: "Admins", value: "6" },
];

const MEMBERS = [
  { name: "Aditi Kapoor", dept: "IT Operations", role: "Administrator", status: "Active" },
  { name: "Rahul Nair", dept: "Sales", role: "Manager", status: "Active" },
  { name: "Sneha Iyer", dept: "Customer Success", role: "Team Lead", status: "Active" },
  { name: "Vikram Rao", dept: "Finance", role: "Analyst", status: "Invited" },
  { name: "Meera Joshi", dept: "Human Resources", role: "Manager", status: "Active" },
];

const LICENSES = [
  { key: "AIML-STD-3F81-JZ02", type: "Standard", status: "Expired" },
  { key: "AIML-PRO-9K12-LM55", type: "Professional", status: "Suspended" },
  { key: "AIML-ENT-7X29-QK41", type: "Enterprise", status: "Active" },
];

const ATTACHMENTS = [
  { name: "Vendor_Contract_Q3.pdf", type: "PDF", icon: "fa-file-pdf", color: "red", summary: "3-year vendor agreement with a 12% YoY pricing escalation clause and a 30-day termination notice." },
  { name: "Employee_Handbook.docx", type: "DOCX", icon: "fa-file-word", color: "blue", summary: "Updated leave policy: 21 annual leave days, revised WFH guidelines effective next quarter." },
  { name: "Q3_Budget_Forecast.xlsx", type: "Excel", icon: "fa-file-excel", color: "green", summary: "Marketing spend up 18% QoQ; overall departmental budget tracking 4% under forecast." },
  { name: "Invoice_Scan_0912.png", type: "Image (OCR)", icon: "fa-file-image", color: "purple", summary: "Invoice #0912 from Amazon Business — total ₹48,200, due in 15 days." },
];
