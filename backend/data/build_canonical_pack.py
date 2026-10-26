import os
import json
import zipfile
from pathlib import Path

# Paths
DATA_DIR = Path(__file__).resolve().parent
PACK_DIR = DATA_DIR / "odin_dev_pack"
BUNDLE_DIR = PACK_DIR / "bundle"
CONTRACTS_DIR = BUNDLE_DIR / "contracts"
DROPS_DIR = BUNDLE_DIR / "drops"

CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)
DROPS_DIR.mkdir(parents=True, exist_ok=True)

# 1. clock.json
clock_content = {
    "checkpoints": ["2027-03-15", "2027-06-01", "2027-09-15"],
    "cadence": "quarterly"
}
(PACK_DIR / "clock.json").write_text(json.dumps(clock_content, indent=2), encoding="utf-8")
(BUNDLE_DIR / "clock.json").write_text(json.dumps(clock_content, indent=2), encoding="utf-8")

# 2. Contract Files (.txt)
contracts = {
    "STD": """QUILLHUB INC. MASTER SERVICES AGREEMENT AND STANDARD COMMERCIAL TERMS
Doc ID: STD.txt
Effective Date: 2026-01-01

Section 1.1 Scope and Provision of Services.
Quillhub Inc. provides enterprise contract intelligence and analytics services.

Section 1.4 Order of Precedence.
In the event of any conflict between this Agreement and any Service Schedule, the terms of the applicable Service Schedule shall control, unless an amendment explicitly specifies otherwise. Any conflicting counterparty standard terms are expressly subordinated to this Agreement.

Section 5.1 Payment Terms.
All fees shall be invoiced monthly in advance and are payable within thirty (30) calendar days of invoice receipt. Uncontested delinquent balances accrue interest at 1.5% per month.

Section 9.2 Limitation of Liability.
Each party's aggregate cumulative liability under this Agreement shall not exceed the total fees paid or payable by Customer in the preceding twelve (12) months, except for gross negligence, willful misconduct, or breach of confidentiality obligations.

Section 11.3 Governing Law and Dispute Notice.
Any formal dispute, breach notification, or escalation notice must be transmitted in writing to legal-notices@quillhub.com.
""",
    "A1": """STRATONODE CORP. CLOUD HOSTING INFRASTRUCTURE AGREEMENT
Doc ID: A1.txt
Effective Date: 2026-03-01
Counterparty: StratoNode Corp.

§1. Services Provided.
StratoNode agrees to provide managed cloud compute and database hosting services to Quillhub Inc.

§4.2 Service Availability.
StratoNode warrants that the Production Cloud Environment shall maintain a Monthly Uptime Percentage of not less than 99.5% during each calendar month. Downtime shall be calculated as total minutes of service unavailability excluding scheduled maintenance.

§4.3 Exclusivity and Non-Compete.
During the Term, Customer shall utilize StratoNode as its primary cloud compute provider for core AI operations, subject to StratoNode meeting all availability targets.

§7.1 Notice Requirements.
Any notice of breach, outage dispute, or SLA failure must be delivered in writing within thirty (30) days of the triggering incident to legal@stratonode.io.
""",
    "A2": """STRATONODE CORP. SERVICE LEVEL AGREEMENT SCHEDULE
Doc ID: A2.txt
Effective Date: 2026-03-01
Counterparty: StratoNode Corp.

§3.1 Service Credit Process.
Customer must submit written notification of an SLA Credit claim within thirty (30) calendar days of the month-end in which the downtime incident occurred. Failure to submit within 30 days forfeits all credit remedies.

§3.2 Calculation of Credits.
If uptime falls between 99.0% and 99.49%, Customer is entitled to a 10% credit. If uptime falls below 99.0%, Customer is entitled to a 25% credit applied against future monthly invoices.
""",
    "A3": """STRATONODE CORP. FIRST AMENDMENT TO SLA SCHEDULE
Doc ID: A3.txt
Effective Date: 2026-09-01
Counterparty: StratoNode Corp.

§1. Amendment of Credit Claim Window.
Section 3.1 of Schedule A2 is hereby amended and superseded in its entirety: Customer must submit written notification of an SLA Credit claim within sixty (60) calendar days of the month-end in which the downtime incident occurred.

§2. Precedence.
In the event of any contradiction between this First Amendment (A3) and the SLA Schedule (A2) or Master Agreement (A1), the terms of this First Amendment shall strictly govern.
""",
    "B1": """HARBOR RETAIL SYSTEMS ENTERPRISE CUSTOMER AGREEMENT
Doc ID: B1.txt
Effective Date: 2026-04-15
Counterparty: Harbor Retail Systems

§2. Service Level Commitments.
Quillhub warrants a Monthly Uptime Percentage of 99.9% for the Harbor Retail portal. Downtime below 99.9% incurs a penalty of $2,500 per 0.1% degradation.

§6. Notice and Grace Period.
Harbor Retail must provide Quillhub ninety (90) calendar days written notice prior to any renewal date to terminate or modify the commercial tier.

§8. Force Majeure and Upstream Outages.
Neither party shall be liable for failure to perform resulting from catastrophic cloud provider outages, provided immediate notice is given within five (5) business days.
""",
    "B2": """VANTAGE LOGISTICS ENTERPRISE CUSTOMER AGREEMENT
Doc ID: B2.txt
Effective Date: 2026-07-01
Counterparty: Vantage Logistics Inc.

§1. Scope of Implementation.
Quillhub shall deploy the autonomous contract workflow by September 1, 2027.

§3. SLA Penalties and Offset.
Vantage Logistics shall be entitled to an immediate fee offset of $5,000 per business day for unexcused implementation delays exceeding fourteen (14) days.

§9. Governing Law and Arbitration.
Any dispute shall be adjudicated under American Arbitration Association (AAA) commercial rules.
""",
    "C1": """NEXUS CONTRACTOR TALENT SERVICES AGREEMENT
Doc ID: C1.txt
Effective Date: 2026-05-01
Counterparty: Nexus Talent Agency

§4. Intellectual Property and Non-Solicitation.
Contractor personnel assigned to Quillhub shall assign all work product exclusively to Quillhub. Quillhub agrees not to solicit or hire personnel directly without paying a 25% placement fee.

§10. Audit and Invoicing.
Invoices must reflect verified hourly logs. Invoices with unverified line items shall be placed in quarantine pending review.
""",
    "D1": """AEGIS CYBER RISK INSURANCE POLICY
Doc ID: D1.txt
Effective Date: 2026-10-01
Counterparty: Aegis Underwriting

§2. Coverage and Breach Notification.
Coverage requires written notice of any potential system breach, ransomware incident, or major cloud hosting failure within seventy-two (72) hours of discovery.

§5. Policy Expiration and Renewal.
Policy coverage terminates on October 1, 2027 unless renewed thirty (30) days in advance with updated risk assessment reports.
"""
}

