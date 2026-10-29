import { EVENTS_BY_DAY, KNIGHTS, ROOMS, ITEMS, RESOURCE_NAMES, KNIGHT_DIALOGUES } from './content.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const ok = extra => ({ ok:true, ...extra });
const err = error => ({ ok:false, error });
const resources = ['people','nobles','merchants','scholars','mystics','treasury'];
const clamp = (key,value) => Math.max(0, key === 'treasury' ? value : Math.min(100,value));
const saveSnapshot = state => {
  const snapshot = clone({ ...state, history:[], knowledge:[] });
  state.history = state.history.filter(entry => entry.day !== state.day);
  state.history.push({day:state.day,snapshot});
};
const remember = (state, fact) => {
  if (fact && !state.knowledge.includes(fact)) state.knowledge.push(fact);
};
function canAfford(state, changes) {
  for (const [key, amount] of Object.entries(changes || {})) {
    if (amount < 0 && key === 'treasury' && state.resources.treasury < -amount) return false;
  }
  return true;
}
function addResources(state, changes) {
  const actual = {};
  for (const [key, amount] of Object.entries(changes || {})) {
    if (!resources.includes(key) || !Number.isFinite(amount)) continue;
    const before = state.resources[key];
    state.resources[key] = clamp(key,before + amount);
    actual[key] = state.resources[key] - before;
  }
  return actual;
}
function nextRandom(state) {
  let x = state.rng >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rng = x >>> 0;
  return state.rng / 4294967296;
}
function lookupQuest(state,id) { return state.quests.find(q => q.id === id); }
function lookupKnight(state,id) { return state.knights.find(k => k.id === id); }
function createQuest(template, day) {
  return { ...clone(template), remaining:template.duration, deadline:day + template.deadlineOffset,
    status:'open', assignedKnightId:null, startedDay:null };
}

/** 建立第一个早晨；state 可 JSON 序列化。 */
export function createGame(seed = 1) {
  const numericSeed = Number(seed);
  const state = {
    schemaVersion:1, day:1, phase:'audience', audienceIndex:0,
    resources:{ people:55, nobles:50, merchants:50, scholars:50, mystics:50, treasury:100 },
    knights:KNIGHTS.map(k => ({ ...clone(k), busyQuestId:null, equipment:[] })),
    quests:[], rooms:{forge:false,alchemy:false,archive:false},
    inventory:{iron:2,herbs:2,seal:0,shield:0,boots:0,charm:0,notebook:0,brooch:0},
    flags:{}, knowledge:['北坡的雾仍未消散。'], history:[], results:[], ending:null,
    rewinds:0, talkedToday:[], rng:(Number.isFinite(numericSeed) ? numericSeed >>> 0 : 1) || 1
  };
  saveSnapshot(state);
  return state;
}

/** 返回当前事件；全部接见完毕后返回 null。 */
export function getAudience(state) {
  if (state?.phase !== 'audience') return null;
  const event = (EVENTS_BY_DAY[state.day] || [])[state.audienceIndex];
  return event ? clone(event) : null;
}

/** 玩家必须有足够国库才能做出需要金币的选择。 */
export function chooseAudience(state,choiceId) {
  if (state?.phase !== 'audience') return err('现在不是接见时间。');
  const event = (EVENTS_BY_DAY[state.day] || [])[state.audienceIndex];
  if (!event) return err('今天的接见已结束，请前往圆桌。');
  const choice = event.choices.find(item => item.id === choiceId);
  if (!choice) return err('没有这个选项。');
  if (!canAfford(state,choice.effects)) return err('国库不足，无法作出这个决定。');
  const delta = addResources(state,choice.effects);
  if (choice.recruit) {
    const knight = lookupKnight(state,choice.recruit);
    if (knight) { knight.available = true; remember(state,`${knight.name}加入了圆桌。`); }
  }
  if (choice.knowledge) remember(state,choice.knowledge);
  if (choice.flag) state.flags[choice.flag] = true;
  if (choice.material) for (const [id,n] of Object.entries(choice.material)) state.inventory[id] = (state.inventory[id] || 0) + n;
  let questId = null;
  if (choice.quest) {
    const quest = createQuest(choice.quest,state.day);
    state.quests.push(quest); questId = quest.id;
  }
  state.audienceIndex++;
  return ok({eventId:event.id,choiceId,delta,questId,remaining:Math.max(0,(EVENTS_BY_DAY[state.day] || []).length - state.audienceIndex)});
}
export function goBoard(state) {
  if (state?.phase !== 'audience') return err('当前无法前往圆桌。');
  if (getAudience(state)) return err('请先完成今天的接见。');
  state.phase = 'board'; return ok();
}

