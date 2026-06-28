from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs/prd/web3_remote_application_command_center_prd.md"

REQUIRED_PHRASES = [
    "Mia Web3 Remote Application Command Center",
    "个人求职冲刺版",
    "30 天主冲刺",
    "60 天转化窗口",
    "Candidate Asset Layer",
    "Today Command Center",
    "Job Inbox",
    "Fit & Risk Score",
    "Application Pack Builder",
    "Outreach Tracker",
    "Weekly Review",
    "Growth Data Analyst",
    "Business Analyst",
    "Product / Operations Analyst",
    "Research & Due Diligence Analyst",
    "不自动登录 LinkedIn / Indeed",
    "不自动发送连接请求、DM 或申请",
    "不自动提交申请",
    "Greenhouse",
    "Lever",
    "Remotive",
    "每周 review 80-120 个岗位",
    "每周完成 20-30 个高质量投递",
    "每周发送 30-50 条定向 outreach",
    "30 天内获得 3-5 个有效回复",
    "60 天目标：拿到 1 个 remote offer",
]

REQUIRED_HEADINGS = [
    "# Web3 Remote Job Copilot 个人求职冲刺版 PRD",
    "## 1. 执行摘要",
    "## 2. 用户目标与岗位策略",
    "## 3. V1 产品定位",
    "## 4. 30/60 天成功指标",
    "## 5. 核心页面与工作流",
    "## 6. Candidate Asset Layer",
    "## 7. 职位数据与导入方式",
    "## 8. Fit & Risk Score",
    "## 9. Application Pack Builder",
    "## 10. Outreach Tracker",
    "## 11. Weekly Review",
    "## 12. AI 与自动化边界",
    "## 13. 合规边界",
    "## 14. V1 / P1 / P2 优先级",
    "## 15. 从原 PRD 继承与重构的内容",
]

FORBIDDEN_PRIMARY_POSITIONING = [
    "本产品的核心是自动海投",
    "V1 支持多用户账号",
    "V1 支持订阅支付",
    "V1 支持团队后台",
    "V1 支持 LinkedIn 自动化",
    "V1 支持 Indeed 自动化",
]


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def main() -> None:
    if not SOURCE.exists():
        fail(f"missing source file: {SOURCE}")

    text = SOURCE.read_text(encoding="utf-8")

    for heading in REQUIRED_HEADINGS:
        if heading not in text:
            fail(f"missing heading: {heading}")

    for phrase in REQUIRED_PHRASES:
        if phrase not in text:
            fail(f"missing required phrase: {phrase}")

    for phrase in FORBIDDEN_PRIMARY_POSITIONING:
        if phrase in text:
            fail(f"forbidden primary positioning: {phrase}")

    if text.count("## ") < 15:
        fail("expected at least 15 level-2 PRD sections")

    if "V1 是一个单用户 Web App" not in text:
        fail("missing explicit single-user V1 statement")

    if "第一用户是 Mia" not in text:
        fail("missing Mia-first statement")

    print("PASS: PRD source validates")


if __name__ == "__main__":
    main()