for name, text in contracts.items():
    (CONTRACTS_DIR / f"{name}.txt").write_text(text, encoding="utf-8")

# 3. manifest.json
manifest_data = {
    "company": {
        "name": "Quillhub Inc.",
        "description": "Enterprise Contract Intelligence Platform"
    },
    "contracts": [
        {"id": "STD", "title": "Standard Commercial Terms (Master)", "counterparty": "Quillhub Inc. (Standard)", "path": "contracts/STD.txt"},
        {"id": "A1", "title": "StratoNode Cloud Hosting Agreement", "counterparty": "StratoNode Corp.", "path": "contracts/A1.txt"},
        {"id": "A2", "title": "StratoNode SLA Schedule (Superseded)", "counterparty": "StratoNode Corp.", "path": "contracts/A2.txt"},
        {"id": "A3", "title": "StratoNode First SLA Amendment (Governing)", "counterparty": "StratoNode Corp.", "path": "contracts/A3.txt"},
        {"id": "B1", "title": "Harbor Retail Customer Agreement", "counterparty": "Harbor Retail Systems", "path": "contracts/B1.txt"},
        {"id": "B2", "title": "Vantage Logistics Enterprise Agreement", "counterparty": "Vantage Logistics Inc.", "path": "contracts/B2.txt"},
        {"id": "C1", "title": "Nexus Contractor Talent Agreement", "counterparty": "Nexus Talent Agency", "path": "contracts/C1.txt"},
        {"id": "D1", "title": "Aegis Cyber Insurance Policy", "counterparty": "Aegis Underwriting", "path": "contracts/D1.txt"}
    ]
}

