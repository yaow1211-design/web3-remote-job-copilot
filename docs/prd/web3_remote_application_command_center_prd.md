# Web3 Remote Job Copilot 个人求职冲刺版 PRD

## 1. 执行摘要

本版 PRD 将 Web3 Remote Job Copilot 从“生产化求职平台”重构为 **Mia Web3 Remote Application Command Center**：一个 V1 单用户 Web App，用于支持 Mia 的 30 天主冲刺与 60 天转化窗口，目标是尽快找到一份适合的 remote 工作，并最终完成向 Web3 的职业转型。

原 PRD 中关于合规数据源、ATS、职位解析、风险识别与人审投递的判断继续保留，但产品叙事不再以“抓取更多岗位”和“自动化投递”为中心。新版核心是：围绕 Mia 的真实履历、LinkedIn、GitHub Pages portfolio、简历版本与 outreach 模板，建立一个从职位发现到材料生成、定向触达、投递跟进、每周复盘的求职作战系统。

V1 是一个单用户 Web App。第一用户是 Mia。它不做多用户账号、订阅支付、团队后台、浏览器插件、LinkedIn 自动化、Indeed 自动化或自动提交申请。V1 的成功标准不是“入库多少职位”，而是是否帮助 Mia 更快拿到有效回复、面试机会和 remote offer。

## 2. 用户目标与岗位策略

用户目标是先尽快找到一份适合 Mia 的 remote 工作，建立国际化远程工作经验，并最终实现向 Web3 的职业转型。

岗位优先级如下：

1. 第一优先级：Web3 / crypto / blockchain 公司的 remote 岗位。
2. 第二优先级：Web3-adjacent remote 岗位，包括 fintech、AI data、global SaaS、growth analytics、product operations。
3. 第三优先级：非 Web3 但能远程、能积累英文 remote 工作经验的数据、增长、业务分析岗位。

这意味着 V1 不把“第一份 remote 工作必须是纯 Web3 公司”设成硬门槛。系统应优先推荐 Web3，但当 Web3 岗位门槛过高时，允许提高 Web3-adjacent remote 岗位权重，以增加上岸概率。

适合 Mia 的 V1 角色方向：

- Growth Data Analyst
- Business Analyst
- Product / Operations Analyst
- Research & Due Diligence Analyst

不适合 Mia 的 V1 角色方向：

- Solidity Engineer
- Smart Contract Engineer
- Senior Tokenomics Expert
- Head of Growth
- Director / Principal level roles
- 明确要求多年全职 crypto company experience 的岗位

## 3. V1 产品定位

产品名称：**Mia Web3 Remote Application Command Center**。

V1 是一个单用户求职 cockpit，不是通用 SaaS。核心工作流是：

```text
Job Intake -> Fit & Risk Score -> Application Pack -> Outreach -> Pipeline Tracking -> Weekly Review
```

V1 的产品原则：

- 少自动化投递，多提高命中率。
- 少泛岗位，多聚焦可转化岗位。
- 少堆功能，多推动每日动作。
- 少虚假 Web3 包装，多把 Mia 的真实优势翻译成 Web3 remote 公司能理解的语言。
- 所有外部动作都必须人审确认，尤其是申请、DM、follow-up。

V1 不做：

- 不自动登录 LinkedIn / Indeed。
- 不自动抓取登录态页面。
- 不自动发送连接请求、DM 或申请。
- 不自动提交申请。
- 不绕过平台规则。
- 不伪造 Web3 工作经历。
- 不把 Mia 包装成 Solidity / smart contract 工程师。
- 不做多用户权限、支付、团队后台、模板市场。

V1 做：

- 管理 Mia 的求职资产。
- 导入和结构化职位。
- 解释岗位匹配度与风险。
- 生成定制申请包。
- 生成 LinkedIn / X / Email outreach 文案。
- 跟踪投递、触达和 follow-up。
- 每周复盘回复率、面试率、拒因和定位调整。

## 4. 30/60 天成功指标

V1 采用“激进但现实”的冲刺目标。

30 天主冲刺目标：

