/* Two relaxed proposals: satisfying clearing and immediate resources, without timing tests. */
const ActivePlay=(()=>{
    const M=ArcaneActivityModel,keys=Object.keys(M.modes);
    const requested=new URLSearchParams(location.search).get('activity');
    let mode=keys.includes(requested)?requested:'clearing',selected='Firebolt',session=null,run=null,serial=0,eventSerial=0;
    let holding=false,brush=false,pointer=null,holdTimer=null,poseTimer=null,suppressUntil=0,visit=null;
    const runs=new Map(),effects=new Set();
    const usable=()=>state.unlocked.filter(name=>spell(name));
    const now=()=>performance.now();
    function stopHold(){holding=false;brush=false;pointer=null;clearInterval(holdTimer);holdTimer=null;phone?.querySelector('.harvest-cast')?.classList.remove('holding');}
    function ensure(){
        if(session!==state){reset();session=state;}
        const key=mode+'-'+state.realm;
        if(!runs.has(key))runs.set(key,M.start({id:'harvest-'+(++serial),mode,realm:state.realm,owned:usable(),now:now()}));
        run=runs.get(key);run.owned=usable();
        if(!usable().includes(selected))selected=usable()[0]||'Firebolt';
        if(!visit||visit.realm!==state.realm)visit={realm:state.realm,shards:state.shards[state.realm],active:state.activeBonus||0};
    }
    const idleGained=()=>visit?Math.max(0,state.shards[visit.realm]-visit.shards-((state.activeBonus||0)-visit.active)):0;
    function bank(){if(session!==state||!run)return;const amount=M.claim(run,state);state.activeBonus=(state.activeBonus||0)+amount;return amount;}
    function open(name){if(state.view==='fight')return;if(name&&usable().includes(name))selected=name;ensure();go('active');}
    function start(){ensure();go('active');}
    function finish(){stopHold();bank();if(state.view==='active')update();}
    function onLeave(){stopHold();bank();clearTimeout(poseTimer);effects.forEach(clearTimeout);effects.clear();visit=null;}
    function reset(){stopHold();clearTimeout(poseTimer);effects.forEach(clearTimeout);effects.clear();runs.clear();session=null;run=null;visit=null;}
    function chooseMode(value){if(!M.modes[value])return;onLeave();mode=value;const url=new URL(location.href);url.searchParams.set('activity',mode);history.replaceState(null,'',url);ensure();go('active');}
    function unlockHint(name){return name==='Icebolt'?(state.won[0]?(state.shards[1]>=5?'Ready to craft':Math.min(5,Math.floor(state.shards[1]))+' / 5 Ice shards'):'Craft in Ice realm'):'Fuse at Forge 2';}
    function targetMarkup(){return run.targetHp.map((hp,i)=>`<span class="harvest-target ${!hp?'cleared':''} ${hp>0&&hp<M.modes[mode].targetHp?'cracked':''}" data-harvest-target="${i}" style="--cell:${i};--hp:${hp/M.modes[mode].targetHp}">${mode==='clearing'?sprite('slime'):ui(resourceIcon(),'harvest-crystal')}<span class="target-ground"></span><span class="crystal-fracture" aria-hidden="true"></span><span class="target-crack" aria-hidden="true"></span><span class="harvest-hit-number" aria-hidden="true"></span><span class="harvest-loot" aria-hidden="true">${ui(resourceIcon())}<b>+1</b></span></span>`).join('');}
    function view(){
        ensure();
        return `<section class="harvest-page">
          <div class="harvest-heading"><div><span class="kicker">${realms[state.realm].toUpperCase()} REALM · ACTIVE PLAY</span><h2>${M.modes[mode].name}</h2></div><button class="text-button" data-ap-back="true">Realm ↗</button></div>
          <div class="harvest-tabs" aria-label="Relaxed play concepts">${keys.map(k=>`<button data-ap-mode="${k}" aria-pressed="${mode===k}">${M.modes[k].label} · ${M.modes[k].name}</button>`).join('')}</div>
          <div class="harvest-progress"><div><b id="harvest-board">${mode==='clearing'?'Clearing':'Crystal bed'} ${run.board}</b><span id="harvest-count">${6-M.remaining(run)} / 6 cleared</span></div><div class="harvest-track" role="progressbar" aria-label="Current field cleared" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(M.progress(run)*100)}"><i style="width:${M.progress(run)*100}%"></i></div></div>
          <div class="harvest-tallies"><span>${ui(resourceIcon(),'inline-icon')} Collected <b id="harvest-collected">+${run.claimed}</b></span><span>Idle <b id="harvest-idle">+${idleGained()}</b></span></div>
          <div class="harvest-field mode-${mode} realm-${realms[state.realm].toLowerCase()}" role="button" tabindex="0" aria-label="${mode==='clearing'?'Tap or hold to cast. Spells find a slime automatically.':'Tap, sweep or hold to break crystals. Every hit chips them away.'}" data-active-spell="${spell(selected).art}">
             ${scenery()}<div class="harvest-shade"></div><div class="harvest-instruction">${mode==='clearing'?'Hold. Cast. Watch them pop.':'Sweep a path through the crystals.'}</div>
             <div class="harvest-targets">${targetMarkup()}</div>
             <div class="harvest-mage">${sprite('mage')}<span class="harvest-mage-glow"></span></div>
             <div class="harvest-effects" aria-hidden="true"></div>
             <div class="harvest-celebration" role="status"></div>
             <div class="harvest-field-caption">${mode==='clearing'?'Your spells find their targets':'Each crack brings you closer'}</div>
          </div>
          <div class="harvest-spells" aria-label="Your spells and what comes next">${spells.map((item,i)=>{const available=usable().includes(item.name);return `<button ${available?`data-ap-spell="${esc(item.name)}" aria-pressed="${selected===item.name}"`:`data-card="spells" data-id="${i}"`} class="harvest-spell ${available?'':'is-locked'}" aria-label="${item.name}, ${available?item.damage+' damage, up to '+M.reach[item.name]+' targets':i===1?'craft with 5 Ice shards after the Fire guardian':'fusion requires Forge 2 and both ingredients'}">${sprite(item.art)}<b>${esc(item.name)}</b><small>${available?(M.reach[item.name]===1?'Focused burst':M.reach[item.name]===2?'Two-target chain':'Four-target bloom'):unlockHint(item.name)}</small></button>`;}).join('')}</div>
          <button class="rune-button harvest-cast" data-ap-cast="true">${sprite(spell(selected).art)}<span>Hold to cast<small>Auto-aim · Tap works too</small></span></button>
          <p class="harvest-note">Take your time. Your cleared targets and loot stay with you.</p>
        </section>`;
    }
    function later(fn,ms){const timer=setTimeout(()=>{effects.delete(timer);fn();},ms);effects.add(timer);}
    function animate(name,outcome){
        const field=phone.querySelector('.harvest-field');if(!field)return;
        const art=spell(name).art;field.dataset.activeSpell=art;
        const mage=field.querySelector('.harvest-mage'),layer=field.querySelector('.harvest-effects'),frame=field.getBoundingClientRect(),origin=mage.getBoundingClientRect();
        mage.querySelector('.sprite').outerHTML=sprite('casting');mage.classList.add('casting');clearTimeout(poseTimer);
        poseTimer=setTimeout(()=>{if(mage.isConnected){mage.classList.remove('casting');mage.querySelector('.sprite').outerHTML=sprite('mage');}},500);
        for(const hit of outcome.hits){
            const body=field.querySelector(`[data-harvest-target="${hit.index}"]`),dest=body.getBoundingClientRect();
            const bolt=document.createElement('span');bolt.className='harvest-bolt';bolt.innerHTML=sprite(art);bolt.style.cssText=`--x:${origin.x+origin.width*.78-frame.x}px;--y:${origin.y+origin.height*.4-frame.y}px;--dx:${dest.x+dest.width*.5-origin.x-origin.width*.78}px;--dy:${dest.y+dest.height*.48-origin.y-origin.height*.4}px`;layer.append(bolt);later(()=>bolt.remove(),360);
        }
        later(()=>{
            bank();refreshHud();
            if(!field.isConnected)return;
            for(const hit of outcome.hits){
                const body=field.querySelector(`[data-harvest-target="${hit.index}"]`);
                body.classList.remove('impact','loot-pop');void body.offsetWidth;body.classList.add('impact');
                body.querySelector('.harvest-hit-number').textContent=hit.damage;
                if(hit.destroyed){body.classList.add('cleared','loot-pop');}else{body.classList.add('cracked');body.style.setProperty('--hp',run.targetHp[hit.index]/M.modes[mode].targetHp);}
            }
            const caption=field.querySelector('.harvest-field-caption');caption.textContent=name+(outcome.earned?' · +'+outcome.earned+' '+realms[run.realm]+' shards':' · Cracking open');
            if(outcome.complete){const banner=field.querySelector('.harvest-celebration');banner.innerHTML=`${ui(resourceIcon())}<strong>${mode==='clearing'?'Beautifully cleared.':'Every crystal, opened.'}</strong><span>+6 ${realms[run.realm]} shards collected</span>`;banner.classList.add('visible');}
            update();inspector();
        },220);
    }
    function nearest(event){
        if(event?.target?.closest?.('[data-harvest-target]'))return Number(event.target.closest('[data-harvest-target]').dataset.harvestTarget);
        const cells=[...phone.querySelectorAll('[data-harvest-target]')].filter(el=>run.targetHp[Number(el.dataset.harvestTarget)]>0);
        if(!event||!cells.length)return run.targetHp.findIndex(hp=>hp>0);
        cells.sort((a,b)=>{const distance=el=>{const r=el.getBoundingClientRect();return Math.hypot(r.x+r.width/2-event.clientX,r.y+r.height/2-event.clientY);};return distance(a)-distance(b);});
        return Number(cells[0].dataset.harvestTarget);
    }
    function cast(event){
        if(!state.connected||state.view!=='active'||state.modal)return;
        ensure();const outcome=M.cast(run,{id:++eventSerial,name:selected,target:nearest(event),damage:spell(selected).damage+state.damageBonus,now:now()});
        if(!outcome.accepted)return;
        animate(selected,outcome);inspector();
    }
    function beginHold(event,isBrush=false){
        if(!state.connected||state.modal||state.view!=='active')return;
        stopHold();holding=true;brush=isBrush;pointer=event?{clientX:event.clientX,clientY:event.clientY}:null;cast(event);
        phone.querySelector('.harvest-cast')?.classList.add('holding');
        holdTimer=setInterval(()=>{if(state.connected&&!document.hidden)cast(brush?pointer:null);},820);
    }
    function update(){
        if(state.view!=='active'||!run||session!==state)return;
        const progress=phone.querySelector('.harvest-track');if(!progress)return;
        if(M.advance(run,now())){const cells=phone.querySelector('.harvest-targets');cells.innerHTML=targetMarkup();phone.querySelector('.harvest-celebration')?.classList.remove('visible');phone.querySelector('.harvest-field-caption').textContent='A fresh patch. The same gentle pace.';}
        const amount=Math.round(M.progress(run)*100);progress.setAttribute('aria-valuenow',amount);progress.querySelector('i').style.width=amount+'%';
        phone.querySelector('#harvest-board').textContent=(mode==='clearing'?'Clearing':'Crystal bed')+' '+run.board;
        phone.querySelector('#harvest-count').textContent=(6-M.remaining(run))+' / 6 cleared';
        phone.querySelectorAll('.harvest-spell.is-locked').forEach(el=>{const hint=unlockHint(spells[Number(el.dataset.id)].name);el.querySelector('small').textContent=hint;el.classList.toggle('ready-to-craft',hint==='Ready to craft');});
        phone.querySelector('#harvest-collected').textContent='+'+run.claimed;phone.querySelector('#harvest-idle').textContent='+'+idleGained();
    }
    function handleButton(el){
        if(el.dataset.apMode){chooseMode(el.dataset.apMode);return true;}
        if(el.dataset.apSpell){selected=el.dataset.apSpell;stopHold();render(true);return true;}
        if(el.dataset.apCast){if(now()>=suppressUntil)cast();return true;}
        if(el.dataset.apBack){go('realm');return true;}
        return false;
    }
    document.addEventListener('pointerdown',event=>{
        if(typeof state==='undefined'||state.view!=='active'||event.button!==0)return;
        const field=event.target.closest('.harvest-field'),button=event.target.closest('.harvest-cast');if(!field&&!button)return;
        if(field&&mode==='crystals')event.preventDefault();
        beginHold(event,!!field);suppressUntil=now()+350;
    });
    document.addEventListener('pointermove',event=>{if(!holding||!brush)return;pointer={clientX:event.clientX,clientY:event.clientY};if(mode==='crystals')cast(pointer);});
    document.addEventListener('click',event=>{if(event.target.closest('.harvest-field')&&now()>=suppressUntil)cast(event);});
    for(const name of ['pointerup','pointercancel','blur'])globalThis.addEventListener(name,()=>{if(holding)suppressUntil=now()+350;stopHold();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopHold();});
    document.addEventListener('keydown',event=>{
        if(typeof state==='undefined'||state.view!=='active'||state.modal||!state.connected||event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
        const index=Number(event.key)-1;if(index>=0&&index<usable().length){selected=usable()[index];stopHold();render(true);event.preventDefault();}
        if(event.code==='Space'){event.preventDefault();if(!event.repeat)beginHold();}
        if(event.code==='Enter'&&event.target.closest('.harvest-field')){event.preventDefault();cast();}
    });
    document.addEventListener('keyup',event=>{if(event.code==='Space'){suppressUntil=now()+350;stopHold();}});
    setInterval(()=>{if(typeof state!=='undefined'&&state.view==='active'&&state.connected&&!document.hidden)update();},100);
    return {view,open,start,finish,onLeave,reset,chooseMode,handleButton,cycle(delta){if(state.view!=='fight')chooseMode(keys[(keys.indexOf(mode)+delta+keys.length)%keys.length]);},label:()=>M.modes[mode].label+' · '+M.modes[mode].name,inspect:()=>({mode,selected,id:run?.id,board:run?.board,cleared:run?.cleared||0,casts:run?.casts||0,collected:run?.claimed||0,progress:run?M.progress(run):0,holding})};
})();
