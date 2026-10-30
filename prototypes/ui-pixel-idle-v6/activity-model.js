/* Casual harvest proposals. Explicit inputs, no countdown, failure state or permanent upgrades. */
(function(scope){
    const modes={clearing:{name:'Spell Clearing',label:'A',targetHp:20},crystals:{name:'Crystal Sweep',label:'B',targetHp:44}};
    const reach={Firebolt:1,Icebolt:2,'Frostfire Bolt':4};
    function start({id,mode='clearing',realm=0,owned=['Firebolt'],now=0}){
        mode=modes[mode]?mode:'clearing';
        return {id,mode,realm,owned:[...owned],board:1,targetHp:Array(6).fill(modes[mode].targetHp),casts:0,damage:0,cleared:0,earned:0,claimed:0,lastCast:-Infinity,lastNow:now,readyAt:0,events:[]};
    }
    const remaining=run=>run.targetHp.filter(hp=>hp>0).length;
    const progress=run=>1-run.targetHp.reduce((sum,hp)=>sum+hp,0)/(modes[run.mode].targetHp*6);
    function advance(run,now){
        if(remaining(run)||now<run.readyAt)return false;
        run.board++;run.targetHp=Array(6).fill(modes[run.mode].targetHp);run.readyAt=0;return true;
    }
    function cast(run,{id,name,target=0,damage=24,now}){
        if(!run.owned.includes(name)||!reach[name]||run.events.includes(id)||now<run.lastNow||now-run.lastCast<800||!Number.isFinite(damage)||damage<=0)return {accepted:false};
        advance(run,now);if(!remaining(run))return {accepted:false};
        target=Number.isInteger(target)?Math.max(0,Math.min(5,target)):0;
        const ordered=Array.from({length:6},(_,i)=>(target+i)%6).filter(i=>run.targetHp[i]>0).slice(0,reach[name]);
        run.events.push(id);run.casts++;run.lastCast=now;run.lastNow=now;
        const hits=ordered.map(index=>{const before=run.targetHp[index];run.targetHp[index]=Math.max(0,before-damage);const dealt=before-run.targetHp[index];run.damage+=dealt;if(!run.targetHp[index]){run.cleared++;run.earned++;}return {index,damage,dealt,destroyed:!run.targetHp[index]};});
        const complete=!remaining(run);if(complete)run.readyAt=now+1100;
        return {accepted:true,hits,complete,earned:hits.filter(h=>h.destroyed).length,progress:progress(run)};
    }
    function claim(run,player){const amount=run.earned-run.claimed;if(amount<=0)return 0;run.claimed=run.earned;player.shards[run.realm]+=amount;return amount;}
    scope.ArcaneActivityModel=Object.freeze({modes,reach,start,remaining,progress,advance,cast,claim});
})(globalThis);
