# StatsWatch Desktop — 设计文档

> Windows 端守望先锋数据伴侣：**StatsWatch 的战绩查询** + **OverBuddy 的实时对局检测**，全部功能免费。

- 状态：设计阶段（v0 草案）
- 最后更新：2026-10-22
- 相关项目：[StatsWatch (iOS)](https://github.com/WilliamGuo2002/StatsWatch-Overwatch-tracker)

---

## 0. 一句话结论

OverBuddy 的全部功能——**包括它收 $5.99/月 的付费功能**——都是在**同一条本地事件流**上做的派生分析。付费墙是定价决策，不是技术门槛。

真正要花钱的只有三样：**视频**（留在本机）、**全球百分位基准**（每天一个缓存 JSON）、**好友/排行榜**（极小的聚合行）。把这三样处理对，这个软件可以在百万日活规模下维持每月几十美元的运营成本，永久免费开放。

---

## 1. 目标与非目标

### 目标
1. 打开软件玩游戏，**自动**记录每一局，尽可能多的数据，无需任何手动输入。
2. 覆盖 OverBuddy 的全部功能（免费 + 付费），全部免费开放。
3. 保留并移植 StatsWatch 的生涯查询能力（查任意玩家、英雄百科、Meta、对比、Smart Coach）。
4. 成本随用户数**近似常数**增长，不会因为用户变多而被迫收费或关停。
5. 不改游戏、不注入、不读内存——走官方认可的集成路径。

### 非目标（v1 不做）
- macOS / Lin（Overwolf 的 GEP、overlay、录制目前只支持 Windows，Mac/Linux 仅支持广告服务）
- 主机平台实时追踪（GEP 只能读 PC 客户端）
- 云端视频托管
- 比赛回放（replay）解析

---

## 2. 技术前提：为什么必须是 Overwolf

暴雪**没有**任何官方的对局数据 API。守望先锋的生涯页只暴露累计统计，不含单场记录。要拿到"这一局发生了什么"，Windows 上只有三条路：

| 路径 | 可行性 | 评价 |
|---|---|---|
| **Overwolf GEP** | ✅ 官方集成，Overwatch 在 Production 列表 | **选这条。** OverBuddy 走的就是这条 |
| 截图 + OCR 识别 Tab 记分板 | ⚠️ 可行但脆弱 | 分辨率/语言/UI 改版一碰就碎，数据密度低。社区有 [ocrwatch2](https://github.com/InventivetalentDev/ocrwatch2)、[OW2-Screenshot-OCR-Tool](https://github.com/artursharykin/Overwatch-2-Screenshot-OCR-Tool) 可参考，但不作为主路径 |
| 读游戏内存 / 注入 | ❌ | 封号风险，不做 |

**Overwolf 是平台，不是竞品。** 它提供游戏覆盖层、实时游戏事件（GEP）、录制能力的 SDK。OverBuddy FAQ 里说的"officially Blizzard-approved game integration for Overwatch companion apps"指的就是 GEP。

### 关键确认（已查证）
- Overwatch 的 Overwolf **Game ID = 10844**
- Overwatch 在 **ow-electron GEP 的 Production 环境**列表中（不是 Dev、不是 In-progress）
- **ow-electron 应用可以自行打包分发**，不必上 Overwolf 商店："you are able to share your app with anyone you like"，自己托管即可，但需要自备可信 CA 的代码签名证书
- 可用的 Overwolf Electron 包：`gep`（游戏事件）、`overlay`（游戏内覆盖窗口 + 热键）、`recorder`（录制 + 回放缓冲）、`utility`（游戏进程追踪）、`crn`（崩溃上报）
- GEP / overlay / recorder **仅 Windows**

### 需要办的事
- 注册 Overwolf 开发者账号，拿 app id（GEP 在 PROD 跑需要走他们的流程）
- 代码签名证书（分发 Windows 安装包用）

---

## 3. 我们能拿到什么数据

GEP 的 Overwatch feature 一共 7 个：`gep_internal`、`game_info`、`match_info`、`kill`、`assist`、`death`、`roster`。以下是完整字段（含官方 JSON 样例的真实字段名）。

### 3.1 `game_info` — 游戏状态

| key | 值 |
|---|---|
| `game_state` | `loading_screen_start` / `game_loaded` / `match_in_progress` / `match_ended` / `role_select_screen_start` / `role_select_screen_end` |
| `game_mode` | 数字码。`20`=Assault `21`=Escort `22`=Hybrid `23`=Control `109`=Flashpoint `224`=Clash `30`=Deathmatch `9`=Elimination `16`=Skirmish `165`=Hero Mastery Solo … 共约 40 个（响应里前导零被去掉） |
| `battle_tag` | 本地玩家的战网 tag，如 `OverTheTop#2100` |
| `game_type` | `UNKNOWN` / `UNRANKED` / `CUSTOM_GAME` / `PRACTICE` / `ARCADE` / `TUTORIAL` / `SKIRMISH` / `VS_AI` / `DEATHMATCH` / `RANKED` / `HERO_MASTERY` / `HERO_MASTERY_SOLO` |
| `game_queue_type` | `OPEN_QUEUE` / `ROLE_QUEUE` |
| `party_player_count` | 队伍人数 |

### 3.2 `match_info` — 对局信息

| key | 值 |
|---|---|
| `map` | 数字 ID，约 37 张图。`212`=Kings Row `707`=Dorado `2018`=Busan `4439`=Hanaoka `4448`=Throne of Anubis `3762`=Runasapi … |
| `match_id` | 游戏自己的 match ID（GEP 305.0+） |
| `pseudo_match_id` | Overwolf 生成的 UUID，与游戏无关 |
| `match_outcome` | `victory` / `defeat` |
| `round_outcome` | `victory` / `defeat`，**仅 Stadium 模式** |

事件：`match_start`、`match_end`、`round_start`、`round_end`、`respawn`、`revive`、`game_exit`、`kill_feed`。

### 3.3 `kill_feed` — 击杀/复活流 ⭐

**整个分析体系的时间轴基础。** 任何玩家死亡或复活时触发：

```
attacker, victim                              — 玩家名
attacker_hero_id,  attacker_hero_name         — 如 41 / "GENJI"
victim_hero_id,    victim_hero_name           — 如 492 / "SOJOURN"
is_attacker_teammate, is_victim_teammate      — bool
supporter, revived                            — 复活事件：复活者 / 被复活者
supporter_hero_id/name, revived_hero_id/name
is_supporter_teammate, is_revived_teammate
```

> 注意：GEP 不带时间戳，**我们在收到事件的瞬间打本地时间戳**（相对 `match_start` 的毫秒偏移）。这就是全部时间轴数据的来源。

### 3.4 `roster` — 记分板 ⭐⭐

`roster_00` … `roster_11`，**十个玩家全都有**：

```
player_name        — 玩家名
battlenet_tag      — 战网 tag（含敌方！）
is_local           — 是否本人
is_teammate        — 是否队友
team               — 0 / 1
hero_name          — 当前英雄，如 "LUCIO"
hero_role          — "TANK" / "DAMAGE" / "SUPPORT"
hero_id            — 英雄数字 ID
kills / deaths / assists
damage / healed / mitigated    — 浮点累计值
```

**这就是记分板。** 而且它是 info update——**值一变就推送**，所以把每次推送按时间戳存下来，天然得到一条**每个玩家每项数据的时间序列**。OverBuddy 的"stat timelines"、"teamfight momentum"、"live ranking"全部来自这里。

`battlenet_tag` 对敌方也给，这是**宿敌（Rivalries）系统**成立的关键——OverBuddy 把这个功能放在付费墙后面。

### 3.5 `kill` / `death` / `assist`
本地玩家的本局累计 `eliminations` / `deaths` / `assists`，同时有对应的 `elimination` / `death` / `assist` 事件（事件数据为累计总数）。`objective_kills` 在文档样例里出现但未列在表中，运行时探测。

### 3.6 拿不到什么（必须诚实对待）

| 缺失 | 影响 | 缓解方案 |
|---|---|---|
| **比分 / 推车进度 / 占点百分比** | 无法显示"推了多远"、"占了多少" | 用 `round_start`/`round_end` 计数 + `match_outcome` 推断回合结果；Stadium 有 `round_outcome` |
| **终极技能充能 / 技能冷却** | OverBuddy 付费的"cooldown efficiency"无法真实推导 | v1 不做，不编造。v2 可选 OCR 补充记分板上的额外列 |
| **敌方 `hero_name` / `hero_role`** | 文档在 249.1.0 注明只给本方；但官方样例里 `is_teammate:false` 的条目**带** `hero_name` | 运行时探测；兜底用 `kill_feed` 的 `attacker_hero_name`/`victim_hero_name`（两边都给）按 `player_name` 回填。**这个兜底很结实** |
| **`match_outcome` 可能丢** | 胜负空白 | 标记为 `unknown`；用团战胜负累计给出"预测结果"并明确标注是预测（OverBuddy 同样有这个问题） |
| **中途退出** | 数据不全 | 标记 `incomplete`，记录质量分 |
| **局内英雄时长** | — | 从 `roster` 的 `hero_name` 变化时间戳推导英雄分段 |

---

## 4. 架构：本地优先

这是**扩容策略**，不是省钱的妥协。

```
┌─────────────────────────────────────────────────────────┐
│  ow-electron 主进程 (Node)                              │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ GEP 采集器 │  │ 录制器     │  │ OverFast 客户端  │  │
│  │ 事件→时间轴│  │ replay缓冲 │  │ 生涯数据/Meta    │  │
│  └─────┬──────┘  └─────┬──────┘  └────────┬─────────┘  │
│        │               │                    │            │
│        ▼               ▼                    ▼            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  本地 SQLite (better-sqlite3)  ←── 唯一真相源   │   │
│  │  matches / roster_snapshots / kill_feed /        │   │
│  │  sessions / players / clips / career_snapshots   │   │
│  └──────────────────────────────────────────────────┘   │
│        │                                                 │
│        ├──► 派生分析层（纯函数，无网络）                │
│        │    团战切分 / 评分 / 对位矩阵 / 教练规则        │
│        │                                                 │
│        └──► 同步层（可选、仅聚合、批量）                │
└────────┼─────────────────────────────────────────────────┘
         │                    ▲
         ▼                    │
┌──────────────────┐   ┌──────────────────────────────────┐
│ 渲染进程 (React) │   │ 云端（Cloudflare，极小）         │
│ 主界面           │   │ Workers + D1 + R2                │
│ overlay 窗口     │   │ · 好友 / 排行榜（聚合行）        │
└──────────────────┘   │ · 全球百分位基准（每日 1 个 JSON）│
                       └──────────────────────────────────┘
```

### 四条铁律

1. **原始数据永不出本机。** 每局的 roster 时间序列、kill feed、视频全部留在用户磁盘。
2. **99% 的读取打本地 SQLite。** "看我的战绩"不产生任何服务器请求——这是扩容能成立的根本原因，也是带宽成本压到接近零的原因。
3. **云端只存聚合，不存单局。** 见 §7。
4. **云端是可选的。** 拔掉网线，除了"查别人战绩"和"全球基准"以外全部功能照常工作。

### OverBuddy 的差异：它把数据传服务器
OverBuddy 的 About 页写明桌面端"reads in-game events as they happen and securely sends them to our servers for processing"。这意味着它的成本随用户数线性增长——这大概就是它必须收 $5.99/月 的原因。我们把处理放在客户端，这个成本项直接消失。

---

## 5. 数据模型（本地 SQLite）

```sql
-- 一局比赛
CREATE TABLE matches (
  id                INTEGER PRIMARY KEY,
  pseudo_match_id   TEXT UNIQUE,      -- Overwolf UUID
  game_match_id     TEXT,             -- 游戏自己的 match_id
  started_at        INTEGER NOT NULL, -- epoch ms
  ended_at          INTEGER,
  duration_ms       INTEGER,
  map_id            INTEGER,
  game_mode         INTEGER,
  game_type         TEXT,             -- RANKED / UNRANKED / ARCADE ...
  queue_type        TEXT,             -- OPEN_QUEUE / ROLE_QUEUE
  party_size        INTEGER,
  outcome           TEXT,             -- victory / defeat / draw / unknown
  outcome_source    TEXT,             -- gep / inferred
  local_battle_tag  TEXT,
  season            INTEGER,
  quality_score     REAL,             -- 0..1 事件完整度
  flags             TEXT              -- JSON: incomplete, left_early, ...
);

-- roster 的每一次推送 = 一个快照（时间序列的原料）
CREATE TABLE roster_snapshots (
  match_id    INTEGER NOT NULL REFERENCES matches(id),
  t_ms        INTEGER NOT NULL,   -- 相对 match_start
  slot        INTEGER NOT NULL,   -- roster_XX 的 XX
  player_name TEXT,
  battle_tag  TEXT,
  is_local    INTEGER,
  is_teammate INTEGER,
  team        INTEGER,
  hero_id     INTEGER,
  hero_name   TEXT,
  hero_role   TEXT,
  kills INTEGER, deaths INTEGER, assists INTEGER,
  damage REAL, healed REAL, mitigated REAL,
  PRIMARY KEY (match_id, t_ms, slot)
);

-- 击杀/复活流
CREATE TABLE kill_feed (
  match_id  INTEGER NOT NULL REFERENCES matches(id),
  seq       INTEGER NOT NULL,
  t_ms      INTEGER NOT NULL,
  kind      TEXT,          -- kill / revive
  attacker TEXT, attacker_hero_id INTEGER, attacker_hero_name TEXT, attacker_is_teammate INTEGER,
  victim   TEXT, victim_hero_id   INTEGER, victim_hero_name   TEXT, victim_is_teammate   INTEGER,
  supporter TEXT, supporter_hero_name TEXT,
  revived   TEXT, revived_hero_name   TEXT,
  PRIMARY KEY (match_id, seq)
);

-- 回合（round_start / round_end 括起来的区间）
CREATE TABLE rounds (
  match_id INTEGER NOT NULL REFERENCES matches(id),
  idx      INTEGER NOT NULL,
  start_ms INTEGER, end_ms INTEGER,
  outcome  TEXT,                    -- Stadium 有 round_outcome，其它推断
  PRIMARY KEY (match_id, idx)
);

-- 派生：团战（由 kill_feed 切分，可重算）
CREATE TABLE teamfights (
  match_id INTEGER NOT NULL REFERENCES matches(id),
  idx      INTEGER NOT NULL,
  start_ms INTEGER, end_ms INTEGER,
  deaths_mine INTEGER, deaths_enemy INTEGER,
  first_death_mine INTEGER,          -- bool: 我方先死
  outcome  TEXT,                     -- won / lost / draw
  local_participated INTEGER,
  local_kills INTEGER, local_deaths INTEGER,
  PRIMARY KEY (match_id, idx)
);

-- 派生：英雄切换分段
CREATE TABLE hero_segments (
  match_id INTEGER NOT NULL REFERENCES matches(id),
  battle_tag TEXT, slot INTEGER,
  hero_id INTEGER, hero_name TEXT,
  start_ms INTEGER, end_ms INTEGER,
  PRIMARY KEY (match_id, slot, start_ms)
);

-- 遇到过的人（队友 + 敌人）→ 宿敌 / 默契系统
CREATE TABLE players (
  battle_tag    TEXT PRIMARY KEY,
  display_name  TEXT,
  first_seen    INTEGER, last_seen INTEGER,
  times_ally    INTEGER DEFAULT 0,
  times_enemy   INTEGER DEFAULT 0,
  wins_with     INTEGER DEFAULT 0, losses_with   INTEGER DEFAULT 0,
  wins_against  INTEGER DEFAULT 0, losses_against INTEGER DEFAULT 0
);

-- 会话（按时间间隔自动切分）
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  started_at INTEGER, ended_at INTEGER,
  match_count INTEGER, wins INTEGER, losses INTEGER
);

-- 自动剪辑
CREATE TABLE clips (
  id INTEGER PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id),
  t_ms INTEGER, duration_ms INTEGER,
  score REAL, reason TEXT,          -- "三杀" / "残血反杀"
  file_path TEXT, thumb_path TEXT
);

-- OverFast 生涯快照（会话前后各拍一次，做权威校验）
CREATE TABLE career_snapshots (
  id INTEGER PRIMARY KEY,
  battle_tag TEXT, taken_at INTEGER,
  payload TEXT                      -- 原始 JSON
);
```

设计要点：
- `roster_snapshots` 和 `kill_feed` 是**不可变的原始事实**；`teamfights`、`hero_segments` 是**可重算的派生表**。算法改了就重跑，历史数据不用重采。
- 体积估算：一局 ~80KB 原始，1000 局 ~80MB。加 WAL + 定期 `VACUUM`，桌面端完全无压力。超过阈值可把 1 年前的 `roster_snapshots` 降采样归档。

---

## 6. 功能实现矩阵

**OB** = OverBuddy 免费 ｜ **OB💰** = OverBuddy 付费 ｜ **SW** = 来自 StatsWatch iOS ｜ **新** = 我们独有

| 功能 | 来源 | 数据源 | 实现要点 |
|---|---|---|---|
| 自动对局记录 | OB | GEP 全部 feature | `match_start`→`match_end` 括起来，中间所有推送落库 |
| 比赛记分板 | OB | `roster` 末帧 | 直接呈现；敌方英雄缺失则用 `kill_feed` 回填 |
| 比赛历史 | OB | `matches` | 本地查询，带地图/英雄/KDA/评级/胜负筛选 |
| 玩家资料（任意玩家） | OB + SW | OverFast `/players/*` | 移植 StatsWatch 逻辑 |
| 日报 / 周报 | OB | `matches` + `sessions` | 按日/周聚合 + 与上一周期做差 |
| 会话追踪 | OB + SW | `sessions` + `career_snapshots` | **自动切分**（间隔 >60min 开新会话）；会话首尾各拍一次 OverFast 快照做权威校验 |
| 生涯进展曲线 | OB + SW | `matches` 趋势 + 快照 | 评级 / 胜率 / 影响力分 折线 |
| 赛季追踪 | OB | `matches.season` | 赛季边界表 + 分赛季聚合 |
| 战斗奖章 / 里程碑 | OB | 派生 | 规则表：首个三杀、10 连胜、单局治疗 >15k … |
| 自动剪辑 | OB | `recorder` + 评分 | §7.4。**全部留在本机** |
| 英雄基准（对比全球） | OB | 云端每日 JSON | §7.5 |
| 英雄 Meta（选取/胜率） | OB + SW | OverFast `/heroes/stats` | 移植 |
| 英雄百科 | SW | OverFast `/heroes/{id}` | 移植 |
| 地图分析 | OB | `matches` × `map_id` | 本地：每图胜率 / 最佳英雄；可叠加全球基准 |
| 地图图鉴 | SW | OverFast `/maps` | 移植 |
| 英雄切换时间轴 | OB | `hero_segments` | §7.2 |
| 团战拆解 | OB | `teamfights` | §7.1 |
| 比赛聚光灯（MVP/Top10） | OB | `roster` 末帧 + 影响力分 | 十人按影响力排序 |
| 对比（玩家/英雄） | OB + SW | 本地 + OverFast | 移植 StatsWatch 的对比 UI |
| 教练建议 | OB + OB💰 + SW | 派生 + 规则引擎 | §7.6。叠加 StatsWatch 的 Smart Coach |
| **深度对局分析（团战动量）** | OB💰 | `teamfights` 累计差 | §7.1。零额外成本 |
| **进阶玩家分析（数据时间线/散点）** | OB💰 | `roster_snapshots` | 直接画时间序列，零额外成本 |
| **回合拆解** | OB💰 | `rounds` + roster 区间差 | 回合内 roster 做差 = 每回合十人数据 |
| **英雄精通（百分位/记录/趋势）** | OB💰 | 本地历史 + 云端基准 | 同英雄历史分布 + 全球百分位 |
| **英雄对位矩阵** | OB💰 | `kill_feed` + `roster` | §7.3。两种信号分别呈现 |
| **阵容默契** | OB💰 | `roster` + `matches.outcome` | 按队友/敌方英雄分组算胜率 |
| **宿敌 / 好友对比** | OB💰 | `players` | `battlenet_tag` 覆盖敌方，本地即可算头对头 |
| **团队模式（雷达图）** | OB💰 | `roster` + 本地聚合 | 移植 StatsWatch 的 `RadarChartView` |
| **无水印剪辑** | OB💰 | — | 本来就不加水印 |
| 排行榜 / 好友 / 挑战 | OB + OB💰 | 云端聚合行 | §7.5。唯一真正需要后端的部分 |
| 个人风格画像 | SW | OverFast + 本地 | 移植 `PlayStyleCard` |
| 个人英雄 S/A/B/C/D 分级 | SW | 本地 + 生涯 | 移植 `HeroTierListSection`，现在有单局数据可做得更准 |
| 分享卡片 | SW | 本地 | 移植 `ShareCardView` |
| **游戏内实时 overlay** | 新 | `overlay` 包 + GEP | 实时记分板 + 本局 K/D/A + 团战动量条 |
| **会话自动校验** | 新 | GEP + OverFast 交叉 | §7.7 — iOS 和 OverBuddy 都做不到 |
| 多语言 | SW | — | 沿用 5 语言：EN / 简中 / 한국어 / 日本語 / ES |

**注意这张表的形态**：OverBuddy 所有付费功能的"数据源"列里，**没有一个需要额外的数据采集或服务器**。全部是在已经躺在本地 SQLite 里的数据上多跑几条 SQL 和几个纯函数。这就是为什么我们能免费开放。

---

## 7. 核心算法

### 7.1 团战切分与动量

```
输入：kill_feed（带本地时间戳）、rounds
参数：GAP = 12000ms（守望复活 ~10s + 赶路）

1. 按 t 排序所有 kind=kill 事件
2. 第一个死亡开启一场团战；只要下一个死亡距上一个 <= GAP 就并入同一场
3. round_end / match_end 强制收束当前团战
4. 每场团战计算：
     deaths_mine / deaths_enemy
     first_death_mine（谁先倒）
     outcome = deaths_mine < deaths_enemy ? won : (> ? lost : draw)
     local_participated / local_kills / local_deaths
5. 动量序列 momentum[i] = Σ(won) - Σ(lost)，按时间画折线
6. 转折点 = momentum 一阶差分绝对值最大、且此后符号不再翻转的那场团战
```

局限：没有占点/推车进度，所以"团战胜负"用死亡数代理。对 Control/Clash 这类模式准确度高，对 Push 这类拉锯模式偏弱——UI 上要标注这是推断值。

### 7.2 英雄切换分段
`roster_snapshots` 按 `(slot)` 分组，沿 `t_ms` 扫描，`hero_name` 变化处切一刀 → `hero_segments`。
可直接得出："你第 3 分钟从 D.VA 换到 ORISA，之后团战胜率从 33% → 71%"（把 `teamfights` 按分段边界切开即可）。

### 7.3 英雄对位矩阵（两种信号，分开呈现）

| 信号 | 算法 | 强度 |
|---|---|---|
| **对枪胜负** | `kill_feed` 中我方英雄 vs 敌方英雄的击杀/被杀配对计数 | 强、直接 |
| **带这个英雄对上他的整体胜率** | `roster` 里出现过的敌方英雄 × `matches.outcome` | 弱归因、覆盖广 |

不要把两者混成一个数字——OverBuddy 只给一个"win rate vs hero"，我们给两个更诚实。

### 7.4 影响力分与评级（S/A/B/C/D）

```
1. 所有 roster 末帧数据按时长归一化为「每 10 分钟」
2. 按 hero_role 加权：
     TANK:    0.30·mitigated + 0.25·damage + 0.20·elims - 0.25·deaths
     DAMAGE:  0.40·damage    + 0.30·elims  + 0.10·assists - 0.20·deaths
     SUPPORT: 0.40·healed    + 0.25·assists + 0.15·damage - 0.20·deaths
   （权重是起点，后续用真实分布回归调参）
3. 对每项做 z-score，基线取自：
     阶段一 — 本地累积历史（冷启动时用内置的粗略基线）
     阶段二 — 云端每日全球百分位表（§7.5）
4. 影响力分 = 加权 z 之和 → 映射百分位
5. 评级：S ≥95 · A ≥80 · B ≥55 · C ≥30 · D <30
```

必须按时长归一化，否则长局虚高。Deathmatch / Hero Mastery 等模式走独立基线或直接不评级。

### 7.5 自动剪辑评分

```
recorder.startReplays({ buffer: 30s })      // 常驻滑动缓冲

每秒累计分数：
  你完成击杀               +3
  6s 内的追加击杀          +4 each      （多杀递增）
  你阵亡                   -2
  你复活队友 / 被复活      +2
  你方赢下的团战且你 2+ 杀 0 死  +5
  未死亡连杀               +1 / 杀（累计）

滑动 15s 窗口求和；窗口分 >= 阈值 且 距上次存片 > 20s
  → recorder.captureReplay(name, lookback = windowStart - 2s)

每局保留 top N，去重，全部留在本机
```

视频**不上传**。分享就让用户自己传 YouTube / Discord，或后期做"可选上传 + 硬配额"。这是成本控制的关键一条。

### 7.6 教练规则引擎

纯规则 + 阈值，不需要大模型（想加 AI 解读可以后期做成可选的本地/BYO-key）：

```
首死率 > 基线         → 开团时机 / 站位
每 10 分钟死亡 > 基线 → 生存与位置
伤害/治疗百分位 < 40  → 输出效率（给该英雄的对标数据）
团战参与率 < 60%      → 跟团节奏
某敌方英雄对枪 < 30%  → 该对位的应对建议（可给换英雄建议）
换英雄后团战胜率提升  → 肯定这次决策
```

每条规则产出：结论 + 支撑数字 + 一条可执行建议。叠加 StatsWatch 已有的 `SmartCoachView` 逻辑。

### 7.7 会话自动校验（我们独有）

GEP 可能丢事件，`match_outcome` 可能缺。OverFast 提供的生涯累计值是**权威的**。所以：

```
会话开始 → 拍一次 OverFast 生涯快照
会话结束 → 再拍一次
差值 = 这个会话的权威增量（场次、胜场、各英雄时长）
对比 GEP 记录到的场次 → 差异就是丢掉的局
→ 标出"本会话有 1 局未能完整记录"，并按权威值修正聚合数字
```

这是把 StatsWatch（权威但粗）和 OverBuddy（细但可能丢）两边的长处接起来，**两者单独都做不到**。

---

## 8. 成本与扩容模型

### 8.1 成本按"随用户数增长"分类

| 项 | 随用户增长？ | 放哪 |
|---|---|---|
| 单局原始数据（roster 时间序列、kill feed） | — | **本机磁盘**，成本 0 |
| 视频剪辑 | — | **本机磁盘**，成本 0 |
| 查看自己的战绩/分析 | — | **本地 SQLite**，成本 0 |
| 查任意玩家生涯 | 否（直连 OverFast） | 第三方 API，成本 0 |
| 全球百分位基准 | **否（常数）** | 每日 1 个 JSON 放 R2/CDN |
| 好友 / 排行榜 / 宿敌云同步 | **是（但只是聚合行）** | Workers + D1 |

### 8.2 云端只存聚合，不存单局

这是最关键的成本决策。

**不要**把每一局同步到云。改为每个用户每赛季每英雄**一行聚合**，按会话结束批量 upsert：

```
user_hero_season(user_id, season, hero_id, games, wins, 
                 sum_damage, sum_healed, sum_mitigated,
                 sum_kills, sum_deaths, sum_assists, sum_duration_ms)
```

- 排行榜、好友对比、全球基准全部可以从这些聚合行算出来
- 一个用户 ≈ 40 行/赛季 × ~200 字节 ≈ **8KB**
- 写入频率：每个会话 1 次批量 upsert ≈ **3 次/天/用户**，不是 8 次/天（按局）

### 8.3 估算（Cloudflare Workers + D1 + R2）

假设：每用户每天 8 局、3 个会话；每会话 1 次同步请求，带 ~10 行 upsert。

| 日活 | 请求/天 | D1 写行/天 | D1 存储 | 估算月成本 |
|---|---|---|---|---|
| 1k | 3k | 30k | ~8MB | **$0**（全在免费额度内） |
| 10k | 30k | 300k | ~80MB | **~$5**（超出 D1 免费的 10万写行/天，需付费计划） |
| 100k | 300k（9M/月） | 3M | ~800MB | **~$10–25**（Workers Standard $5 含 1000万请求/月） |
| 1M | 3M（90M/月） | 30M | ~8GB | **~$40–80** |

免费额度（已核对官方 Workers 定价页及第三方汇总，**上线前需按当期价目复核**）：
- Workers Free：10万请求/天；Standard 付费：$5/月含 1000万请求/月，超出 $0.30/百万
- D1 Free：500万读行/天、**10万写行/天**、5GB 总存储（单库上限 10GB，付费计划同样适用）
- R2 Free：10GB-月、100万 Class A、1000万 Class B 操作/月；**出网流量免费**

**R2 出网免费是关键。** 追踪类软件通常死在带宽上——我们既没有视频出网，静态基准文件又走零出网费的存储，这一项基本归零。

### 8.4 扩容时的真实瓶颈

按可能性排序：
1. **D1 的写行上限** — 缓解：更大的批量、更长的同步间隔、把计数器合并后再写
2. **排行榜查询扇出** — 缓解：预计算排行榜快照（每小时一次 cron），存成 R2 的静态 JSON，客户端直接拉；排行榜不需要实时
3. **OverFast API 限流** — 它是暴雪生涯页的爬虫代理，有 429。缓解：客户端本地缓存 + 退避重试 + 必要时自建缓存代理（这会产生成本，所以尽量靠客户端缓存解决）
4. **Overwolf 包更新/GEP 中断** — GEP 会随游戏版本短暂失效，必须在 UI 里显示事件状态（Overwolf 提供状态 API）

### 8.5 可持续性
如果真的长到百万级，每月几十美元可以靠捐赠覆盖（你 iOS 版已有 PayPal 渠道）。**绝不**把已经免费的功能收回付费墙后面。

---

## 9. 技术栈与目录结构

| 层 | 选型 | 理由 |
|---|---|---|
| 运行时 | **ow-electron**（Overwolf 的 Electron 发行版） | 唯一能同时拿到 GEP + overlay + recorder 又能自行分发的方案 |
| 语言 | TypeScript | 与 Swift 的模型层对应关系清晰，便于移植 |
| UI | React + Vite | **直接复用 [StatsWatch 网页版](https://github.com/WilliamGuo2002/StatsWatch.app-Web-Version-Overwatch-Tracker)**（已是 TS + React，含 `api/overwatchApi.ts`、career/compare/heroes/profile/progress/search 组件、5 语言 i18n、`types/models.ts`） |
| 图表 | Recharts / visx | 对应 iOS 的 Swift Charts |
| 本地库 | better-sqlite3 | 同步 API，主进程里最简单最快 |
| 状态 | Zustand | 轻 |
| 云端（可选） | Cloudflare Workers + D1 + R2 | 出网免费、免费额度大、边缘部署 |
| 打包 | electron-builder（ow-electron 适配） | 需自备代码签名证书 |

```
StatsWatch-Desktop/
├─ Docs/
│  ├─ DESIGN.md              ← 本文件
│  ├─ GEP-REFERENCE.md       ← GEP 字段 / 英雄ID / 地图ID / 模式ID 全表
│  └─ COST-MODEL.md          ← 成本模型与复核记录
├─ src/
│  ├─ main/                  ← Electron 主进程
│  │  ├─ gep/                ← GEP 订阅、事件归一化、打时间戳
│  │  ├─ recorder/           ← replay 缓冲、剪辑评分
│  │  ├─ db/                 ← schema、迁移、repository
│  │  ├─ analysis/           ← 团战切分、评分、对位、教练（纯函数，可单测）
│  │  ├─ overfast/           ← OverFast 客户端 + 缓存
│  │  └─ sync/               ← 可选云同步（聚合）
│  ├─ renderer/              ← React UI
│  │  ├─ views/              ← 对应 iOS 的 Views/
│  │  └─ components/
│  ├─ overlay/               ← 游戏内 overlay 窗口
│  └─ shared/                ← 类型、英雄/地图/模式 ID 映射、i18n
├─ cloud/                    ← Cloudflare Workers（可选部分）
└─ tests/                    ← analysis/ 的单测（用录制的事件流做 fixture）
```

**`src/main/analysis/` 全部是纯函数**：输入事件流，输出派生结果。这意味着可以录一份真实对局的事件流存成 fixture，然后算法随便改、随便回归测试，不需要开游戏。这是整个项目最重要的可测试性决策。

---

## 10. 里程碑

### M0 — 骨架（本周）
ow-electron 跑起来、GEP 连上 Overwatch（10844）、把**所有** feature 的原始事件 dump 成 JSONL。
**产出：一份真实对局的事件流 fixture。** 后面所有算法都在它上面开发，不必反复开游戏。

### M1 — 采集与记分板
事件 → SQLite 落库；比赛历史列表；比赛记分板（含敌方英雄回填）；自动会话切分。

### M2 — 生涯查询（移植 StatsWatch）
OverFast 全部接口；玩家查询/资料/段位；英雄百科；Meta；地图图鉴；对比；风格画像；Smart Coach；分享卡片。

> **不要从 Swift 重写。** 已有的 [StatsWatch 网页版](https://github.com/WilliamGuo2002/StatsWatch.app-Web-Version-Overwatch-Tracker) 就是 TypeScript + React，`src/api/overwatchApi.ts`（OverFast 客户端）、`src/types/models.ts`（数据模型）、`src/components/{career,compare,heroes,profile,progress,search}`、`src/i18n/*.json`（5 语言）可以直接搬进 `src/renderer/`。
>
> 这一步的实际工作变成：搬运 → 改成 Electron 渲染进程（IPC 取代直接 fetch 的部分）→ 接本地 SQLite → 补 iOS 版有而网页版没有的（Smart Coach、风格画像、英雄分级、分享卡片，这几个从 Swift 翻）。
>
> 这一半不依赖 Overwolf，可以**独立先发布**，没有封号风险、不开游戏也能用。

### M3 — 派生分析（= OverBuddy 的付费区）
团战切分 + 动量；英雄切换时间轴；回合拆解；影响力分与评级；聚光灯/MVP；对位矩阵；阵容默契；宿敌；日报/周报；生涯进展曲线；教练规则引擎。

### M4 — Overlay 与剪辑
游戏内实时 overlay（记分板 + 动量条）；replay 缓冲 + 自动剪辑评分 + 剪辑库；热键手动存片。

### M5 — 云端（可选功能）
匿名基准上报 + 每日百分位聚合；好友；排行榜快照；挑战。

### M6 — 打包发布
代码签名；自动更新；多语言；非官方免责声明；网站/下载页。

---

## 11. 风险与待确认

| 项 | 状态 | 处理 |
|---|---|---|
| Overwolf 开发者账号 / app id | **待办** | 注册，确认 Overwatch GEP 在 PROD 可直接用 |
| 敌方 `hero_name` 是否真的缺 | **待运行时验证** | 文档 249.1.0 说只给本方，官方样例却给了。M0 dump 时验证；兜底方案已有（`kill_feed` 回填） |
| 代码签名证书 | 待办 | 自行分发必需；OV 证书约 $100–300/年 |
| GEP 随游戏更新中断 | 持续风险 | UI 显示事件状态；接 Overwolf 状态 API；算法对缺失字段容错 |
| OverFast API 限流 / 停服 | 中等风险 | 本地缓存 + 退避；它是单人维护的开源项目，考虑备用数据源 |
| 封号风险 | 低但非零 | 不注入不改游戏。OverBuddy 自称"经暴雪批准的集成"但无第三方证实；历史上 OverTrack 出现过误封后撤销。首页需明确告知 |
| Cloudflare 价目变动 | 低 | 成本模型留在 `Docs/COST-MODEL.md`，上线前复核 |
| 商标 / ToS | 需处理 | 照搬 iOS 版的非官方免责声明 |

---

## 12. 免责声明

本项目为**非官方**粉丝作品，与暴雪娱乐（Blizzard Entertainment, Inc.）无任何关联、背书或授权关系。*守望先锋*（Overwatch）及所有相关英雄、名称、图像和素材均为暴雪娱乐的商标或注册商标。

本软件不修改游戏、不注入进程、不读取游戏内存。所有对局数据通过 Overwolf 官方游戏事件接口获取，生涯数据来自公开可见的个人资料。

---

## 参考资料

- [Overwatch Game Events (GEP) 官方字段文档](https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/overwatch/)
- [GEP 支持环境 — 游戏列表（PROD/DEV）](https://dev.overwolf.com/ow-electron/live-game-data-gep/supported-environment/)
- [ow-electron GEP API](https://dev.overwolf.com/ow-electron/reference/Overwolf-electron-APIs/gep/Overview)
- [ow-electron 包总览（gep / overlay / recorder / utility / crn）](https://dev.overwolf.com/ow-electron/reference/Overwolf-electron-APIs/packages/Overview/)
- [ow-electron recorder API](https://dev.overwolf.com/ow-electron/reference/Overwolf-electron-APIs/recorder/Overview/)
- [ow-electron overlay API](https://dev.overwolf.com/ow-electron/reference/Overwolf-electron-APIs/overlay/Overview/)
- [ow-electron FAQ（分发与平台支持）](https://dev.overwolf.com/ow-electron/getting-started/onboarding-resources/ow-electron-faq)
- [Overwolf 官方 Overwatch 事件示例应用](https://github.com/overwolf/events-sample-apps/tree/master/overwatch-events-sample-app)
- [OverFast API](https://overfast-api.tekrop.fr)
- [StatsWatch (iOS)](https://github.com/WilliamGuo2002/StatsWatch-Overwatch-tracker) ｜ [StatsWatch 网页版（TS + React，M2 的复用来源）](https://github.com/WilliamGuo2002/StatsWatch.app-Web-Version-Overwatch-Tracker)
- [OverBuddy](https://overbuddy.com/) ｜ [FAQ](https://overbuddy.com/faq/) ｜ [Premium](https://overbuddy.com/premium/)
- [Cloudflare Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)
