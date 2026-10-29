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
  {image:'opening-crown.png', speaker:'阿尔林', text:'早安，陛下。看到这座高塔重新焕发生机，真是不可思议……'}
];

/** Mount a self-contained, skippable prologue over the current game view. */
export function startOpening(container,onFinish=()=>{}) {
  let index=0, currentImage='', transitionToken=0, ended=false;
  const layer=document.createElement('section');
  layer.className='opening';
  layer.setAttribute('role','dialog');
  layer.setAttribute('aria-label','故事序章');
  layer.setAttribute('aria-modal','true');
  layer.innerHTML=`<div class="opening-scenes" aria-hidden="true"></div><div class="opening-shade"></div><button type="button" class="opening-skip">跳过</button><div class="opening-dialogue"><div class="opening-speaker"></div><p class="opening-text" aria-live="polite"></p><button type="button" class="opening-next" aria-label="下一句">继续 <span>◆</span></button></div>`;
  container.append(layer);
  const scenes=layer.querySelector('.opening-scenes'), text=layer.querySelector('.opening-text'), speaker=layer.querySelector('.opening-speaker'), next=layer.querySelector('.opening-next');
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
    speaker.textContent=scene.speaker||'旁白';
    text.textContent=scene.text;
    next.innerHTML=index===OPENING_SCENES.length-1?'进入高塔 <span>◆</span>':'继续 <span>◆</span>';
  }
  function finish() { if(ended)return; ended=true; layer.classList.add('opening-leaving'); setTimeout(()=>{layer.remove(); onFinish()},450); }
  layer.addEventListener('click',event=>{
    event.stopPropagation();
    if(event.target.closest('.opening-skip')) return finish();
    if(event.target.closest('.opening-next')) { if(index===OPENING_SCENES.length-1) finish(); else {index++;show()} }
  });
  layer.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();finish()}});
  show();next.focus({preventScroll:true});
}