- 每周 review 80-120 个岗位。
- 每周 shortlist 25-40 个岗位。
- Top recommended jobs 中人工判定可投比例 ≥ 70%。
- 每周完成 20-30 个高质量投递。
- 每个投递都有对应 Application Pack。
- 至少 80% 投递使用定制 summary、note 或 DM。
- 每周发送 30-50 条定向 outreach。
- 每条 outreach 绑定具体岗位、公司或 portfolio angle。
- follow-up 准时率 ≥ 80%。
- 30 天内获得 3-5 个有效回复。
- 30 天内获得 1-2 个面试机会。

60 天转化窗口目标：

- 累计获得 5-8 个面试机会。
- 60 天目标：拿到 1 个 remote offer。
- offer 优先级：Web3 remote > fintech remote > AI data remote > global SaaS remote。

如果 2 周后没有任何有效回复，系统必须触发策略复盘：

- 调整目标角色比例。
- 降低纯 Web3 岗位占比，提高 Web3-adjacent remote 岗位占比。
- 重写 LinkedIn headline / About / Featured。
- 强化 GitHub Pages portfolio 首屏与项目说明。
- 调整 DM 模板。
- 降低高门槛岗位投递权重。
- 增加 warm intro、community outreach、founder / hiring manager 直接触达比例。

## 5. 核心页面与工作流

V1 包含六个核心页面。

### 5.1 Today Command Center

首页不做营销页，也不做复杂 dashboard。打开后直接显示今天的作战队列：

- Review 20 jobs
- Shortlist 8 jobs
- Apply 4 jobs
- Send 8 outreach messages
- Follow up 5 previous contacts

首页按优先级显示：

- Strong Apply Today
- Need Portfolio Angle
- Need Referral / DM First
- Follow-up Due
- Risky / Low ROI

首页的目标是减少犹豫，让 Mia 每天知道下一步做什么。

### 5.2 Job Inbox

Job Inbox 是职位池。V1 支持三类导入方式：

- API / public source import
- manual URL import
- copy-paste JD import

V1 不追求一开始采集 500+ 岗位，先保证每条职位能够结构化、评分、进入申请闭环。

核心筛选器：

- Web3 remote
- Web3-adjacent remote
- Growth Data / Product Analyst / Business Analyst / Ops Analyst
- APAC / worldwide / Taiwan-compatible / China-compatible
- No hard crypto-company-experience requirement

### 5.3 Job Detail & Fit Review

每条职位有一个判断页，回答五个问题：

- Why this fits Mia
- Why this is risky
- Which resume angle to use
- Which portfolio proof to mention
- Apply now / DM first / skip

推荐动作只允许：

- Strong Apply
- Apply with Custom Pack
- DM First
- Portfolio Needed
- Skip

### 5.4 Application Pack Builder

Application Pack Builder 是 V1 的关键转化页面。每个 shortlisted job 都应生成：

- selected resume version
- role angle
- tailored summary
- cover note / short application note
- recruiter DM
- hiring manager DM
- portfolio highlight
- interview talking points
- risk handling note

生成内容必须与 Mia 的 LinkedIn headline、About、Experience、Featured、GitHub Pages portfolio 保持一致。

### 5.5 Outreach Tracker

Outreach Tracker 管理联系人和触达，不自动群发、不自动抓取、不自动发送。

状态包括：

- Not contacted
- DM drafted
- DM sent
- Follow-up due
- Replied
- Call booked
- Rejected
- No response

渠道包括：

- LinkedIn
- X
- Telegram
- Email
- Warm intro
- Community

### 5.6 Weekly Review

Weekly Review 每周回答：

- 哪个角色方向回复率最高？
- 哪些关键词或定位带来面试？
- 哪些岗位总是被拒？
- 是否需要调整 LinkedIn headline / About / Featured / portfolio？
- 下一周应该提高哪个方向的投递比例？

## 6. Candidate Asset Layer

Candidate Asset Layer 是本版 PRD 的新增核心层。它保存 Mia 对外求职资产，所有评分和文案生成都必须引用这一层。

字段：

- target_positioning
- linkedin_headline
- linkedin_about
- linkedin_experience_highlights
- portfolio_url
- portfolio_projects
- resume_versions
- featured_items
- skill_keywords
- proof_points
- risk_disclaimers

初始 proof points：

