// 原创人物、事件与道具；不包含参考游戏的台词或剧情文本。
export const RESOURCE_NAMES = { people:'民心', nobles:'贵族', merchants:'商会', scholars:'学者', mystics:'秘仪', treasury:'国库' };
export const SKILL_NAMES = { strength:'力量', agility:'敏捷', charisma:'魅力', magic:'魔法', wit:'才智', luck:'运气' };
export const KNIGHTS = [
  { id:'anwen', name:'安雯', role:'雾林游侠', trait:'谨慎', bio:'总会先看脚印，再问发生了什么。', portrait:0, skills:{strength:5,agility:8,charisma:4,magic:3,wit:6,luck:6}, affinity:55, available:true },
  { id:'beilu', name:'贝鲁', role:'山地护卫', trait:'忠直', bio:'擅长正面解决麻烦，也愿意替别人扛责任。', portrait:1, skills:{strength:9,agility:4,charisma:4,magic:2,wit:5,luck:5}, affinity:55, available:true },
  { id:'mira', name:'米拉', role:'巡塔术士', trait:'好奇', bio:'相信每一道古怪的谜题都该被认真提问。', portrait:2, skills:{strength:3,agility:5,charisma:5,magic:9,wit:7,luck:4}, affinity:55, available:true },
  { id:'lin', name:'琳', role:'银舌使者', trait:'圆滑', bio:'能在针锋相对的谈判里找到一条退路。', portrait:3, skills:{strength:3,agility:6,charisma:9,magic:4,wit:8,luck:7}, affinity:45, available:false },
  { id:'yewu', name:'夜武', role:'黑羽骑士', trait:'倔强', bio:'曾为对手效力，如今想证明自己的选择。', portrait:4, skills:{strength:8,agility:8,charisma:3,magic:4,wit:5,luck:6}, affinity:35, available:false }
];
export const ROOMS = {
  forge:{id:'forge',name:'铸造室',description:'修复铁器，制造骑士的护具。',cost:{treasury:12,merchants:3}},
  alchemy:{id:'alchemy',name:'药剂室',description:'将草药调配为远行用品。',cost:{treasury:10,mystics:3}},
  archive:{id:'archive',name:'藏书阁',description:'整理秘闻，提升对事件的理解。',cost:{treasury:10,scholars:3}}
};
export const ITEMS = {
  iron:{id:'iron',name:'铁矿',description:'铸造材料',kind:'material'},
  herbs:{id:'herbs',name:'草药',description:'制药材料',kind:'material'},
  seal:{id:'seal',name:'古印',description:'带有塔楼印记的稀有材料',kind:'material'},
  shield:{id:'shield',name:'星纹盾',description:'力量 +2',kind:'equipment',room:'forge',cost:{iron:2,treasury:4},bonus:{strength:2}},
  boots:{id:'boots',name:'轻行靴',description:'敏捷 +2',kind:'equipment',room:'forge',cost:{iron:1,treasury:5},bonus:{agility:2}},
  charm:{id:'charm',name:'萤灯护符',description:'魔法 +2',kind:'equipment',room:'alchemy',cost:{herbs:2,treasury:4},bonus:{magic:2}},
  notebook:{id:'notebook',name:'巡塔手札',description:'才智 +2',kind:'equipment',room:'archive',cost:{seal:1,treasury:3},bonus:{wit:2}},
  brooch:{id:'brooch',name:'和谈胸针',description:'魅力 +2',kind:'equipment',room:'alchemy',cost:{herbs:1,treasury:5},bonus:{charisma:2}}
};
const Q = (id,title,description,skills,difficulty,duration,deadlineOffset,rewards,penalties) => ({id,title,description,skills,difficulty,duration,deadlineOffset,rewards,penalties});
const C = (id,text,effects={},quest=null,extra={}) => ({id,text,effects,quest,...extra});
const E = (id,title,speaker,text,choices) => ({id,title,speaker,text,choices});
export const EVENTS_BY_DAY = {
  1:[
    E('d1_fog','雾林的灯火','北坡信使','北坡起了不散的雾，巡夜灯接连熄灭。村民请求王座派人前去查看。',[
      C('investigate','派骑士前去查探',{people:3,treasury:-3},Q('fog','查探北坡','追寻灯火熄灭的原因。',['agility','wit'],5,1,1,{people:7,scholars:3},{people:-5})),
      C('wait','先封锁道路，等雾散去',{people:-3,treasury:2})]),
    E('d1_grain','粮车停在城门','谷物商人','一支粮队被旧桥拦住。商人希望王座协助通行，价格也许可以商量。',[
      C('escort','安排护送并购买粮食',{treasury:-6,merchants:4},Q('grain','护送粮队','为粮车清出可通行的道路。',['strength','charisma'],5,1,2,{people:5,merchants:5},{merchants:-4})),
      C('tax','让商队自行解决，收取过路费',{treasury:5,merchants:-5,people:-2})])
  ],
  2:[
    E('d2_bridge','石桥的裂缝','石匠会长','连接两岸的桥出现裂痕。若不修复，山村的药材便无法运进城。',[
      C('repair','出钱修桥，并派人巡视',{treasury:-6,people:4},Q('bridge','修补旧桥','监督石匠并清理桥下障碍。',['strength','wit'],6,2,2,{people:6,merchants:4},{people:-5})),
      C('detour','改走山路，暂缓修桥',{treasury:2,merchants:-4})]),
    E('d2_lin','来访的谈判官','琳','一名离开旧廷的谈判官希望在塔中谋职。她要求一个开口的机会。',[
      C('recruit','接受她的效忠，邀请加入圆桌',{treasury:-4,nobles:-2},{...Q('talks','调停集市争执','为两支商队寻找共同的交易条件。',['charisma','wit'],6,1,2,{merchants:6,people:3},{merchants:-4})},{recruit:'lin',knowledge:'琳曾在旧廷担任谈判官。'}),
      C('decline','礼貌谢绝，让她离开',{nobles:3,people:-2})])
  ],
  3:[
    E('d3_well','井底的微光','村中药师','村井夜里浮起蓝光。有人说是好兆头，也有人不敢再饮水。',[
      C('study','派术士与学者共同调查',{treasury:-4,scholars:4},Q('well','检查古井','查明水井异光并恢复安全用水。',['magic','wit'],7,1,2,{mystics:5,people:5},{mystics:-4})),
      C('seal','封井并运送备用水',{people:2,mystics:-2})]),
    E('d3_budget','谁来支付修缮费','商会代表','商会愿意垫付塔楼的修缮费，但希望获得一年的免税资格。',[
      C('accept','接受垫款，给予短期免税',{treasury:9,merchants:4,nobles:-3}),
      C('refuse','拒绝免税，公开账目',{treasury:-3,scholars:4,people:3})])
  ],
  4:[
    E('d4_knight','黑羽骑士的请求','夜武','一位曾在敌方军队服役的骑士来到塔前，要求为过去的行为赎责。',[
      C('trust','给他机会，先从护送任务做起',{people:-2,treasury:-3},Q('blackfeather','山道护送','护送村民穿过不安定的山路。',['strength','agility'],7,2,2,{people:8,nobles:2},{people:-5}),{recruit:'yewu',knowledge:'夜武曾在敌军服役，主动前来赎责。'}),
      C('reject','拒绝效忠，派人送他离境',{nobles:4,people:-3})]),
    E('d4_barn','冬仓里的空位','仓库管理员','寒潮提前到来，粮仓尚未备满。现在拨款可以补充余粮。',[
      C('buy','动用国库收购余粮',{treasury:-9,people:6,merchants:3}),
      C('ration','实行配给，保留国库',{treasury:3,people:-5,nobles:2})])
  ],
  5:[
    E('d5_beast','森林里的脚印','林地守望人','森林深处出现巨大脚印，木工停止作业。守望人希望有人弄清它来自何处。',[
      C('track','派人追踪，但不得贸然伤害',{treasury:-3,mystics:2},Q('forest','追踪森林访客','辨明林中巨兽是否有敌意。',['agility','luck'],8,2,2,{people:5,mystics:6},{people:-5,mystics:-2})),
      C('bounty','征召猎人，尽快清除威胁',{people:3,mystics:-5})]),
    E('d5_accusation','大厅中的指控','贵族使者','一名贵族指控巡塔队偏袒商会，要求立即惩处负责人。',[
      C('hearing','召集双方公开听证',{scholars:4,people:3,nobles:-2}),
      C('punish','先撤换负责人以平息争议',{nobles:5,people:-4,merchants:-2})])
  ],
  6:[
    E('d6_mirror','塔镜留下的影子','藏书官','一面古镜上映出尚未发生的火光。藏书官说镜框里藏着一枚古印。',[
      C('study','记录镜中影像，研究古印',{scholars:5,treasury:-3},Q('mirror','修复古镜','查找镜框中的机关并记录影像。',['magic','wit'],8,1,1,{scholars:5,mystics:4},{scholars:-4}),{material:{seal:1},knowledge:'古镜显示过塔楼未来的火光。'}),
      C('cover','封存古镜，避免引发恐慌',{people:2,mystics:-3})]),
    E('d6_river','河水漫上田埂','东岸农户','连日暴雨让河水越过田埂。农户希望王座派人保护堤坝。',[
      C('reinforce','运送木料并加固河堤',{treasury:-6,people:4},Q('river','加固东岸','在洪峰抵达前稳住河堤。',['strength','agility'],8,1,0,{people:7,merchants:3},{people:-7})),
      C('evacuate','优先转移居民，放弃部分农田',{people:2,merchants:-4})])
  ],
  7:[
    E('d7_seal','破损的塔印','巡塔守卫','塔顶的古印出现一道裂缝，各方代表都在等待你的决定。',[
      C('repair','召集学者与术士共同修复',{treasury:-5,scholars:3,mystics:3},Q('seal','修复塔印','在仪式结束前稳住塔顶古印。',['magic','wit'],9,1,0,{scholars:6,mystics:6},{mystics:-6}),{knowledge:'塔顶古印与远古防御有关。'}),
      C('delay','暂缓仪式，组织居民撤离',{people:4,nobles:-4})]),
    E('d7_council','七日后的议会','塔楼顾问','七天的决定已经改变了王国。议会请你选择下一阶段的首要目标。',[
      C('people','让重建与民生先行',{people:8,treasury:-5},{...Q('rebuild','重建街区','带领居民修整受损的街巷。',['strength','charisma'],7,1,0,{people:5},{people:-4})},{flag:'people_first'}),
      C('alliance','邀请各方代表签订新盟约',{nobles:4,merchants:4,scholars:3},Q('alliance','筹备盟约','说服不同派系派代表出席。',['charisma','wit'],8,1,0,{nobles:3,merchants:3,scholars:3},{nobles:-4}),{flag:'alliance_first'}),
      C('mystery','集中力量追查古印的来历',{mystics:6,scholars:3,treasury:-4},Q('history','追查塔印','在旧档中寻找古印的起源。',['magic','wit'],8,1,0,{mystics:4,scholars:4},{scholars:-4}),{flag:'mystery_first'})])
  ]
};

