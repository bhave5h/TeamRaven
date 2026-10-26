import sys
from pathlib import Path

# Bootstrap project root into sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir.parent) not in sys.path:
    sys.path.insert(0, str(backend_dir.parent))

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import json
from datetime import datetime

from backend.config import settings
from backend.db.database import get_db, init_db, get_dataset_state
from backend.engines.manifest_loader import ManifestLoader
from backend.engines.parser import ContractParser
from backend.engines.precedence import PrecedenceEngine
from backend.engines.event_ingester import EventIngester
from backend.engines.timeline_engine import TimelineEngine
from backend.agents.odin import Odin
from backend.agents.norns import Norns
from backend.agents.heimdall import Heimdall
from backend.agents.tyr import Tyr
from backend.agents.workflow import WarRoomPipeline
from backend.reports.company_report import CompanyReportGenerator
from backend.reports.contract_report import ContractReportGenerator
from backend.engines.action_dispatcher import ActionDispatcher


# ==============================================================================
# PAGE CONFIGURATION & THEME
# ==============================================================================
st.set_page_config(
    page_title="Odin: Contract War Room",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Enterprise Dark Theme CSS
st.markdown("""
<style>
    /* Dark background and font setup */
    .stApp {
        background-color: #090D16;
        color: #F3F4F6;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    /* Top Banner */
    .war-room-header {
        background: linear-gradient(135deg, #111827 0%, #1E1B4B 100%);
        border: 1px solid #312E81;
        border-radius: 12px;
        padding: 20px 24px;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }
    
    /* Metric Cards */
    .metric-card {
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 10px;
        padding: 16px 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .metric-val {
        font-size: 26px;
        font-weight: 700;
        margin-top: 4px;
    }
    .metric-sub {
        font-size: 12px;
        color: #9CA3AF;
    }
    
    /* Agent Badges */
    .badge-odin { background: #312E81; color: #818CF8; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; }
    .badge-thor { background: #064E3B; color: #34D399; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; }
    .badge-loki { background: #881337; color: #FB7185; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; }
    .badge-heimdall { background: #164E63; color: #38BDF8; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; }
    .badge-tyr { background: #78350F; color: #FBBF24; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; }
    
    /* Chat message card */
    .chat-bubble {
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 8px;
        padding: 14px 18px;
        margin-bottom: 12px;
    }
    
    /* Tab Styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        border-bottom: 1px solid #1F2937;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: transparent;
        border-radius: 6px 6px 0px 0px;
        color: #9CA3AF;
        padding: 10px 18px;
    }
    .stTabs [aria-selected="true"] {
        background-color: #1F2937 !important;
        color: #F9FAFB !important;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# INITIALIZE SYSTEM & DATA ENGINES
# ==============================================================================
@st.cache_resource
def bootstrap_system():
    init_db()
    active = get_dataset_state()
    if not active.get("bundle_path") or not active.get("clock_path"):
        return None
    settings.update_dataset_paths(active["bundle_path"], active["clock_path"])
    manifest = ManifestLoader.load_bundle(settings.DATA_BUNDLE_PATH, settings.CLOCK_PATH)
    for contract in manifest.contracts:
        ContractParser.parse_file(contract.doc_id, contract.text_path, contract.title)
    PrecedenceEngine().analyze_all_contracts()
    if manifest.event_drop1_path and manifest.event_drop1_path.exists():
        EventIngester.ingest_file(manifest.event_drop1_path, drop_number=1)
    if manifest.event_drop2_path and manifest.event_drop2_path.exists():
        EventIngester.ingest_file(manifest.event_drop2_path, drop_number=2)
    return manifest

manifest = bootstrap_system()
if manifest is None:
    st.warning("No uploaded bundle is active. Upload a bundle in the local Contract War Room first.")
    st.stop()
# SIDEBAR CONTROLS & TEMPORAL CLOCK (FR9.2)
# ==============================================================================
with st.sidebar:
    st.markdown("### 🛡️ **War Room Operations**")
    st.caption("Autonomous Multi-Agent Contract Intelligence")
    
    st.markdown("---")
    st.markdown("#### **Temporal Clock (clock.json)**")
    
    checkpoint_options = list(manifest.checkpoints)
    selected_checkpoint = st.select_slider(
        "Uploaded checkpoint date",
        options=checkpoint_options,
        value=checkpoint_options[-1],
        help="Dates come from the active upload's clock.json."
    )

    st.markdown("#### **System Health**")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM clauses")
        clauses_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM events")
        events_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM event_quarantine")
        quarantine_count = cursor.fetchone()[0]

    st.write(f"📄 **Indexed Clauses**: `{clauses_count}`")
    st.write(f"⚡ **Operational Events**: `{events_count}`")
    st.write(f"🛑 **Quarantined Lines**: `{quarantine_count}`")
    st.write(f"🤖 **Active LLM**: `{settings.GROQ_MODEL}`")
    
    st.markdown("---")
    if st.button("🔄 Reset / Re-Index Bundle", use_container_width=True):
        st.cache_resource.clear()
        st.rerun()

# ==============================================================================
# TOP BANNER
# ==============================================================================
st.markdown(f"""
<div class="war-room-header">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h2 style="margin: 0; color: #FFFFFF; font-size: 26px;">ODIN: CONTRACT WAR ROOM</h2>
            <p style="margin: 4px 0 0 0; color: #A5B4FC; font-size: 14px;">Metrics and evidence from the active uploaded bundle</p>
        </div>
        <div style="text-align: right;"><span style="background: #047857; color: #A7F3D0; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 13px;">● CHECKPOINT: {selected_checkpoint}</span></div>
    </div>
</div>
""", unsafe_allow_html=True)

# Uploaded portfolio metrics, limited to the selected checkpoint
exposure = TimelineEngine.calculate_financial_exposure(selected_checkpoint)
kpi1, kpi2, kpi3, kpi4 = st.columns(4)
kpi1.metric("Uploaded contracts", len(manifest.contracts))
kpi2.metric("Indexed clauses", clauses_count)
kpi3.metric("Uploaded event records", events_count)
kpi4.metric("Ledger amount recorded", f"{exposure.recorded_transaction_total:,.2f}")
st.caption(f"Ledger rows: {exposure.recorded_transaction_count} · Flagged rows: {exposure.flagged_transaction_count} · Flagged amount: {exposure.flagged_transaction_total:,.2f}")

# MAIN NAVIGATION TABS (Strictly mapped to FR9.1 - FR9.5 & FR8)
# ==============================================================================
tab_overview, tab_network, tab_debate, tab_actions, tab_reports = st.tabs([
    "📊 Executive Overview & Exposure",
    "🕸️ Contract Network & Timeline",
    "⚔️ Cognitive Debate Arena",
    "⚖️ Action Center & Legal Notices",
    "📑 Portfolio Risk Reports"
])

# ==============================================================================
# TAB 1: EXECUTIVE OVERVIEW & EXPOSURE (FR9.2, FR9.3)
# ==============================================================================
with tab_overview:
    col_chart, col_heatmap = st.columns([1, 1])
    with get_db() as conn:
        ledger_rows = [dict(row) for row in conn.execute(
            "SELECT substr(payment_date,1,7) AS month, SUM(amount) AS total, COUNT(*) AS transactions "
            "FROM payments_ledger WHERE payment_date <= ? GROUP BY substr(payment_date,1,7) ORDER BY month",
            (selected_checkpoint,),
        ).fetchall()]
        contract_rows = [dict(row) for row in conn.execute(
            "SELECT c.doc_id, c.title, COUNT(cl.clause_id) AS clause_count "
            "FROM contracts c LEFT JOIN clauses cl ON cl.doc_id = c.doc_id GROUP BY c.doc_id, c.title ORDER BY c.doc_id"
        ).fetchall()]
    with col_chart:
        st.subheader("Uploaded ledger totals by month")
        if ledger_rows:
            st.line_chart(pd.DataFrame(ledger_rows).set_index("month")["total"])
        else:
            st.info("No ledger rows are dated on or before this checkpoint.")
    with col_heatmap:
        st.subheader("Uploaded contract index")
        st.dataframe(pd.DataFrame(contract_rows), hide_index=True, use_container_width=True)

# TAB 2: CONTRACT NETWORK & TIMELINE (FR9.1, FR3)
# ==============================================================================
with tab_network:
    col_graph, col_timeline = st.columns([1, 1])
    
    with col_graph:
        st.subheader("🕸️ Interactive Contract Precedence DAG")
        prec_engine = PrecedenceEngine()
        prec_engine.analyze_all_contracts()
        
        dot_lines = [
            'digraph G {',
            '  bgcolor="#111827";',
            '  rankdir=LR;',
            '  node [shape=box, style="filled,rounded", fontname="Helvetica", fontcolor="#FFFFFF", fontsize=11];',
            '  edge [color="#6366F1", arrowhead=vee, penwidth=1.5];'
        ]
        for node in prec_engine.graph.nodes():
            color = "#1E293B"
            if "A" in node: color = "#1E1B4B"
            elif "B" in node: color = "#064E3B"
            elif "C" in node: color = "#312E81"
            elif "D" in node: color = "#78350F"
            dot_lines.append(f'  "{node}" [label="Document {node}", fillcolor="{color}"];')

        for u, v in prec_engine.graph.edges():
            dot_lines.append(f'  "{u}" -> "{v}" [label="supersedes", fontcolor="#A5B4FC", fontsize=9];')
        dot_lines.append('}')
        
        st.graphviz_chart("\n".join(dot_lines), use_container_width=True)
        st.caption("Edges show precedence relationships indexed from the active uploaded contracts.")

    with col_timeline:
        st.subheader(f"Uploaded event deadlines ({selected_checkpoint})")
        _, milestones = Norns.evaluate_timeline(checkpoint=selected_checkpoint)
        ms_data = [{"Event": ms.title, "Contract": ms.contract_id, "Date in source": ms.target_date, "Status from source": ms.status, "Amount stated": ms.accumulated_penalty} for ms in milestones]
        if ms_data:
            st.dataframe(pd.DataFrame(ms_data), hide_index=True, use_container_width=True)
        else:
            st.info("No uploaded event records include a contract-linked deadline.")
# TAB 3: COGNITIVE DEBATE ARENA (FR9.4, FR7)
# ==============================================================================
with tab_debate:
    st.subheader("⚔️ Multi-Agent Adversarial Debate Arena")
    st.caption("Loki (Counterparty Adversary) vs. Heimdall (Operational Evidence) Arbitrated by Tyr (Chief Judicial Judge)")
    
    col_btn1, col_btn2 = st.columns([1, 4])
    with col_btn1:
        run_debate_btn = st.button("🚀 Run War Room Debate", use_container_width=True)

    if run_debate_btn or "debate_state" in st.session_state:
        if run_debate_btn:
            with st.spinner("Executing cognitive multi-agent debate across checkpoints with Groq LLM..."):
                pipeline = WarRoomPipeline(run_id=f"gui_{datetime.now().strftime('%H%M%S')}")
                state = pipeline.execute(checkpoint=selected_checkpoint)
                st.session_state["debate_state"] = state
        else:
            state = st.session_state["debate_state"]

        # Display debate rounds (both Loki and Heimdall)
        for turn in state.get("debate_turns", []):
            role_badge = f'<span class="badge-{turn.speaker.lower()}">{turn.speaker.upper()} • {turn.speaker_role.upper()}</span>'
            st.markdown(f"""
            <div class="chat-bubble">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    {role_badge}
                    <span style="color: #6B7280; font-size: 11px;">Round {turn.round_number}</span>
                </div>
                <div style="color: #E5E7EB; line-height: 1.5; font-size: 14px;">{turn.content}</div>
            </div>
            """, unsafe_allow_html=True)
            
            # Show citations if present
            if turn.citations:
                for c in turn.citations:
                    ver_icon = "🟢 VERIFIED VERBATIM" if c.verified else "🔴 UNVERIFIED"
                    with st.expander(f"📌 Citation: {c.doc_id} {c.section} ({ver_icon})"):
                        st.code(c.quote, language="text")

        # Display Tyr's final arbitration ruling
        ruling = state.get("ruling")
        if ruling:
            st.markdown("---")
            st.markdown(f"""
            <div style="background: #1C1917; border: 2px solid #D97706; border-radius: 10px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge-tyr">TYR • JUDICIAL ARBITRATION RULING</span>
                    <span style="background: #B45309; color: #FEF3C7; padding: 4px 12px; border-radius: 14px; font-weight: 700;">VERDICT: {ruling.verdict}</span>
                </div>
                <h4 style="margin: 12px 0 6px 0; color: #F59E0B;">{ruling.issue}</h4>
                <p style="color: #D1D5DB; font-size: 14px; line-height: 1.6;">{ruling.rationale}</p>
                <div style="margin-top: 10px; font-size: 12px; color: #9CA3AF;">
                    <strong>Controlling Precedence:</strong> {ruling.controlling_precedence}
                </div>
            </div>
            """, unsafe_allow_html=True)

# ==============================================================================
# TAB 4: ACTION CENTER & LEGAL NOTICES (FR9.5, FR6.2, FR6.3)
# ==============================================================================
with tab_actions:
    st.subheader("⚖️ Formal Legal Notices & Action Center")
    st.caption("Ready-to-send notices drafted by Tyr with courier addresses, statutory citations, and human-approval gates.")

    # Top Alerts Section
    st.markdown("#### 🚨 Prioritized Operational Alerts (Heimdall)")
    alerts = Heimdall.generate_alerts(checkpoint=selected_checkpoint)
    if not alerts:
        st.info("No alert conditions were found in the uploaded event records.")
    for alt in alerts:
        severity = str(alt.get("severity", "info")).lower()
        sev_color = {"critical": "#EF4444", "warning": "#F59E0B", "info": "#3B82F6"}.get(severity, "#6B7280")
        impact = alt.get("impact_cents")
        amount = "not stated" if impact is None else f"{impact / 100:,.2f} amount units"
        st.markdown(f"""
        <div style="background: #111827; border-left: 4px solid {sev_color}; padding: 12px 16px; margin-bottom: 10px; border-radius: 0 6px 6px 0;">
            <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 700; color: {sev_color}; font-size: 13px;">[{severity}] {alt.get('title') or 'Uploaded event'}</span>
                <span style="color: #9CA3AF; font-size: 12px;">Deadline: {alt.get('deadline') or 'not stated'}</span>
            </div>
            <div style="color: #D1D5DB; font-size: 13px; margin: 4px 0;">{alt.get('description') or ''}</div>
            <div style="color: #A5B4FC; font-size: 12px;">Contract: {alt.get('contract_id') or 'not mapped'} · Amount: {amount}</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("#### ✉️ Drafted Ready-to-Send Notices (Tyr)")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT action_id, checkpoint, action_type, target_party, title, subject_line, letter_body, status FROM actions")
        action_rows = [dict(r) for r in cursor.fetchall()]

    if not action_rows:
        st.info("No active notices in database. Run the War Room Pipeline to generate drafted actions.")
    else:
        for act in action_rows:
            with st.container():
                st.markdown(f"""
                <div style="background: #111827; border: 1px solid #1F2937; border-radius: 8px; padding: 16px; margin-bottom: 14px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 700; color: #F3F4F6; font-size: 16px;">{act['title']}</span>
                        <span style="background: {'#064E3B' if act['status'] == 'approved' else '#374151'}; color: {'#34D399' if act['status'] == 'approved' else '#E5E7EB'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">STATUS: {act['status'].upper()}</span>
                    </div>
                    <div style="color: #9CA3AF; font-size: 13px; margin: 4px 0 10px 0;">
                        Target: <strong>{act['target_party']}</strong> | Subject: <em>{act['subject_line']}</em>
                    </div>
                    <div style="background: #090D16; border: 1px solid #1F2937; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 12px; color: #D1D5DB; white-space: pre-wrap;">
{act['letter_body']}
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                col_act1, col_act2, col_act3, _ = st.columns([1, 1, 1.5, 3])
                with col_act1:
                    if st.button("✅ Approve Notice", key=f"app_{act['action_id']}"):
                        with get_db() as conn:
                            conn.execute("UPDATE actions SET status = 'approved', needs_human_approval = 0 WHERE action_id = ?", (act['action_id'],))
                            conn.commit()
                        st.success("Action marked APPROVED in database.")
                        st.rerun()
                with col_act2:
                    if st.button("❌ Reject", key=f"rej_{act['action_id']}"):
                        with get_db() as conn:
                            conn.execute("UPDATE actions SET status = 'rejected' WHERE action_id = ?", (act['action_id'],))
                            conn.commit()
                        st.warning("Action REJECTED.")
                        st.rerun()
                with col_act3:
                    if act['status'] in ('approved', 'dispatched'):
                        if st.button("🔏 Seal & Dispatch", key=f"disp_{act['action_id']}"):
                            rec = ActionDispatcher.dispatch_action(act['action_id'])
                            st.success(f"DISPATCHED! Seal: {rec['digital_sha256_seal'][:16]}...")
                            st.rerun()

# ==============================================================================
# TAB 5: PORTFOLIO RISK REPORTS (FR8)
# ==============================================================================
with tab_reports:
    st.subheader("📑 Analytical Reports & Synthesis Dossiers")
    st.caption("Generated Markdown dossiers with comprehensive verbatim citation grounding.")
    
    with get_db() as conn:
        report_contracts = [dict(row) for row in conn.execute("SELECT doc_id, title FROM contracts ORDER BY doc_id").fetchall()]
    report_options = ["Uploaded portfolio summary"] + [f"{row['doc_id']} — {row['title']}" for row in report_contracts]
    report_type = st.selectbox("Select uploaded report", options=report_options)
    if report_type == "Uploaded portfolio summary":
        md_content = CompanyReportGenerator.generate(selected_checkpoint)
    else:
        doc_id = report_type.split(" — ", 1)[0]
        md_content = ContractReportGenerator.generate(doc_id)

    st.download_button(
        label="📥 Download Report Markdown",
        data=md_content,
        file_name=f"{report_type.replace(' ', '_').lower()}.md",
        mime="text/markdown"
    )
    
    st.markdown(md_content)