/** 分配后立即锁定骑士，以阻止一人重复接受两个任务。 */
export function assignKnight(state,questId,knightId) {
  if (state?.phase !== 'board') return err('只能在圆桌阶段派遣骑士。');
  const quest = lookupQuest(state,questId), knight = lookupKnight(state,knightId);
  if (!quest || quest.status !== 'open') return err('任务不可派遣。');
  if (!knight || !knight.available) return err('骑士尚未加入圆桌。');
  if (quest.assignedKnightId === knightId) return ok();
  if (quest.assignedKnightId) return err('任务已有骑士，请先撤回。');
  if (knight.busyQuestId) return err('这位骑士已有任务。');
  quest.assignedKnightId = knight.id; knight.busyQuestId = quest.id;
  return ok({questId,knightId});
}
export function unassignKnight(state,questId) {
  if (state?.phase !== 'board') return err('只能在圆桌阶段撤回派遣。');
  const quest = lookupQuest(state,questId);
  if (!quest || quest.status !== 'open' || !quest.assignedKnightId) return err('这项任务无法撤回。');
  const knight = lookupKnight(state,quest.assignedKnightId);
  if (knight && knight.busyQuestId === quest.id) knight.busyQuestId = null;
  quest.assignedKnightId = null; return ok({questId});
}

