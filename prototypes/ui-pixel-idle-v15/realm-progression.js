/* UI study only: three numbered-progression layouts on the existing idle route.
   Explicit review state; no reward, save, boss-cadence or progression-rule changes. */
const RealmProgression=(()=>{
    const variants={A:{term:'Tier',name:'Tier · Resemarkör'},B:{term:'Floor',name:'Floor · Tornklättring'},C:{term:'Circle',name:'Circle · Magiska ringar'}};
    let selected=40,frontier=40,ready=false;
    const key=()=>new URLSearchParams(location.search).get('progression');
    const enabled=()=>Object.hasOwn(variants,key());
    const config=()=>variants[key()];
    const inspect=()=>({variant:key(),term:config()?.term,realm:'Fire',selected,frontier,bossAt:42,bossReady:ready,simulated:true});
    const place=()=>selected<31?'Cinder Crossing':'Ashen Ruins';
    const status=()=>ready?'Guardian waiting':selected<frontier?'Farming cleared ground':'Farming';
    function locationView(){
        const {term}=config(),label=`Fire realm, ${term} ${selected}, ${place()}. Open progression`;
        const number=key()==='A'?`<span class="tier-sigil">${selected}</span>`:key()==='B'?`<span class="floor-sigil" aria-hidden="true"><i></i><i></i><i></i><b>${selected}</b></span>`:`<span class="circle-sigil" aria-hidden="true"><i></i><b>${selected}</b></span>`;
        return `<button class="location-plaque progression-plaque progression-${key()}" data-action="map" aria-label="${label}">${number}<span class="progression-copy"><span class="kicker">FIRE REALM</span><strong>${term}${key()==='B'?' '+selected:''}</strong><small>${place()}</small></span><span class="progression-chevron" aria-hidden="true">⌄</span></button>`;
    }
    function progress(){return `<div class="place-progress study-progress" role="img" aria-label="${status()}"><i style="width:${ready?100:65}%"></i></div>`;}
    function row(n){const boss=n===42,here=n===selected,cleared=n<frontier,locked=boss?!ready:n>frontier;return `<button class="numbered-stop ${here?'here':''} ${cleared?'cleared':''} ${boss?'guardian-stop':''}" data-progression-step="${n}" ${locked||boss?'disabled':''} ${here?'aria-current="step"':''} aria-label="${boss?'Guardian, '+config().term+' 42':config().term+' '+n+(here?', farming here':cleared?', cleared':', locked')}"><span class="stop-medallion">${boss?sprite('golem'):n}</span><span><strong>${boss?'Sentinel Keep':config().term+' '+n}</strong><small>${boss?(ready?'Boss · '+config().term+' 42':'Boss · '+config().term+' 42'):here?status():cleared?'Cleared':'Unexplored'}</small></span>${boss||locked?ui(boss?'power':'lock','inline-icon'):here?'<b class="current-star" aria-hidden="true">◆</b>':'<b aria-hidden="true">✓</b>'}</button>`;}
    function view(){
        const k=key(),term=config().term,steps=[39,40,41,42];
        const header=`<div class="progression-heading">${ui('fire')}<div><span class="kicker">FIRE REALM · ${place()}</span><h4>${term} ${selected}</h4></div><span class="status-chip">${status()}</span></div>`;
        const context=`<div class="region-context">${sprite('workshop')}<div><strong>${place()}</strong><span>${term}s 31–41</span></div></div>`;
        const ribbon=k==='A'?`<div class="tier-road">${steps.map(row).join('')}</div>${context}`:k==='B'?`<div class="floor-tower">${[...steps].reverse().map(row).join('')}</div>`:`<div class="circle-map" aria-hidden="true"><i></i><i></i><i></i><span class="circle-core">${selected}<small>${term.toUpperCase()}</small></span><span class="circle-future">42 ${sprite('golem')}</span></div><div class="circle-steps">${steps.map(row).join('')}</div>`;
        return `<div class="progression-overview overview-${k}">${header}${ribbon}<div class="progression-footer">${ready?'<span class="guardian-preview">'+sprite('golem')+'<span><strong>The Ember Sentinel</strong><small>Boss waits · Layout preview</small></span></span>':'<span>'+ui('fire','inline-icon')+' Fire shard farming</span>'}${selected<frontier?'<button class="text-button" data-progression-resume>Return to frontier →</button>':`<span>${ready?'Boss waits for you':'Next: '+term+' '+(selected+1)}</span>`}</div></div>`;
    }
    function refresh(){const node=phone.querySelector('.location-context');if(!node)return;const temp=document.createElement('div');temp.innerHTML=locationView();const old=node.querySelector('.location-plaque');if(old){old.innerHTML=temp.firstElementChild.innerHTML;old.setAttribute('aria-label',temp.firstElementChild.getAttribute('aria-label'));}const bar=node.querySelector('.place-progress');if(bar){bar.setAttribute('aria-label',status());bar.firstElementChild.style.width=(ready?100:65)+'%';}}
    function change(delta){const keys=Object.keys(variants),next=keys[(keys.indexOf(key())+delta+keys.length)%keys.length],url=new URL(location.href);url.searchParams.set('progression',next);history.replaceState(null,'',url);render(true);}
    function handle(el){
        if(el.closest('.progression-review-popover')){document.querySelector('.progression-review-popover')?.remove();document.querySelector('#variant-label').setAttribute('aria-expanded','false');}
        if(el.dataset.progressionVariant){const url=new URL(location.href);url.searchParams.set('progression',el.dataset.progressionVariant);history.replaceState(null,'',url);render(true);return true;}
        if(el.hasAttribute('data-progression-reset')){selected=frontier=40;ready=false;render(true);return true;}
        if(el.hasAttribute('data-progression-advance')){if(!ready){if(frontier<41)selected=++frontier;else{selected=41;ready=true;}}render(true);return true;}
        if(el.hasAttribute('data-progression-resume')){selected=frontier;state.modal=null;render(true);return true;}
        if(el.dataset.progressionStep){const n=Number(el.dataset.progressionStep);if(Number.isInteger(n)&&n>=1&&n<=frontier){selected=n;state.modal=null;render(true);}return true;}
        return false;
    }
    function label(){return key()+' · '+config().name;}
    function start(){if(!enabled())return;state.heldLevel=true;document.body.classList.add('realm-progression-study');
        const labelNode=document.querySelector('#variant-label');labelNode.setAttribute('role','button');labelNode.setAttribute('tabindex','0');labelNode.setAttribute('aria-label','Öppna demonstrationskontroller');labelNode.setAttribute('aria-expanded','false');labelNode.setAttribute('aria-haspopup','true');labelNode.title='Tryck för demonstrationskontroller';
        const toggle=()=>{const open=document.querySelector('.progression-review-popover');if(open){open.remove();labelNode.setAttribute('aria-expanded','false');return;}const pop=document.createElement('div');pop.className='progression-review-popover';pop.innerHTML='<span>LAYOUTDEMO · INGA SPELBELÖNINGAR</span><button data-progression-advance>Simulera clear →</button><button data-progression-reset>Återställ steg 40</button>';document.querySelector('.prototype-switcher').append(pop);labelNode.setAttribute('aria-expanded','true');};
        labelNode.addEventListener('click',toggle);labelNode.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
        document.querySelector('.prototype-switcher>span').textContent='REALM-STUDIE';document.querySelector('.prototype-switcher').setAttribute('aria-label','Jämför Tier, Floor och Circle');render();}
    return {enabled,inspect,location:locationView,progress,view,refresh,change,handle,label,start};
})();
