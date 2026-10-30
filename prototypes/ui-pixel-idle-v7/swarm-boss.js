/* Wind guardian reinforcements: one example encounter, never a source of farming rewards. */
const SwarmBoss=(()=>{
    const M=ArcaneActivityModel;
    function start(f){f.swarm=true;f.adds=M.spawn(12,0,'add');f.addSerial=12;f.addPopped=0;f.lastSwarmShot=null;}
    function view(f){return `<div class="boss-minions" aria-label="${f.adds.filter(m=>m.hp>0).length} summoned monsters">${f.adds.filter(m=>m.hp>0).map(m=>`<span class="boss-minion" style="left:${m.x}%;top:${30+m.y*.55}%">${sprite('slime')}</span>`).join('')}</div><div class="boss-summon-label">Reinforcements · ${f.adds.filter(m=>m.hp>0).length} alive · ${f.addPopped} cleared</div>${f.lastSwarmShot?`<div class="boss-spell-flash ${f.lastSwarmShot.shape}" aria-hidden="true">${sprite(spell(f.lastSwarmShot.name).art)}</div>`:''}`;}
    function cast(f,s,damage){
        const boss={id:'guardian',kind:'boss',x:50,y:23,hp:f.bossHp};
        const adds=f.adds.map(m=>({...m,y:30+m.y*.55}));
        const target=boss; // Keep direct boss damage viable; area geometry can also clear nearby reinforcements.
        const result=M.resolve([boss,...adds],{name:s.name,origin:{x:f.x,y:f.y},aim:target,damage});
        f.bossHp=boss.hp;for(const m of f.adds){const changed=adds.find(a=>a.id===m.id);m.hp=changed.hp;}f.addPopped+=result.hits.filter(h=>h.killed&&h.kind!=='boss').length;
        f.lastSwarmShot=result;f.flashElapsed=f.elapsed;return result;
    }
    function tick(f){
        if(f.flashElapsed<f.elapsed)f.lastSwarmShot=null;
        if(f.elapsed%9===0){f.adds=f.adds.filter(m=>m.hp>0);const count=Math.min(12,36-f.adds.length);if(count>0){f.adds.push(...M.spawn(count,f.addSerial,'add'));f.addSerial+=count;}}
        if(f.elapsed%5===0)f.hp=Math.max(0,f.hp-f.adds.filter(m=>m.hp>0).length*.6);
    }
    return {start,view,cast,tick};
})();
