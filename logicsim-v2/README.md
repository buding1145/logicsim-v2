# LogicSim ∀∃ — 逻辑表达式仿真（2026 改造版）

> 基于 2021 年旧站 [kuangdash/logicsim](https://kuangdash.gitlab.io/logicsim) 改造。
> 原站将「逆波兰逻辑表达式」解析为二叉决策图（Shannon 分解）并用 JointJS 绘制成电路式图形。

## 网站业务功能

1. 输入**逆波兰逻辑表达式**（如 `a b . fe >` 表示 "a 与 b 推出 fe"）
2. 点击「解析文本」→ 表达式被解析为 JSON 图模型
3. 点击「文本转图」→ 渲染为正规逻辑电路图（含小地图、缩放、拖拽）
4. 支持 JSON 模型的导入 / 导出、元素名称备注编辑

## 本次改造内容

| # | 改造项 | 说明 |
|---|--------|------|
| 1 | **新增量词 ∀ / ∃** | 作业要求的「给逻辑表达式添加量词」。`F x ∀` 表示全称量化 ∀x.F（语义 `F[x:=0] ∧ F[x:=1]`），`F x ∃` 表示存在量化 ∃x.F（语义 `F[x:=0] ∨ F[x:=1]`），在 `LogicParser.js` 中通过香农代入（`restrictT`）实现，支持嵌套量词 |
| 2 | **UI 全面现代化** | 重写 `style.css`：靛蓝渐变顶栏、卡片式右侧面板、圆角按钮、运算符速查表；重写 `index.html` 帮助区为结构化表格 |
| 3 | **新增真值表功能** | 点击「生成真值表」枚举所有变量赋值并求值，结果渲染在底栏（`ViewGen.js` 新增 `app.showTruth`） |
| 4 | **示例一键运行** | 右侧面板提供 6 个示例（含量词示例：排中律、矛盾律等），点击即解析并成图 |
| 5 | **修复布局 bug** | 原版 `.app-body` 高度 `calc(100% - 60px)` 与 150px 顶栏不匹配，已修正为 `calc(100% - 150px)` |

## 运算符速查（逆波兰式）

| 符号 | 示例 | 含义 |
|------|------|------|
| `.` | `a b .` | 逻辑与 a∧b |
| `,` | `a b ,` | 逻辑或 a∨b |
| `<` | `a <` | 逻辑非 ¬a |
| `>` | `a b >` | 逻辑推出 a→b |
| `=` | `a b =` | 逻辑等价 a↔b |
| `∀` | `a b , a ∀` | 全称量词 ∀a(a∨b)（新增） |
| `∃` | `a b . b ∃` | 存在量词 ∃b(a∧b)（新增） |

## 本地运行

纯静态站点，无构建步骤：

```bash
# 方式一：直接用浏览器打开
public/index.html

# 方式二：本地静态服务器（推荐）
npx serve public
# 或
python -m http.server 8000 --directory public
```

## 测试

量词功能附带单元测试（18 个用例，含回归与语义等价验证）：

```bash
node test-parser.js
```

## 部署（GitLab Pages）

仓库已包含 `.gitlab-ci.yml`，推送到 GitLab 后自动部署：

```bash
git remote add origin https://gitlab.com/<你的用户名>/logicsim-v2.git
git push -u origin main
# 部署完成后访问 https://<你的用户名>.gitlab.io/logicsim-v2/
```

## 技术栈

jQuery · Backbone.js · JointJS · dagre · select2 · w3.css（沿用原版本地依赖，无新增外部 CDN）
