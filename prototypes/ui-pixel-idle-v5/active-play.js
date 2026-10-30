/* Three playable design proposals. All progress is local, illustrative and separate from boss rules. */
const ActivePlay = (()=>{
    const M=ArcaneActivityModel;
    const keys=Object.keys(M.modes);
    const initialMode=new URLSearchParams(location.search).get('activity');
    let mode=keys.includes(initialMode)?initialMode:'hunt';
    let selected='Firebolt',round=null,session=null,startShards=0,result=null,serial=0,castSerial=0,lastMessage='';
    let holdTimer=null,holdInterval=null,suppressClickUntil=0,pulseFrame=0,poseTimer=null;
    const effects=new Set();
    const descriptions={hunt:'Pick a spell. Aim for the charged slime. Hold a target for steady casting.',pulse:'Cast when the moving rune enters gold. You get one cast per pulse.',weave:'Tap the next spell in the glowing chain. Finish it to release a flourish.'};
    const now=()=>performance.now();
    const usable=()=>state.unlocked.filter(name=>spell(name));
    function stopHold(){clearTimeout(holdTimer);clearInterval(holdInterval);holdTimer=null;holdInterval=null;}
    function updateUrl(){const url=new URL(location.href);url.searchParams.set('activity',mode);history.replaceState(null,'',url);}
    function chooseMode(value){if(!M.modes[value])return;finish(false);round=null;result=null;mode=value;updateUrl();go('active');}
    function open(name){
        if(state.view==='fight')return notify('Leave the boss attempt before entering spell practice.');
        if(name&&state.unlocked.includes(name))selected=name;
        if(!usable().includes(selected))selected=usable()[0]||'Firebolt';
        if(state.view!=='active'){round=null;result=null;session=state;}
        go('active');
    }
    function start(){
        if(!state.connected)return;
        stopHold();session=state;startShards=state.shards[state.realm];result=null;lastMessage='';
        round=M.start({id:'practice-'+(++serial),mode,realm:state.realm,owned:usable(),now:now()});render();if(mode==='pulse')pulseFrame=requestAnimationFrame(drawPulse);
    }
    function finish(show=true){
        stopHold();
        if(!round||round.finished||session!==state)return;
        const idle=Math.max(0,state.shards[round.realm]-startShards);
        result={...M.finish(round),idle,mode};result.shards=M.claim(round,state);
        state.activeBonus=(state.activeBonus||0)+result.shards;
        if(show&&state.view==='active'){render();refreshHud();}
    }
    function onLeave(){finish(false);stopHold();clearTimeout(poseTimer);cancelAnimationFrame(pulseFrame);effects.forEach(clearTimeout);effects.clear();}
    function reset(){stopHold();clearTimeout(poseTimer);cancelAnimationFrame(pulseFrame);effects.forEach(clearTimeout);effects.clear();round=null;result=null;session=null;lastMessage='';}
    function palette(){
        return `<div class="active-spells" aria-label="Choose a spell">${usable().map((name,i)=>`<button class="practice-spell ${name===selected?'selected':''}" data-ap-spell="${esc(name)}" aria-pressed="${name===selected}" aria-label="${esc(name)}, ${spell(name).damage} damage${mode==='weave'?', cast this spell':''}">${sprite(spell(name).art)}<span>${esc(name)}</span><small>${spell(name).damage} damage · ${i+1}</small></button>`).join('')}</div>`;
    }
    function view(){
        const running=round&&!round.finished&&session===state;
        const art=spell(selected)?.art||'fire';
        if(result&&round?.finished)return resultView();
        const charged=running?M.chargedTarget(round,now()):0;
        const targets=mode==='hunt'?`<div class="hunt-targets">${[0,1,2].map(i=>`<button class="practice-target ${i===charged?'charged':''}" data-ap-target="${i}" aria-label="Cast ${esc(selected)} at slime ${i+1}${i===charged?', charged target':''}"><span class="target-aura"></span>${sprite('slime')}<span class="practice-enemy-hp"><i style="width:${running?round.targetHp[i]/60*100:100}%"></i></span><small>${i===charged?'CHARGED':'SLIME'}</small></button>`).join('')}</div>`:`<button class="practice-focus" data-ap-cast="true" aria-label="Cast ${esc(selected)}">${sprite('slime')}<span class="focus-aura"></span><span class="practice-enemy-hp"><i style="width:${running?round.targetHp[0]/60*100:100}%"></i></span><small>${mode==='pulse'?'CAST ON GOLD':'SPELL TARGET'}</small></button>`;
        return `<section class="activity-page">
            <div class="activity-heading"><div><span class="kicker">${realms[state.realm].toUpperCase()} REALM · ACTIVE PLAY</span><h2>${M.modes[mode].name}</h2></div><button class="text-button" data-ap-back="true">Realm ↗</button></div>
            <div class="activity-tabs" aria-label="Active play concepts">${keys.map(key=>`<button data-ap-mode="${key}" class="${key===mode?'active':''}" aria-pressed="${key===mode}">${M.modes[key].label} · ${M.modes[key].name.replace('Rune ','').replace('Arcane ','').replace('Spell ','')}</button>`).join('')}</div>
            <div class="practice-tallies"><span>${ui('time','inline-icon')}<b id="practice-time">${running?Math.ceil((round.endsAt-now())/1000):20}s</b></span><span>Bonus ${ui(resourceIcon(),'inline-icon')}<b id="practice-bonus">+${running?M.bonus(round):0}</b></span><span class="idle-tally">Idle <b id="practice-idle">+${running?Math.max(0,state.shards[round.realm]-startShards):0}</b></span></div>
            <div class="practice-field mode-${mode} realm-${realms[state.realm].toLowerCase()}" data-active-spell="${art}">${scenery()}<div class="practice-field-shade"></div>
                <div class="practice-help">${mode==='hunt'?'Aim for the charged slime':mode==='pulse'?'Cast as the rune enters gold':'Follow the glowing spell'}</div>
                ${mode==='weave'?`<div class="weave-queue">${weaveQueue()}</div>`:''}${targets}
                <div class="practice-mage">${sprite('mage')}<span class="practice-mage-glow"></span></div>
                <div class="practice-projectile" aria-hidden="true"></div><div class="practice-impact" aria-hidden="true"></div>
                ${mode==='pulse'?'<div class="pulse-lane" aria-hidden="true"><span class="pulse-good"></span><span class="pulse-perfect"></span><span class="pulse-marker"></span></div>':''}
                <div class="practice-feedback" id="practice-feedback" role="status">${running?'':mode==='hunt'?'Tap a slime to begin':'Ready when you are'}</div>
            </div>
            <div class="practice-status"><span id="practice-spell-name">${esc(selected)}</span><span id="practice-streak">${running?'Streak '+round.combo:'No player damage'}</span></div>
            ${palette()}
            <div class="practice-footer">${running?'<button class="rune-button secondary" data-ap-bank="true">End round & bank bonus</button>':'<button class="rune-button" data-ap-start="true">Begin a free round</button>'}</div>
            <p class="practice-caption">${descriptions[mode]}</p>
        </section>`;
    }
    function weaveQueue(){
        const queue=round&&!round.finished?M.sequence(round):M.sequence(M.start({id:'preview',mode:'weave',owned:usable()}));
        return queue.map((name,i)=>`<span class="weave-rune ${round?.weaveIndex===i||!round&&i===0?'current':''}" data-weave-index="${i}">${sprite(spell(name).art)}<small>${i+1}</small></span>${i<queue.length-1?'<i aria-hidden="true"></i>':''}`).join('');
    }
    function resultView(){
        return `<section class="activity-page practice-result"><div class="activity-heading"><div><span class="kicker">${M.modes[result.mode].name.toUpperCase()} · ROUND COMPLETE</span><h2>A little more magic.</h2></div></div><div class="practice-reward-art">${ui('crest')}</div><div class="practice-reward">${ui(realms[result.realm].toLowerCase())}<strong>+${result.shards}</strong><span>${realms[result.realm]} shards</span></div><p class="tiny muted center">Added to your resources. Idle kept working.</p><div class="round-report"><div><span>Your active bonus</span><b>+${result.shards}</b></div><div><span>Idle earned in parallel</span><b>+${result.idle}</b></div><div><span>Best streak</span><b>${result.bestCombo}</b></div><div><span>Spell damage dealt</span><b>${result.damage}</b></div></div><div class="stack">${btn('Play another free round','apAgain')}${btn('Return to your realm','apRealm',true)}</div><p class="practice-caption">No tickets. No lost progress. Your boss still waits for an active attempt.</p></section>`;
    }
    function feedback(message,good=false){const el=phone.querySelector('#practice-feedback');if(el){el.textContent=message;el.classList.toggle('good',good);}}
    function animate(name,target,hit){
        const field=phone.querySelector('.practice-field');if(!field)return;
        field.dataset.activeSpell=spell(name).art;
        const mage=field.querySelector('.practice-mage'),body=field.querySelector(mode==='hunt'?`[data-ap-target="${target}"]`:'[data-ap-cast]');
        const bolt=field.querySelector('.practice-projectile');
        if(!body)return;
        const frame=field.getBoundingClientRect(),from=mage.getBoundingClientRect(),to=body.getBoundingClientRect();
        mage.querySelector('.sprite').outerHTML=sprite('casting');mage.classList.add('casting');
        bolt.innerHTML=sprite(spell(name).art);bolt.style.cssText=`left:${from.right-frame.left-10}px;top:${from.top-frame.top+20}px;--tx:${to.left+to.width/2-from.right+10}px;--ty:${to.top+to.height/2-from.top-20}px`;
        bolt.classList.remove('moving');void bolt.offsetWidth;bolt.classList.add('moving');
        const timer=setTimeout(()=>{effects.delete(timer);if(!field.isConnected)return;body.classList.remove('practice-hit');void body.offsetWidth;if(hit)body.classList.add('practice-hit');const blast=field.querySelector('.practice-impact');blast.style.left=to.left+to.width/2-frame.left+'px';blast.style.top=to.top+to.height/2-frame.top+'px';blast.classList.remove('burst');void blast.offsetWidth;if(hit)blast.classList.add('burst');},240);effects.add(timer);
        clearTimeout(poseTimer);effects.delete(poseTimer);const settle=poseTimer=setTimeout(()=>{effects.delete(settle);if(!field.isConnected)return;mage.classList.remove('casting');mage.querySelector('.sprite').outerHTML=sprite('mage');},520);effects.add(settle);
    }
    function cast(target=0){
        if(!state.connected||state.view!=='active')return;
        if(!usable().includes(selected))return;
        if(!round||round.finished){if(result)return;start();if(mode==='pulse'){feedback('Follow the rune into gold');return;}}
        if(round.finished||session!==state)return;
        if(now()>=round.endsAt){finish();return;}
        const outcome=M.cast(round,{id:++castSerial,name:selected,target,damage:spell(selected).damage+state.damageBonus,now:now()});
        if(!outcome.accepted)return;
        lastMessage=outcome.message;
        animate(selected,target,outcome.hit);
        feedback(outcome.message+(outcome.hit?' · '+outcome.damage:''),outcome.perfect);
        update();inspector();
    }
    function update(){
        if(state.view!=='active'||!round||round.finished||session!==state)return;
        const time=phone.querySelector('#practice-time');if(time)time.textContent=Math.max(0,Math.ceil((round.endsAt-now())/1000))+'s';
        const bonus=phone.querySelector('#practice-bonus');if(bonus)bonus.textContent='+'+M.bonus(round);
        const idle=phone.querySelector('#practice-idle');if(idle)idle.textContent='+'+Math.max(0,state.shards[round.realm]-startShards);
        const streak=phone.querySelector('#practice-streak');if(streak)streak.textContent='Streak '+round.combo;
        phone.querySelectorAll('.practice-target').forEach(el=>{const i=Number(el.dataset.apTarget),charged=M.chargedTarget(round,now())===i;el.classList.toggle('charged',charged);el.querySelector('small').textContent=charged?'CHARGED':'SLIME';el.querySelector('.practice-enemy-hp i').style.width=round.targetHp[i]/60*100+'%';el.setAttribute('aria-label',`Cast ${selected} at slime ${i+1}${charged?', charged target':''}`);});
        const hp=phone.querySelector('.practice-focus .practice-enemy-hp i');if(hp)hp.style.width=round.targetHp[0]/60*100+'%';
        const cue=phone.querySelector('.mode-pulse .practice-focus small');if(cue){const phase=M.pulse(round,now());const window=phase>=.27&&phase<=.73;cue.textContent=window?'CAST NOW':'WAIT FOR GOLD';cue.classList.toggle('ready',window);}
        phone.querySelectorAll('.practice-spell').forEach(b=>{b.classList.toggle('selected',b.dataset.apSpell===selected);b.setAttribute('aria-pressed',b.dataset.apSpell===selected);});
        if(mode==='weave'){const queue=phone.querySelector('.weave-queue');if(queue&&queue.dataset.key!==round.chains+'-'+round.weaveIndex){queue.innerHTML=weaveQueue();queue.dataset.key=round.chains+'-'+round.weaveIndex;}}
        const spellLabel=phone.querySelector('#practice-spell-name');if(spellLabel)spellLabel.textContent=selected;
    }
    function drawPulse(){if(state.view!=='active'||mode!=='pulse'||!round||round.finished)return;const marker=phone.querySelector('.pulse-marker');if(marker)marker.style.left=M.pulse(round,now())*100+'%';pulseFrame=requestAnimationFrame(drawPulse);}
    function handleButton(el){
        if(el.dataset.apMode){chooseMode(el.dataset.apMode);return true;}
        if(el.dataset.apSpell){selected=el.dataset.apSpell;if(mode==='weave'){cast(0);}else{phone.querySelectorAll('.practice-spell').forEach(b=>{b.classList.toggle('selected',b.dataset.apSpell===selected);b.setAttribute('aria-pressed',b.dataset.apSpell===selected);});const label=phone.querySelector('#practice-spell-name');if(label)label.textContent=selected;}return true;}
        if(el.dataset.apTarget!==undefined){if(now()<suppressClickUntil)return true;cast(Number(el.dataset.apTarget));return true;}
        if(el.dataset.apCast){cast(0);return true;}
        if(el.dataset.apStart){start();return true;}
        if(el.dataset.apBank){finish();return true;}
        if(el.dataset.apBack){onLeave();go('realm');return true;}
        return false;
    }
    document.addEventListener('pointerdown',event=>{
        const target=event.target.closest('[data-ap-target]');if(!target||mode!=='hunt'||!round||round.finished||!state.connected)return;
        const index=Number(target.dataset.apTarget);stopHold();
        holdTimer=setTimeout(()=>{suppressClickUntil=now()+150;cast(index);holdInterval=setInterval(()=>{suppressClickUntil=now()+150;cast(index);},700);},350);
    });
    for(const event of ['pointerup','pointercancel','visibilitychange','blur'])globalThis.addEventListener(event,()=>{if(holdInterval)suppressClickUntil=now()+150;stopHold();});
    document.addEventListener('keydown',event=>{
        if(typeof state==='undefined'||state.view!=='active'||state.modal||!state.connected||event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
        const i=Number(event.key)-1;if(i>=0&&i<usable().length){event.preventDefault();selected=usable()[i];if(mode==='weave')cast(0);else{update();if(!round||round.finished)render(true);}}
        if(event.code==='Space'&&!event.target.closest('button')){event.preventDefault();cast(mode==='hunt'&&round?M.chargedTarget(round,now()):0);}
    });
    setInterval(()=>{if(typeof state==='undefined'||state.view!=='active'||!state.connected||document.hidden)return;if(round&&!round.finished&&now()>=round.endsAt){finish();return;}update();},80);
    return {view,open,start,finish,onLeave,reset,handleButton,chooseMode,cycle(delta){if(state.view==='fight')return;chooseMode(keys[(keys.indexOf(mode)+delta+keys.length)%keys.length]);},label:()=>M.modes[mode].label+' · '+M.modes[mode].name,inspect:()=>({mode,selected,roundId:round?.id,shots:round?.shots||0,bonus:round?M.bonus(round):0,finished:!!round?.finished})};
})();
