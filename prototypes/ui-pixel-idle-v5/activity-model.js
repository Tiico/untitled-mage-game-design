/* Isolated prototype challenge rules. Values are illustrative; no game progression or persistence. */
(function(scope){
    const modes={hunt:{name:'Rune Hunt',label:'A',skill:'Aim for the charged slime'},pulse:{name:'Arcane Pulse',label:'B',skill:'Cast as the rune reaches gold'},weave:{name:'Spell Weave',label:'C',skill:'Follow the spell chain'}};
    function start({id,mode='hunt',realm=0,owned=['Firebolt'],now=0}){
        return {id,mode:modes[mode]?mode:'hunt',realm,owned:[...owned],startedAt:now,endsAt:now+20000,lastCast:-Infinity,lastBeat:-1,shots:0,hits:0,perfect:0,combo:0,bestCombo:0,score:0,damage:0,targetHp:[60,60,60],weaveIndex:0,chains:0,events:[],finished:false,claimed:false};
    }
    const chargedTarget=(round,now)=>Math.floor(Math.max(0,now-round.startedAt)/1400)%3;
    const pulse=(round,now)=>((Math.max(0,now-round.startedAt)%1600)/1600);
    function sequence(round){
        const basic=round.owned.filter(name=>name!=='Frostfire Bolt');
        const base=basic.length?basic:round.owned;
        if(!base.length)return [];
        return [base[round.chains%base.length],base[(round.chains+1)%base.length],round.owned.includes('Frostfire Bolt')?'Frostfire Bolt':base[(round.chains+2)%base.length]];
    }
    const bonus=round=>Math.min(6,Math.floor(round.score/8));
    function cast(round,{id,name,target=0,damage=24,now}){
        if(round.finished||now>=round.endsAt||now<round.startedAt||!round.owned.includes(name)||round.events.includes(id)||now-round.lastCast<420)return {accepted:false};
        const beat=Math.floor((now-round.startedAt)/1600);
        if(round.mode==='pulse'&&round.lastBeat===beat)return {accepted:false};
        if(!Number.isInteger(target)||target<0||target>2)return {accepted:false};
        round.events.push(id);round.lastCast=now;round.shots++;
        let hit=true,perfect=false,points=0,message='Hit';
        if(round.mode==='hunt'){
            perfect=target===chargedTarget(round,now);points=perfect?3:1;message=perfect?'Resonant hit!':'Hit';
        }else if(round.mode==='pulse'){
            round.lastBeat=beat;const distance=Math.abs(pulse(round,now)-.5);
            perfect=distance<=.09;hit=distance<=.23;points=perfect?5:hit?2:0;message=perfect?'Perfect!':hit?'Good timing':pulse(round,now)<.5?'A little early':'A little late';
        }else{
            hit=name===sequence(round)[round.weaveIndex];
            if(hit){round.weaveIndex++;points=2;message='Spell linked';if(round.weaveIndex===3){round.weaveIndex=0;round.chains++;points+=4;perfect=true;message='Chain complete!';}}
            else{round.weaveIndex=0;message='Follow the glowing spell';}
        }
        if(hit){round.hits++;round.damage+=damage;round.combo++;round.bestCombo=Math.max(round.bestCombo,round.combo);round.targetHp[target]=Math.max(0,round.targetHp[target]-damage);if(!round.targetHp[target]){round.targetHp[target]=60;points+=2;}if(perfect)round.perfect++;}
        else round.combo=0;
        round.score+=points;
        return {accepted:true,hit,perfect,damage:hit?damage:0,message,bonus:bonus(round),target};
    }
    function finish(round){round.finished=true;return {id:round.id,realm:round.realm,shards:bonus(round),hits:round.hits,perfect:round.perfect,bestCombo:round.bestCombo,damage:round.damage};}
    function claim(round,player){
        if(!round.finished||round.claimed)return 0;
        round.claimed=true;const amount=bonus(round);player.shards[round.realm]+=amount;return amount;
    }
    scope.ArcaneActivityModel=Object.freeze({modes,start,chargedTarget,pulse,sequence,bonus,cast,finish,claim});
})(globalThis);
