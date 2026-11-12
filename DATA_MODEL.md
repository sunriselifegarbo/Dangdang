# 阶段 0 数据模型（待确认）

时间统一使用 Unix 毫秒，ID 为 UUID 字符串。数据库名 Dangdang，当前 schema 版本 1。

| 表 | 字段 | 索引 |
| --- | --- | --- |
| Word / words | id、text、autoPinyin、customPinyin?、source、language、createdAt | id 主键、[language+text]、source、createdAt |
| WordList / wordLists | id、name、wordIds、createdAt | id 主键、name、createdAt、wordIds 多值索引 |
| Session / sessions | id、type、startedAt、items | id 主键、type、startedAt |
| SessionItem（嵌入 items） | wordId、result | 无独立表 |
| WordStat / wordStats | wordId、status、streak、wrongCount、lastReviewedAt | wordId 主键、status、lastReviewedAt |

- source：manual（手动）、voice（语音）、photo（拍照）。
- language：字符串，创建词语时默认 zh；现阶段仅支持中文。
- type：normal（普通）、wrong-retry（错词重练）、missed-retry（错过的词重练）、review（错词复习）。
- result：correct（对）、wrong（错）、unwritten（未听写）。
- status：unmastered（未掌握）、missed（错过的词）、mastered（已掌握）。
- 显示拼音严格为 `customPinyin ?? autoPinyin`；恢复自动拼音时删除 customPinyin。
- lastReviewedAt 从未作答时为 null；未听写不更新时间。
- [language+text] 暂为非唯一索引，后续录入通过事务复用已有词；避免备份合并前过早限定唯一规则。
- 已发布版本的 schema 保留不改；变更追加 version(2) 等并按需 upgrade，禁止删库升级。

## 状态规则

规则常量位于 src/domain/mastery.ts，默认连续答对门槛为 3，可在调用时传入设置值。

1. 新词初始未掌握，streak=0，wrongCount=0。
2. 任何练习答错：未掌握、连续次数归零，累计错误加一。
3. 提前结束的未听写词：错过的词、连续次数归零，不增加错误次数。
4. 未掌握或错过的词在三种复习类型中连续答对达到门槛：已掌握。
5. 普通听写答对不累计复习连续次数；已掌握词答对保持已掌握。
6. 已掌握词若未听写，按第 3 条归为错过的词。

以上按用户描述实现，不声称还原参考应用的内部逻辑。第 5、6 条是为消除边界歧义而明确的默认规则，请在进入阶段 1 前确认或调整。

## 当前限制

这里只建立模型及纯状态计算函数；结束页确认、跨表事务写入、数据备份合并与历史快照将在相应阶段完成。SessionItem 仅引用 wordId，后续删除词语时需保留被历史引用的词；如需历史保留当时的文字/拼音，可在后续版本增加快照字段。
