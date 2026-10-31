// The engine resolves a cloned day once; this view reveals its results one at a time.
export function showQuestWheels(container, items, onComplete) {
  let index=0, busy=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layer=document.createElement('div');
  layer.className='wheel-overlay';
  layer.innerHTML='<section class="wheel-modal" role="dialog" aria-modal="true" aria-labelledby="wheel-title"><h2 id="wheel-title"></h2><p class="wheel-knight"></p><div class="wheel-wrap"><div class="wheel-disc" aria-hidden="true"></div><img class="wheel-frame" src="./assets/quest-wheel-frame-v2.png" alt=""><div class="wheel-center" aria-hidden="true"><span class="inline-resource-icon resource-icon-treasury"></span></div></div><p class="wheel-legend"></p><p class="wheel-outcome" aria-live="polite"></p><button type="button" class="paper-button wheel-action"></button></section>';
  container.append(layer);
  // Keep keyboard focus inside the active settlement until all tasks are revealed.
  layer.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();button.focus({preventScroll:true});}});
  const title=layer.querySelector('#wheel-title'), knight=layer.querySelector('.wheel-knight'), disc=layer.querySelector('.wheel-disc'), legend=layer.querySelector('.wheel-legend'), outcome=layer.querySelector('.wheel-outcome'), button=layer.querySelector('.wheel-action');
  const colors={critical:'#d6ac59',success:'#7d9b7a',failure:'#aa6972'};
  const labels={critical:'出色完成',success:'完成',failure:'失败'};
  function show(){
    const item=items[index];
    title.textContent=`${item.title} · ${index+1} / ${items.length}`;
    knight.textContent=`${item.knightName} · 成功率 ${item.chance}%`;
    const bins=Array.from({length:6},(_,i)=>{const grade=item.power-item.difficulty+i-2;return grade>=3?'critical':grade>=0?'success':'failure'});
    disc.style.transition='none';disc.style.transform='rotate(0deg)';
    disc.style.background=`conic-gradient(${bins.map((bin,i)=>`${colors[bin]} ${i*60}deg ${(i+1)*60}deg`).join(',')})`;
    disc.innerHTML=bins.map((bin,i)=>{const angle=(i*60+30)*Math.PI/180;return '<span class="wheel-emblem" style="left:'+(50+30*Math.sin(angle))+'%;top:'+(50-30*Math.cos(angle))+'%"><i class="outcome-icon outcome-'+bin+'"></i><small>'+labels[bin]+'</small></span>'}).join('');
    legend.innerHTML=`<span><i class="outcome-icon outcome-critical"></i>出色完成</span><span><i class="outcome-icon outcome-success"></i>完成</span><span><i class="outcome-icon outcome-failure"></i>失败</span><br>成功 ${item.chance}%（含出色完成） · 失败 ${100-item.chance}%`;
    outcome.textContent='点击执行任务，转动转盘。';button.textContent='执行任务';button.disabled=false;busy=false;
  }
  button.addEventListener('click',()=>{
    if(busy)return;
    if(button.dataset.next==='true'){
      button.dataset.next='false';
      if(++index===items.length){layer.remove();onComplete();}else show();
      return;
    }
    busy=true;button.disabled=true;
    const item=items[index], bins=Array.from({length:6},(_,i)=>{const grade=item.power-item.difficulty+i-2;return grade>=3?'critical':grade>=0?'success':'failure'});
    const sector=Number.isInteger(item.roll)&&bins[item.roll]===item.outcome?item.roll:bins.indexOf(item.outcome);
    // The selected outcome was drawn by the same six-sided roll as the engine.
    disc.style.transition=reduced?'none':'transform 1.8s cubic-bezier(.16,.75,.18,1)';
    disc.getBoundingClientRect();
    disc.style.transform=`rotate(${1800-(Math.max(0,sector)+.5)*60}deg)`;
    setTimeout(()=>{outcome.textContent=`${labels[item.outcome]}：${item.text}`;button.textContent=index===items.length-1?'查看圆桌记录':'下一项任务';button.dataset.next='true';button.disabled=false;busy=false;button.focus({preventScroll:true});},reduced?0:1850);
  });
  show();button.focus({preventScroll:true});
}
