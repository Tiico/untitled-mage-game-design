import M from './model.mjs';
import { metadata, rules } from './catalog.mjs';
import { analyzeCatalog } from './analysis.mjs';
const $ = id => document.getElementById(id);
let scenario = 'intro', step = 0, mode = 'design', selected = '';
let state = M.fresh();
let choiceA = 'fire', choiceB = '';
let analysisStage = 3;
const analysis = analyzeCatalog(M.spells);
const stageNames = ['Before Fire boss', 'Before Ice boss', 'Before Earth boss', 'Before Wind boss', 'After Wind boss'];
const scenarios = {
    intro:{name:'01 · First fusion',title:'From Firebolt to Frostfire',description:'Follow the PRD introduction: Fire boss → 5 ice shards → Icebolt → Ice boss → upgrade → fusion. The first fusion never gates its own boss.',steps:[
        ['Simulate Fire boss victory',{type:'boss'}],['Collect 5 ice shards',{type:'farm',realm:1}],['Craft Icebolt · 5 shards',{type:'craft',id:'ice'}],['Simulate Ice boss victory',{type:'boss'}],['Upgrade forge to level 2',{type:'upgrade'}],['Forge Firebolt + Icebolt',{type:'fuse',a:'fire',b:'ice'}]
    ]},
    chain:{name:'02 · Multi-step chain',title:'A fusion can become an ingredient',description:'A deliberately generous setup isolates the proposed chain. Wind shards are reachable after Earth; forge 3 is a proposal. Craft two fusions, then combine them.',steps:[
        ['Forge Firebolt + Icebolt',{type:'fuse',a:'fire',b:'ice'}],['Forge Icebolt + Gale Blade',{type:'fuse',a:'ice',b:'gale'}],['Forge Frostfire Bolt + Hailstorm',{type:'fuse',a:'frostfire',b:'hail'}]
    ]},
    invalid:{name:'03 · Invalid & repeated',title:'What should a failed attempt cost?',description:'Try an invalid pair, a valid pair, then the same recipe reversed. Compare the essence and library after every step. Reverse order uses the same recipe (proposal).',steps:[
        ['Try Stone Spike + Gale Blade',{type:'fuse',a:'stone',b:'gale'}],['Forge Firebolt + Icebolt',{type:'fuse',a:'fire',b:'ice'}],['Repeat Icebolt + Firebolt',{type:'fuse',a:'ice',b:'fire'}]
    ]},
    free:{name:'04 · Free exploration',title:'Build your own route',description:'Starts at the beginning. Use the controls below the atlas to simulate victories, collect shards, craft base spells and attempt recipes. No state is saved.',steps:[]}
};
function dispatch(action) {
    state = M.reduce(state,action);
    if(action.type==='fuse') { choiceA=action.a; choiceB=action.b; }
    if(!state.error && action.type==='fuse') selected = state.discovered.at(-1) || selected;
    render();
}
function start(name) { scenario=name;step=0;state=M.preset(name);choiceA='fire';choiceB=state.owned.includes('ice')?'ice':'';selected='';render(); }
function ancestors(id,set=new Set()) { if(set.has(id)) return set;set.add(id); (M.find(id)?.inputs||[]).forEach(p=>ancestors(p,set)); return set; }
function visible(p) { return mode==='design' || !p.inputs || state.discovered.includes(p.id); }
function renderAnalysis() {
    $('analysis').hidden = mode === 'player';
    const stage = analysis.stages[analysisStage];
    const available = new Set(stage.reachable);
    $('analysis').innerHTML = `<div class="analysis-header"><div><div class="eyebrow">Structure analysis / potential acquisition</div><h2>${analysis.issues.length ? analysis.issues.length+' structure issues' : 'No circular or unreachable recipes'}</h2><p>${analysis.baseCount} base spells · ${analysis.fusionCount} fusions · ${analysis.multiStepCount} multi-step fusion. Unlimited farmable materials assumed.</p></div><div class="analysis-controls"><label>Milestone<select id="analysis-stage">${stageNames.map((name,i)=>`<option value="${i}" ${i===analysisStage?'selected':''}>${name}</option>`).join('')}</select></label><button id="export-analysis">Export analysis</button></div></div><div class="analysis-result"><strong>${stage.reachable.length} / ${M.spells.length} spells reachable · forge cap ${stage.forge}</strong><p>${stage.reachable.map(id=>M.find(id).name).join(' · ')}</p><p>This analyzes ingredients and gates. It does not prove that a boss can be defeated or that the economy is balanced. Changing this milestone does not change your free-play state.</p></div><details><summary>Acquisition and dependency table</summary><div class="table-scroll"><table><thead><tr><th>Spell</th><th>Decision</th><th>Earliest milestone</th><th>Selected milestone</th><th>Directly used by</th></tr></thead><tbody>${M.spells.map(p=>`<tr><td>${p.name}</td><td>${p.known?'PRD':'Proposal'}</td><td>${stageNames[analysis.bySpell[p.id].earliestStage]||'Unreachable'}</td><td>${available.has(p.id)?'Reachable':'Locked'}</td><td>${analysis.bySpell[p.id].usedBy.map(id=>M.find(id).name).join(', ')||'Final result'}</td></tr>`).join('')}</tbody></table></div></details>`;
    $('analysis-stage').onchange = event => { analysisStage = Number(event.target.value); renderAnalysis(); updateViewLink(); };
    $('export-analysis').onclick = () => {
        const report = {metadata, milestone: stageNames[analysisStage], analysis,
            simulation: {bosses: state.bosses, forge: state.forge, essence: state.essence,
                shards: state.shards, owned: state.owned, discovered: state.discovered},
            limits: 'Structural acquisition only. Proposed content and economy are not approved game design.'};
        const url = URL.createObjectURL(new Blob([JSON.stringify(report,null,4)], {type:'application/json'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = `fusion-analysis-${metadata.version}.json`;
        link.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
}
function renderMap() {
    const shown = M.spells.filter(visible);
    const trace = shown.some(p=>p.id===selected) ? ancestors(selected) : new Set();
    const paths = shown.filter(p=>p.inputs).flatMap(p=>p.inputs.map(id=>{
        const from=M.find(id),active=trace.has(p.id)&&trace.has(id);
        return `<path class="edge ${p.known?'':'proposal'} ${active?'highlight':trace.size?'dim':''}" d="M ${from.x+82} ${from.y} C ${from.x+210} ${from.y},${p.x-210} ${p.y},${p.x-82} ${p.y}"/>`;
    })).join('');
    $('map').innerHTML = `<span class="column-label" style="left:14.0625%">01 / Base spells</span><span class="column-label" style="left:48.9583%">02 / First fusion</span><span class="column-label" style="left:83.8542%">03 / Multi-step fusion</span><svg viewBox="0 0 960 650" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>` + shown.map(p=>{
        const owned=state.owned.includes(p.id);
        return `<button class="node ${p.known?'':'proposal'} ${owned?'owned':''} ${selected===p.id?'selected':''} ${trace.size&&!trace.has(p.id)?'dim':''}" data-spell="${p.id}" aria-pressed="${selected===p.id}" style="left:${p.x/960*100}%;top:${p.y}px;--node-color:${p.color}"><span class="status">${owned?'UNLOCKED':p.known?'PRD':'PROPOSAL'}</span><span class="symbol" aria-hidden="true">${p.symbol}</span><span class="node-title">${p.name}</span><span class="node-note">${p.inputs?`Forge ${p.level} · fusion`:`${M.realms[p.realm]} · ${p.id==='fire'?'starting spell':p.cost+' shards'}`}</span></button>`;
    }).join('');
    $('map').querySelectorAll('[data-spell]').forEach(b=>b.onclick=()=>{selected=b.dataset.spell;renderMap();renderInspector();updateViewLink();});
    $('map-subtitle').textContent=mode==='design'?'Designer-only proposal. Follow a line from ingredient to result.':'Undiscovered fusion nodes and recipe links are hidden.';
    $('map-note').textContent=mode==='design'?'Solid content: Firebolt, Icebolt and Frostfire Bolt. Dashed nodes and links are design proposals, not approved additions. On narrow screens, scroll the atlas sideways.':`${analysis.fusionCount-state.discovered.length} fusion recipes remain undiscovered. The PRD does not decide whether the final game shows a hidden-recipe count. Base-spell previews here are a simulation choice.`;
}
function renderInspector() {
    const p=M.find(selected);
    if(!p || !visible(p)) { $('inspector').innerHTML=mode==='design'?'<div class="eyebrow">Reading the atlas</div><h2>Follow a branch</h2><p>Select a spell to highlight every ingredient it depends on.</p><p>Solid borders mark the three named PRD spells. Dashed borders mark proposed content. Status labels show what you have actually unlocked.</p><p>Six base spells → five first-step fusions → one multi-step fusion.</p>':'<div class="eyebrow">Recipe discovery</div><h2>Something to discover</h2><p>Choose two unlocked spells in the forge. Hidden results are only revealed by a successful craft.</p>';return; }
    const owned=state.owned.includes(p.id);
    $('inspector').innerHTML=`<span class="tag ${p.known?'confirmed':'proposed'}">${p.known?'PRD CONTENT':'CONTENT PROPOSAL'}</span><div class="big-symbol" style="color:${p.color}" aria-hidden="true">${p.symbol}</div><h2>${p.name}</h2><p>${p.role}</p><dl class="facts"><div><dt>Library</dt><dd>${owned?'Unlocked permanently':'Not unlocked'}</dd></div><div><dt>Forge requirement</dt><dd>${p.level===0?'Starting spell':'Level '+p.level}</dd></div><div><dt>Acquisition</dt><dd>${p.inputs?'Recipe discovery':p.id==='fire'?'Granted at start':p.cost+' '+M.realms[p.realm].toLowerCase()+' shards'}</dd></div></dl>${p.inputs?`<div class="recipe">${p.inputs.map(id=>M.find(id).name).join(' + ')}<br>→ ${p.name}</div><p>${p.known?'PRD §7: first fusion after the Ice boss.':'Proposed recipe and forge requirement.'}</p>`:'<p>All base spells also have a finished-spell drop path in the PRD; drops are not simulated here.</p>'}${owned?'<button id="use-ingredient" class="small">Use as ingredient</button>':''}`;
    if(owned) $('use-ingredient').onclick=()=>{if(choiceA===p.id) choiceB='';else if(!choiceA) choiceA=p.id;else choiceB=p.id;renderForge();$('ingredient-a').scrollIntoView({block:'center'});};
}
function renderForge() {
    const options='<option value="">Choose a spell…</option>'+state.owned.map(id=>`<option value="${id}">${M.find(id).name}</option>`).join('');
    $('ingredient-a').innerHTML=options;$('ingredient-b').innerHTML=options;
    $('ingredient-a').value=choiceA;$('ingredient-b').value=choiceB;
    const current=Math.min(state.bosses,3);
    $('farm').textContent=`Collect 5 ${M.realms[current].toLowerCase()} shards`;
    $('farm-note').textContent='Or return to an unlocked realm below. Intro Icebolt costs exactly 5 ice shards; all other base costs here are proposals.';
    $('craft-actions').innerHTML=M.realms.filter((_,i)=>i<=current).map((r,i)=>`<button class="small" data-farm="${i}">+5 ${r} shards</button>`).join('')+M.spells.filter(p=>!p.inputs&&!state.owned.includes(p.id)).map(p=>`<button class="small" data-craft="${p.id}" ${p.realm>state.bosses||p.level>state.forge?'disabled':''}>Craft ${p.name} · ${p.cost}</button>`).join('')+'<button class="small" id="essence">Grant 60 essence · design control</button>';
    $('craft-actions').querySelectorAll('[data-farm]').forEach(b=>b.onclick=()=>dispatch({type:'farm',realm:Number(b.dataset.farm)}));
    $('craft-actions').querySelectorAll('[data-craft]').forEach(b=>b.onclick=()=>dispatch({type:'craft',id:b.dataset.craft}));
    $('essence').onclick=()=>dispatch({type:'essence'});
    $('upgrade').textContent=`Upgrade forge${state.forge>0&&state.forge<M.cap({bosses:4})?' · '+rules.forgeUpgradeCosts[state.forge]+' essence':''}`;
    $('boss').disabled=state.bosses===4;
    $('boss').textContent=state.bosses<4?`Simulate ${M.realms[state.bosses]} boss victory`:'All bosses defeated';
}
function render() {
    $('tabs').innerHTML=Object.entries(scenarios).map(([id,s])=>`<button role="tab" aria-selected="${scenario===id}" aria-controls="scenario" data-scenario="${id}">${s.name}</button>`).join('');
    $('tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>start(b.dataset.scenario));
    const s=scenarios[scenario],next=s.steps[step];
    $('scenario').innerHTML=`<div><span class="step">${s.steps.length?`GUIDED WALKTHROUGH · ${Math.min(step+1,s.steps.length)} / ${s.steps.length}`:'INDEPENDENT EXPLORATION'}</span><h3>${mode==='player'&&scenario==='intro'?'Your first fusion':s.title}</h3><p>${s.description}</p></div>${next?`<button class="primary" id="next">${step+1}. ${next[0]}</button>`:s.steps.length?'<span class="tag confirmed">Walkthrough complete</span>':'<span class="tag">Use the forge below</span>'}`;
    if(next) $('next').onclick=()=>{state=M.reduce(state,next[1]);if(next[1].type==='fuse'){choiceA=next[1].a;choiceB=next[1].b;if(!state.error)selected=state.discovered.at(-1)||selected;}if(!state.error||scenario==='invalid')step++;render();};
    $('progress').innerHTML=M.realms.map((r,i)=>`<div class="realm ${i===Math.min(state.bosses,3)?'current':''}"><strong>${String(i+1).padStart(2,'0')} / ${r}</strong><span>${i<state.bosses?'Boss defeated':i===state.bosses?'Available · boss undefeated':'Locked behind '+M.realms[i-1]+' boss'}</span></div>`).join('');
    $('state').innerHTML=`<div class="stat"><strong>${state.forge} <small class="muted">/ ${M.cap(state)}</small></strong><span>Forge level / unlocked cap</span></div><div class="stat"><strong>${state.essence}</strong><span>Essence · proposed currency</span></div><div class="stat"><strong>${state.owned.length} <small class="muted">/ ${M.spells.length}</small></strong><span>Permanent spells unlocked</span></div><div class="stat"><strong>${state.discovered.length} <small class="muted">/ ${analysis.fusionCount}</small></strong><span>Fusion recipes discovered</span></div>`;
    $('notice').textContent=state.notice;$('notice').className=state.error?'error':'';
    $('library').textContent=state.owned.map(id=>M.find(id).name).join(' · ');
    $('resources').textContent='Shards: '+M.realms.map((r,i)=>`${r} ${state.shards[i]}`).join(' / ')+'. Essence: '+state.essence+'.';
    $('discoveries').textContent='Discovered recipes: '+(state.discovered.map(id=>M.find(id).name).join(', ')||'none')+'. Bosses defeated: '+state.bosses+'/4.';
    $('log').innerHTML=state.log.map(line=>`<li>${line}</li>`).join('');
    $('design-mode').setAttribute('aria-pressed',mode==='design');$('player-mode').setAttribute('aria-pressed',mode==='player');
    $('design-questions').hidden=mode==='player';
    $('catalog-version').textContent=`Catalog ${metadata.version} · reviewed ${metadata.lastReviewed}`;
    renderAnalysis();renderMap();renderInspector();renderForge();updateViewLink();
}
function updateViewLink() {
    const url = new URL(location.href);
    url.searchParams.set('scenario',scenario);
    url.searchParams.set('view',mode);
    url.searchParams.set('milestone',analysisStage);
    if(selected && visible(M.find(selected))) url.searchParams.set('spell',selected);
    else url.searchParams.delete('spell');
    history.replaceState(null,'',url);
}
$('ingredient-a').onchange=e=>{choiceA=e.target.value;};$('ingredient-b').onchange=e=>{choiceB=e.target.value;};
$('forge').onclick=()=>dispatch({type:'fuse',a:choiceA,b:choiceB});
$('upgrade').onclick=()=>dispatch({type:'upgrade'});
$('boss').onclick=()=>dispatch({type:'boss'});
$('farm').onclick=()=>dispatch({type:'farm',realm:Math.min(state.bosses,3)});
$('reset').onclick=()=>start(scenario);
$('show-all').onclick=()=>{selected='';renderMap();renderInspector();updateViewLink();};
$('design-mode').onclick=()=>{mode='design';render();};$('player-mode').onclick=()=>{mode='player';render();};
const initialView = new URLSearchParams(location.search);
scenario = Object.hasOwn(scenarios,initialView.get('scenario')) ? initialView.get('scenario') : 'intro';
mode = initialView.get('view') === 'player' ? 'player' : 'design';
const requestedStage = Number(initialView.get('milestone'));
if(initialView.has('milestone') && Number.isInteger(requestedStage) && requestedStage >= 0 && requestedStage <= 4) analysisStage = requestedStage;
state = M.preset(scenario);
choiceB = state.owned.includes('ice') ? 'ice' : '';
selected = M.find(initialView.get('spell')) && visible(M.find(initialView.get('spell'))) ? initialView.get('spell') : '';
if(analysis.issues.length) {
    $('analysis').textContent = 'Catalog validation failed: ' + analysis.issues.join('; ');
    $('notice').textContent = 'The simulator cannot run until the catalog is repaired.';
} else render();
