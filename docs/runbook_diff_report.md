# Runbook Diff Report

## Metadata
- Generated at: 2026-02-17 10:50:56 +03:00
- Source runbook: docs/NeredeServis_Cursor_Amber_Runbook.md
- Locked copy: docs/RUNBOOK_LOCKED.md
- Source SHA256: 2EC22E26BCBC09318FAC28D7BBBF813D2C79CDAF5AFD30B7B0E46DD03D6C57B6
- Locked SHA256: 2EC22E26BCBC09318FAC28D7BBBF813D2C79CDAF5AFD30B7B0E46DD03D6C57B6
- Lock status: MATCH

## Scope
- Compare: docs/NeredeServis_Cursor_Amber_Runbook.md vs docs/NeredeServis_Teknik_Plan.md
- Goal: line-based differences and conflict check.

## Line-Based Differences (Expected, Non-Conflict)
1. Workflow orchestration exists only in runbook.
- Runbook has phase execution model and user-gated flow: docs/NeredeServis_Cursor_Amber_Runbook.md:173, docs/NeredeServis_Cursor_Amber_Runbook.md:212, docs/NeredeServis_Cursor_Amber_Runbook.md:286, docs/NeredeServis_Cursor_Amber_Runbook.md:341, docs/NeredeServis_Cursor_Amber_Runbook.md:399, docs/NeredeServis_Cursor_Amber_Runbook.md:457, docs/NeredeServis_Cursor_Amber_Runbook.md:578, docs/NeredeServis_Cursor_Amber_Runbook.md:753.
- Technical plan is contract/spec-first, not step executor: docs/NeredeServis_Teknik_Plan.md:9, docs/NeredeServis_Teknik_Plan.md:61, docs/NeredeServis_Teknik_Plan.md:589, docs/NeredeServis_Teknik_Plan.md:1214.

2. Approval/verification checkpoints are runbook-specific.
- Approval prompts: docs/NeredeServis_Cursor_Amber_Runbook.md:201, docs/NeredeServis_Cursor_Amber_Runbook.md:217, docs/NeredeServis_Cursor_Amber_Runbook.md:543, docs/NeredeServis_Cursor_Amber_Runbook.md:716, docs/NeredeServis_Cursor_Amber_Runbook.md:817.
- Verification checkpoints: docs/NeredeServis_Cursor_Amber_Runbook.md:243, docs/NeredeServis_Cursor_Amber_Runbook.md:268, docs/NeredeServis_Cursor_Amber_Runbook.md:542, docs/NeredeServis_Cursor_Amber_Runbook.md:799.

3. Detailed rule/code contracts are technical-plan-specific.
- Firestore rules section: docs/NeredeServis_Teknik_Plan.md:441.
- RTDB rules section: docs/NeredeServis_Teknik_Plan.md:546.
- Function contracts: docs/NeredeServis_Teknik_Plan.md:640.

4. Release governance differs by responsibility.
- Runbook has rollout choreography: docs/NeredeServis_Cursor_Amber_Runbook.md:799, docs/NeredeServis_Cursor_Amber_Runbook.md:814, docs/NeredeServis_Cursor_Amber_Runbook.md:827.
- Technical plan has release gates and policy criteria: docs/NeredeServis_Teknik_Plan.md:1051, docs/NeredeServis_Teknik_Plan.md:1092, docs/NeredeServis_Teknik_Plan.md:1214.

## Line-Based Alignment Checks (Critical)
1. Timezone policy aligned.
- Runbook: docs/NeredeServis_Cursor_Amber_Runbook.md:423, docs/NeredeServis_Cursor_Amber_Runbook.md:508, docs/NeredeServis_Cursor_Amber_Runbook.md:922.
- Technical plan: docs/NeredeServis_Teknik_Plan.md:95, docs/NeredeServis_Teknik_Plan.md:667, docs/NeredeServis_Teknik_Plan.md:1253.

2. Multi-device and finish ownership aligned.
- Runbook: docs/NeredeServis_Cursor_Amber_Runbook.md:486, docs/NeredeServis_Cursor_Amber_Runbook.md:487, docs/NeredeServis_Cursor_Amber_Runbook.md:921.
- Technical plan: docs/NeredeServis_Teknik_Plan.md:653, docs/NeredeServis_Teknik_Plan.md:654, docs/NeredeServis_Teknik_Plan.md:1163.

3. RTDB live timestamp window aligned.
- Runbook: docs/NeredeServis_Cursor_Amber_Runbook.md:246, docs/NeredeServis_Cursor_Amber_Runbook.md:504.
- Technical plan: docs/NeredeServis_Teknik_Plan.md:564.

4. Driver directory direct read locked down.
- Runbook: docs/NeredeServis_Cursor_Amber_Runbook.md:258, docs/NeredeServis_Cursor_Amber_Runbook.md:259, docs/NeredeServis_Cursor_Amber_Runbook.md:266.
- Technical plan: docs/NeredeServis_Teknik_Plan.md:465, docs/NeredeServis_Teknik_Plan.md:542.

5. Monetization V1.0/V1.1 alignment and paywall source governance aligned.
- Runbook: docs/NeredeServis_Cursor_Amber_Runbook.md:708, docs/NeredeServis_Cursor_Amber_Runbook.md:713, docs/NeredeServis_Cursor_Amber_Runbook.md:802, docs/NeredeServis_Cursor_Amber_Runbook.md:923.
- Technical plan: docs/NeredeServis_Teknik_Plan.md:874, docs/NeredeServis_Teknik_Plan.md:875, docs/NeredeServis_Teknik_Plan.md:876, docs/NeredeServis_Teknik_Plan.md:1093.

## Active Conflict Status
- No active critical conflict found between runbook and technical plan as of this snapshot.
- Noted differences are role-based/document-purpose differences.

## Next Control Gate
- Proceed only after user approval for the next step.
