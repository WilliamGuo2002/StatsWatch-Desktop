<div align="center">

# StatsWatch Desktop

### 守望先锋 Windows 数据伴侣 · Overwatch companion for Windows

**自动记录每一局 · 赛后深度复盘 · 全功能免费**
**Auto-track every match · Post-game analysis · Everything free**

</div>

---

## 这是什么

Windows 端的守望先锋数据工具，把两件事合在一起：

- **战绩查询** — 查任意玩家的段位、生涯数据、英雄池、Meta、英雄百科（移植自 [StatsWatch (iOS)](https://github.com/WilliamGuo2002/StatsWatch-Overwatch-tracker)）
- **自动对局记录** — 开着软件打游戏，自动记录这一局尽可能多的数据：完整记分板、击杀时间轴、团战拆解、英雄切换、自动剪辑

**所有功能免费开放**，包括同类软件放在订阅墙后面的深度分析、对位矩阵、宿敌系统和教练建议。

## 红线：这是复盘工具，不是软性外挂

> **对局进行中，本软件不向玩家呈现任何对局信息。** 记录在局内发生，呈现一律在局后。

没有游戏内 overlay，没有实时面板，没有局内提示。这条约束在**代码的 IPC 层**强制执行——对局进行中渲染进程根本收不到数据，而不是"把界面藏起来"。`tests/` 里有一条专门测它的用例。

因此本项目**不使用** Overwolf 的 `overlay` 包，也就不涉及任何形式的游戏进程注入。

源码公开、且协议允许你自行编译，**你可以亲自验证这一点**。

## 为什么能全免费

同类软件把对局数据上传到自己的服务器处理，成本随用户数线性增长，所以必须收订阅费。

StatsWatch Desktop 是**本地优先**的：原始对局数据、时间序列、视频剪辑全部留在你自己的电脑上，分析在本机完成。看自己的战绩不产生任何服务器请求。云端只保存极小的聚合数据，用于好友对比和全球基准。

这同时意味着：**更快**（本地 SQLite 即时查询）、**更私密**（原始数据不出本机）、**可持续**（成本不随用户数膨胀）。

## 怎么拿到对局数据

暴雪没有公开的对局 API。本项目通过 [Overwolf 的 Game Events Provider](https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/overwatch/) 读取游戏事件——这是守望先锋伴侣应用的官方集成途径。

**不修改游戏、不注入进程、不读取游戏内存。**

## 状态

🚧 开发中（M2）。完整技术设计见 **[Docs/DESIGN.md](Docs/DESIGN.md)**，GEP 字段与 ID 对照表见 **[Docs/GEP-REFERENCE.md](Docs/GEP-REFERENCE.md)**。

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M0 | GEP 接通 + 事件流 dump | 🟡 代码就绪，待 Overwolf 开发者密钥 |
| M1 | 采集落库 + 比赛历史 + 记分板 | ⬜ |
| M2 | 生涯查询（移植 StatsWatch） | ✅ 完成，已对照 iOS 逐页核对 |
| M3 | 派生分析（团战/对位/宿敌/教练） | ⬜ |
| M4 | 自动剪辑（无游戏内 overlay） | ⬜ |
| M5 | 云端可选功能（好友/排行榜/基准） | ⬜ |
| M6 | 打包发布 | ⬜ |

## 系统要求

- Windows（Overwolf 的游戏事件、overlay、录制目前仅支持 Windows）
- 能跑守望先锋的机器

## 技术栈

| 层 | 选型 |
|---|---|
| 运行时 | ow-electron（Overwolf 的 Electron 发行版） |
| 语言 | TypeScript |
| UI | React + Vite |
| 本地库 | SQLite (better-sqlite3) |
| 生涯数据 | [OverFast API](https://overfast-api.tekrop.fr) |
| 对局数据 | Overwolf GEP |
| 云端（可选） | Cloudflare Workers + D1 + R2 |

## 许可

**源码可见，但不是开源。** 源码公开是为了让任何人都能读、能自己编译验证这个软件到底做了什么——特别是验证它**不修改游戏、不注入进程、不读取游戏内存**。

采用 [PolyForm Strict License 1.0.0](LICENSE)：可以非商业使用，**不可分发、不可修改、不可用于商业目的**。编译好的应用对最终用户完全免费。

`StatsWatch` 名称与图标不在授权范围内。

## 免责声明

本项目为**非官方**粉丝作品，与暴雪娱乐（Blizzard Entertainment, Inc.）无任何关联、背书或授权关系。*守望先锋*（Overwatch）及所有相关英雄、名称、图像和素材均为暴雪娱乐的商标或注册商标。

**关于使用风险：** 暴雪从未公开认可过任何第三方对局追踪软件。2018 年暴雪曾警告过同类工具的用户。本项目通过 Overwolf 的官方游戏事件接口取数、严格遵守上述红线，但**使用第三方软件存在非零风险，请自行判断**。详见 [DESIGN.md §11.1](Docs/DESIGN.md)。

---

<div align="center">
为守望先锋社区用心打造 🎮
</div>
