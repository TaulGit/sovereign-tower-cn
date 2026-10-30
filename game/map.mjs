export const MAP_PLACES = [
 {id:'tower',name:'暮塔',x:50,y:49,detail:'王座与圆桌所在之地。骑士在此接受派遣，工坊与藏书阁守护着高塔的未来。'},
 {id:'forest',name:'北坡雾林',x:37,y:28,detail:'北坡巡夜灯接连熄灭。迷雾遮住了林间道路，也留下了等待骑士查明的线索。'},
 {id:'outpost',name:'林地哨所',x:27,y:38,detail:'守望人与巡林骑士的驻地。哨所沿林缘守护商道，留意森林深处的动静。'},
 {id:'bridge',name:'旧桥',x:39,y:57,detail:'连接河流两岸的古老石桥。粮车与商队从这里通行，桥梁的安危牵动整个领地。'},
 {id:'fields',name:'东岸农田',x:75,y:49,detail:'农户、磨坊与粮仓散布在河岸。丰收与洪水决定着王国粮食的来源。'},
 {id:'ferry',name:'渡口',x:65,y:71,detail:'河道与商路交会的渡口。远行商人带来货物，也带来边境的消息。'},
 {id:'court',name:'旧廷',x:73,y:28,detail:'贵族与使者的来处。昔日宫廷仍影响着各方对新王座的态度。'},
 {id:'ruins',name:'古印遗迹',x:52,y:20,detail:'残破的石柱围绕着幽光。古印、塔镜与裂隙的秘密在此交织。'}
];

export function renderKingdomMap(selectedId=null,zoom=2){
 const place=MAP_PLACES.find(p=>p.id===selectedId);
 const scale=Math.max(1.5,Math.min(3,zoom));
 const offset=(target,coordinate)=>Math.max(100-scale*100,Math.min(0,target-scale*coordinate));
 const markers=MAP_PLACES.map(p=>`<button class="map-place" data-action="map-location" data-id="${p.id}" style="left:${p.x}%;top:${p.y}%" aria-label="放大查看${p.name}"><strong>${p.name}</strong></button>`).join('');
 return `<div class="overlay map-overlay"><section class="kingdom-map ${place?'is-detail':''}" role="dialog" aria-modal="true" aria-label="${place?place.name+'地点详情':'王国地图'}">
 <div class="map-viewport"><div class="map-canvas" style="${place?`transform:translate(${offset(50,place.x)}%,${offset(43,place.y)}%) scale(${scale});`:''}"><img src="./assets/kingdom-map.png" alt="暮塔王国的山林、城镇与河流">${place?`<span class="map-focus-ring" style="left:${place.x}%;top:${place.y}%"></span>`:markers}</div></div>
 <h2>${place?place.name:'暮塔疆域'}</h2><button class="paper-button map-close" data-action="close">关闭地图</button>
 ${place?`<div class="map-zoom-controls"><button class="paper-button" data-action="map-zoom" data-id="-0.5" aria-label="缩小" ${scale<=1.5?'disabled':''}>−</button><output>${Math.round(scale*100)}%</output><button class="paper-button" data-action="map-zoom" data-id="0.5" aria-label="放大" ${scale>=3?'disabled':''}>＋</button></div><aside class="map-location-card"><strong>${place.name}</strong><p>${place.detail}</p><button class="paper-button" data-action="map-overview">返回全图</button></aside>`:'<p class="map-hint">选择一个地点，放大查看疆域细节</p>'}
 </section></div>`;
}