// 第二周继续第一章的原创故事，每个决定都改变资源或派遣机会。
Object.assign(EVENTS_BY_DAY, {
  8:[
    E('d8_bell','第八声钟','守钟人','昨夜塔钟自己敲响了八下。守钟人发现钟绳上沾着银色粉末。',[
      C('inspect','派人检查钟楼',{treasury:-3,scholars:2},Q('bell','检查钟楼','寻找钟声与银粉的来源。',['agility','wit'],7,1,1,{scholars:5,mystics:3},{scholars:-4}),{knowledge:'第八声钟响时出现了银色粉末。'}),
      C('silence','暂停钟楼使用，安抚居民',{people:3,mystics:-2})]),
    E('d8_wages','骑士的工钱','圆桌管事','连续的差事让随行侍从疲惫。管事希望增加补贴，也提醒国库还有其他用途。',[
      C('pay','从国库支付补贴',{treasury:-6,people:4,nobles:2}),
      C('rest','安排轮休，暂不增加开支',{people:2,merchants:-2})])
  ],
  9:[
    E('d9_scroll','纸背上的地图','藏书官','一张废弃的账册背面画着通向山腹的小路，末端标着一扇没有名字的门。',[
      C('follow','派人沿地图探查',{treasury:-3,scholars:3},Q('map','追寻旧地图','沿山路寻找无名石门。',['wit','luck'],8,2,2,{scholars:5,mystics:4},{people:-4}),{knowledge:'账册背面藏着通向山腹的地图。'}),
      C('copy','先临摹地图，暂不惊动山中居民',{scholars:2,mystics:1})]),
    E('d9_toll','桥上的两种税','渡口商人','新桥开通后，城防与商会各自设卡收费。商队请求议会确定唯一的规则。',[
      C('lower','取消重复收费，统一低额通行费',{merchants:6,people:3,nobles:-3}),
      C('keep','保留城防关卡以补充国库',{treasury:6,merchants:-4})])
  ],
  10:[
    E('d10_mask','戴面具的来访者','门厅侍从','一位戴面具的访客要求面见王座，只说自己知道塔印裂开的原因。',[
      C('meet','安排在圆桌公开会谈',{nobles:-2,scholars:3},Q('mask','调查面具来客','核实来客携带的信物。',['charisma','wit'],8,1,1,{scholars:5,people:2},{nobles:-4}),{knowledge:'面具来客似乎认识塔印。'}),
      C('guard','要求访客先交出信物再入塔',{nobles:2,people:1,mystics:-2})]),
    E('d10_mill','磨坊停转','磨坊学徒','河道堵塞，磨坊已经停了一整天。村民提出要么清淤，要么临时购买面粉。',[
      C('clear','组织队伍清理河道',{people:3,treasury:-3},Q('mill','清理磨坊水道','搬开堵住水轮的木石。',['strength','agility'],8,1,1,{people:6,merchants:2},{people:-4})),
      C('supply','向商队征集面粉，承诺下月结算',{people:2,merchants:-3})])
  ],
  11:[
    E('d11_tree','黑树下的约定','林地长者','古树下的旧石碑被人撬开了。长者说破坏石碑会打破多年前的约定。',[
      C('restore','修复石碑并寻找撬动它的人',{mystics:3,treasury:-4},Q('tree','修复旧石碑','保护古树并搜集现场线索。',['magic','luck'],8,2,2,{mystics:6,people:3},{mystics:-5}),{knowledge:'古树石碑记录着一项旧日约定。'}),
      C('listen','暂不修复，先听取林地居民的意见',{people:2,mystics:2,scholars:-2})]),
    E('d11_letters','相互矛盾的两封信','议会书记','来自同一城镇的两封求援信说法相反。书记建议派遣使者再作决定。',[
      C('verify','派遣使者核实',{treasury:-3,scholars:2},Q('letters','核实求援信','分别拜访两封信的署名人。',['charisma','wit'],8,1,1,{people:4,scholars:4},{nobles:-3})),
      C('mediation','邀请双方来塔中当面对质',{nobles:2,merchants:-2,people:1})])
  ],
  12:[
    E('d12_crypt','塔下的门','地窖管理员','地图所示的石门竟与塔楼地窖相通。门上有三个凹槽，其中一个正在发光。',[
      C('open','安排骑士进入，记录沿途标记',{treasury:-4,mystics:2},Q('crypt','探查塔下石门','探索地窖深处并记录标记。',['magic','wit'],9,2,2,{mystics:5,scholars:5},{mystics:-5}),{material:{seal:1},knowledge:'山腹的石门与塔楼地窖相通。'}),
      C('guard','封锁入口并加派守卫',{nobles:2,people:1,scholars:-2})]),
    E('d12_relic','商队带来的碎片','远行商人','商人出示了一枚与塔印相似的碎片，愿意交给你，但要求免去这趟货税。',[
      C('trade','免税换取碎片',{treasury:-4,merchants:4,mystics:2},null,{material:{seal:1},knowledge:'远行商人带来过一枚塔印碎片。'}),
      C('decline','拒绝交易，只允许学者绘图',{scholars:3,merchants:-1})])
  ],
  13:[
    E('d13_signal','山脊上的烽火','边境信使','山脊连续燃起三道烽火，边境驻队请求支援；另一封信却称那只是误报。',[
      C('scout','派遣斥候确认烽火',{treasury:-3,nobles:2},Q('signal','确认边境烽火','赶往山脊确认驻队情况。',['agility','luck'],9,1,0,{nobles:4,people:4},{people:-5})),
      C('prepare','调集守卫但暂不出城',{nobles:3,merchants:-2})]),
    E('d13_dispute','议会的裂痕','议会记录员','关于塔印的使用，商会与秘仪师互不相让。双方都希望你当众表态。',[
      C('mediate','邀请双方在公开议会上辩论',{people:2,scholars:3,merchants:1,mystics:1}),
      C('mystics','支持秘仪师保管塔印',{mystics:5,merchants:-4}),
      C('merchants','支持商会监督物资使用',{merchants:5,mystics:-4})])
  ],
  14:[
    E('d14_gate','最后一处裂缝','塔楼顾问','塔印与地窖石门同时亮起。圆桌只剩一天时间，为塔楼选择应对的方法。',[
      C('repair','召集骑士与术士稳定塔印',{treasury:-5,mystics:4},Q('lastseal','稳定塔印','在灯火熄灭前稳定石门。',['magic','wit'],9,1,0,{mystics:6,scholars:4},{people:-5}),{flag:'protect_tower'}),
      C('evacuate','先保护居民，逐步撤离塔下街区',{people:6,nobles:-3},{...Q('evacuation','护送街区居民','将居民护送到安全地点。',['strength','charisma'],8,1,0,{people:6},{people:-4})},{flag:'protect_people'}),
      C('record','留下学者记录现象，等待裂缝自行平息',{scholars:5,mystics:-3},Q('record','记录裂缝','观察塔印并保存记录。',['wit','luck'],9,1,0,{scholars:6},{scholars:-4}),{flag:'pursue_truth'})]),
    E('d14_oath','十四日后的誓言','议会代表','两周内，各方的选择都留下了痕迹。代表们请求你决定下一阶段的方向。',[
      C('together','邀请各派共同守护塔与城',{people:5,nobles:3,merchants:3},null,{flag:'ending_unity'}),
      C('barrier','把防御交给骑士团',{nobles:5,people:2},null,{flag:'ending_guard'}),
      C('research','让学者继续追查古印来源',{scholars:5,mystics:3},null,{flag:'ending_research'})])
  ]
});

