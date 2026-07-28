# BestShopio Merchant

BestShopio 商家经营后台的可点击原型。它是完整 BestShopio 店铺的日常操作系统，不是 SaaS 内部运营中台，也不是 BestCheckout 独立后台。

## 产品范围

- Home 与开店引导
- Orders、Products、Collections、Customers、Discounts
- Analytics
- Content：Blog、Page、Menu
- Channels：Online Store、Google、Facebook
- Apps：Subscriptions、Bundles 等
- Settings：Payments、Currency、Checkout、Notifications、Domains、Shipping、Staff & Permissions

BestCheckout 可以作为 BestShopio 体系中的 Checkout 增长能力接入，但 BestCheckout 商家不会因为底层复用 BestShopio 就直接看到本后台的全部模块。

## 结构

- `index.html`：商家后台入口与模块地图。
- `assets/`：共享 shell、设计系统和导航 manifest。
- `analytics/`、`orders/`、`products/` 等：按业务模块拆分的原型。

## GitHub

- 仓库：`zjc66666-pm/bestshopio-prototypes`
- 分支：`main`
- GitHub Pages：`https://zjc66666-pm.github.io/bestshopio-prototypes/`

本目录是独立发布镜像。不得混入 `BestShopio Workspace` 中的 `docs/`、`reference/` 或历史文件。