(BUNDLE_DIR / "manifest.json").write_text(json.dumps(manifest_data, indent=2), encoding="utf-8")

# 4. drops/drop1.jsonl
drop1_events = [
    {"event_id": "EVT-101", "timestamp": "2027-02-14T08:30:00Z", "event_type": "cloud_outage", "contract_id": "A1", "summary": "StratoNode us-east-1 compute cluster outage duration 142 minutes", "payload_json": json.dumps({"outage_minutes": 142, "exposure_cents": 1800000, "impact_cents": 1800000})},
    {"event_id": "EVT-102", "timestamp": "2027-03-02T11:15:00Z", "event_type": "dispute_notice", "contract_id": "B1", "summary": "Harbor Retail submitted downtime credit request for February service disruption", "payload_json": json.dumps({"claim_amount": 250000, "impact_cents": 250000})},
    {"event_id": "EVT-103", "timestamp": "2027-04-10T14:00:00Z", "event_type": "payment_received", "contract_id": "B2", "summary": "Vantage Logistics Q1 license remittance", "payload_json": json.dumps({"amount": 12500000, "status": "processed"})},
    {"event_id": "EVT-104", "timestamp": "2027-05-18T09:45:00Z", "event_type": "sla_breach_warning", "contract_id": "A1", "summary": "StratoNode database latency spike above 850ms threshold", "payload_json": json.dumps({"latency_ms": 850, "exposure_cents": 500000})},
]

with open(DROPS_DIR / "drop1.jsonl", "w", encoding="utf-8") as f:
    for ev in drop1_events:
        f.write(json.dumps(ev) + "\n")

# 5. drops/drop2.jsonl (with malformed line for quarantine testing)
drop2_events = [
    {"event_id": "EVT-201", "timestamp": "2027-06-22T16:00:00Z", "event_type": "outage_incident", "contract_id": "B2", "summary": "Vantage Logistics integration gateway unavailable for 38 minutes", "payload_json": json.dumps({"outage_minutes": 38, "exposure_cents": 350000})},
    {"event_id": "EVT-202", "timestamp": "2027-07-04T12:00:00Z", "event_type": "audit_notice", "contract_id": "C1", "summary": "Nexus contractor timesheet discrepancy flagged by finance", "payload_json": json.dumps({"flagged_hours": 32, "amount": 480000})},
    {"event_id": "EVT-203", "timestamp": "2027-08-15T10:30:00Z", "event_type": "policy_renewal", "contract_id": "D1", "summary": "Aegis Cyber Insurance 45-day renewal assessment window opened", "payload_json": json.dumps({"status": "action_required"})},
]

with open(DROPS_DIR / "drop2.jsonl", "w", encoding="utf-8") as f:
    for ev in drop2_events:
        f.write(json.dumps(ev) + "\n")
    # Add corrupted line to trigger Heimdall quarantine
    f.write("{CORRUPTED_JSON_STREAM_DROP2_LINE_4: INVALID_EOF\n")

# 6. Create Zip archive: quillhub_portfolio.zip
zip_path = DATA_DIR / "quillhub_portfolio.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.write(PACK_DIR / "clock.json", "clock.json")
    zf.write(BUNDLE_DIR / "manifest.json", "manifest.json")
    for txt_file in CONTRACTS_DIR.glob("*.txt"):
        zf.write(txt_file, f"contracts/{txt_file.name}")
    for drop_file in DROPS_DIR.glob("*.jsonl"):
        zf.write(drop_file, f"drops/{drop_file.name}")

# Also copy zip to frontend public for direct download or inspection
frontend_public_zip = Path(__file__).resolve().parents[2] / "frontend" / "public" / "quillhub_portfolio.zip"
if frontend_public_zip.parent.exists():
    with open(frontend_public_zip, "wb") as f_out, open(zip_path, "rb") as f_in:
        f_out.write(f_in.read())

print(f"Generated canonical pack at: {PACK_DIR}")
print(f"Generated benchmark zip at: {zip_path}")
