/* Shared realm-place review data. Names, route lengths and landmark positions are proposals. */
(function(scope){
    const routes=[
        {name:'Fire',places:[['emberwood','Emberwood','portal'],['cinder-crossing','Cinder Crossing','pond'],['ashen-ruins','Ashen Ruins','workshop']],boss:['sentinel-keep','Sentinel Keep','The Ember Sentinel']},
        {name:'Ice',places:[['hushed-glacier','Hushed Glacier','portal'],['frostfall-lake','Frostfall Lake','pond'],['crystal-pass','Crystal Pass','mine'],['winter-spire','Winter Spire','workshop']],boss:['wardens-crown',"Warden’s Crown",'The Glacier Warden']},
        {name:'Earth',places:[['verdant-hollow','Verdant Hollow','portal'],['mossroot-grove','Mossroot Grove','moth'],['stonevein-quarry','Stonevein Quarry','mine'],['tangled-ruins','Tangled Ruins','workshop'],['rootbound-gate','Rootbound Gate','portal']],boss:['colossus-heart','Colossus Heart','The Root Colossus']},
        {name:'Wind',places:[['skyreach','Skyreach','portal'],['gale-bridges','Gale Bridges','pond'],['stormwatch','Stormwatch','workshop']],boss:['tempest-shrine','Tempest Shrine','The Sky Keeper']}
    ].map(r=>Object.freeze({...r,places:Object.freeze(r.places.map(([id,name,art])=>Object.freeze({id,name,art}))),boss:Object.freeze({id:r.boss[0],name:r.boss[1],guardian:r.boss[2]})}));
    const valid=r=>Number.isInteger(r)&&r>=0&&r<routes.length;
    const count=r=>valid(r)?routes[r].places.length:0;
    const place=(r,level)=>valid(r)?routes[r].places[level-1]||null:null;
    const canVisit=(won,r)=>valid(r)&&(r===0||won.slice(0,r).every(Boolean));
    const frontier=(s,r)=>Math.min(count(r),s.cleared[r]+1);
    const canTravel=(s,r,level)=>canVisit(s.won,r)&&Number.isInteger(level)&&level>0&&level<=count(r)&&(s.won[r]||level<=frontier(s,r));
    const gate=(s,r=s.realm)=>valid(r)&&!s.won[r]&&s.levels[r]===count(r)&&s.cleared[r]>=count(r);
    function advance(s){const r=s.realm;if(!valid(r)||s.won[r]||s.heldLevel||gate(s)||s.seconds>=43200)return false;s.cleared[r]=Math.max(s.cleared[r],s.levels[r]);s.stageKills=0;if(s.groups)s.groups[r]=0;if(s.placeProgress)s.placeProgress[r][s.levels[r]]=0;if(s.levels[r]<count(r))s.levels[r]++;return true;}
    function travel(s,r,level){
        if(!canTravel(s,r,level))return false;
        s.groups||=[0,0,0,0];s.placeProgress||=[{},{},{},{}];s.placeProgress[s.realm][s.levels[s.realm]]=s.stageKills;s.groups[s.realm]=s.stageKills;
        const changed=s.levels[r]!==level;s.realm=r;s.levels[r]=level;s.stageKills=s.placeProgress[r][level]??(changed?0:s.groups[r]);s.groups[r]=s.stageKills;
        s.heldLevel=!!s.won[r]||level<frontier(s,r);return true;
    }
    scope.MageRealms=Object.freeze({routes:Object.freeze(routes),count,place,canVisit,frontier,canTravel,gate,advance,travel});
})(globalThis);
