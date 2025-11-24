# Contributing Guide

Thank you for considering contributing! 以下为贡献说明：

## 1. Issues
- 使用简体中文或英文均可。
- 报告 Bug：请附浏览器版本与复现步骤。
- 功能建议：请描述场景与预期收益。

## 2. 分支策略
- `main`：稳定发布。
- 功能开发：`feat/xxx-description`
- 修复补丁：`fix/bug-short-desc`

## 3. 提交规范
- 提交信息格式建议：`type(scope): message`
  - type 示例：feat / fix / docs / refactor / perf / chore
  - scope 示例：score, classify, ui
  - 示例：`fix(classify): avoid false pinghe when incomplete`

## 4. Pull Request
- 保持最小变更面，避免无关格式化。
- 说明动机、核心实现与回归测试方法。
- 若涉及结构调整请在 PR 中附架构简要图或要点。

## 5. 代码风格
- 原生 JS，不引入框架除非充分论证必要性。
- 保持函数纯度（无副作用）优先，DOM 操作集中在渲染层。
- 避免魔法数字，集中到 `constants.js`。

## 6. 测试（计划）
未来可添加：Jest + @testing-library/dom 进行逻辑单测与渲染测试。

## 7. 安全 & 隐私
- 不收集任何后端数据。
- 禁止引入第三方收集脚本。

## 8. 国际化（建议）
新特性请考虑未来 i18n：文本集中、避免硬编码到逻辑。

欢迎你的贡献！