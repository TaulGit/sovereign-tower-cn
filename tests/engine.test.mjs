import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,getAudience,chooseAudience,goBoard,assignKnight,unassignKnight,estimateQuest,resolveBoard,finishResults,rewind,buildRoom,craft,equip,getKnightDialogue,talkToKnight} from '../game/engine.mjs';

function chooseDay(state,choices) {
  for (const choice of choices) {
    assert.ok(getAudience(state),`第 ${state.day} 日应有接见`);
    const result = chooseAudience(state,choice);
    assert.equal(result.ok,true,`${choice}: ${result.error || ''}`);
  }
  assert.equal(getAudience(state),null);
  assert.equal(goBoard(state).ok,true);
}
function finishDay(state,choices) {
  chooseDay(state,choices); assert.equal(resolveBoard(state).ok,true); assert.equal(finishResults(state).ok,true);
}

test('接见按顺序改变资源，完成两场后才能进入圆桌', () => {
  const state = createGame(7);
  assert.equal(state.phase,'audience'); assert.equal(getAudience(state).id,'d1_fog');
  assert.equal(goBoard(state).ok,false);
  assert.equal(chooseAudience(state,'investigate').ok,true);
  assert.equal(state.resources.people,58); assert.equal(state.resources.treasury,97);
  assert.equal(state.quests[0].id,'fog');
  assert.equal(chooseAudience(state,'invalid').ok,false); assert.equal(state.audienceIndex,1);
  assert.equal(chooseAudience(state,'escort').ok,true);
  assert.equal(getAudience(state),null); assert.equal(goBoard(state).ok,true);
  assert.equal(state.phase,'board');
});

test('同一骑士不能同时接两个任务，撤回后可以重新派遣', () => {
  const state = createGame(1); chooseDay(state,['investigate','escort']);
  assert.equal(assignKnight(state,'fog','anwen').ok,true);
  assert.equal(assignKnight(state,'grain','anwen').ok,false);
  assert.equal(assignKnight(state,'fog','beilu').ok,false);
  assert.equal(unassignKnight(state,'fog').ok,true);
  assert.equal(assignKnight(state,'grain','anwen').ok,true);
  assert.equal(assignKnight(state,'fog','beilu').ok,true);
  assert.equal(assignKnight(state,'grain','lin').ok,false);
});

test('强制高低能力场景能产生成功与失败并改变对应资源', () => {
  const state = createGame(2); chooseDay(state,['investigate','escort']);
  state.knights.find(k => k.id === 'anwen').skills.agility = 30;
  state.knights.find(k => k.id === 'anwen').skills.wit = 30;
  state.quests.find(q => q.id === 'grain').difficulty = 99;
  assignKnight(state,'fog','anwen'); assignKnight(state,'grain','beilu');
  const before = {...state.resources};
  const result = resolveBoard(state); assert.equal(result.ok,true);
  assert.equal(state.phase,'results');
  assert.equal(state.quests.find(q => q.id === 'fog').status,'success');
  assert.equal(state.quests.find(q => q.id === 'grain').status,'failure');
  assert.equal(state.resources.people,before.people + 7);
  assert.equal(state.resources.merchants,before.merchants - 4);
  assert.equal(state.knights.find(k => k.id === 'beilu').busyQuestId,null);
});

test('跨日任务占用骑士并在下一天结束，期间不能撤回', () => {
  const state = createGame(3); finishDay(state,['wait','tax']);
  chooseDay(state,['repair','decline']);
  assert.equal(assignKnight(state,'bridge','beilu').ok,true);
  assert.equal(resolveBoard(state).ok,true);
  assert.equal(state.quests.find(q => q.id === 'bridge').status,'running');
  assert.equal(state.quests.find(q => q.id === 'bridge').remaining,1);
  assert.equal(state.results[0].outcome,'in_progress');
  finishResults(state); chooseDay(state,['seal','refuse']);
  assert.equal(unassignKnight(state,'bridge').ok,false);
  assert.equal(equip(state,'beilu','shield').ok,false);
  resolveBoard(state);
  assert.ok(['success','failure'].includes(state.quests.find(q => q.id === 'bridge').status));
  assert.equal(state.knights.find(k => k.id === 'beilu').busyQuestId,null);
});

