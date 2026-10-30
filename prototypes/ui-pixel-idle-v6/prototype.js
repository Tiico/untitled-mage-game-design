/* THROWAWAY REVIEW BUILD. Local, accelerated simulation; no persistence or authoritative rewards. */
const params = new URLSearchParams(location.search);
const crestStudies = ['base', 'evolved', 'crowned'];
const variant = 'B';
let crestStudy = crestStudies.includes(params.get('crest')) ? params.get('crest') : 'base';
const phone = document.querySelector('#phone');
const realms = ['Fire', 'Ice', 'Earth', 'Wind'];
const places = ['Emberwood', 'Hushed Glacier', 'Verdant Hollow', 'Skyreach'];
const bosses = ['The Ember Sentinel', 'The Glacier Warden', 'The Root Colossus', 'The Sky Keeper'];
const rects = {
    mage:[37,27,251,295],casting:[318,16,348,306],slime:[684,123,232,203],hit:[975,96,254,236],
    golem:[12,330,353,344],moth:[397,414,244,234],fox:[686,423,257,229],spirit:[982,417,235,237],
    workshop:[13,680,326,309],mine:[346,683,307,315],pond:[671,672,296,329],portal:[977,686,265,312],
    fire:[52,1016,241,215],ice:[363,1035,246,196],frost:[674,1014,234,225],shards:[994,1027,219,202]
};
const sprite = (name, extra='') => {
    const bounds=rects[name] || rects.shards;
    let pose='';
    if(name==='mage'||name==='casting'){
        const [x,,w,h]=bounds,feetX=name==='mage'?164:488;
        pose=`;--pose-w:${(w+8)/303*94}%;--pose-h:${(h+8)/303*94}%;--pose-shift:${(x+w/2-feetX)/(w+8)*100}%`;
    }
    return `<span class="sprite ${extra}" data-sprite="${name}" aria-hidden="true" style="${MagePresentation.frameStyle(bounds,.94)}${pose}"><span class="sprite-art"></span></span>`;
};
// Keep visible pixels centered even when source atlas cells have uneven transparent gutters.
const {hudBounds,frameStyle,nextIdleSpell,frontierRealm,visitRealm} = MagePresentation;
const ui = (name, extra='') => `<span class="ui-icon ${extra}" data-ui-icon="${name}" aria-hidden="true" style="${frameStyle(hudBounds[name] || hudBounds.crest)}"><span class="ui-art"></span></span>`;
const resourceIcon = () => realms[state.realm].toLowerCase();
const currencyText = text => text.replace(/\b(fire-shards|ice-shards|ore|pearls)\b/g, word => `${ui(({'fire-shards':'fire','ice-shards':'ice'})[word]||word, 'inline-icon')} ${word}`);
const spells = [
    {name:'Firebolt',art:'fire',element:'Fire',damage:24,cooldown:3,description:'A spark of fire, cast at the nearest enemy.'},
    {name:'Icebolt',art:'ice',element:'Ice',damage:20,cooldown:4,description:'A shard of ice. Add it to your idle build alongside Firebolt.'},
    {name:'Frostfire Bolt',art:'frost',element:'Fusion',damage:62,cooldown:3,description:'Fire and ice, forged together. Both original spells stay in your Library.'}
];
const fresh = () => ({
    view:'realm',realm:0,groups:[0,0,0,0],levels:[1,1,1,1],cleared:[0,0,0,0],won:[false,false,false,false],shards:[0,0,0,0],ore:120,pearls:80,
    idle:['Firebolt'],boss:['Firebolt'],autos:[true,true,true,true],unlocked:['Firebolt'],familiar:0,
    hpBonus:0,damageBonus:0,forgeLevel:1,mining:2,fishing:1,synergy:true,largeCollection:false,
    collectionTab:'spells',build:'idle',queries:{spells:'',familiars:''},filters:{spells:'All',familiars:'All'},pages:{spells:0,familiars:0},
    modal:null,seconds:0,kills:0,enemyHp:40,stageKills:0,connected:true,fight:null,returnPending:false,returnClaimed:false,returned:null
});
let state = fresh();
let toastTimer;
let toastText = '';
let lastFocus;
const esc = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const spell = name => spells.find(s=>s.name===name);
const permanentHp = () => 100 + state.hpBonus;
const spellPower = () => 24 + state.damageBonus;
// Illustrative sum for this review only. No XP, threshold, reward or gate uses it.
const magePower = () => permanentHp() + spellPower();
const compactStat = value => new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(value);
const hpMax = () => Math.round((100 + state.hpBonus) * (state.view === 'fight' && state.familiar % 2 === 0 ? 1.1 : 1));
const power = () => state.damageBonus + (state.view==='fight'?state.boss:state.idle).reduce((sum,name)=>sum+spell(name).damage,0);
const combatPower = () => Math.round(power()*(state.view==='fight' && state.familiar % 2 === 1 ? 1.08 : 1));
const rate = () => (power()/24*.6).toFixed(1);
const gate = () => state.levels[state.realm]===5 && state.cleared[state.realm]>=5 && !state.won[state.realm];
const canVisit = r => MagePresentation.canVisitRealm(state.won,r);
const atCap = () => state.seconds>=43200;
const familiar = id => ({id,name:(id%2?'Ember fox':'Moon moth')+(id>1?` ${String(Math.floor(id/2)+1).padStart(3,'0')}`:''),art:id%2?'fox':'moth',buff:id%2?'+8% Spell damage':'+10% HP',type:id%2?'Damage':'HP'});
const btn = (text,action,secondary=false,disabled=false) => {
    const cost = text.match(/^(.*?) · (\d+) (fire-shards|ice-shards|ore|pearls)$/);
    const prefix = action==='buyHp'?ui('hp','inline-icon'):action==='buyDamage'?ui('power','inline-icon'):'';
    const body = cost ? `<span class="button-label">${prefix}${esc(cost[1])}</span><span class="button-cost">${ui(({'fire-shards':'fire','ice-shards':'ice'})[cost[3]]||cost[3])}<b>${cost[2]}</b></span>` : prefix+currencyText(text);
    return `<button class="rune-button ${secondary?'secondary':''} ${cost?'has-cost':''}" data-action="${action}" aria-label="${esc(text)}" ${disabled?'disabled':''}>${body}</button>`;
};
const icon = name => `<span class="spell-icon ${name?'':'empty'}">${name?sprite(spell(name).art):ui('empty')}</span>`;
function hud() {
    const resources = [
        ['Fire shards',state.shards[0],'fire'],['Ice shards',state.shards[1],'ice'],
        ['Earth shards',state.shards[2],'earth'],['Wind shards',state.shards[3],'wind'],
        ['Ore',state.ore,'ore'],['Pearls',state.pearls,'pearls']
    ];
    const crest = crestStudy==='base'?'crest':crestStudy;
    return `<header class="hud crest-hud" aria-label="Resources and permanent mage stats"><button class="mage-identity" data-action="powerInfo" aria-label="Mage Power ${magePower()}. View permanent stats and rating formula">${ui(crest,'mage-crest')}<span class="mage-power"><small>MAGE POWER</small><strong>${compactStat(magePower())}</strong></span></button><div class="permanent-stats"><span class="stat-number" aria-label="Permanent HP ${permanentHp()}">${ui('hp')}<b>${compactStat(permanentHp())}</b><small>HP</small></span><span class="stat-number" aria-label="Permanent Spell power ${spellPower()}">${ui('power')}<b>${compactStat(spellPower())}</b><small>Spell power</small></span></div><button class="icon-button hud-menu" data-action="menu" aria-label="Open resources, navigation and prototype controls">${ui('settings')}</button><div class="resource-strip">${resources.map(([name,value,art])=>`<button class="resource" data-action="resources" aria-label="${name}: ${value}" title="${name}">${ui(art)}<span>${new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:0}).format(value)}</span></button>`).join('')}</div>${state.view==='fight'?`<div class="combat-health" role="progressbar" aria-label="Player health in this boss fight" aria-valuemin="0" aria-valuemax="${hpMax()}" aria-valuenow="${Math.ceil(state.fight.hp)}"><span class="combat-health-fill" style="width:${Math.max(0,state.fight.hp/hpMax())*100}%"></span><b>${ui('hp','inline-icon')} ${Math.ceil(state.fight.hp)} / ${hpMax()} HP <small>· boss fight</small></b></div>`:''}</header>`;
}

