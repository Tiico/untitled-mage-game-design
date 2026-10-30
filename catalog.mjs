// The simulator catalog. Proposed content is never an implicit PRD decision.
export const metadata = {
    version: '2026.10.30.2',
    prdVersion: '1.2',
    lastReviewed: '2026-10-30',
    sourcePrdSha256: '80f9e3888361feb4021eae5d950bca564d4e49148bfab9eff868f2e119e2e103'
};
export const realms = ['Fire', 'Ice', 'Earth', 'Wind'];
export const rules = {
    fusionCost: 30,
    forgeCaps: [0, 1, 2, 3, 3],
    bossRewards: [0, 80, 80, 0],
    forgeUpgradeCosts: [0, 20, 40]
};
export const spells = [
    {id:'fire',name:'Firebolt',symbol:'✦',color:'#f6a47f',realm:0,level:0,cost:0,known:true,role:'Starting offensive spell.',x:135,y:90},
    {id:'ice',name:'Icebolt',symbol:'❄',color:'#9cd5e3',realm:1,level:1,cost:5,known:true,role:'An extra spell that increases early farming output.',x:135,y:190},
    {id:'stone',name:'Stone Spike',symbol:'◆',color:'#cdbb8b',realm:2,level:2,cost:10,role:'Proposal: a heavy single-target strike.',x:135,y:290},
    {id:'gale',name:'Gale Blade',symbol:'≋',color:'#b7dba8',realm:3,level:3,cost:10,role:'Proposal: a fast sweeping projectile.',x:135,y:390},
    {id:'ember',name:'Ember Ring',symbol:'◉',color:'#f6a47f',realm:0,level:1,cost:10,role:'Proposal: close-range area damage.',x:135,y:490},
    {id:'ward',name:'Frost Ward',symbol:'◇',color:'#9cd5e3',realm:1,level:1,cost:10,role:'Proposal: a defensive self-buff.',x:135,y:590},
    {id:'frostfire',name:'Frostfire Bolt',symbol:'✧',color:'#d2c0ee',level:2,inputs:['fire','ice'],known:true,role:'PRD: a clear power increase over the starting spells.',x:470,y:90},
    {id:'magma',name:'Magma Lance',symbol:'⟐',color:'#e6b18e',level:2,inputs:['fire','stone'],role:'Proposal: a stronger heavy strike.',x:470,y:210},
    {id:'hail',name:'Hailstorm',symbol:'⁕',color:'#b4ded9',level:3,inputs:['ice','gale'],role:'Proposal: a stronger sweeping storm.',x:470,y:330},
    {id:'vortex',name:'Cinder Vortex',symbol:'◎',color:'#e5c28f',level:3,inputs:['ember','gale'],role:'Proposal: a stronger area attack.',x:470,y:450},
    {id:'bastion',name:'Glacial Bastion',symbol:'⬡',color:'#bdcfcf',level:2,inputs:['ward','stone'],role:'Proposal: a stronger defensive self-buff.',x:470,y:570},
    {id:'tempest',name:'Tempest Crown',symbol:'♜',color:'#d4ddae',level:3,inputs:['frostfire','hail'],role:'Proposal: the multi-step offensive payoff. Uses two already-fused spells.',x:805,y:330}
];
