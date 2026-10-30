/* Selected Spell Clearing direction: touch-led swarms, rotating build, real area geometry. */
const ActivePlay=(()=>{
    const M=ArcaneActivityModel;
    let session=null,run=null,preview=null,serial=0,eventId=0,holding=false,pointerId=null,aim=null,holdTimer=null,suppressUntil=0,lastFrame=0,poseTimer=null;
    let visit=null;const runs=new Map(),timers=new Set();
    const usable=()=>state.unlocked.filter(name=>spell(name));
    const build=()=>state.idle.filter(name=>usable().includes(name)).slice(0,4);
    const now=()=>performance.now();
    function stopHold(){holding=false;pointerId=null;clearInterval(holdTimer);holdTimer=null;phone?.querySelector('.swarm-field')?.classList.remove('is-holding');phone?.querySelector('.swarm-cast')?.classList.remove('holding');}
    function reset(){stopHold();timers.forEach(clearTimeout);timers.clear();clearTimeout(poseTimer);runs.clear();session=null;run=null;preview=null;visit=null;aim=null;}
    function ensure(){
        if(session!==state){reset();session=state;}
        if(!runs.has(state.realm))runs.set(state.realm,M.start({id:'swarm-'+(++serial),realm:state.realm,owned:usable(),now:now()}));
        run=runs.get(state.realm);run.owned=usable();if(preview&&!usable().includes(preview))preview=null;
        if(!visit)visit={realm:state.realm,shards:state.shards[state.realm],active:state.activeBonus||0};
    }
    function bank(){if(session!==state||!run)return;const amount=M.claim(run,state);state.activeBonus=(state.activeBonus||0)+amount;return amount;}
    function onLeave(){stopHold();bank();timers.forEach(clearTimeout);timers.clear();clearTimeout(poseTimer);visit=null;}
    function open(name){if(state.view==='fight')return;ensure();preview=name&&usable().includes(name)?name:null;go('active');}
    const idleGained=()=>visit?Math.max(0,state.shards[visit.realm]-visit.shards-((state.activeBonus||0)-visit.active)):0;
    function mobMarkup(m){return `<span class="swarm-mob" data-mob="${m.id}" style="--mx:${m.x};--my:${m.y}"><span class="mob-shadow"></span>${sprite('slime')}<span class="mob-pop"></span></span>`;}
    function loadoutMarkup(){return Array.from({length:4},(_,i)=>`<span class="swarm-slot" data-swarm-spell="${build()[i]||''}">${icon(build()[i])}</span>`).join('');}
    function view(){
        ensure();
        return `<section class="swarm-page"><div class="harvest-heading"><div><span class="kicker">${realms[state.realm].toUpperCase()} REALM · SPELL CLEARING</span><h2>Let your spells fly.</h2></div><button class="text-button" data-ap-back="true">Realm ↗</button></div>
        <div class="swarm-tallies"><span><b id="swarm-popped">${run.popped}</b> popped</span><span>${ui(resourceIcon(),'inline-icon')}<b id="swarm-collected">+${run.claimed}</b></span><span>Idle <b id="swarm-idle">+${idleGained()}</b></span></div>
        <div class="swarm-field realm-${realms[state.realm].toLowerCase()}" tabindex="0" role="button" aria-label="Hold a finger over the monsters. Move it to direct your equipped spells." data-active-spell="fire">${scenery()}<div class="harvest-shade"></div><div class="swarm-instruction">Hold over the swarm. Move to direct your magic.</div><div class="swarm-mobs">${run.mobs.filter(m=>m.hp>0).map(mobMarkup).join('')}</div><div class="swarm-aim" aria-hidden="true"></div><div class="swarm-mage">${sprite('mage')}</div><div class="swarm-fx" aria-hidden="true"></div><div class="swarm-caption" role="status">${build().length?'Your build casts in turn':'Equip a spell to begin'}</div></div>
        <div class="swarm-loot"><span>Next ${realms[state.realm]} shard</span><span id="swarm-shard-count">${run.popped%8} / 8 pops</span><div class="swarm-loot-track"><i style="width:${run.popped%8/8*100}%"></i></div></div>
        <div class="swarm-build-heading"><span class="kicker">${preview?'SPELL TRIAL':'YOUR IDLE BUILD · CASTS IN TURN'}</span><button class="text-button" data-action="idleBuild">Edit build ↗</button></div>
        <div class="swarm-loadout">${loadoutMarkup()}</div>
        ${preview?`<div class="swarm-trial">${sprite(spell(preview).art)}<span>Trying ${esc(preview)}</span><button data-ap-resume="true">Use idle build</button></div>`:''}
        <button class="rune-button swarm-cast" data-ap-cast="true" ${!build().length&&!preview?'disabled':''}>Hold to cast<small>Or hold directly over the monsters</small></button>
        <p class="harvest-note">${preview?'A spell trial keeps both saved builds unchanged.':'Bolts pick a target. Cones sweep through the crowd.'}</p></section>`;
    }
    function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);}
    function animate(outcome){
        const field=phone.querySelector('.swarm-field');if(!field)return;const art=spell(outcome.name).art;field.dataset.activeSpell=art;
        const mage=field.querySelector('.swarm-mage');mage.querySelector('.sprite').outerHTML=sprite('casting');clearTimeout(poseTimer);poseTimer=setTimeout(()=>{if(mage.isConnected)mage.querySelector('.sprite').outerHTML=sprite('mage');},330);
        const fx=field.querySelector('.swarm-fx');
        if(outcome.shape==='cone'){
            const cone=document.createElementNS('http://www.w3.org/2000/svg','svg');cone.setAttribute('viewBox','0 0 100 100');cone.setAttribute('preserveAspectRatio','none');cone.classList.add('swarm-cone');
            const edge=sign=>`${outcome.origin.x+Math.cos(outcome.direction+sign*outcome.angle)*outcome.range},${outcome.origin.y+Math.sin(outcome.direction+sign*outcome.angle)*outcome.range}`;
            cone.innerHTML=`<polygon points="${outcome.origin.x},${outcome.origin.y} ${edge(-1)} ${edge(1)}"/><polyline points="${edge(-1)} ${outcome.origin.x},${outcome.origin.y} ${edge(1)}"/>`;fx.append(cone);later(()=>cone.remove(),420);
        }else{
            const bolt=document.createElement('span');bolt.className='swarm-bolt';bolt.innerHTML=sprite(art);bolt.style.left=outcome.origin.x+'%';bolt.style.top=outcome.origin.y+'%';bolt.style.setProperty('--tx',outcome.aim.x+'%');bolt.style.setProperty('--ty',outcome.aim.y+'%');fx.append(bolt);later(()=>bolt.remove(),320);
        }
        later(()=>{
            const amount=bank();refreshHud();if(!field.isConnected)return;
            for(const hit of outcome.hits){const el=field.querySelector(`[data-mob="${hit.id}"]`);if(!el)continue;el.classList.add(hit.killed?'popped':'hit');if(hit.killed)later(()=>el.remove(),300);else later(()=>el.classList.remove('hit'),240);}
            const caption=field.querySelector('.swarm-caption');caption.textContent=outcome.name+' · '+outcome.killed+' popped'+(amount?' · +'+amount+' shards':'');
            phone.querySelectorAll('[data-swarm-spell]').forEach(el=>el.classList.toggle('is-casting',el.dataset.swarmSpell===outcome.name));update();inspector();
        },150);
    }
    function cast(){
        if(state.view!=='active'||!state.connected||state.modal)return;ensure();
        const field=phone.querySelector('.swarm-field'),box=field.getBoundingClientRect(),mage=field.querySelector('.swarm-mage').getBoundingClientRect(),origin={x:(mage.x+mage.width*.65-box.x)/box.width*100,y:(mage.y+mage.height*.4-box.y)/box.height*100};
        const outcome=M.cast(run,{id:++eventId,loadout:build(),preview,aim,origin,damageBonus:state.damageBonus,damages:Object.fromEntries(spells.map(s=>[s.name,s.damage])),now:now()});
        if(outcome.accepted)animate(outcome);
    }
    function beginHold(event){
        if(state.view!=='active'||!state.connected||state.modal)return;stopHold();holding=true;
        const field=event?.target.closest('.swarm-field');if(field){const r=field.getBoundingClientRect();aim={x:(event.clientX-r.x)/r.width*100,y:(event.clientY-r.y)/r.height*100};pointerId=event.pointerId;field.setPointerCapture?.(event.pointerId);}
        else aim={x:50,y:38};
        phone.querySelector('.swarm-field')?.classList.add('is-holding');phone.querySelector('.swarm-cast')?.classList.add('holding');cast();holdTimer=setInterval(cast,440);
    }
    function update(){
        if(state.view!=='active'||!run||session!==state)return;const field=phone.querySelector('.swarm-field');if(!field)return;
        const popped=phone.querySelector('#swarm-popped');if(popped)popped.textContent=run.popped;
        phone.querySelector('#swarm-collected').textContent='+'+run.claimed;phone.querySelector('#swarm-idle').textContent='+'+idleGained();phone.querySelector('#swarm-shard-count').textContent=run.popped%8+' / 8 pops';phone.querySelector('.swarm-loot-track i').style.width=run.popped%8/8*100+'%';
    }
    function frame(time){
        requestAnimationFrame(frame);if(time-lastFrame<40)return;lastFrame=time;
        if(typeof state==='undefined'||state.view!=='active'||!state.connected||document.hidden||state.modal||!run)return;
        const field=phone.querySelector('.swarm-field');if(!field)return;M.step(run,time,!matchMedia('(prefers-reduced-motion:reduce)').matches);const layer=field.querySelector('.swarm-mobs');
        for(const m of run.mobs){if(m.hp<=0)continue;let el=layer.querySelector(`[data-mob="${m.id}"]`);if(!el){layer.insertAdjacentHTML('beforeend',mobMarkup(m));el=layer.lastElementChild;}el.style.setProperty('--mx',m.x);el.style.setProperty('--my',m.y);}
        if(aim){const ring=field.querySelector('.swarm-aim');ring.style.left=aim.x+'%';ring.style.top=aim.y+'%';}update();
    }
    requestAnimationFrame(frame);
    function handleButton(el){if(el.dataset.apBack){go('realm');return true;}if(el.dataset.apResume){preview=null;stopHold();render(true);return true;}if(el.dataset.apCast){if(now()>=suppressUntil)cast();return true;}return false;}
    document.addEventListener('pointerdown',event=>{if(typeof state==='undefined'||state.view!=='active'||event.button!==0)return;if(!event.target.closest('.swarm-field,.swarm-cast'))return;event.preventDefault();beginHold(event);suppressUntil=now()+350;});
    document.addEventListener('pointermove',event=>{if(!holding||event.pointerId!==pointerId)return;const field=phone.querySelector('.swarm-field');if(!field)return;const r=field.getBoundingClientRect();aim={x:Math.max(0,Math.min(100,(event.clientX-r.x)/r.width*100)),y:Math.max(0,Math.min(100,(event.clientY-r.y)/r.height*100))};});
    for(const name of ['pointerup','pointercancel','blur'])globalThis.addEventListener(name,()=>{if(holding)suppressUntil=now()+350;stopHold();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopHold();});
    document.addEventListener('keydown',event=>{if(typeof state==='undefined'||state.view!=='active'||state.modal||event.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(event.code==='Space'){event.preventDefault();if(!event.repeat)beginHold();}if(event.code==='Enter'&&event.target.closest('.swarm-field')){event.preventDefault();cast();}});
    document.addEventListener('keyup',event=>{if(event.code==='Space')stopHold();});
    const studies=['swarmBasic','swarmCone','swarmBoss'];
    const studyIndex=()=>state.view==='fight'&&state.fight?.swarm?2:state.idle.includes('Frostfire Cone')?1:0;
    return {view,open,onLeave,reset,handleButton,start:()=>open(),finish:()=>{stopHold();bank();},cycle(delta){scenario(studies[(studyIndex()+delta+3)%3]);},label:()=>['A · Rotating bolts','B · Cone fusion','C · Boss reinforcements'][typeof state==='undefined'?0:studyIndex()],inspect:()=>({id:run?.id,preview,holding,aim,casts:run?.casts||0,popped:run?.popped||0,collected:run?.claimed||0,alive:run?M.alive(run.mobs).length:0,lastSpell:run?.casts?build()[(run.cursor-1)%Math.max(1,build().length)]:null})};
})();