function nav() {
    const items = [['realm','portal','Realm'],['forge','workshop','Forge'],['boss','golem','Boss'],['ventures','mine','Ventures'],['library','book','Collection']];
    return `<nav class="bottom-nav" aria-label="Game navigation">${items.map(([view,art,name])=>`<button data-view="${view}" class="${state.view===view?'active':''}" ${state.view===view?'aria-current="page"':''}>${view==='library'?ui('book'):sprite(art)}${name}</button>`).join('')}</nav>`;
}
const title = (name,kicker='') => `<div class="page-heading"><div>${kicker?`<div class="kicker">${kicker}</div>`:''}<h2>${name}</h2></div></div>`;
function scenery() { return `<div class="scenery ${state.realm===1?'ice':''}" style="--realm-x:${({0:0,2:50,3:100})[state.realm]||0}%"></div>`; }
function stages() {
    const current=state.levels[state.realm],cleared=state.cleared[state.realm],won=state.won[state.realm];
    return `<div class="realm-trail" role="list" aria-label="Realm progression: five farming stages followed by an active boss">${[1,2,3,4,5].map((level,i)=>`<span class="trail-stop ${cleared>=level||won?'complete':''} ${level===current?'current':''}" role="listitem" aria-label="Farming stage 1-${level}${level===current?', current stage':''}${cleared>=level||won?', completed':''}" ${level===current?'aria-current="step"':''}><i></i></span><span class="trail-pipe ${cleared>=level||won?'complete':''}" aria-hidden="true"></span>`).join('')}<span class="trail-boss ${won?'complete':''} ${gate()?'ready':''}" role="listitem" aria-label="Boss stage 1-6${won?', defeated':gate()?', ready for an active attempt':', waiting'}">${sprite('golem')}</span></div><div class="trail-caption"><span>Farming path</span><span>${won?'Guardian defeated':gate()?'Guardian ready':'Guardian ahead'}</span></div>`;
}

function journeySheet() {
    const won = state.won[state.realm];
    const frontier = frontierRealm(state.won);
    const canResume = won && frontier !== state.realm;
    let nextAction = !state.idle.length ? btn('Choose spells','idleBuild',true) : atCap() ? btn('Restart idle','resetWindow',true) : gate() ? btn('Face the boss','boss',true) : canResume ? btn(`Resume ${realms[frontier]}`,'resumeJourney',true) : won ? btn('Collection','library',true) : btn('Prepare boss','boss',true);
    return `<section class="journey-sheet">
        <div class="row between"><span class="kicker">${gate()?'BOSS GATE REACHED':won?'FARMING A CONQUERED REALM':'YOUR JOURNEY'}</span><span class="tag">${realms[state.realm]} · 1-${state.levels[state.realm]}</span></div>
        <h3>${gate()?'Keep farming. Face the boss.':won?'Return for what you need.':'A little further, a little stronger.'}</h3>
        ${stages()}
        ${gate()?'<p class="gate-note">1-5 keeps producing loot. Boss 1-6 waits for you.</p>':won?'<p class="gate-note">Boss defeated. Farm any cleared level for its shards.</p>':`<div class="progress-label"><span>Clearing progress · ${state.stageKills}/3 groups</span><span>Auto-progress</span></div><div class="progress-track"><i style="width:${state.stageKills/3*100}%"></i></div>`}
        <div class="farm-summary"><span>${ui(resourceIcon(),'inline-icon')} ${realms[state.realm]} shards</span><strong>+${rate()} / sec</strong></div>
        <div class="mini-loadout">${Array.from({length:4},(_,i)=>`<span class="idle-slot ${idleAnimation.activeSpell===state.idle[i]?'is-casting':''}" data-idle-spell="${state.idle[i]||''}">${icon(state.idle[i])}</span>`).join('')}<button class="text-button" data-action="idleBuild">Edit build ↗</button></div>
        <div class="realm-actions">${btn('Play & earn','activePlay')}${nextAction}</div>
        <div class="timer-note">${ui('time','inline-icon')} Idle progress: ${Math.floor(state.seconds/3600)}h ${Math.floor(state.seconds%3600/60)}m / 12h maximum</div>
    </section>`;
}
function realmView() {
    const active = state.idle.includes(idleAnimation.activeSpell) ? idleAnimation.activeSpell : null;
    return `<section class="realm-page realm-${realms[state.realm].toLowerCase()}">
        <div class="scene">${scenery()}
            <div class="realm-location"><div><span class="kicker">${realms[state.realm].toUpperCase()} REALM · 1-${state.levels[state.realm]}</span><h2>${places[state.realm]}</h2></div><button class="text-button realm-switch" data-action="map">${sprite('portal')}<span>Change realm</span><span aria-hidden="true">⌄</span></button></div>
            <div class="idle-label"><span class="status-dot" aria-hidden="true"></span> ${atCap()?'IDLE WINDOW COMPLETE':gate()?'FARMING AT THE BOSS GATE':'IDLE COMBAT'}</div>
            <div class="actor mage"><span class="actor-shadow"></span><span class="mage-body">${sprite('mage')}</span><span class="cast-glow"></span><small>MAGE</small></div>
            <div class="actor enemy"><span class="actor-shadow"></span><div class="enemy-hp"><i style="width:${state.enemyHp/40*100}%"></i></div>${sprite('slime')}<small>${realms[state.realm].toUpperCase()} SLIME</small></div>
            <div class="spell-flight" aria-hidden="true"><span class="spell-trail"></span><span class="flight-art"></span></div>
            <div class="impact-burst" aria-hidden="true"></div><span class="damage-float" aria-hidden="true"></span><span class="loot-label" aria-hidden="true"></span>
            <div class="cast-caption" aria-live="off"><span class="cast-icon">${active?sprite(spell(active).art):''}</span><span class="cast-name">${active||(state.idle.length?'Spells cast automatically':'Equip a spell to begin')}</span></div>
            <div class="scene-foot"><span>${state.won[state.realm]?'Cleared realm · Farming continues':'No player damage during idle'}</span><span>${state.kills} monsters defeated</span></div>
        </div>${journeySheet()}
    </section>`;
}

