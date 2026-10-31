import {renderMap,bindMap} from './map.mjs';
import * as engine from './engine.mjs';
import {RESOURCE_NAMES,SKILL_NAMES,ROOMS,ITEMS} from './content.mjs';
import {initializeSave,saveGame} from './save.mjs';
import {startOpening} from './opening.mjs?v=20261030';
import {showQuestWheels} from './wheel.mjs';


const app=document.querySelector('#app');
let game=null, screen='home', modal=null, towerTab='rooms', selectedQuest=null, selectedKnight=null, dialogueKnight=null, choicesOpen=false, saved=null, saveInfo='正在连接存档…', toast='', toastTimer, audienceTransition=false, wheelActive=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const displaySpeaker=name=>name==='塔楼顾问'?'塔楼顾问 · 阿尔林':name;
const portraits={anwen:0,beilu:1,mira:2,lin:3,yewu:4};
const visitors=[
 ['北坡信使','谷物商人','石匠会长','村中药师','商会代表','仓库管理员','林地守望人','贵族使者','藏书官'],
 ['东岸农户','巡塔守卫','塔楼顾问','守钟人','圆桌管事','渡口商人','门厅侍从','磨坊学徒','林地长者'],
 ['议会书记','地窖管理员','远行商人','边境信使','议会记录员','议会代表']
];
const speakerKnights={'琳':'lin','夜武':'yewu'};
function portraitStyle(sheet,index,columns,rows){
 const x=(index%columns)*100/(columns-1), y=Math.floor(index/columns)*100/(rows-1);
 return `background-image:url('./assets/${sheet}.png');background-size:${columns*100}% ${rows*100}%;background-position:${x}% ${y}%`;
}
const avatar=(id,klass='avatar',pose=0)=>['anwen','beilu','mira'].includes(id)?`<div class="${klass} hd-knight hd-${id}" style="background-image:url('./assets/knight-${id}.png')"></div>`:`<div class="${klass}" style="${portraitStyle('characters-knights',portraits[id]+pose*5,5,2)}"></div>`;
function visitor(name){
 if(name==='塔楼顾问')return '<img class="character audience-portrait advisor-portrait" src="./assets/arlin-audience.png" alt="塔楼顾问 · 阿尔林">';
 const sheet=visitors.findIndex(group=>group.includes(name));
 const index=sheet<0?0:visitors[sheet].indexOf(name);
 const file=speakerKnights[name]?`visitor-${speakerKnights[name]}`:`visitor-${sheet+1}-${index}`;
 return `<img class="character audience-portrait" src="./assets/portraits/${file}.png" alt="${esc(name)}">`;
}
const uiIcon=index=>`<span class="ui-icon" aria-hidden="true" style="background-position:${(index%4)*100/3}% ${Math.floor(index/4)*50}%"></span>`;
// Decorate visible resource names after rendering, leaving text and accessible labels intact.
function decorateResources(root){
 const names=[...Object.entries(RESOURCE_NAMES),...['iron','herbs','seal'].map(id=>[id,ITEMS[id].name])], pattern=new RegExp(`(${names.map(([,name])=>name).join('|')})`,'g');
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())if(pattern.test(walker.currentNode.nodeValue)){nodes.push(walker.currentNode);pattern.lastIndex=0}else pattern.lastIndex=0;
 for(const node of nodes){
  const parts=node.nodeValue.split(pattern), fragment=document.createDocumentFragment();
  for(const part of parts){const entry=names.find(([,name])=>name===part);if(entry){const icon=document.createElement('span');icon.className=`inline-resource-icon resource-icon-${entry[0]}`;icon.setAttribute('aria-hidden','true');fragment.append(icon)}fragment.append(document.createTextNode(part))}
  node.replaceWith(fragment);
 }
}
const btn=(action,label,extra='',klass='paper-button')=>`<button class="${klass}" data-action="${action}" ${extra}>${label}</button>`;
const valueChanges=(effects={})=>Object.entries(effects).filter(([,v])=>v).map(([k,v])=>`${RESOURCE_NAMES[k]||ITEMS[k]?.name||k} ${v>0?'+':''}${v}`).join(' · ')||'没有直接变化';
const costText=cost=>Object.entries(cost).map(([k,v])=>`${RESOURCE_NAMES[k]||ITEMS[k]?.name||k} ${v}`).join('、');
function notify(message){toast=message;clearTimeout(toastTimer);render();toastTimer=setTimeout(()=>{toast='';render()},2800)}
function hud(){
 const info={people:'民众的支持；影响王国结局。',nobles:'贵族的支持；影响王国结局。',merchants:'商会的支持；影响建设与结局。',scholars:'学者的支持；影响建设与结局。',mystics:'秘仪师的支持；影响建设与结局。',treasury:'可用于决策、建设与制作。'};
 return `<div class="hud"><div class="hud-left"><div class="hud-day">第 <b>${game.day}</b> 日 <span class="top-title">/ 14</span></div><div class="resource-group">${Object.entries(game.resources).map(([k,v])=>`<div class="resource ${k==='treasury'?'gold':''}" tabindex="0" aria-label="${RESOURCE_NAMES[k]} ${v}。${info[k]}"><span class="resource-symbol resource-${k}"><span class="inline-resource-icon resource-icon-${k}" aria-hidden="true"></span></span><span class="resource-value" data-resource="${k}">${v}</span><span class="resource-tip" role="tooltip"><strong>${RESOURCE_NAMES[k]}</strong><small>${info[k]}</small></span></div>`).join('')}</div></div><div class="hud-right">${[['map',8,'王国地图'],['time',7,'时间回溯'],['journal',8,'见闻手记'],['save',9,'保存进度'],['help',10,'玩法说明']].map(([a,i,t])=>`<button class="icon-button" data-action="${a}" title="${t}" aria-label="${t}"><img class="navigation-icon" src="./assets/navigation/${a}.png" alt=""></button>`).join('')}</div></div>`
}
function home(){return `<div class="home-vignette"></div><div class="home-content"><div class="home-kicker">一座塔 · 一场漫长的抉择</div><h1>暮塔之主</h1><div class="ornament">${uiIcon(11)}</div><p class="home-sub">接见来访者，回应他们的请求。<br>召集骑士，决定王国的未来。</p><div class="home-buttons">${btn('new','开始新的旅程','','ribbon-button')}${saved?btn('continue','继续旅程','','ribbon-button'):''}${btn('help','如何游玩','','ribbon-button')}</div><p class="home-meta">十四日章节<br>${esc(saveInfo)}</p></div>`}
function audience(){const event=engine.getAudience(game);return `<div class="goal">${event?`接见来访者 <strong>${game.audienceIndex+1} / 2</strong>`:'今日接见已结束'}</div>${visitor(event?.speaker||'塔楼顾问',choicesOpen)}<div class="name-banner"><small>${event?esc(event.title):'圆桌等待着你'}</small>${esc(displaySpeaker(event?.speaker||'塔楼顾问'))}</div><div class="dialogue ${choicesOpen?'dialogue-deciding':''}"><div class="speaker-tag">${esc(displaySpeaker(event?.speaker||'塔楼顾问'))}</div><p>${esc(event?.text||'陛下，今天的来访者都已离开。现在请前往圆桌，安排骑士处理领地的事务。')}</p>${event&&choicesOpen?`<div class="dialogue-choices">${event.choices.map(c=>btn('choose',`${esc(c.text)}<small>${esc(valueChanges(c.effects))}${c.quest?' · 获得派遣任务':''}</small>`,`data-id="${esc(c.id)}"`,'option-button')).join('')}</div>`:event?btn('choices','作出决定','','dialogue-next'):''}</div>${event?'':btn('board','前往圆桌 →','','paper-button scene-travel')}`}
function currentKnight(){return game.knights.find(k=>k.id===selectedKnight&&k.available)||game.knights.find(k=>k.available)}
function currentQuest(){return game.quests.find(q=>q.id===selectedQuest&&['open','running'].includes(q.status))||game.quests.find(q=>['open','running'].includes(q.status))}
function radar(knight,required=[]){
 const entries=Object.entries(SKILL_NAMES),point=(i,r)=>{const a=-Math.PI/2+i*Math.PI/3;return [110+Math.cos(a)*r,110+Math.sin(a)*r]};
 const points=r=>entries.map((_,i)=>point(i,r).join(',')).join(' ');
 const grids=[20,40,60].map(r=>`<polygon points="${points(r)}" class="radar-grid"/>`).join('');
 const axes=entries.map((_,i)=>{const [x,y]=point(i,60);return `<line x1="110" y1="110" x2="${x}" y2="${y}" class="radar-axis"/>`}).join('');
 const shape=entries.map(([key],i)=>point(i,Math.max(0,Math.min(10,knight.skills[key]||0))*6).join(',')).join(' ');
 const labels=entries.map(([key,label],i)=>{const [x,y]=point(i,85);return `<text x="${x}" y="${y+4}" text-anchor="middle" class="${required.includes(key)?'radar-required':''}">${label} ${knight.skills[key]||0}</text>`}).join('');
 return `<svg class="radar" viewBox="0 0 220 220" role="img" aria-label="骑士六维属性。${entries.map(([key,label])=>`${label} ${knight.skills[key]||0}${required.includes(key)?'，当前任务需求':''}`).join('；')}">${grids}${axes}<polygon points="${shape}" class="radar-shape"/>${labels}</svg>`;
}
function board(){const q=currentQuest(), k=currentKnight();if(k)selectedKnight=k.id;if(q)selectedQuest=q.id;const list=game.quests.filter(x=>['open','running'].includes(x.status));const est=q&&k?engine.estimateQuest(game,q.id,k.id):null;const owner=q?.assignedKnightId&&game.knights.find(n=>n.id===q.assignedKnightId);let action=q?.status==='open'?(q.assignedKnightId?btn('unassign','撤回派遣','','paper-button assign-button'):btn('assign','派遣这位骑士','','paper-button assign-button')):'';return `<div class="view-screen"><div class="board-backdrop"></div><section class="quest-panel"><h2 class="panel-title">王国事务</h2><div class="panel-sub">选择事务，再选择一位骑士</div><div class="quest-list">${list.length?list.map(x=>`<button class="quest-card ${x.id===q?.id?'selected':''}" data-action="quest" data-id="${esc(x.id)}"><strong>${esc(x.title)}</strong><small>${esc(x.description)}<br>需求：${x.skills.map(s=>SKILL_NAMES[s]).join(' / ')} · ${x.duration} 日<br>${x.status==='running'?`执行中，剩余 ${x.remaining} 日`:`截止第 ${x.deadline} 日${x.assignedKnightId?' · 已指派':''}`}</small>${x.assignedKnightId?`<span class="assigned-portrait">${avatar(x.assignedKnightId)}<span>${esc(game.knights.find(n=>n.id===x.assignedKnightId)?.name)}</span></span>`:''}</button>`).join(''):'<div class="quest-empty">目前没有待处理的事务。<br>你可以查看塔楼，或结束今日。</div>'}</div><div class="quest-footer">${btn('tower','<img src="./assets/navigation/tower.png" alt="">塔楼与骑士','','paper-button tower-button')}</div></section><div class="board-portrait">${k?avatar(k.id,'character'):''}</div><div class="board-controls">${action}<div class="knight-carousel">${game.knights.filter(n=>n.available).map(n=>`<button class="knight-chip ${n.id===k?.id?'selected':''}" data-action="knight" data-id="${n.id}" title="${esc(n.name)}${n.busyQuestId?' · 执行任务中':''}" aria-label="${esc(n.name)}">${avatar(n.id)}</button>`).join('')}</div><div class="knight-name">${esc(k?.name||'暂无骑士')} ${k?.busyQuestId?' · 任务中':''}</div></div><aside class="stats-panel">${k?`<h3>${esc(k.name)} · ${esc(k.role)}</h3><small>${esc(k.trait)}　|　信任 ${k.affinity}</small>${radar(k,q?.skills||[])}<div class="equip-list">装备：${k.equipment.length?k.equipment.map(id=>ITEMS[id]?.name).join('、'):'暂无'}</div>${q?`<div class="chance">${owner?`指派：${esc(owner.name)}`:`预计成功率 ${est?.chance??0}%`}</div>`:'<div class="chance">请选择左侧事务</div>'}`:''}</aside><div class="board-bottom"><span>圆桌 · 第 ${game.day} 日</span><div>${btn('resolve','结束今日','','paper-button continue-button')}</div></div></div>`}
function frame(title,body,intro=''){return `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">${modal==='results'?'':'<button class="modal-close" data-action="close" aria-label="关闭">关闭</button>'}<h2>${esc(title)}</h2>${intro?`<p class="modal-intro">${intro}</p>`:''}${body}</section></div>`}
function tower(){if(game?.phase!=='board')return frame('塔楼与骑士','<p class="modal-intro">前往圆桌后可建设、制作和交谈。</p>');let tabs=[['rooms','建设'],['craft','工坊'],['knights','骑士']].map(([id,name])=>btn('tab',name,`data-id="${id}"`,`paper-button ${towerTab===id?'active':''}`)).join('');let body='';if(towerTab==='rooms')body=`<div class="modal-grid">${Object.values(ROOMS).map(r=>`<div class="room-card"><img class="room-art" src="./assets/rooms/${r.id}.png" alt="${r.name}" loading="lazy"><strong>${r.name}</strong><p>${r.description}</p><p>需要：${costText(r.cost)}</p>${game.rooms[r.id]?'已建成':btn('build','建设',`data-id="${r.id}"`)}</div>`).join('')}</div>`;if(towerTab==='craft')body=`<p class="modal-intro">材料：${['iron','herbs','seal'].map(id=>`${ITEMS[id].name} ${game.inventory[id]||0}`).join(' · ')}</p><div class="modal-grid">${Object.values(ITEMS).filter(i=>i.kind==='equipment').map(i=>`<div class="item-card"><img class="equipment-art" src="./assets/equipment/${i.id}.png" alt="${i.name}" loading="lazy"><strong>${i.name} <small>拥有 ${game.inventory[i.id]||0}</small></strong><p>${i.description} · 需要${ROOMS[i.room].name}</p><p>材料：${costText(i.cost)}</p>${btn('craft','制作',`data-id="${i.id}"`)}</div>`).join('')}</div>`;if(towerTab==='knights')body=`<p class="modal-intro">空闲骑士每日可交谈一次。</p>${game.knights.filter(k=>k.available).map(k=>`<div class="relationship-row">${avatar(k.id,'avatar',1)}<div><strong>${esc(k.name)} · 信任 ${k.affinity}</strong><small>${esc(k.bio)}<br>${k.busyQuestId?'执行任务中':`装备：${k.equipment.map(x=>ITEMS[x]?.name).join('、')||'无'}`}</small></div>${btn('talk','交谈',`data-id="${k.id}" ${engine.getKnightDialogue(game,k.id)?'':'disabled'}`)}${btn('gear','装备',`data-id="${k.id}" ${k.busyQuestId?'disabled':''}`)}</div>`).join('')}`;return frame('塔楼与骑士',`<div class="modal-tabs">${tabs}</div>${body}`)}
function knightDialogue(){const d=engine.getKnightDialogue(game,dialogueKnight);if(!d)return frame('交谈','<p class="modal-intro">这位骑士暂时无法交谈。</p>');return frame(d.title,`<div class="conversation-portrait">${avatar(d.knightId,'avatar',1)}</div><p class="modal-intro">${esc(d.text)}</p><div class="result-list">${d.choices.map(c=>btn('talk-choice',`${esc(c.text)}<small>信任 ${c.affinity>0?'+':''}${c.affinity} · ${valueChanges(c.effects)}</small>`,`data-id="${c.id}"`,'option-button')).join('')}</div>`)}
function gear(){const k=game.knights.find(x=>x.id===selectedKnight);return frame(`${k.name}的装备`,`<p class="modal-intro">最多装备两件，不能重复。</p><div class="modal-grid">${Object.values(ITEMS).filter(i=>i.kind==='equipment'&&game.inventory[i.id]>0).map(i=>`<div class="item-card"><img class="equipment-art" src="./assets/equipment/${i.id}.png" alt="${i.name}" loading="lazy"><strong>${i.name}</strong><p>${i.description} · 拥有 ${game.inventory[i.id]}</p>${btn('equip','装备',`data-id="${i.id}"`)}</div>`).join('')||'<p>没有可装备的物品。请先到工坊制作。</p>'}</div>${btn('back-tower','返回骑士','','paper-button')}`)}
function modals(){if(!modal)return '';if(modal==='map')return renderMap();if(modal==='help')return frame('如何游玩',`<div class="journal-list"><p><b>接见</b>：回应来访者，平衡各方。</p><p><b>圆桌</b>：按属性派遣骑士，留意期限。</p><p><b>塔楼</b>：建造、制作装备、交谈。</p><p><b>时光</b>：回到曾经历的日子，重新选择。</p></div>`);if(modal==='tower')return tower();if(modal==='talk')return knightDialogue();if(modal==='gear')return gear();if(modal==='time')return frame('时光回廊',`<p class="modal-intro">回到某日清晨，见闻保留。</p><div class="history-list">${game.history.slice().reverse().map(h=>`<div class="history-card"><strong>第 ${h.day} 日的清晨</strong><p>从这一天重新开始</p>${btn('rewind','回到这一天',`data-id="${h.day}"`)}</div>`).join('')}</div>`);if(modal==='journal')return frame('见闻手记',`<div class="journal-list">${game.knowledge.map(x=>`<p>${uiIcon(11)} ${esc(x)}</p>`).join('')}</div>`,`已回溯 ${game.rewinds} 次`);if(modal==='results'){const names={critical:'出色完成',success:'完成',failure:'失败',expired:'过期',in_progress:'执行中',info:'记录'};return frame(`第 ${game.day} 日 · 圆桌记录`,`<div class="result-list">${game.results.map(r=>`<div class="result-card"><strong>${esc(r.title)} · ${names[r.outcome]}</strong><p>${esc(r.text)}</p><small>${esc(valueChanges(r.delta))}</small></div>`).join('')}</div><div class="modal-actions">${btn('next-day',game.day===14?'查看章节结局':'迎接下一日','','paper-button continue-button')}</div>`)}return ''}
function ending(){return `<div class="ending-view"><div class="ending-inner"><div class="home-kicker">十四日的抉择</div><h2>${esc(game.ending.title)}</h2><p>${esc(game.ending.text)}</p><div class="ornament" style="margin:auto">${uiIcon(11)}</div><p>你已抵达本章节结局。<br>回到过去，也许能看见另一种未来。</p><div class="modal-actions">${btn('time','回溯时间')}${btn('new','重新开始')}</div></div></div>`}
let lastResources=null,lastSpeaker=null,resourceEpoch=0;
function render(){const previous=lastResources;lastResources=game?{...game.resources}:null;const epoch=++resourceEpoch;app.innerHTML=`<div class="scene-bg ${screen!=='home'&&game?.phase==='audience'?'audience-background':game&&['board','results'].includes(game.phase)?'round-table-bg':''}"></div><div class="scene-tint"></div>${screen==='home'?home():`${hud()}${game.phase==='audience'?audience():game.phase==='board'||game.phase==='results'?board():''}${game.phase==='ending'?ending():''}`}${modals()}${toast?`<div class="toast" role="status">${esc(toast)}</div>`:''}`;decorateResources(app);animateResources(previous,epoch);const speaker=game?.phase==='audience'?`${game.day}:${game.audienceIndex}`:null;if(speaker&&speaker!==lastSpeaker)app.querySelector('.character')?.classList.add('visitor-enter');lastSpeaker=speaker;bindMap(app);}
function checked(result,success){if(!result.ok){notify(result.error);return false}if(success)notify(success);else render();return true}
app.addEventListener('click',async e=>{const b=e.target.closest('button[data-action]');if(!b||b.disabled||audienceTransition||wheelActive)return;const a=b.dataset.action,id=b.dataset.id;
 if(a==='new'){clearTimeout(toastTimer);toast='';game=engine.createGame(Math.floor(Math.random()*4294967295)||1);screen='game';modal=null;choicesOpen=false;selectedKnight=null;selectedQuest=null;render();startOpening(app)}
 else if(a==='continue'&&saved){game=structuredClone(saved);screen='game';modal=game.phase==='results'?'results':null;render()}
 else if(a==='close'){modal=null;render()}
 else if(a==='help'){modal='help';render()}
 else if(a==='choices'){choicesOpen=true;render()}
 else if(a==='cancel-choices'){choicesOpen=false;render()}
 else if(a==='choose'){
  audienceTransition=true;
  const character=app.querySelector('.character');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(character&&!reduced){character.classList.add('visitor-exit');await new Promise(resolve=>setTimeout(resolve,220))}
  const result=engine.chooseAudience(game,id);
  if(result.ok){choicesOpen=false;notify(`决定已记录 · ${valueChanges(result.delta)}`);if(!reduced)app.querySelector('.character')?.classList.add('visitor-enter')}
  else notify(result.error);
  audienceTransition=false;
 }
 else if(a==='board'){checked(engine.goBoard(game))}
 else if(a==='quest'){selectedQuest=id;render()}
 else if(a==='knight'){selectedKnight=id;render()}
 else if(a==='assign'){const q=currentQuest(),k=currentKnight();if(q&&k)checked(engine.assignKnight(game,q.id,k.id),`${k.name}已接受「${q.title}」`)}
 else if(a==='unassign'){const q=currentQuest();if(q)checked(engine.unassignKnight(game,q.id),'已撤回派遣')}
 else if(a==='resolve'){
  const next=structuredClone(game), r=engine.resolveBoard(next);
  if(!r.ok){notify(r.error);return}
  const items=r.results.filter(result=>['critical','success','failure'].includes(result.outcome)&&result.knightId).map(result=>{
   const estimate=engine.estimateQuest(game,result.questId,result.knightId);
   return {...result,...estimate};
  });
  const finish=()=>{game=next;wheelActive=false;modal='results';render()};
  if(items.length){clearTimeout(toastTimer);toast='';render();wheelActive=true;showQuestWheels(app,items,finish)}else finish();
 }
 else if(a==='next-day'){const r=engine.finishResults(game);if(r.ok){modal=null;selectedQuest=null;render()}else notify(r.error)}
 else if(a==='map'){modal='map';render()}
 else if(a==='tower'){modal='tower';render()}
 else if(a==='tab'){towerTab=id;render()}
 else if(a==='build')checked(engine.buildRoom(game,id),'塔楼建设完成');
 else if(a==='craft')checked(engine.craft(game,id),`${ITEMS[id].name}制作完成`);
 else if(a==='talk'){dialogueKnight=id;modal='talk';render()}
 else if(a==='talk-choice'){const r=engine.talkToKnight(game,dialogueKnight,id);if(r.ok){modal='tower';notify(`交谈结束 · 信任 ${r.affinity>0?'+':''}${r.affinity}`)}else notify(r.error)}
 else if(a==='gear'){selectedKnight=id;modal='gear';render()}
 else if(a==='back-tower'){towerTab='knights';modal='tower';render()}
 else if(a==='equip')checked(engine.equip(game,selectedKnight,id),'装备成功');
 else if(a==='time'||a==='journal'){modal=a;render()}
 else if(a==='rewind'){const r=engine.rewind(game,Number(id));if(r.ok){modal=null;screen='game';selectedQuest=null;choicesOpen=false;notify(`已回到第 ${game.day} 日`)}else notify(r.error)}
 else if(a==='save'){b.disabled=true;const snapshot=structuredClone(game);const result=await saveGame(snapshot);if(result.ok)saved=snapshot;notify(result.message)}
});
render();
initializeSave().then(result=>{if(result.state)saved=result.state;saveInfo=result.status==='found'?'发现云端存档，可继续旅程。':result.status==='empty'?'已连接云存档。':result.message||'云存档暂不可用。';if(screen==='home')render()}).catch(()=>{saveInfo='云存档暂不可用。';if(screen==='home')render()});

function kingdomMap(){return renderMap()}

function animateResources(previous,epoch){if(!previous||!game)return;for(const [key,value] of Object.entries(game.resources)){const delta=value-previous[key],node=app.querySelector('[data-resource="'+key+'"]');if(!delta||!node)continue;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced)continue;node.textContent=previous[key];const change=document.createElement('span');change.className='resource-change '+(delta>0?'gain':'loss');change.textContent=(delta>0?'+':'')+delta;node.append(change);setTimeout(()=>{if(resourceEpoch!==epoch)return;node.textContent=value;node.classList.add('resource-settled')},1050)}}

app.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal==='map'){modal=null;render()}});