test('未派遣任务到截止日过期并造成后果', () => {
  const state = createGame(4); chooseDay(state,['investigate','tax']);
  resolveBoard(state); assert.equal(state.quests[0].status,'open'); finishResults(state);
  chooseDay(state,['detour','decline']); const prior = state.resources.people;
  resolveBoard(state);
  assert.equal(state.quests.find(q => q.id === 'fog').status,'expired');
  assert.equal(state.resources.people,prior - 5);
  assert.ok(state.results.some(r => r.outcome === 'expired'));
});

test('回溯还原角色、金币与日程，同时保留发现的信息', () => {
  const state = createGame(5); finishDay(state,['wait','tax']);
  assert.equal(state.day,2); const original = JSON.stringify(state.history[0].snapshot.resources);
  assert.equal(chooseAudience(state,'detour').ok,true); assert.equal(chooseAudience(state,'recruit').ok,true);
  assert.equal(state.knights.find(k => k.id === 'lin').available,true);
  assert.ok(state.knowledge.some(k => k.includes('琳加入')));
  assert.equal(rewind(state,1).ok,true);
  assert.equal(state.day,1); assert.equal(state.phase,'audience');
  assert.equal(JSON.stringify(state.resources),original);
  assert.equal(state.knights.find(k => k.id === 'lin').available,false);
  assert.ok(state.knowledge.some(k => k.includes('琳加入')));
  assert.equal(state.rewinds,1); assert.equal(rewind(state,7).ok,false);
});

test('建造、制作和装备消耗材料并影响任务预估', () => {
  const state = createGame(6); chooseDay(state,['investigate','escort']);
  assert.equal(craft(state,'shield').ok,false);
  assert.equal(buildRoom(state,'forge').ok,true);
  assert.equal(buildRoom(state,'forge').ok,false);
  const before = estimateQuest(state,'grain','beilu').power;
  assert.equal(craft(state,'shield').ok,true); assert.equal(state.inventory.iron,0);
  assert.equal(equip(state,'beilu','shield').ok,true); assert.equal(state.inventory.shield,0);
  assert.ok(estimateQuest(state,'grain','beilu').power > before);
  assert.equal(craft(state,'shield').ok,false);
});

test('十四天完整分支可达阶段结局，存档可序列化后继续', () => {
  let state = createGame(17);
  finishDay(state,['wait','tax']);
  finishDay(state,['detour','decline']);
  finishDay(state,['seal','refuse']);
  state = JSON.parse(JSON.stringify(state));
  finishDay(state,['reject','ration']);
  finishDay(state,['bounty','hearing']);
  finishDay(state,['cover','evacuate']);
  finishDay(state,['delay','alliance']);
  finishDay(state,['silence','rest']);
  finishDay(state,['copy','lower']);
  finishDay(state,['guard','supply']);
  finishDay(state,['listen','mediation']);
  finishDay(state,['guard','decline']);
  finishDay(state,['prepare','mediate']);
  finishDay(state,['evacuate','together']);
  assert.equal(state.phase,'ending'); assert.equal(state.ending.id,'unity');
  assert.equal(state.history.length,14); assert.equal(rewind(state,3).ok,true);
  assert.equal(state.phase,'audience'); assert.equal(state.day,3);
  assert.ok(state.knowledge.some(x => x.includes('灯火与盟约')));
});

test('六维属性与招募、运气需求可以参与任务评估', () => {
  const state = createGame(77);
  assert.ok(state.knights.every(k => Number.isInteger(k.skills.luck)));
  finishDay(state,['wait','tax']);
  chooseDay(state,['detour','recruit']);
  assert.equal(state.knights.find(k => k.id==='lin').available,true);
  assert.equal(assignKnight(state,'talks','lin').ok,true);
  assert.ok(Number.isFinite(estimateQuest(state,'talks','lin').chance));
});

test('骑士交谈改变关系，单日限一次，次日可再次交谈', () => {
 const state=createGame(9); chooseDay(state,['wait','tax']);
 const before=state.knights[0].affinity; assert.ok(getKnightDialogue(state,'anwen'));
 assert.equal(talkToKnight(state,'anwen','listen').ok,true); assert.equal(state.knights[0].affinity,before+5);
 assert.equal(talkToKnight(state,'anwen','listen').ok,false); resolveBoard(state); finishResults(state);
 chooseDay(state,['detour','decline']); assert.ok(getKnightDialogue(state,'anwen'));
});
