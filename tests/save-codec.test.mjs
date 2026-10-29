import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,chooseAudience,goBoard,assignKnight,resolveBoard,finishResults,rewind} from '../game/engine.mjs';
import {encodeSave,decodeSave} from '../game/save-codec.mjs';
test('存档按编号重建骑士与事务，回溯历史仍可用',()=>{
 const state=createGame(123);chooseAudience(state,'investigate');chooseAudience(state,'escort');goBoard(state);assignKnight(state,'fog','anwen');resolveBoard(state);finishResults(state);
 const packed=encodeSave(state); assert.equal(packed.saveVersion,2);assert.equal(packed.state.knights[0].bio,undefined);assert.equal(packed.state.quests[0].description,undefined);
 const restored=decodeSave(JSON.parse(JSON.stringify(packed)));assert.deepEqual(restored,state);assert.equal(rewind(restored,1).ok,true);assert.equal(restored.day,1);
});
test('旧存档可迁移，未知格式不会被当作空存档',()=>{
 const state=createGame();assert.deepEqual(decodeSave({saveVersion:1,state}),state);assert.throws(()=>decodeSave({saveVersion:999,state}));
});

test('十四日各阶段的存档能够完整还原，包括任务结果及结局',async()=>{
 const {getAudience}=await import('../game/engine.mjs');let state=createGame(2718);
 while(state.phase!=='ending'){
  while(getAudience(state)){const e=getAudience(state);assert.ok(e.choices.some(c=>chooseAudience(state,c.id).ok));}
  assert.ok(goBoard(state).ok);
  for(const q of state.quests.filter(q=>q.status==='open'&&!q.assignedKnightId)) {const k=state.knights.find(k=>k.available&&!k.busyQuestId);if(k)assignKnight(state,q.id,k.id)}
  resolveBoard(state);
  assert.deepEqual(decodeSave(JSON.parse(JSON.stringify(encodeSave(state)))),state);
  finishResults(state);
 }
 assert.deepEqual(decodeSave(JSON.parse(JSON.stringify(encodeSave(state)))),state);
 assert.ok(new TextEncoder().encode(JSON.stringify(encodeSave(state))).length < 100000);
});
