/* Three navigation studies around the same game state and direct feature grid. */
const MageNavigation=(()=>{
    const options=['A','B','C'];let current=options.includes(new URLSearchParams(location.search).get('nav'))?new URLSearchParams(location.search).get('nav'):'A';
    const names={A:'A · Compact dock',B:'B · Floating rune',C:'C · Header launcher'};
    const features=[['realm','Realm','portal'],['forge','Spellforge','workshop'],['spells','Spells','book'],['familiars','Familiars','moth'],['ventures','Ventures','mine'],['return','Idle rewards','time'],['map','Realm map','portal'],['recipes','Recipes','frost'],['builds','Loadouts','empty'],['account','Settings','settings'],['boss','Boss arena','golem'],['ascension','Ascension','crowned',true],['research','Research','power',true],['quests','Quests','book',true],['achievements','Achievements','crest',true]];
    const gridIcon=()=>'<span class="launcher-icon" aria-hidden="true">'+Array.from({length:9},()=>'<i></i>').join('')+'</span>';
    const art=name=>['portal','workshop','moth','mine','frost','golem'].includes(name)?sprite(name):ui(name);
    const headerLaunch=()=>current==='C'||(current==='A'&&['active','fight'].includes(state.view));
    function chrome(){
        if(current==='C')return '';
        if(current==='B')return `<button class="floating-launcher" data-action="allFeatures" aria-label="Open all features">${gridIcon()}<span>All</span></button>`;
        if(['active','fight'].includes(state.view))return '';
        return `<nav class="bottom-nav compact-dock" aria-label="Game navigation"><button data-view="realm" class="${state.view==='realm'?'active':''}">${sprite('portal')}Realm</button><button data-view="forge" class="${state.view==='forge'?'active':''}">${sprite('workshop')}Forge</button><button data-action="allFeatures" aria-label="Open all features">${gridIcon()}All</button></nav>`;
    }
    function grid(){return `${state.view==='fight'?'<p class="compact-notice">Leaving ends this attempt. Retry is free.</p>':''}<div class="feature-grid">${features.map(([key,name,icon,future])=>`<button data-feature="${key}" aria-label="Open ${name}${future?', future feature study':''}">${art(icon)}<strong>${name}</strong>${future?'<small>Future study</small>':''}</button>`).join('')}</div>`;}
    function select(key){
        if(!features.some(f=>f[0]===key))return;
        if(state.view==='fight')finishFight(false);
        if(key==='spells'){state.collectionTab='spells';go('library');}
        else if(key==='familiars'){state.collectionTab='familiars';go('library');}
        else if(key==='recipes'){state.forgeTab='fusion';go('forge');}
        else if(key==='builds'){state.collectionTab='spells';state.build='idle';go('library');}
        else if(key==='map')openModal({type:'map'});
        else if(['ascension','research','quests','achievements'].includes(key)){state.futureFeature=key;go('future');}
        else go(key);
    }
    function change(value){current=options.includes(value)?value:options[(options.indexOf(current)+Number(value)+3)%3];const url=new URL(location.href);url.searchParams.set('nav',current);history.replaceState(null,'',url);render(true);}
    return {current:()=>current,names,features,gridIcon,headerLaunch,chrome,grid,select,change,label:()=>names[current]};
})();
