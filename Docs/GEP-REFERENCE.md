# Overwolf GEP — Overwatch 字段与 ID 对照表

> 抄录自 [官方文档](https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/overwatch/)，便于离线查阅与写代码时对照。
> **Overwolf Game ID = 10844**（注意：`getRunningGameInfo` 返回的 id 带序号后缀，需 `Math.floor(id / 10)`）

可用 feature：`gep_internal` · `game_info` · `match_info` · `kill` · `assist` · `death` · `roster`

---

## game_state

```
loading_screen_start
game_loaded
role_select_screen_start
role_select_screen_end
match_in_progress
match_ended
```

## game_type

```
UNKNOWN · UNRANKED · CUSTOM_GAME · PRACTICE · ARCADE · TUTORIAL
SKIRMISH · VS_AI · DEATHMATCH · RANKED · HERO_MASTERY · HERO_MASTERY_SOLO
```

## game_queue_type

```
OPEN_QUEUE · ROLE_QUEUE
```

## game_mode ID

> 响应里前导零被去掉（`"0030"` → `"30"`）

| ID | 模式 | | ID | 模式 |
|---|---|---|---|---|
| 3 | Junkenstein's Revenge | | 66 | Story Missions |
| 7 | CTF | | 67 | Storm Rising |
| 8 | Mei's Snowball Offensive | | 74 | Survivor |
| 9 | Elimination | | 89 | Snowball Deathmatch |
| 15 | Uprising | | 90 | Practice Range |
| 16 | Skirmish | | 109 | Flashpoint |
| 20 | Assault | | 112 | Bounty Hunter |
| 21 | Escort | | 165 | Hero Mastery — Solo |
| 22 | Hybrid | | 186 | Hero Mastery CO-OP |
| 23 | Control | | 224 | Clash |
| 25 | Tutorial | | 227 | Junkenstein's Lab |
| 26 | Uprising All Heroes | | 235 | OW Classic: Assault |
| 29 | Team Deathmatch | | 236 | OW Classic: Escort |
| 30 | Deathmatch | | 237 | OW Classic: Hybrid |
| 32 | Lucioball | | 238 | OW Classic: Control |
| 37 | Retribution | | 253 | Kingmaker: Escort |
| 41 | Yeti Hunter | | 254 | Kingmaker: Control |
| 42 | Halloween Holdout Endless | | 255 | Kingmaker: Push |
| 61 | Calypso Heromode | | 256 | Kingmaker: Hybrid |
| | | | 257 | Kingmaker: Flashpoint |
| | | | 258 | Kingmaker: Clash |

## map ID

> 官方文档注明仍有部分取值未知，运行时遇到未知 ID 要记录下来而不是丢弃

| ID | 地图 | | ID | 地图 |
|---|---|---|---|---|
| 212 | King's Row | | 2087 | Circuit Royal |
| 388 | Watchpoint: Gibraltar | | 2161 | Rialto |
| 468 | Numbani | | 2360 | Paraíso |
| 687 | Hollywood | | 2628 | Havana |
| 707 | Dorado | | 2651 | Blizzard World Winter |
| 1207 | Nepal | | 2795 | New Queen Street |
| 1467 | Route 66 | | 2868 | Colosseo |
| 1634 | Lijiang Tower | | 2892 | Midtown |
| 1645 | Ilios | | 3205 | Shambali Monastery |
| 1677 | Eichenwalde | | 3314 | Antarctic Peninsula |
| 1694 | Oasis | | 3390 | Suravasa |
| 1707 | Hollywood Halloween | | 3411 | Esperança |
| 1713 | King's Row Winter | | 3603 | New Junk City |
| 1719 | Lijiang Tower Lunar New Year | | 3762 | Runasapi |
| 1878 | Junkertown | | 3776 | Samoa |
| 1886 | Blizzard World | | 4439 | Hanaoka |
| 2018 | Busan | | 4448 | Throne of Anubis |
| 2036 | Eichenwalde Halloween | | | |

---

## roster_XX

每个 slot 一条 info update，**十个玩家全有**。值是 JSON 字符串，需二次 parse。

| 字段 | 类型 | 说明 |
|---|---|---|
| `player_name` | string | 玩家名 |
| `battlenet_tag` | string | 战网 tag，**敌方也给** |
| `is_local` | bool | 是否本人 |
| `is_teammate` | bool | 是否队友 |
| `team` | 0 \| 1 | 队伍 |
| `hero_name` | string | 当前英雄，如 `"LUCIO"` |
| `hero_role` | string | `TANK` / `DAMAGE` / `SUPPORT` |
| `hero_id` | number | 英雄数字 ID |
| `kills` / `deaths` / `assists` | number | 累计 |
| `damage` / `healed` / `mitigated` | float | 累计 |

