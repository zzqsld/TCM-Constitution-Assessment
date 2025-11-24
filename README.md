# TCM Constitution Assessment

> 中文名：中医体质测评前端（纯静态）

A lightweight, dependency‑free, static web application for Traditional Chinese Medicine (TCM) constitution self‑assessment based on the questionnaire standard of the China Association of Chinese Medicine. This project provides long‑term stable logic for question rendering, gender‑aware filtering, scoring transformation, constitution classification, and professional report generation (non-diagnostic, educational use only).

本项目是一个无需后端的纯前端单页应用，依据《中医体质分类与判定自测表》逻辑实现体质自测。强调：仅供学习与初步自我参考，不构成任何医疗建议或诊断。

## Features / 特性
- Zero build: pure HTML/CSS/Vanilla JS
- Deterministic report ID generator (daily reset, multi-stage alphanumeric token)
- Centralized gender-based question filtering (湿热体质带下/阴囊项) 保证数组长度一致性
- Robust scoring + classification (平和需自身≥60且其他均 <40，避免误判)
- Intelligent report section with combination constitution suggestions
- Debug panel (隐藏触发) 提供快速填充与预设模拟
- Clean separation: `questions.js`, `knowledge.js`, `constants.js`, `app.js`
- No tracking, no persistence (内存态，刷新即清空)

## Live Usage / 使用方式
1. Clone repository:
```
git clone https://github.com/your-user/tcm-constitution-assessment.git
cd tcm-constitution-assessment
```
2. Open `index.html` directly in modern browser (Chrome/Edge/Firefox). 或者使用本地静态服务器：
```
# Node 环境（可选）
npx serve .
# 或
python -m http.server 8000
```
3. （可选）填写个人信息后开始答题；也可跳过直接测评。
4. 完成全部题组后自动生成报告，可复制内容保存。

## Project Structure / 目录结构
```
├─ index.html          # 主页面
├─ style.css           # 样式（含报告主题样式）
├─ constants.js        # 全局常量与工具 (随机、阈值等)
├─ questions.js        # 题目定义（含平和逆向标记与性别过滤文本）
├─ knowledge.js        # 体质症状与建议 + 组合规则
├─ app.js              # 主逻辑：渲染、状态、评分、分类、报告
├─ README.md           # 项目说明
├─ LICENSE             # 许可证 (MIT)
├─ CONTRIBUTING.md     # 贡献指南
├─ CODE_OF_CONDUCT.md  # 行为准则
├─ SECURITY.md         # 安全与问题报告策略
├─ CHANGELOG.md        # 版本记录
└─ docs/
   ├─ ARCHITECTURE.md  # 架构说明
   └─ REPORT_ID.md     # 报告编号算法说明
```

## Scoring & Classification / 评分与判定
- 原始问卷 Likert 1–5 → 转化分按标准公式（参见 `app.js`）。
- 平和体质：平和自身转化分 ≥60 且其他体质均 <40。
- 主体质：≥40 分。
- 倾向体质：30–39 分。
- 逆向题（平和）使用 `reverse: true` 在计算中自动反向处理。

## Report ID / 报告编号
Daily reset sequence (`TCMYYYYMMDD` + 5-char stage token). Multi-stage ranges:
- 00001–99999 → A0001–Z9999 → AA001–ZZ999 → AAA01–ZZZ99 → AAAA1–ZZZZ9 → AAAAA–ZZZZZ
详解见 `docs/REPORT_ID.md`。

## Long-term Stability / 长期稳定性策略
- 单一过滤函数 `getFilteredQuestions()` 消除重复逻辑
- 分类函数要求所有非平和得分已计算以避免“缺题误平和”
- 无外部依赖，减少供应链风险
- 清晰模块边界，便于未来重构或迁移

## Debug Panel / 调试面板
通过秘钥序列（见 `constants.js`）触发。提供：快速填充、预设主体质、随机多主、报告 ID 调节等。生产使用时可移除 `debugPanel` 节点或相关 JS 逻辑以隐藏。

## Contributing / 贡献
见 `CONTRIBUTING.md`。欢迎：
- 新增 i18n 支持
- 增加可访问性增强（ARIA / 键盘导航）
- 引入可选持久化层（LocalStorage 加密）

## Security / 安全说明
纯前端静态资源，不处理个人敏感数据；不建议填写真实身份证明信息。问题或潜在安全风险请见 `SECURITY.md` 提交。

## Disclaimer / 免责声明
This project does NOT provide medical diagnosis, treatment, or professional health advice. Always consult qualified healthcare professionals for medical concerns.
本项目不提供医疗诊断或治疗建议，报告仅供学习参考。

## License / 许可证
Apache License 2.0. 详见 `LICENSE`。

## Roadmap / 未来规划建议
- [ ] 可选离线缓存 (Service Worker)
- [ ] 自动化测试（Jest + DOM Testing）
- [ ] 导出 PDF 功能（打印样式优化）
- [ ] 数据统计面板（匿名、仅本地）

## Quick Start Script (Optional)
若需要 `package.json` 脚本：参见根目录 `package.json`。
```
npm install
npm run dev
```

---
Feel free to open issues / PRs. 欢迎提 Issue 或 PR。