// 交谈均为原创中文文本；单日每位骑士只能交谈一次。
export const KNIGHT_DIALOGUES = {
  anwen:{knightId:'anwen',title:'巡林之后',speaker:'安雯',text:'安雯把沾着露水的地图放在桌上：“雾林的路每天都在变，不能只相信旧地图。”',choices:[
    {id:'listen',text:'请她把新发现记下来。',affinity:5,effects:{scholars:1},knowledge:'安雯一直在更新雾林地图。'},
    {id:'hurry',text:'让她少记些，先完成任务。',affinity:-2,effects:{people:1}}]},
  beilu:{knightId:'beilu',title:'盔甲与晚饭',speaker:'贝鲁',text:'贝鲁正在擦拭护肩。他抬起头：“队伍可以多走一段路，但侍从也需要休息。”',choices:[
    {id:'care',text:'同意轮休并准备热饭。',affinity:5,effects:{treasury:-1,people:1},knowledge:'贝鲁在意随行侍从的状况。'},
    {id:'order',text:'提醒他任务期限更重要。',affinity:-2,effects:{nobles:1}}]},
  mira:{knightId:'mira',title:'没有答案的公式',speaker:'米拉',text:'米拉的纸上写满了奇怪符号：“这个公式应该能解释塔印，可我总觉得少了一项。”',choices:[
    {id:'study',text:'鼓励她和学者交换想法。',affinity:5,effects:{scholars:1,mystics:1},knowledge:'米拉正在研究塔印的公式。'},
    {id:'focus',text:'先把注意力放在眼前的工作。',affinity:-2,effects:{treasury:1}}]},
  lin:{knightId:'lin',title:'一份未经寄出的信',speaker:'琳',text:'琳折起一封没有署名的信：“谈判时，人们往往更相信自己得到的让步。”',choices:[
    {id:'ask',text:'询问她在旧廷的经历。',affinity:5,effects:{nobles:1,merchants:1},knowledge:'琳仍留着一封没有署名的旧信。'},
    {id:'demand',text:'要求她交出这封信。',affinity:-3,effects:{nobles:2}}]},
  yewu:{knightId:'yewu',title:'黑羽的来处',speaker:'夜武',text:'夜武把一枚破损徽记放在桌角：“我想留下，可旧日的事情不会凭空消失。”',choices:[
    {id:'trust',text:'告诉他，选择会由行动证明。',affinity:5,effects:{people:1},knowledge:'夜武仍保存着破损的旧徽记。'},
    {id:'doubt',text:'要求他以后事事接受监督。',affinity:-3,effects:{nobles:1}}]}
};
