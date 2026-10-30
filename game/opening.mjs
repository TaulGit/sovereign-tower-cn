// Chinese translation of the opening lines supplied by the creator in screenshots.
export const OPENING_SCENES = [
  {image:'opening-forest.png', text:'被世人遗忘、抛弃的可怜麻风病人，在古老的王国中寻求救赎。'},
  {image:'opening-forest.png', text:'绝望与疲惫之际，一个轻柔的声音在心中回响，召唤着他前往遥远的地方。'},
  {image:'opening-tower.png', text:'旅程的尽头，这个可怜人终于抵达了高塔的废墟——它是曾经辉煌的布雷塔尼亚王国最后的遗迹。'},
  {image:'opening-tower.png', text:'仿佛有一种名为命运的力量，引领他来到这片被遗忘之地。'},
  {image:'opening-crowd.png', text:'高塔脚下，几位贵族正在争论。王位的甄选又一次令人失望。'},
  {image:'opening-crowd.png', text:'王之塔的大门依然紧闭，预言也未曾实现。'},
  {image:'opening-key.png', text:'陌生人穿过人群，伸手去拿那把传说中的钥匙。'},
  {image:'opening-key.png', text:'预言在他的脑海中回响：“唯有众神选中的真正君王，才能用银钥匙打开高塔之门。”'},
  {image:'opening-door.png', text:'而大门……为他打开了。'},
  {image:'opening-crown.png', text:'从此以后，人们称他为……'},
  {image:'opening-crown.png', text:'高塔的君王。'},
  {image:'throne-room.png', speaker:'塔楼顾问 · 阿尔林', text:'早安，陛下。看到这座高塔重新焕发生机，真是不可思议……'}
];

/** Mount a self-contained, skippable prologue over the current game view. */
export function startOpening(container,onFinish=()=>{}) {
  let index=0, currentImage='', transitionToken=0, ended=false, historyOpen=false;
  const layer=document.createElement('section');
  layer.className='opening';
  layer.setAttribute('role','dialog');
  layer.setAttribute('aria-label','故事序章');
  layer.setAttribute('aria-modal','true');
  layer.innerHTML=`<div class="opening-scenes" aria-hidden="true"></div><div class="opening-shade"></div><div class="opening-arlin" hidden aria-hidden="true"></div><button type="button" class="opening-skip">跳过</button><button type="button" class="opening-history-toggle" aria-expanded="false" aria-controls="opening-history">文字记录</button><div class="opening-dialogue"><div class="opening-speaker"></div><p class="opening-text" aria-live="polite"></p><button type="button" class="opening-next" aria-label="下一句">继续 <span class="opening-next-icon" aria-hidden="true"></span></button></div><section id="opening-history" class="opening-history" role="dialog" aria-label="序章文字记录" hidden><div class="opening-history-header"><strong>文字记录</strong><button type="button" class="opening-history-close">关闭</button></div><div class="opening-history-list"></div></section>`;
  container.append(layer);
  const scenes=layer.querySelector('.opening-scenes'), text=layer.querySelector('.opening-text'), speaker=layer.querySelector('.opening-speaker'), next=layer.querySelector('.opening-next');
  const history=layer.querySelector('.opening-history'), historyList=layer.querySelector('.opening-history-list'), historyToggle=layer.querySelector('.opening-history-toggle');
  for (const image of new Set(OPENING_SCENES.map(s=>s.image))) { const preload=new Image(); preload.src=`./assets/${image}`; }
  function show() {
    const scene=OPENING_SCENES[index];
    if (scene.image!==currentImage) {
      currentImage=scene.image;
      const background=document.createElement('div');
      background.className='opening-background';
      background.style.backgroundImage=`url("./assets/${scene.image}")`;
      scenes.append(background);
      const token=++transitionToken;
      // Keep the prior background beneath the incoming image while it fades in.
      setTimeout(()=>{if(token===transitionToken && !ended) [...scenes.children].slice(0,-1).forEach(node=>node.remove())},900);
    }
    layer.querySelector('.opening-arlin').hidden=scene.speaker!=='塔楼顾问 · 阿尔林';
    speaker.textContent=scene.speaker||'旁白';
    text.textContent=scene.text;
    next.innerHTML=index===OPENING_SCENES.length-1?'进入高塔 <span class="opening-next-icon" aria-hidden="true"></span>':'继续 <span class="opening-next-icon" aria-hidden="true"></span>';
  }
  function toggleHistory(open) {
    historyOpen=open;
    history.hidden=!open;
    historyToggle.setAttribute('aria-expanded',String(open));
    if(open){
      historyList.replaceChildren();
      for(const scene of OPENING_SCENES.slice(0,index+1)){
        const entry=document.createElement('p'), name=document.createElement('strong');
        name.textContent=scene.speaker||'旁白';
        entry.append(name,document.createTextNode(`：${scene.text}`));
        historyList.append(entry);
      }
      historyList.scrollTop=historyList.scrollHeight;
      layer.querySelector('.opening-history-close').focus({preventScroll:true});
    } else historyToggle.focus({preventScroll:true});
  }
  function finish() { if(ended)return; ended=true; document.removeEventListener('keydown',onKeydown); layer.classList.add('opening-leaving'); setTimeout(()=>{layer.remove(); onFinish()},450); }
  function advance(){if(ended||historyOpen)return; if(index===OPENING_SCENES.length-1)finish();else {index++;show()}}
  layer.addEventListener('click',event=>{
    event.stopPropagation();
    if(event.target.closest('.opening-skip')) return finish();
    if(event.target.closest('.opening-history-toggle')) return toggleHistory(!historyOpen);
    if(event.target.closest('.opening-history-close')) return toggleHistory(false);
    if(event.target.closest('.opening-dialogue')) advance();
  });
  function onKeydown(event){
    if(ended)return;
    if(event.key==='Escape'){event.preventDefault(); if(historyOpen)toggleHistory(false);else finish(); return}
    if(event.key===' '&&!event.repeat&&!historyOpen){
      const focused=event.target.closest?.('button');
      if(focused&&focused!==next)return;
      event.preventDefault(); advance();
    }
  }
  document.addEventListener('keydown',onKeydown);
  show();next.focus({preventScroll:true});
}
