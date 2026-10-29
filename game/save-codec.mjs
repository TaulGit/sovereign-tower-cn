import {KNIGHTS,EVENTS_BY_DAY} from './content.mjs';
const clone=value=>JSON.parse(JSON.stringify(value));
const quests=new Map(Object.values(EVENTS_BY_DAY).flat().flatMap(event=>event.choices.map(c=>c.quest).filter(Boolean)).map(q=>[q.id,q]));
const knightFields=['id','affinity','available','busyQuestId','equipment'];
const questFields=['id','remaining','deadline','status','assignedKnightId','startedDay'];
const pick=(obj,keys)=>Object.fromEntries(keys.filter(k=>k in obj).map(k=>[k,clone(obj[k])]));
const endings={
 fragile:{title:'摇晃的盟约',text:'十四天过去，塔楼仍然矗立。裂痕尚未弥合，下一次议会需要有人先伸出手。'},
 unity:{title:'灯火与盟约',text:'各方共同守住了暮塔。古印的秘密仍在，但再没有人需要独自面对它。'},
 guard:{title:'守望之誓',text:'骑士团接下守塔的誓言，城中终于能够在钟声中安睡。'},
 research:{title:'未尽的密卷',text:'学者记录下裂缝的每一次闪动。答案仍在远方，但探索已经开始。'},
 mystery:{title:'尚未写完的密卷',text:'塔印的来历仍藏在旧卷深处。你决定让圆桌继续追寻答案。'},
 alliance:{title:'圆桌之约',text:'各方代表终于坐到同一张桌前。盟约只是开端，守约将是下一场考验。'},
 renewal:{title:'灯火重新亮起',text:'十四日的风雨后，街道逐渐恢复生机。塔楼的灯火还将照亮更远的道路。'}
};
const resultFields=['questId','knightId','outcome','delta','roll'];
function packCore(state){const {knights,quests:taskList,history,results,ending,...other}=state;return {...clone(other),ending:ending?.id||null,results:results.map(r=>pick(r,resultFields)),knights:knights.map(k=>pick(k,knightFields)),quests:taskList.map(q=>pick(q,questFields))}}
function restoreResult(r,state){
 const quest=state.quests.find(q=>q.id===r.questId), knight=state.knights.find(k=>k.id===r.knightId),name=knight?.name||'';
 let text=''; if(r.outcome==='critical')text=`${name}出色地完成了任务。`;
 else if(r.outcome==='success')text=`${name}完成了任务。`;
 else if(r.outcome==='failure')text=name?`${name}未能完成任务，带回了经验。`:'任务缺少骑士，未能完成。';
 else if(r.outcome==='expired')text=quest?.startedDay!=null?'任务在期限内未能完成。':'任务超过期限，未能派遣。';
 else if(r.outcome==='in_progress')text=`仍在执行，预计还需 ${quest.remaining} 天。`;
 else if(r.outcome==='info')text='今日没有完成或过期的任务。';else throw new Error('unknown result');
 return {questId:r.questId,title:quest?.title||'圆桌记录',knightId:r.knightId,knightName:name,outcome:r.outcome,...(Number.isInteger(r.roll)?{roll:r.roll}:{}),text,delta:clone(r.delta)};
}
function unpackCore(state){
 if(!state||!Array.isArray(state.knights)||!Array.isArray(state.quests)||!Number.isInteger(state.day))throw new Error('invalid save');
 const restored={...clone(state),knights:state.knights.map(k=>{const base=KNIGHTS.find(n=>n.id===k.id);if(!base)throw new Error('unknown knight');return {...clone(base),...clone(k)}}),quests:state.quests.map(q=>{const base=quests.get(q.id);if(!base)throw new Error('unknown quest');return {...clone(base),...clone(q)}})};
 if(state.ending){if(!endings[state.ending])throw new Error('unknown ending');restored.ending={id:state.ending,...endings[state.ending]}}
 restored.results=state.results.map(r=>restoreResult(r,restored));return restored;
}
export function encodeSave(state){return {saveVersion:2,state:{...packCore(state),history:state.history.map(h=>({day:h.day,snapshot:packCore(h.snapshot)}))}}}
export function decodeSave(value){
 if(!value||![1,2].includes(value.saveVersion)||!value.state)throw new Error('unsupported save version');
 if(value.saveVersion===1){if(!Number.isInteger(value.state.day)||!Array.isArray(value.state.knights)||!Array.isArray(value.state.history))throw new Error('invalid save');return clone(value.state)}
 const {history,...core}=value.state;if(!Array.isArray(history))throw new Error('invalid history');return {...unpackCore(core),history:history.map(h=>({day:h.day,snapshot:{...unpackCore(h.snapshot),history:[]}}))};
}