/** 提供 UI 所需的预计成功率；实际判定使用可复现的内部随机数。 */
export function estimateQuest(state,questId,knightId) {
  const quest = lookupQuest(state,questId), knight = lookupKnight(state,knightId);
  if (!quest || !knight || !quest.skills?.length) return null;
  const power = Math.floor(quest.skills.reduce((sum,skill) => {
    const bonus = knight.equipment.reduce((total,id) => total + (ITEMS[id]?.bonus?.[skill] || 0),0);
    return sum + (knight.skills[skill] || 0) + bonus;
  },0) / quest.skills.length) + Math.floor((knight.affinity - 50) / 25);
  const probability = [-2,-1,0,1,2,3].filter(roll => power - quest.difficulty + roll >= 0).length / 6;
  return { power, difficulty:quest.difficulty, chance:Math.round(probability * 100) };
}
function resolveCompleted(state,quest) {
  const knight = lookupKnight(state,quest.assignedKnightId);
  if (!knight) return {questId:quest.id,title:quest.title,knightId:null,knightName:'',outcome:'failure',text:'任务缺少骑士，未能完成。',delta:{}};
  const {power} = estimateQuest(state,quest.id,knight.id);
  const grade = power - quest.difficulty + Math.floor(nextRandom(state)*6) - 2;
  const outcome = grade >= 3 ? 'critical' : grade >= 0 ? 'success' : 'failure';
  const good = outcome !== 'failure';
  const delta = addResources(state,good ? quest.rewards : quest.penalties);
  knight.affinity = Math.max(0,Math.min(100,knight.affinity + (outcome === 'critical' ? 5 : good ? 3 : -3)));
  knight.busyQuestId = null; quest.remaining = 0; quest.status = good ? 'success' : 'failure';
  return {questId:quest.id,title:quest.title,knightId:knight.id,knightName:knight.name,outcome,
    text:outcome === 'critical' ? `${knight.name}出色地完成了任务。` : good ? `${knight.name}完成了任务。` : `${knight.name}未能完成任务，带回了经验。`,delta};
}
function expire(state,quest,reason) {
  const knight = lookupKnight(state,quest.assignedKnightId);
  if (knight?.busyQuestId === quest.id) { knight.busyQuestId = null; knight.affinity = Math.max(0,knight.affinity-2); }
  quest.status = 'expired';
  return {questId:quest.id,title:quest.title,knightId:knight?.id || null,knightName:knight?.name || '',outcome:'expired',text:reason,delta:addResources(state,quest.penalties)};
}
/** 一次结算只推进一天；跨日任务保留骑士与剩余天数。 */
export function resolveBoard(state) {
  if (state?.phase !== 'board') return err('现在无法结算圆桌。');
  const results = [];
  for (const quest of state.quests) {
    if (quest.status === 'open' && quest.assignedKnightId) {
      quest.status = 'running'; quest.startedDay = state.day; quest.remaining = quest.duration;
    }
    if (quest.status === 'running') {
      quest.remaining = Math.max(0,quest.remaining-1);
      if (quest.remaining === 0) results.push(resolveCompleted(state,quest));
      else if (state.day >= quest.deadline) results.push(expire(state,quest,'任务在期限内未能完成。'));
      else {
        const knight = lookupKnight(state,quest.assignedKnightId);
        results.push({questId:quest.id,title:quest.title,knightId:knight?.id || null,knightName:knight?.name || '',outcome:'in_progress',text:`仍在执行，预计还需 ${quest.remaining} 天。`,delta:{}});
      }
    } else if (quest.status === 'open' && state.day >= quest.deadline) {
      results.push(expire(state,quest,'任务超过期限，未能派遣。'));
    }
  }
  if (!results.length) results.push({questId:null,title:'圆桌记录',knightId:null,knightName:'',outcome:'info',text:'今日没有完成或过期的任务。',delta:{}});
  state.results = results; state.phase = 'results'; return ok({results:clone(results)});
}
function chooseEnding(state) {
  const r = state.resources;
  if (Math.min(r.people,r.nobles,r.merchants,r.scholars,r.mystics) <= 10) return {id:'fragile',title:'摇晃的盟约',text:'十四天过去，塔楼仍然矗立。裂痕尚未弥合，下一次议会需要有人先伸出手。'};
  if (state.flags.ending_unity) return {id:'unity',title:'灯火与盟约',text:'各方共同守住了暮塔。古印的秘密仍在，但再没有人需要独自面对它。'};
  if (state.flags.ending_guard) return {id:'guard',title:'守望之誓',text:'骑士团接下守塔的誓言，城中终于能够在钟声中安睡。'};
  if (state.flags.ending_research) return {id:'research',title:'未尽的密卷',text:'学者记录下裂缝的每一次闪动。答案仍在远方，但探索已经开始。'};
  if (state.flags.mystery_first) return {id:'mystery',title:'尚未写完的密卷',text:'塔印的来历仍藏在旧卷深处。你决定让圆桌继续追寻答案。'};
  if (state.flags.alliance_first) return {id:'alliance',title:'圆桌之约',text:'各方代表终于坐到同一张桌前。盟约只是开端，守约将是下一场考验。'};
  return {id:'renewal',title:'灯火重新亮起',text:'十四日的风雨后，街道逐渐恢复生机。塔楼的灯火还将照亮更远的道路。'};
}
export function finishResults(state) {
  if (state?.phase !== 'results') return err('请先结算今天的任务。');
  if (state.day >= 14) {
    state.ending = chooseEnding(state); state.phase = 'ending';
    remember(state,`你见证了结局：${state.ending.title}。`);
    return ok({ending:clone(state.ending)});
  }
  state.day++; state.phase = 'audience'; state.audienceIndex = 0; state.results = []; state.talkedToday = [];
  saveSnapshot(state);
  return ok({day:state.day});
}
/** 可重返已到达的早晨；故事状态回滚，已知信息和回溯次数保留。 */
export function rewind(state,day) {
  const targetDay = Number(day);
  const entry = state?.history?.find(h => h.day === targetDay);
  if (!entry || !Number.isInteger(targetDay) || targetDay > state.day) return err('无法回到尚未到达的日期。');
  const history = clone(state.history.filter(h => h.day <= targetDay));
  const knowledge = [...state.knowledge]; const rewinds = (state.rewinds || 0) + 1;
  const restored = clone(entry.snapshot);
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state,restored,{history,knowledge,rewinds});
  remember(state,`你曾回到第 ${targetDay} 日的早晨。`);
  return ok({day:state.day,rewinds});
}
export function buildRoom(state,roomId) {
  if (state?.phase !== 'board') return err('只能在圆桌阶段建设塔楼。');
  const room = ROOMS[roomId];
  if (!room) return err('没有这个建筑。');
  if (state.rooms[roomId]) return err('这间建筑已经建成。');
  for (const [key,cost] of Object.entries(room.cost)) if ((state.resources[key] || 0) < cost) return err(`${RESOURCE_NAMES[key] || key}不足。`);
  const delta = addResources(state,Object.fromEntries(Object.entries(room.cost).map(([key,cost]) => [key,-cost])));
  state.rooms[roomId] = true;
  remember(state,`${room.name}已经建成。`);
  return ok({roomId,delta});
}
export function craft(state,itemId) {
  if (state?.phase !== 'board') return err('只能在圆桌阶段制作物品。');
  const item = ITEMS[itemId];
  if (!item || item.kind !== 'equipment') return err('没有这个配方。');
  if (!state.rooms[item.room]) return err(`需要先建造${ROOMS[item.room].name}。`);
  for (const [key,cost] of Object.entries(item.cost)) {
    const amount = key === 'treasury' ? state.resources.treasury : (state.inventory[key] || 0);
    if (amount < cost) return err(`${key === 'treasury' ? RESOURCE_NAMES[key] : ITEMS[key]?.name || key}不足。`);
  }
  for (const [key,cost] of Object.entries(item.cost)) {
    if (key === 'treasury') state.resources.treasury -= cost;
    else state.inventory[key] -= cost;
  }
  state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
  return ok({itemId,count:state.inventory[itemId]});
}
export function equip(state,knightId,itemId) {
  if (state?.phase !== 'board') return err('只能在圆桌阶段装备物品。');
  const knight = lookupKnight(state,knightId), item = ITEMS[itemId];
  if (!knight || !knight.available) return err('这位骑士尚未加入圆桌。');
  if (knight.busyQuestId) return err('出勤中的骑士不能更换装备。');
  if (!item || item.kind !== 'equipment' || !(state.inventory[itemId] > 0)) return err('没有可装备的这件物品。');
  if (knight.equipment.includes(itemId)) return err('这位骑士已装备同名物品。');
  if (knight.equipment.length >= 2) return err('这位骑士的装备栏已满。');
  state.inventory[itemId]--; knight.equipment.push(itemId);
  return ok({knightId,itemId});
}

export function getKnightDialogue(state, knightId) {
  const knight = lookupKnight(state,knightId);
  if (state?.phase !== 'board' || !knight?.available || knight.busyQuestId || (state.talkedToday || []).includes(knightId)) return null;
  return KNIGHT_DIALOGUES[knightId] ? clone(KNIGHT_DIALOGUES[knightId]) : null;
}
export function talkToKnight(state, knightId, choiceId) {
  const dialogue = getKnightDialogue(state,knightId);
  if (!dialogue) return err('这位骑士现在无法交谈，或今日已经交谈过。');
  const choice = dialogue.choices.find(c => c.id === choiceId);
  if (!choice) return err('没有这个选项。');
  if (!canAfford(state,choice.effects)) return err('国库不足。');
  const knight = lookupKnight(state,knightId);
  const before = knight.affinity; knight.affinity = Math.max(0,Math.min(100,knight.affinity + choice.affinity));
  const delta = addResources(state,choice.effects);
  (state.talkedToday ||= []).push(knightId); remember(state,choice.knowledge);
  return ok({delta,affinity:knight.affinity-before});
}