function collectionTools(kind) {
    const options = kind==='spells'?['All','Unlocked','Fire','Ice','Fusion']:['All','HP','Damage'];
    return `<div class="collection-tools"><input data-search="${kind}" aria-label="Search ${kind}" placeholder="Search ${kind}…" value="${esc(state.queries[kind])}"><select data-filter="${kind}" aria-label="Filter ${kind}">${options.map(o=>`<option ${state.filters[kind]===o?'selected':''}>${o}</option>`).join('')}</select></div>`;
}
function grid(kind,picker=false) {
    const query = state.queries[kind].toLowerCase();
    const filter = state.filters[kind];
    let items = kind==='spells'?spells.map((s,id)=>({...s,id,locked:!state.unlocked.includes(s.name)})):Array.from({length:state.largeCollection?240:2},(_,i)=>familiar(i));
    const total = items.length;
    items = items.filter(item=>item.name.toLowerCase().includes(query) && (filter==='All'||(kind==='spells'?(filter==='Unlocked'?!item.locked:filter===item.element):item.type===filter)));
    const perPage = 18;
    const pages = Math.max(1,Math.ceil(items.length/perPage));
    state.pages[kind] = Math.min(state.pages[kind],pages-1);
    const page = state.pages[kind];
    return `<div class="collection-meta">${items.length} / ${total} ${kind}${state.largeCollection&&kind==='familiars'?' · sample collection':''}${picker?' · select a card':''}</div><div class="collection-grid">${items.slice(page*perPage,(page+1)*perPage).map(item=>{
        const selected = kind==='familiars'?state.familiar===item.id:state[state.build].includes(item.name);
        return `<button class="collection-card ${selected?'selected':''} ${item.locked?'locked':''}" data-card="${kind}" data-id="${item.id}" aria-label="${esc(item.name)}${selected?', selected':''}${item.locked?', not unlocked':''}" ${selected?'aria-pressed="true"':'aria-pressed="false"'}>${sprite(item.art)}<strong>${esc(item.name)}</strong><small>${kind==='spells'?(item.locked?'Not unlocked':`${item.damage} damage`):item.buff}</small></button>`;
    }).join('')}</div>${items.length===0?'<div class="no-results">No matches. Try another name or filter.</div>':''}${pages>1?`<div class="pagination"><button data-page="-1" data-kind="${kind}" ${page===0?'disabled':''} aria-label="Previous page">←</button><span>Page ${page+1} of ${pages} · 18 per page</span><button data-page="1" data-kind="${kind}" ${page===pages-1?'disabled':''} aria-label="Next page">→</button></div>`:''}`;
}
function slots(build,autos=false) {
    return `<div class="slots">${Array.from({length:4},(_,i)=>`<div class="slot"><button class="loadout-button" data-slot="${i}" data-build="${build}" aria-label="Choose ${build} spell in slot ${i+1}">${icon(state[build][i])}<span class="slot-number" aria-hidden="true">${i+1}</span></button>${autos?`<button class="toggle ${state[build][i]&&state.autos[i]?'on':''}" data-auto="${i}" ${state[build][i]?'':'disabled'} aria-label="Slot ${i+1} autocast" aria-pressed="${!!state[build][i]&&state.autos[i]}">${state[build][i]?(state.autos[i]?'Auto':'Manual'):'No spell'}</button>`:''}</div>`).join('')}</div>`;
}
function libraryView() {
    const kind = state.collectionTab;
    return `<section class="page">${title('Your collection','SPELLS & FAMILIARS')}<div class="tabs"><button data-tab="spells" class="${kind==='spells'?'active':''}">Spells</button><button data-tab="familiars" class="${kind==='familiars'?'active':''}">Familiars</button></div>${kind==='spells'?`<div class="tabs"><button data-build="idle" class="${state.build==='idle'?'active':''}">Idle build</button><button data-build="boss" class="${state.build==='boss'?'active':''}">Boss build</button></div><p class="tiny muted">${state.build==='idle'?'All equipped spells cast automatically.':'Separate from idle. Set autocast in boss preparation.'} Up to four spells.</p>${slots(state.build)}`:`<div class="selected-familiar">${sprite(familiar(state.familiar).art)}<div><strong>${esc(familiar(state.familiar).name)}</strong><span class="tiny gold">${familiar(state.familiar).buff} · Boss only</span></div></div><p class="tiny muted">Choose one passive boss ally. No idle buffs.</p>`}${collectionTools(kind)}<div id="collection-results">${grid(kind)}</div></section>`;
}
function bossView() {
    return `<section class="page">${title('Before the battle',`${realms[state.realm].toUpperCase()} REALM · BOSS 1-6`)}<div class="row panel">${sprite('golem')}<div><h3>${bosses[state.realm]}</h3><span class="tiny muted">90 seconds · Free attempts<br>One victory per boss</span></div></div><span class="kicker">YOUR BOSS BUILD · FOUR SLOTS</span>${slots('boss',true)}<div class="note">${gate()?'Your mage keeps farming at 1-5 until you enter.':state.won[state.realm]?'This boss is already defeated. It cannot be replayed.':`Clear farming levels 1-1–1-5 to reach this boss. Current: 1-${state.levels[state.realm]}.`}</div><span class="kicker">ONE FAMILIAR · PASSIVE BOSS BUFF</span><div class="selected-familiar">${sprite(familiar(state.familiar).art)}<div><strong>${esc(familiar(state.familiar).name)}</strong><span class="tiny gold">${familiar(state.familiar).buff}</span></div></div>${btn('Choose familiar','chooseFamiliar',true)}<div class="detail-stats"><div>${ui('hp','inline-icon')} Health in this fight<b>${Math.round((100+state.hpBonus)*(state.familiar%2===0?1.1:1))} HP</b></div><div>${ui('power','inline-icon')} Build damage<b>${Math.round((state.boss.reduce((n,s)=>n+spell(s).damage,0)+state.damageBonus)*(state.familiar%2?1.08:1))}</b></div></div>${btn('Enter the boss arena · 1-6','startFight',false,!gate()||!state.boss.length)}<p class="tiny muted center" style="margin-top:12px">Move to dodge. Tap manual spells to cast.<br>Permanent progression stays with you after a loss.</p></section>`;
}
function forgeView() {
    return `<section class="page">${title('The Spellforge',`FORGE LEVEL ${state.forgeLevel}`)}<div class="panel venture-art">${sprite('workshop')}<div><h3>Learn. Combine.<br>Discover.</h3><span class="tiny muted">Original spells always stay.</span></div></div><div class="tabs"><button data-forge-tab="craft" class="${state.forgeTab!=='fusion'?'active':''}">Shard crafting</button><button data-forge-tab="fusion" class="${state.forgeTab==='fusion'?'active':''}">Fusion</button></div>${state.forgeTab!=='fusion'?`<p class="tiny muted">Choose a spell from the grid to inspect its recipe.</p><div class="collection-grid">${spells.slice(0,2).map((s,id)=>`<button class="collection-card ${state.unlocked.includes(s.name)?'selected':''}" data-craft-card="${id}">${sprite(s.art)}<strong>${s.name}</strong><small>${state.unlocked.includes(s.name)?'Unlocked':'5 ice-shards'}</small></button>`).join('')}</div>`:`<div class="recipe-grid">${spells.map((s,id)=>`<button class="collection-card" data-craft-card="${id}">${sprite(id===2&&!state.unlocked.includes(s.name)?'shards':s.art)}<strong>${id===2&&!state.unlocked.includes(s.name)?'Unknown result':s.name}</strong><small>${id===2?'Fused spell':'Ingredient · kept'}</small></button>`).join('')}</div><p class="tiny muted center">Firebolt + Icebolt → a new discovery</p><div class="note">Forge level 2 opens after the Ice boss. Its fixed reward covers the upgrade and first fusion.</div>${state.forgeLevel<2?btn('Upgrade forge · 10 fire-shards','upgradeForge',false,!state.won[1]):btn(state.unlocked.includes('Frostfire Bolt')?'Frostfire Bolt discovered':'Forge unknown spell · 10 fire-shards','fuse',false,state.unlocked.includes('Frostfire Bolt')||!state.unlocked.includes('Icebolt')||state.shards[0]<10)}`}<p class="tiny muted" style="margin-top:15px">${ui('fire','inline-icon')} ${state.shards[0]} fire-shards · Illustrative forge costs</p></section>`;
}
function venturesView() {
    return `<section class="page">${title('Your settlement','VENTURES · PERMANENT GROWTH')}<section class="panel"><div class="venture-art">${sprite('mine')}<div><h3>Moonstone mine</h3><span class="kicker">LEVEL ${state.mining}</span><div class="venture-value">${ui('ore','inline-icon')}${(state.mining*5*1.2*(state.synergy?1.25:1)).toFixed(1)} <small>ore / min</small></div></div></div><div class="venture-workers">${sprite('spirit')}<span>${state.mining} base spirits<br>Always working</span><span>2 loot-spirits<br>+20% combined</span></div><p class="venture-formula">${state.mining*5} base × 1.20 spirits × ${state.synergy?'1.25':'1.00'} pond</p><div class="stack">${btn('+5 Spell power · 40 ore','buyDamage',false,state.ore<40)}${btn('Mine level +1 · 60 ore','upgradeMine',true,state.ore<60)}</div></section><section class="panel"><div class="venture-art">${sprite('pond')}<div><h3>Silverfin pond</h3><span class="kicker">LEVEL ${state.fishing}</span><div class="venture-value">${ui('pearls','inline-icon')}8 <small>pearls / min</small></div></div></div><div class="venture-workers">${sprite('spirit')}<span>${state.fishing} base spirit<br>Always working</span><span>No loot-spirits yet</span></div><div class="stack">${btn('+10 permanent HP · 30 pearls','buyHp',false,state.pearls<30)}${btn(state.synergy?'Mine synergy ×1.25 · Active':'Mine synergy · 50 pearls','synergy',true,state.synergy||state.pearls<50)}</div></section><div class="note">Every collected loot-spirit contributes, including duplicates. Familiars are separate boss companions.</div></section>`;
}
function fightView() {
    const f = state.fight;
    return `<section class="fight-page"><header class="fight-head"><div class="row between"><h2>${bosses[state.realm]}</h2><strong class="gold">${ui('time','inline-icon')} ${90-f.elapsed}s</strong></div><div class="boss-track" aria-label="Boss health"><i style="width:${f.bossHp/600*100}%"></i></div><span class="tiny muted">${Math.ceil(f.bossHp)} / 600 HP · ${familiar(state.familiar).buff} active</span></header><div class="fight-arena" aria-label="Drag or tap to move the mage">${scenery()}${sprite('golem','boss-actor')}<div class="danger" aria-hidden="true"></div><span class="fight-mage" style="left:${f.x}%;top:${f.y}%">${sprite('mage')}</span><div class="arena-hint">Drag or tap to move · Dodge the marked area</div></div><section class="fight-bottom"><div class="slots">${Array.from({length:4},(_,i)=>state.boss[i]?`<button class="cast-button" data-cast="${i}" ${f.cooldowns[i]>0||state.autos[i]?'disabled':''}>${sprite(spell(state.boss[i]).art)}<span>${f.cooldowns[i]>0?f.cooldowns[i]+'s':state.autos[i]?'Auto':'Cast'}</span></button>`:`<div class="spell-icon empty">${ui('empty')}</div>`).join('')}</div><button class="text-button" data-action="retreat">Leave attempt · Retry for free</button></section></section>`;
}
function resultView() {
    const won = state.fight.result==='win';
    return `<section class="page center">${sprite(won?'portal':'moth','result-art')}${title(won?'A new path opens.':'Another try awaits.',won?'BOSS DEFEATED':'ATTEMPT ENDED')}<p class="muted">${bosses[state.fight.realm]}</p><div class="panel">${won?`<h3>${state.fight.realm<3?realms[state.fight.realm+1]+' realm · 1-1 unlocked':'All four realms conquered'}</h3><p class="tiny">Fixed reward: ${ui(realms[state.fight.realm].toLowerCase(),'inline-icon')}20 ${realms[state.fight.realm].toLowerCase()}-shards${state.fight.realm===1?' + 20 fire-shards + forge level 2 access':''}.<br>Boss rewards granted once. Permanent spells kept.</p>`:'<h3>Your progression is safe.</h3><p class="tiny">No resources lost. No retry fee.<br>Return to farming at 1-5 or try a new boss build.</p>'}</div><div class="stack">${won?btn(state.fight.realm<3?`Enter ${realms[state.fight.realm+1]} realm · 1-1`:'Return to farming','continue'):btn('Prepare a free retry','boss')}${btn('Visit the Spellforge','forge',true)}</div></section>`;
}
function returnView() {
    const report = state.returned;
    if(!report)return `<section class="page">${title('All caught up','YOUR JOURNEY CONTINUES')}${sprite('mage','result-art')}<div class="panel"><h3>Your mage is still at work.</h3><p class="tiny muted">Return after some time away to collect your progress. Up to 12 hours count for your mage and both ventures.</p></div>${btn('Back to your realm','realm')}<p class="tiny muted center" style="margin-top:14px">A boss always waits for an active attempt.</p></section>`;
    return `<section class="page">${title('While you were away','RETURN · SIMULATED PREVIEW')}${sprite('mage','result-art')}<div class="panel"><h3>${report?report.hours:'20'} hours away.<br>${report?Math.min(12,report.hours):12} hours of progress.</h3><div class="return-line"><span>${ui('time','inline-icon')} Counted time</span><b>${report?Math.min(12,report.hours):12}h / 12h maximum</b></div><div class="return-line"><span>${ui(resourceIcon(),'inline-icon')} ${realms[state.realm]} shards</span><b>+${report?.shards||0}</b></div><div class="return-line"><span>${ui('ore','inline-icon')} Moonstone ore</span><b>+${report?.ore||0}</b></div><div class="return-line"><span>${ui('pearls','inline-icon')} Silverfin pearls</span><b>+${report?.pearls||0}</b></div><div class="return-line"><span>Farming progress</span><b>${report?.start||'1-1'} → 1-${state.levels[state.realm]}</b></div></div><div class="note">${state.returnClaimed?'This return has already been collected. No duplicate rewards.':report?'Boss 1-6 was not entered. Your mage kept farming at 1-5 until the 12-hour window ended.':'Use the return scenario to preview 20 hours away.'}</div>${btn(state.returnClaimed?'Collected · Back to farming':'Collect and continue','claimReturn',false,!report&&!state.returnClaimed)}<p class="tiny muted center" style="margin-top:15px">The same time window applies to the mage and both ventures in parallel.</p></section>`;
}
function accountView() {
    return `<section class="page">${title('Your journey','ACCOUNT · PREVIEW ONLY')}${sprite('portal','result-art')}<div class="panel"><h3>Platform account</h3><p class="tiny muted">Cloud save and same-platform restoration belong here. This prototype only keeps state in memory.</p></div>${btn('Simulate connection loss','disconnect',true)}<div class="note">Active play requires a connection. Reconnecting restores the locally confirmed prototype state.</div>${btn('Review idle return','return',true)}</section>`;
}
const views = {active:()=>ActivePlay.view(),realm:realmView,library:libraryView,boss:bossView,forge:forgeView,ventures:venturesView,fight:fightView,result:resultView,return:returnView,account:accountView};
function modalView() {
    if (!state.modal) return '';
    let body = '', heading = '';
    const m = state.modal;
    if (m.type==='power') {
        heading = 'Mage Power';
        body = `<div class="power-explainer"><div>${ui('crest','power-crest')}<strong>${magePower()}</strong><span>MAGE POWER</span></div><div class="power-equation"><span>${ui('hp')}<b>${permanentHp()}</b><small>Permanent HP</small></span><i>+</i><span>${ui('power')}<b>${compactStat(spellPower())}</b><small>Spell power</small></span></div></div><p class="note">Your permanent strength, in one number. Damage taken during a fight does not lower this rating. Spell builds and familiar bonuses are shown separately in their battle context.</p><p class="tiny muted">There is no player level or XP bar. Improve your permanent stats through your ventures.</p>${btn('Visit your ventures','ventures',true)}`;
    } else if (m.type==='resources') {
        heading = 'Your resources';
        const entries = [['fire','Fire shards',state.shards[0]],['ice','Ice shards',state.shards[1]],['earth','Earth shards',state.shards[2]],['wind','Wind shards',state.shards[3]],['ore','Ore',state.ore],['pearls','Pearls',state.pearls]];
        body = `<div class="resource-balances">${entries.map(([art,name,value])=>`<div>${ui(art)}<span>${name}</span><strong>${value.toLocaleString('en')}</strong></div>`).join('')}</div><p class="tiny muted">All six balances stay visible in the header, including while choosing spells or familiars.</p>`;
    } else if (m.type==='menu') {
        heading = 'Your journey';
        body = `<div class="stack">${btn('Play for bonus shards','activePlay',true)}${btn('Choose realm and farming level','map',true)}${btn('Spells & familiars','library',true)}${btn('Account & connection','account',true)}${btn('Return summary','return',true)}</div><h4>Resources</h4><div class="resource-legend">${[['fire','Fire shards'],['ice','Ice shards'],['earth','Earth shards'],['wind','Wind shards'],['ore','Ore'],['pearls','Pearls']].map(([art,name])=>`<span>${ui(art)}${name}</span>`).join('')}</div><p class="tiny muted">Tap a resource in the header to check its name and balance.</p><h4>Prototype controls</h4><p class="tiny muted">Accelerated simulation · No progress saved</p><div class="stack">${[['start','Fire realm · 1-1'],['gate','At the boss gate · 1-5'],['ice','Ice realm · Craft Icebolt'],['active','Try all three spells in active play'],['spells','Three-spell idle build'],['revisit','Revisit a conquered realm'],['collection','Sample collection · 240 familiars'],['return','Away for 20 hours']].map(([key,label])=>`<button class="rune-button secondary" data-scenario="${key}">${label}</button>`).join('')}${btn('Advance a farming level','advance',true)}${btn('Show boss victory','demoWin',true)}${btn('Show boss defeat','demoLose',true)}${btn('Reach 12-hour cap','demoCap',true)}</div>`;
    } else if (m.type==='map') {
        heading = 'Choose your realm';
        const frontier = frontierRealm(state.won);
        body = `<p class="tiny muted">Return to any conquered realm for its shards. Your journey and boss victories stay with you.</p><div class="realm-list">${realms.map((r,i)=>`<button class="realm-choice" data-realm="${i}" ${!canVisit(i)?'disabled':''} ${state.realm===i?'aria-current="true"':''}>${ui(r.toLowerCase())}<span class="realm-choice-copy"><strong>${r} realm</strong><small>${state.won[i]?'Boss defeated · Farm 1-1–1-5':canVisit(i)?`Journey at 1-${state.levels[i]} · Boss at 1-6`:'Defeat the '+realms[i-1]+' boss'}</small></span><span class="realm-choice-action">${state.realm===i?'Current':!canVisit(i)?ui('lock'):state.won[i]?'Farm →':'Continue →'}</span></button>`).join('')}</div><h4>Farming level · ${realms[state.realm]}</h4><div class="farming-levels">${[1,2,3,4,5].map(l=>`<button class="level-choice ${l===state.levels[state.realm]?'current':''}" data-level="${l}" ${l>Math.min(5,state.cleared[state.realm]+1)?'disabled':''} title="Farming stage 1-${l}" aria-label="Choose farming stage 1-${l}"><span class="map-stage-dot" aria-hidden="true"></span></button>`).join('')}</div><p class="tiny muted">Choose an earlier level to hold farming there. The furthest reached level resumes auto-progress.</p>${frontier!==state.realm?btn(`Resume ${realms[frontier]} realm · 1-${state.levels[frontier]}`,'resumeJourney',true):''}`;
    } else if (m.type==='picker') {
        heading = m.kind==='spells'?`Choose spell · Slot ${m.slot+1}`:'Choose one familiar';
        body = `${m.kind==='spells'?'<p class="tiny muted">Choose an unlocked spell from the grid. Other slots are kept.</p>':'<p class="tiny muted">Passive buffs apply only during boss fights.</p>'}${collectionTools(m.kind)}<div id="collection-results">${grid(m.kind,true)}</div>${m.kind==='spells'&&state[m.build][m.slot]?btn('Remove this spell','removeSlot',true):''}`;
    } else if (m.type==='card') {
        const item = m.kind==='spells'?spells[m.id]:familiar(m.id);
        heading = item.name;
        const unlocked = state.unlocked.includes(item.name);
        body = `<div class="detail-art">${sprite(item.art)}</div>${m.kind==='familiars'?`<p class="gold center">${item.buff} · Boss fights only</p><p class="tiny muted">One familiar at a time. No active spells or idle bonuses. This collection uses illustrative sample entries.</p>${btn(state.familiar===item.id?'Selected for boss fights':'Select for boss fights','selectFamiliar',false,state.familiar===item.id)}`:`<p class="tiny muted">${item.description}</p><div class="detail-stats"><div>${ui('power','inline-icon')} Spell damage<b>${item.damage}</b></div><div>${ui('time','inline-icon')} Cooldown<b>${item.cooldown}s</b></div></div>${unlocked?btn(state[state.build].includes(item.name)?`Remove from ${state.build} build`:`Equip in ${state.build} build`,'equipSpell')+btn('Try this spell','trySpell',true):item.name==='Icebolt'?btn('Craft Icebolt · 5 ice-shards','craftIce',false,state.shards[1]<5||!state.won[0]):btn('Inspect fusion recipe','inspectFusion',true)}`}`;
    }
    return `<div class="overlay"><section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(heading)}"><div class="row between" style="margin-bottom:12px"><h3>${esc(heading)}</h3><button class="sheet-close" data-action="close" aria-label="Close dialog">×</button></div>${body}</section></div>`;
}
function inspector() {
    document.querySelector('#state').textContent = JSON.stringify({variant,crestStudy,activity:ActivePlay.inspect(),activeBonus:state.activeBonus||0,magePower:magePower(),permanentHp:permanentHp(),spellPower:spellPower(),ratingFormula:'Permanent HP + Spell power (illustrative)',view:state.view,realm:realms[state.realm],level:'1-'+state.levels[state.realm],bossGate:gate(),won:state.won,idle:state.idle,boss:state.boss,autos:state.autos,familiar:familiar(state.familiar).name,shards:state.shards,ore:state.ore,pearls:state.pearls,countedHours:state.seconds/3600,cap:atCap(),returnClaimed:state.returnClaimed,collectionSize:state.largeCollection?240:2},null,2);
}
function render(preserveScroll=false) {
    const url=new URL(location.href);if(state.view==='active')url.searchParams.set('view','active');else url.searchParams.delete('view');history.replaceState(null,'',url);
    const scroll = preserveScroll ? phone.querySelector('.game-content')?.scrollTop || 0 : 0;
    phone.innerHTML = hud()+`<div class="game-content">${(views[state.view]||realmView)()}</div>`+(['fight','active'].includes(state.view)?'':nav())+modalView()+(toastText?`<div class="toast" role="status">${esc(toastText)}</div>`:'')+(!state.connected?`<section class="blocking"><h2>Connection lost</h2><p class="muted">Active play is paused. Reconnect to continue from your confirmed progress.</p>${btn('Reconnect','reconnect')}</section>`:'');
    phone.querySelector('.game-content').scrollTop=scroll;
    phone.style.setProperty('--hud-height',phone.querySelector('.hud').offsetHeight+'px');
    document.querySelector('#variant-label').textContent = ActivePlay.label();
    document.querySelector('#review-links').innerHTML = ['realm','forge','boss','ventures','library','return','account'].map(v=>`<button data-view="${v}">${({library:'Collection',return:'Return'})[v]||v[0].toUpperCase()+v.slice(1)}</button>`).join('');
    inspector();
    if(state.modal)phone.querySelector('.sheet-close')?.focus({preventScroll:true});
}
function refreshHud() {
    phone.querySelector('.hud').outerHTML = hud();
    phone.style.setProperty('--hud-height',phone.querySelector('.hud').offsetHeight+'px');
}
function notify(message) {
    toastText=message; clearTimeout(toastTimer); render(true);
    toastTimer=setTimeout(()=>{toastText='';phone.querySelector('.toast')?.remove();},3000);
}
function go(view) { if(state.view==='active'&&view!=='active')ActivePlay.onLeave();state.view=view;state.modal=null;render(); }
function openModal(modal) { lastFocus=document.activeElement;state.modal=modal;render(true);phone.querySelector('.sheet-close')?.focus(); }
function closeModal() {state.modal=null;render(true);if(lastFocus?.dataset.action)phone.querySelector(`[data-action="${lastFocus.dataset.action}"]`)?.focus();}
function scenario(key) {
    ActivePlay.reset();
    resetIdleAnimation();
    state=fresh();toastText='';
    if(key==='gate'){state.levels[0]=5;state.cleared[0]=5;state.shards[0]=35;}
    if(key==='ice'){state.won[0]=true;state.cleared[0]=6;state.levels[0]=5;state.realm=1;state.shards[1]=5;}
    if(key==='revisit'){state.won[0]=true;state.cleared[0]=6;state.levels=[5,3,1,1];state.cleared[1]=2;state.realm=1;state.stageKills=2;state.shards=[35,12,0,0];state.unlocked=['Firebolt','Icebolt'];state.idle=['Firebolt','Icebolt'];}
    if(key==='active'){state.unlocked=spells.map(s=>s.name);state.idle=['Firebolt','Icebolt'];state.won=[true,true,false,false];state.cleared=[6,6,0,0];state.levels=[5,5,1,1];state.realm=2;state.forgeLevel=2;state.view='active';}
    if(key==='spells'){state.won=[true,true,false,false];state.cleared=[6,6,0,0];state.levels=[5,5,1,1];state.realm=2;state.unlocked=spells.map(s=>s.name);state.idle=spells.map(s=>s.name);state.boss=['Firebolt','Icebolt'];state.forgeLevel=2;}
    if(key==='collection'){state.largeCollection=true;state.view='library';state.collectionTab='familiars';}
    if(key==='return'){
        state.levels[0]=5;state.cleared[0]=5;state.seconds=43200;state.returnPending=true;state.view='return';
        state.returned={hours:20,start:'1-1',shards:Math.round(.6*43200),ore:Math.round(15*720),pearls:8*720};
    }
    render();
}
function advance() {
    if(atCap()||state.won[state.realm]||state.heldLevel) return;
    const r=state.realm;state.cleared[r]=Math.max(state.cleared[r],state.levels[r]);state.stageKills=0;state.groups[r]=0;
    if(state.levels[r]<5)state.levels[r]++;else state.cleared[r]=5;
}
function startFight() {
    if(!gate()||!state.boss.length)return;
    state.view='fight';state.modal=null;
    state.fight={realm:state.realm,elapsed:0,bossHp:600,hp:hpMax(),cooldowns:[0,0,0,0],x:52,y:72,result:null};
    render();
}
function finishFight(won,force=false) {
    if(force&&state.view!=='fight'){
        if(state.won[state.realm])return notify('This boss has already been defeated.');
        state.levels[state.realm]=5;state.cleared[state.realm]=5;startFight();
    }
    const f=state.fight;if(!f||f.result)return;
    f.result=won?'win':'loss';
    if(won&&!state.won[f.realm]){
        state.won[f.realm]=true;state.cleared[f.realm]=6;state.shards[f.realm]+=20;
        if(f.realm===1)state.shards[0]+=20;
    }
    go('result');
}
function cast(i) {
    const f=state.fight,s=spell(state.boss[i]);
    if(!f||f.result||!s||f.cooldowns[i]>0)return;
    f.bossHp=Math.max(0,f.bossHp-Math.round((s.damage+state.damageBonus)*(state.familiar%2?1.08:1)));
    f.cooldowns[i]=s.cooldown;
    if(!f.bossHp)finishFight(true);
}
const actions={
    activePlay:()=>ActivePlay.open(),apAgain:()=>ActivePlay.start(),apRealm:()=>go('realm'),
    trySpell:()=>{const name=spells[state.modal.id].name;ActivePlay.open(name);},
    powerInfo:()=>openModal({type:'power'}),resources:()=>openModal({type:'resources'}),ventures:()=>go('ventures'),menu:()=>openModal({type:'menu'}),map:()=>openModal({type:'map'}),close:closeModal,
    realm:()=>go('realm'),forge:()=>go('forge'),boss:()=>go('boss'),library:()=>go('library'),account:()=>go('account'),return:()=>go('return'),
    idleBuild:()=>{state.collectionTab='spells';state.build='idle';go('library');},
    chooseFamiliar:()=>openModal({type:'picker',kind:'familiars'}),
    startFight,retreat:()=>finishFight(false),
    nextRealm:()=>{if(state.realm<3&&visitRealm(state,state.realm+1)){resetIdleAnimation();go('realm');}},
    resumeJourney:()=>{if(visitRealm(state,frontierRealm(state.won))){resetIdleAnimation();go('realm');}},
    continue:()=>{if(state.fight.realm<3)visitRealm(state,state.fight.realm+1);resetIdleAnimation();go('realm');},
    advance:()=>{state.modal=null;advance();render(true);},demoWin:()=>finishFight(true,true),demoLose:()=>finishFight(false,true),demoCap:()=>{state.seconds=43200;state.modal=null;render();},
    selectFamiliar:()=>{state.familiar=state.modal.id;state.modal=null;notify('Selected for boss fights. Your idle stats stay the same.');},
    equipSpell:()=>{
        const name=spells[state.modal.id].name,build=state[state.build];
        if(build.includes(name))state[state.build]=build.filter(n=>n!==name);else if(build.length<4)build.push(name);else return notify('Four slots are full. Remove a spell first.');
        state.modal=null;notify('Your '+state.build+' build has been updated.');
    },
    removeSlot:()=>{state[state.modal.build].splice(state.modal.slot,1);state.modal=null;render(true);},
    craftIce:()=>{
        if(state.shards[1]<5||state.unlocked.includes('Icebolt')||!state.won[0])return;
        state.shards[1]-=5;state.unlocked.push('Icebolt');state.modal=null;state.build='idle';state.collectionTab='spells';state.view='library';notify('Icebolt unlocked. Select it in the grid to add it to your idle build.');
    },
    inspectFusion:()=>{state.forgeTab='fusion';go('forge');},
    upgradeForge:()=>{if(!state.won[1]||state.forgeLevel>=2||state.shards[0]<10)return;state.shards[0]-=10;state.forgeLevel=2;notify('Forge level 2 unlocked. The remaining reward covers your first fusion.');},
    fuse:()=>{if(state.forgeLevel<2||state.shards[0]<10||!state.unlocked.includes('Icebolt')||state.unlocked.includes('Frostfire Bolt'))return;state.shards[0]-=10;state.unlocked.push('Frostfire Bolt');notify('Frostfire Bolt discovered. Firebolt and Icebolt are kept.');},
    buyDamage:()=>{if(state.ore<40)return;state.ore-=40;state.damageBonus+=5;notify('Permanent Spell power +5. Mage Power +5.');},
    buyHp:()=>{if(state.pearls<30)return;state.pearls-=30;state.hpBonus+=10;notify('Permanent HP +10. Mage Power +10.');},
    upgradeMine:()=>{if(state.ore<60)return;state.ore-=60;state.mining++;render(true);},
    synergy:()=>{if(state.synergy||state.pearls<50)return;state.pearls-=50;state.synergy=true;render(true);},
    claimReturn:()=>{
        if(state.returnClaimed)return go('realm');
        if(!state.returned||!state.returnPending)return;
        state.shards[state.realm]+=state.returned.shards;state.ore+=state.returned.ore;state.pearls+=state.returned.pearls;state.returnClaimed=true;state.returnPending=false;
        state.seconds=0;notify('12 hours collected once. A new idle window begins.');
    },
    resetWindow:()=>{state.seconds=0;notify('A new idle window begins. Previously earned resources are kept.');},
    disconnect:()=>{state.connected=false;render();},reconnect:()=>{state.connected=true;notify('Reconnected. Confirmed prototype progress restored.');}
};
function handleClick(event) {
    const el=event.target.closest('button');if(!el||el.disabled)return;
    if(el.dataset.scenario)return scenario(el.dataset.scenario);
    if(el.dataset.demo){if(el.dataset.demo==='advance'){advance();render(true);}else if(el.dataset.demo==='cap'){state.seconds=43200;render(true);}else finishFight(el.dataset.demo==='win',true);return;}
    if(!state.connected&&el.dataset.action!=='reconnect')return;
    if(ActivePlay.handleButton(el))return;
    if(el.dataset.action){actions[el.dataset.action]?.();return;}
    if(el.dataset.view)return go(el.dataset.view);
    if(el.dataset.realm!==undefined){if(visitRealm(state,Number(el.dataset.realm))){resetIdleAnimation();return go('realm');}return;}
    if(el.dataset.level){resetIdleAnimation();const level=Number(el.dataset.level);state.heldLevel=level<Math.min(5,state.cleared[state.realm]+1);state.levels[state.realm]=level;state.stageKills=0;state.groups[state.realm]=0;return go('realm');}
    if(el.dataset.tab){state.collectionTab=el.dataset.tab;return render();}
    if(el.dataset.slot!==undefined){state.build=el.dataset.build;return openModal({type:'picker',kind:'spells',slot:Number(el.dataset.slot),build:el.dataset.build});}
    if(el.dataset.build){state.build=el.dataset.build;return render();}
    if(el.dataset.auto!==undefined){const i=Number(el.dataset.auto);state.autos[i]=!state.autos[i];return render(true);}
    if(el.dataset.card){
        const kind=el.dataset.card,id=Number(el.dataset.id);
        if(state.modal?.type==='picker'&&kind==='spells'){
            const name=spells[id].name;if(!state.unlocked.includes(name))return notify('Unlock this spell at the Spellforge first.');
            const m=state.modal,build=state[m.build];
            if(build.includes(name)&&build[m.slot]!==name)return notify('This spell is already equipped in another slot.');
            build[Math.min(m.slot,build.length)]=name;state.modal=null;return notify('Boss and idle builds are saved separately in this preview.');
        }
        return openModal({type:'card',kind,id});
    }
    if(el.dataset.page){state.pages[el.dataset.kind]+=Number(el.dataset.page);refreshCollection();return;}
    if(el.dataset.craftCard!==undefined)return openModal({type:'card',kind:'spells',id:Number(el.dataset.craftCard)});
    if(el.dataset.forgeTab){state.forgeTab=el.dataset.forgeTab;return render(true);}
    if(el.dataset.cast!==undefined){cast(Number(el.dataset.cast));return render(true);}
}
function refreshCollection() {
    const kind=state.modal?.kind||state.collectionTab;
    const results=phone.querySelector('#collection-results');if(results)results.innerHTML=grid(kind,state.modal?.type==='picker');inspector();
}
document.addEventListener('click',handleClick);
document.addEventListener('input',event=>{const kind=event.target.dataset.search;if(kind){state.queries[kind]=event.target.value;state.pages[kind]=0;refreshCollection();}});
document.addEventListener('change',event=>{const kind=event.target.dataset.filter;if(kind){state.filters[kind]=event.target.value;state.pages[kind]=0;refreshCollection();}});
function switchVariant(delta) {ActivePlay.cycle(delta);}
document.querySelector('#previous').onclick=()=>switchVariant(-1);
document.querySelector('#next').onclick=()=>switchVariant(1);
document.addEventListener('keydown',event=>{
    if(state.modal&&event.key==='Escape'){event.preventDefault();closeModal();return;}
    if(state.modal&&event.key==='Tab'){
        const focusables=[...phone.querySelectorAll('.sheet button:not(:disabled),.sheet input,.sheet select,.sheet a')];
        const first=focusables[0],last=focusables.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}return;
    }
    if(event.target.closest('input,textarea,select,[contenteditable="true"]')||state.view==='fight'||state.modal)return;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();switchVariant(event.key==='ArrowLeft'?-1:1);}
});
window.addEventListener('popstate',()=>{const value=new URLSearchParams(location.search).get('crest');crestStudy=crestStudies.includes(value)?value:'base';render(true);});
let dragging=false;
function moveMage(event) {
    const arena=event.target.closest('.fight-arena');if(!arena||state.view!=='fight'||!state.connected)return;
    const box=arena.getBoundingClientRect();state.fight.x=Math.max(8,Math.min(92,(event.clientX-box.left)/box.width*100));state.fight.y=Math.max(40,Math.min(88,(event.clientY-box.top)/box.height*100));
    const mage=arena.querySelector('.fight-mage');mage.style.left=state.fight.x+'%';mage.style.top=state.fight.y+'%';
}
phone.addEventListener('pointerdown',event=>{if(event.target.closest('.fight-arena')){dragging=true;event.target.closest('.fight-arena').setPointerCapture(event.pointerId);moveMage(event);}});
phone.addEventListener('pointermove',event=>{if(dragging)moveMage(event);});
phone.addEventListener('pointerup',()=>{dragging=false;});
phone.addEventListener('pointercancel',()=>{dragging=false;});
const idleAnimation = { previous:null, activeSpell:null, nextAt:0, phase:'rest', timers:[] };
function resetIdleAnimation() {
    idleAnimation.timers.forEach(clearTimeout);
    idleAnimation.timers=[];idleAnimation.previous=null;idleAnimation.activeSpell=null;idleAnimation.phase='rest';idleAnimation.nextAt=performance.now()+350;
}
function updateIdlePanels() {
    refreshHud();
    if(state.view!=='realm'||state.modal)return;
    const sheet=phone.querySelector('.journey-sheet');if(sheet)sheet.outerHTML=journeySheet();
    const kills=phone.querySelector('.scene-foot span:last-child');if(kills)kills.textContent=state.kills+' monsters defeated';
    const label=phone.querySelector('.idle-label');if(label)label.innerHTML='<span class="status-dot" aria-hidden="true"></span> '+(atCap()?'IDLE WINDOW COMPLETE':gate()?'FARMING AT THE BOSS GATE':'IDLE COMBAT');
    const location=phone.querySelector('.realm-location .kicker');if(location)location.textContent=realms[state.realm].toUpperCase()+' REALM · 1-'+state.levels[state.realm];
    inspector();
}
function runIdleAttack() {
    if(!state.connected||document.hidden||state.returnPending||atCap()||state.view==='fight'||idleAnimation.phase!=='rest')return;
    const name=nextIdleSpell(state.idle,idleAnimation.previous);if(!name)return;
    const selected=spell(name);if(!selected)return;
    const session=state,realm=state.realm;
    const current=()=>state===session&&state.realm===realm&&state.connected&&!state.returnPending&&!atCap()&&state.view!=='fight'&&state.idle.includes(name);
    const scene=state.view==='realm'&&!state.modal?phone.querySelector('.scene'):null;
    const visual=()=>scene?.isConnected&&state.view==='realm'&&!state.modal;
    idleAnimation.previous=name;idleAnimation.activeSpell=name;idleAnimation.phase='windup';idleAnimation.nextAt=performance.now()+1600;
    function later(delay,fn){idleAnimation.timers.push(setTimeout(fn,delay));}
    if(visual()){
        scene.dataset.casting=selected.art;scene.dataset.spell=name;
        scene.querySelector('.cast-icon').innerHTML=sprite(selected.art);scene.querySelector('.cast-name').textContent=name;
        scene.querySelector('.mage').classList.add('is-winding');
        phone.querySelectorAll('.idle-slot').forEach(el=>el.classList.toggle('is-casting',el.dataset.idleSpell===name));
    }
    later(180,()=>{
        if(!current())return;
        idleAnimation.phase='flight';
        if(!visual())return;
        const mage=scene.querySelector('.mage'),enemy=scene.querySelector('.enemy'),flight=scene.querySelector('.spell-flight'),bounds=scene.getBoundingClientRect();
        const from=mage.getBoundingClientRect(),to=enemy.getBoundingClientRect();
        const x=from.right-bounds.left-10,y=from.top-bounds.top+32;
        flight.style.cssText=`left:${x}px;top:${y}px;--dx:${to.left+to.width/2-bounds.left-x}px;--dy:${to.top+to.height/2-bounds.top-y-8}px`;
        flight.querySelector('.flight-art').innerHTML=sprite(selected.art);
        mage.classList.remove('is-winding');mage.classList.add('is-casting');mage.querySelector('.sprite').outerHTML=sprite('casting');
        flight.classList.add('is-flying');
    });
    later(660,()=>{
        if(!current())return;
        idleAnimation.phase='impact';
        const damage=selected.damage+state.damageBonus;
        state.enemyHp=Math.max(0,state.enemyHp-damage);
        const defeated=state.enemyHp===0;
        if(defeated){state.kills++;state.shards[realm]++;state.stageKills++;state.groups[realm]=state.stageKills;if(state.stageKills>=3&&!state.heldLevel&&!state.won[realm])advance();state.enemyHp=40;}
        if(visual()){
            const enemy=scene.querySelector('.enemy');
            scene.querySelector('.spell-flight').classList.remove('is-flying');enemy.classList.add('is-hit');if(defeated)enemy.classList.add('is-defeated');
            const blast=scene.querySelector('.impact-burst'),target=enemy.getBoundingClientRect(),bounds=scene.getBoundingClientRect();blast.style.left=target.left+target.width/2-bounds.left+'px';blast.style.top=target.top+target.height/2-bounds.top-8+'px';blast.classList.add('is-visible');
            const value=scene.querySelector('.damage-float');value.style.left=target.left+target.width/2-bounds.left+'px';value.style.top=target.top-bounds.top-10+'px';value.textContent=damage;value.classList.remove('is-visible');void value.offsetWidth;value.classList.add('is-visible');
            scene.querySelector('.enemy-hp i').style.width=defeated?'0%':state.enemyHp/40*100+'%';
            if(defeated){scene.querySelector('.loot-label').classList.remove('is-visible');void scene.querySelector('.loot-label').offsetWidth;scene.querySelector('.loot-label').textContent='+1 '+realms[realm].toLowerCase()+' shard';scene.querySelector('.loot-label').classList.add('is-visible');}
        }
        updateIdlePanels();
        later(300,()=>{if(!visual())return;const enemy=scene.querySelector('.enemy');enemy.classList.remove('is-hit','is-defeated');if(defeated){enemy.classList.add('is-spawning');scene.querySelector('.enemy-hp i').style.width='100%';}scene.querySelector('.impact-burst').classList.remove('is-visible');});
    });
    later(1140,()=>{
        if(visual()){const mage=scene.querySelector('.mage');mage.classList.remove('is-casting','is-winding');mage.querySelector('.sprite').outerHTML=sprite('mage');scene.querySelector('.enemy').classList.remove('is-spawning');}
        idleAnimation.phase='rest';idleAnimation.timers=[];
    });
}
setInterval(()=>{if(performance.now()>=idleAnimation.nextAt)runIdleAttack();},100);
let tick=0;
setInterval(()=>{
    if(!state.connected||document.hidden||state.returnPending)return;
    if(state.view==='fight'){
        const f=state.fight;if(f.result)return;
        f.elapsed++;if(f.elapsed>=90)return finishFight(false);
        f.cooldowns=f.cooldowns.map(c=>Math.max(0,c-1));
        state.boss.forEach((_,i)=>{if(state.autos[i])cast(i);});
        if(f.result)return;
        if(f.elapsed%5===0){f.hp=Math.max(0,f.hp-(f.x<48&&f.y>53?18:4));if(!f.hp)return finishFight(false);}
        render(true);return;
    }
    if(atCap())return;
    state.seconds++;tick++;
    if(tick%60===0){state.ore+=Math.round(state.mining*5*1.2*(state.synergy?1.25:1));state.pearls+=8;refreshHud();}
    if(atCap())render(true);inspector();
},1000);
document.querySelector('.prototype-switcher').hidden = false; // Public prototype review build.
if(params.get('view')==='active')ActivePlay.open();else render();