真实样例：

```json
{"feature":"roster","category":"roster","key":"roster_0","value":"{\"player_name\":\"CHARLOGNE\",\"is_local\":false,\"hero_name\":\"LUCIO\",\"hero_role\":\"SUPPORT\",\"team\":0,\"kills\":18,\"deaths\":9,\"damage\":5318.73,\"assists\":21,\"healed\":12641.1,\"mitigated\":1708.42,\"battlenet_tag\":\"charlogne#2351\",\"hero_id\":121,\"is_teammate\":false}"}
```

> ⚠️ 官方文档在 249.1.0 处注明 `hero_name` / `hero_role` **只对本方队伍提供**，但上面这条官方样例里 `is_teammate:false` 却带了 `hero_name`。**M0 阶段必须运行时验证。**
> 兜底：`kill_feed` 的 `attacker_hero_name` / `victim_hero_name` 两边都给，可按 `player_name` 回填敌方英雄。

---

## kill_feed

任何玩家死亡**或复活**时触发。值同样是 JSON 字符串。

| 字段 | 说明 |
|---|---|
| `attacker` / `victim` | 玩家名 |
| `attacker_hero_id` / `attacker_hero_name` | 击杀者英雄 |
| `victim_hero_id` / `victim_hero_name` | 被击杀者英雄 |
| `is_attacker_teammate` / `is_victim_teammate` | bool |
| `supporter` / `supporter_hero_id` / `supporter_hero_name` | 复活事件：复活者 |
| `revived` / `revived_hero_id` / `revived_hero_name` | 复活事件：被复活者 |
| `is_supporter_teammate` / `is_revived_teammate` | bool |

真实样例：

```json
{"attacker":"brandy","victim":"SpectralSoul","is_attacker_teammate":false,"is_victim_teammate":false,"attacker_hero_id":41,"victim_hero_id":492,"supporter":"","revived":"","is_supporter_teammate":false,"is_revived_teammate":false,"supporter_hero_id":null,"revived_hero_id":null,"attacker_hero_name":"GENJI","victim_hero_name":"SOJOURN","supporter_hero_name":null,"revived_hero_name":null}
```

> **GEP 不提供时间戳。** 我们在收到事件的瞬间打本地时间戳（相对 `match_start` 的毫秒偏移）。这是全部时间轴分析的唯一时间来源，所以事件处理路径上不能有阻塞操作。

---

## match_info

| key | 值 |
|---|---|
| `map` | 地图数字 ID（见上表） |
| `match_id` | 游戏自己的 match ID（GEP 305.0+） |
| `pseudo_match_id` | Overwolf 生成的 UUID，与游戏无关 |
| `match_outcome` | `victory` / `defeat` |
| `round_outcome` | `victory` / `defeat`，**仅 Stadium 模式**（GEP 305.0+） |

## 事件一览

| 事件 | 数据 | 触发时机 | Since |
|---|---|---|---|
| `match_start` | null | 比赛开始 | 229.0 |
| `match_end` | null | 比赛结束 | 229.0 |
| `round_start` | null | 回合开始 | 252.0 |
| `round_end` | null | 回合结束 | 252.0 |
| `respawn` | null | 本地玩家重生 | 258.0 |
| `revive` | null | 本地玩家被复活 | 258.0 |
| `kill_feed` | JSON | 任何玩家死亡或复活 | 277.0 |
| `game_exit` | null | 玩家退出游戏 | 312.0 |
| `elimination` | int（累计） | 本地玩家击杀 | 229.0 |
| `death` | int（累计） | 本地玩家死亡 | 229.0 |
| `assist` | int（累计） | 本地玩家助攻 | 229.0 |

## kill / death / assist 的 info

| feature | key | 说明 |
|---|---|---|
| `kill` | `eliminations` | 本局累计击杀 |
| `kill` | `objective_kills` | 文档样例里出现但未列在表中 — **运行时探测** |
| `death` | `deaths` | 本局累计死亡 |
| `assist` | `assists` | 本局累计助攻（文档表格里 Category 误写成 `death`） |

---

## 已知缺失

| 缺失 | 后果 |
|---|---|
| 比分 / 推车进度 / 占点百分比 | 无法显示客观目标进度；团战胜负只能用死亡数代理 |
| 终极技能充能 / 技能冷却 | 无法做真实的技能效率分析 |
| 局内英雄时长 | 需从 `roster` 的 `hero_name` 变化时间戳推导 |
| 稳定的 `match_outcome` | 客户端时序问题或中途退出会导致缺失，需标记为 unknown/predicted |

## 运维提醒

GEP 会随游戏版本更新短暂失效。官方建议把错误和警告**显示给用户**，并提供了事件状态 API 与状态页。UI 里需要有一个"事件采集状态"指示。