- traditional finance background
- customer lifecycle analytics
- campaign conversion up to 42%
- data product / PRD / UAT / dashboard experience
- AI chatbot feasibility and compliance experience
- green finance and asset management exposure
- SQL / Python / data analysis internships
- GitHub Pages portfolio
- independent Web3 / DeFi project angle

初始 risk_disclaimers：

- no full-time Web3 company experience yet
- not applying as Solidity engineer
- not positioning as senior tokenomics expert

Candidate Asset Layer 的作用是避免材料不一致。例如 LinkedIn 上是 Growth Data Analyst，简历却写成 Researcher，DM 又写成 Product Manager。V1 必须确保岗位、简历、LinkedIn、portfolio、DM 使用同一套定位语言。

## 7. 职位数据与导入方式

V1 的 Job 对象字段：

- title
- company
- source
- original_url
- apply_url
- jd_text
- remote_type
- location_constraints
- role_family
- seniority
- required_skills
- preferred_skills
- crypto_requirement_level
- salary_range
- posted_at
- status

Job status：

- new
- reviewed
- shortlisted
- application_pack_ready
- applied
- dm_sent
- follow_up_due
- interview
- rejected
- archived

数据源策略：

- P0 支持手动 URL、手动复制 JD、手动输入联系人。
- P1 接入 Greenhouse、Lever、Remotive。
- P1 可补充 Adzuna、Arbeitnow、Google JobPosting 页面。
- USAJOBS 对 Web3 remote 直接价值较低，保留为低优先级。

原 PRD 中对 Greenhouse、Lever、Remotive、Adzuna、USAJOBS、Arbeitnow 的合规分析继续保留，但在新版 PRD 中它们是支撑 Job Inbox 的数据源，不再是产品叙事中心。

## 8. Fit & Risk Score

Fit & Risk Score 必须可解释，不做黑盒总分。

评分字段：

- overall_score
- role_fit
- transferable_finance_fit
- growth_data_fit
- product_ops_fit
- web3_barrier
- remote_compatibility
- language_fit
- portfolio_proof_strength
- outreach_opportunity
- recommendation

初始权重：

- role_fit: 20%
- transferable_finance_fit: 20%
- growth_data_fit: 20%
- product_ops_fit: 10%
- remote_compatibility: 10%
- portfolio_proof_strength: 10%
- outreach_opportunity: 10%
- web3_barrier: negative penalty, up to -30%

硬拒绝条件：

- requires 3+ years full-time crypto company experience
- requires Solidity / smart contract engineering as core skill
- requires US/EU-only work authorization when not compatible
- requires native-level language outside English/Chinese
- seniority clearly above current positioning, such as Head of Growth, Director, Principal

风险级别：

| 风险级别 | 关键词示例 | 动作 |
|---|---|---|
| 高 | crypto company experience required, previous exchange experience required, Solidity required, 5+ years in blockchain | 默认不推荐，除非有内推或强作品集证据 |
| 中 | crypto experience preferred, familiar with on-chain data, DeFi knowledge is a plus, trading experience preferred | 可冲，需要强定制文案 |
| 低 | interest in crypto, fintech experience preferred, data analytics, growth marketing, Mandarin/English | 优先推荐 |

## 9. Application Pack Builder

每个 shortlisted job 生成一个 Application Pack。

字段：

- selected_resume_version
- role_angle
- tailored_summary
- cover_note
- recruiter_dm
- hiring_manager_dm
- portfolio_highlight
- interview_talking_points
- risk_handling_note

role_angle 固定为四类：

- Growth Data Analyst
- Business Analyst
- Product / Operations Analyst
- Research & Due Diligence Analyst

risk_handling_note 示例：

```text
I have not worked full-time inside a Web3 company yet, but I bring finance-grade analytical discipline, customer lifecycle growth experience, and hands-on Web3 project work.
```

Application Pack 的目标不是生成完美长文，而是让 Mia 能快速完成高质量投递和触达。

## 10. Outreach Tracker

OutreachContact 字段：

- name
- company
- role
- channel
- profile_url
- relationship_type
- message_status
- follow_up_date
- reply_status

relationship_type：

