# 最终数据模型

数据库 Dangdang，版本 3；保留 v1 声明，以 v2 upgrade 回填默认值与历史文本快照，v3 刷新词典自动拼音且保留手动拼音。所有 id 为稳定 UUID，时间使用 Unix 毫秒。

| 模型 | 字段 |
| --- | --- |
| Word | id、text、autoPinyin（默认空串）、customPinyin?、source（默认 manual）、language（默认 zh）、createdAt |
| WordList | id、name、wordIds（默认空数组）、createdAt |
| Session | id、type（默认 normal）、startedAt、items（默认空数组） |
| SessionItem | wordId、textSnapshot、result（默认 unwritten） |
| WordStat | wordId、status（默认 unmastered）、streak（默认 0）、wrongCount（默认 0）、lastReviewedAt（默认 null） |

工厂函数提供默认值，持久化后的实体保留必需字段以便代码安全读取。customPinyin 可选，显示为 customPinyin ?? autoPinyin。source 为 manual / voice / photo；result 为 correct / wrong / unwritten（对 / 错 / 未听写）；type 为 normal / wrong-retry / missed-retry / review；status 为 unmastered / missed / mastered。

仅主键标识记录，不添加业务唯一约束；词语按 text+language 在代码中去重。历史文字读取 textSnapshot，删除 Word 后仍可显示。旧版已删除且从未保存快照的词无法恢复原文，迁移为空串，由界面显示缺失提示。

## 状态规则

- 没有 WordStat 表示尚未作答的新词；未听写时才创建 missed 统计。已有统计的词未听写，全部统计保持不变，历史仍记 unwritten。
- 已有未掌握不因未听写改成错过；已掌握也保持已掌握。优先级未掌握 > 错过的词 > 已掌握用于防止未听写覆盖已有状态。
- 答错一律 unmastered，连胜清零，wrongCount 加一。
- 只有 wrong-retry / missed-retry / review 答对累计连续次数，默认 3 次晋级 mastered，门槛可配置。
- normal 答对不累计连胜；已掌握答对保持已掌握。未听写不打断已有连胜。

## 备份契约（阶段 5 实施）

JSON 顶层包含 formatVersion、exportedAt 和四张表完整数据，所有 id / wordId / wordIds 保持原值。导入先校验和预览，以 id 合并；已有 id 保留现有记录，不覆盖；text+language 相同的不同 id 复用现有 Word 并映射引用；历史 textSnapshot 保留。禁止清库导入。冲突与跳过数量在预览中展示。