- recruiter
- hiring manager
- team member
- founder
- warm intro
- community contact

ApplicationActivity 字段：

- job_id
- action_type
- channel
- date
- content_version
- result
- next_action_date
- notes

action_type：

- reviewed_job
- generated_pack
- submitted_application
- sent_dm
- sent_follow_up
- received_reply
- booked_interview
- rejected

## 11. Weekly Review

WeeklyReview 字段：

- week
- reviewed_count
- shortlisted_count
- applied_count
- outreach_count
- reply_count
- interview_count
- rejection_reasons
- best_role_family
- worst_role_family
- next_week_adjustments

Weekly Review 的输出必须能指导下一周动作：

- 调整角色方向配比。
- 调整 scoring weights。
- 更新 Candidate Asset Layer。
- 更新 LinkedIn / portfolio / resume / DM 模板。
- 调整 Web3 与 Web3-adjacent 岗位比例。

## 12. AI 与自动化边界

AI 在 V1 中做五件事：

1. JD 解析。
2. Fit & Risk 解释。
3. Application Pack 生成。
4. DM / follow-up 文案生成。
5. Weekly Review 复盘建议。

AI 不做：

- 不自动点击投递。
- 不自动提交申请。
- 不自动发 LinkedIn DM。
- 不伪造 Web3 工作经历。
- 不把 Mia 包装成 Solidity / smart contract 工程师。
- 不隐藏“尚无全职 Web3 公司经验”这个事实。

## 13. 合规边界

LinkedIn / Indeed：

- 允许用户手动粘贴职位 URL、联系人 URL、JD 文本。
- 允许系统生成 DM 文案。
- 不允许系统自动抓取登录态页面。
- 不允许系统自动发送连接请求、DM 或申请。
- 不允许系统自动提交申请。

ATS / public sources：

- 优先使用 Greenhouse、Lever、Remotive 等公开 API 或公开职位页。
- 申请提交默认走人审确认。
- V1 可以先不做自动提交，只生成 Application Pack 和原始申请链接。

个人信息：

- 不保存第三方账号密码。
- 不存储 LinkedIn / Indeed 登录态。
- 求职材料、联系方式、简历版本应最小化存储。
- 用户应能删除本地职位、联系人、申请记录和生成文案。

## 14. V1 / P1 / P2 优先级

P0：30 天冲刺必须有：

- Candidate Asset Layer
- Job Inbox
- Fit & Risk Score
- Application Pack Builder
- Outreach Tracker
- Pipeline Status
- Weekly Review

P0 必须支持：

- 手动导入职位 URL / JD。
- 结构化解析 JD。
- 给出 Mia 专属匹配分与风险。
- 生成四类角色方向的 Application Pack。
- 生成 LinkedIn / X / Email DM。
- 记录投递与触达状态。
- 提醒 follow-up。
- 每周输出定位调整建议。

P1：提高效率但不阻塞 V1：

- Greenhouse / Lever / Remotive API 接入。
- 自动去重。
- 职位到期检测。
- 简历 PDF 版本管理。
- 面试题与回答生成。
- 拒信原因归类。

P2：V2 产品化才需要：

- 多用户账号。
- 订阅支付。
- 团队后台。
- 浏览器插件。
- 自动投递。
- LinkedIn 自动化。
- Indeed 自动化。
- 模板市场。

## 15. 从原 PRD 继承与重构的内容

保留：

- 数据源合规判断。
- Greenhouse / Lever / Remotive 等公开源。
- JD 解析字段。
- 风险关键词。
- 人审投递原则。
- 监控和复盘指标。

重写：

- 执行摘要。
- 产品定位。
- MVP 优先级。
- 评分模型。
- 半自动投递部分。
- 路线图。

新增：

- Candidate Asset Layer。
- Today Command Center。
- Application Pack Builder。
- Outreach Tracker。
- Mia 专属 30/60 天 KPI。
- LinkedIn / Portfolio 一致性检查。

本版 PRD 的核心判断是：先用完整 Web App 形态服务 Mia 自己的求职冲刺，跑通“岗位 -> 材料 -> 触达 -> 跟进 -> 复盘 -> offer”的闭环，再考虑是否抽象为面向更多转行用户的 SaaS。
