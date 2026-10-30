/* THROWAWAY: one pixel-art language across the existing A prototype. */
// Explicit source rectangles keep neighboring sprites out of each transparent tile.
const pixelRects = {
    mage:[8,10,300,315], casting:[312,0,370,325], slime:[684,82,267,250], hit:[966,56,284,282],
    golem:[0,329,365,345], moth:[388,405,267,257], fox:[669,402,290,263], spirit:[980,417,267,250],
    workshop:[8,680,332,315], mine:[346,680,319,319], pond:[671,671,296,332], portal:[977,683,273,316],
    fire:[18,1016,289,235], ice:[338,1007,309,242], frost:[666,1008,287,243], shards:[982,1015,265,233]
};
const pixelSpriteStyle = name => {
    const [x,y,w,h] = pixelRects[name] || pixelRects.shards;
    return `--sx:${x/(1254-w)*100}%;--sy:${y/(1254-h)*100}%;--sw:${1254/w*100}%;--sh:${1254/h*100}%`;
};
const setPixelPose = (element,name) => { element.style.cssText = pixelSpriteStyle(name); };
const pixelSprite = (name, extra = '') => {
    return `<span class="pixel-sprite ${extra}" data-sprite="${name}" style="${pixelSpriteStyle(name)}" aria-hidden="true"></span>`;
};
const pixelSpell = name => pixelSprite(({ Firebolt: 'fire', Icebolt: 'ice', 'Frostfire Bolt': 'frost' })[name]);
const isPixel = () => variant === 'A' && artMode === 'pixel';
const pixelDirection = { name: 'Pixel fantasy', chapter: 'En sammanhållen pixelvärld', description: 'Samma pixelspråk för magiker, monster, miljöer, byggnader, spells och gränssnitt. Magikern står kvar och strider i en simulerad idle-loop.', title: 'Ett litet fantasyspel, hela vägen.', points: [['En gemensam skala', 'Tydliga pixlar, kraftiga silhuetter, stora hattar och små timmerhus. Ingen fotorealistisk bakgrund.'], ['Idle som strid', 'Magikern står kvar, kastar spells och möter nya monster. Ingen autofarming-knapp eller automatisk vandring.'], ['Samma värld i varje vy', 'Spellforge är en verkstad, sidosysslor har byggnader och spirits, bossen och familiars följer samma uttryck.']] };
const pixelGlyphs = {
    A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],G:['01111','10000','10000','10111','10001','10001','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['111','010','010','010','010','010','111'],J:['00111','00010','00010','00010','10010','10010','01100'],K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','10101','10011','10001','10001','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],Q:['01110','10001','10001','10001','10101','10010','01101'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],W:['10001','10001','10001','10101','10101','11011','10001'],X:['10001','10001','01010','00100','01010','10001','10001'],Y:['10001','10001','01010','00100','00100','00100','00100'],Z:['11111','00001','00010','00100','01000','10000','11111']
};
function pixelTitle(text) {
    let x = 0;
    let pixels = '';
    for (const char of text.toUpperCase()) {
        if (char === ' ') { x += 3; continue; }
        const glyph = pixelGlyphs[char];
        if (!glyph) { x += 3; continue; }
        glyph.forEach((row, y) => [...row].forEach((p, col) => { if (p === '1') pixels += `<rect x="${x + col}" y="${y}" width="1" height="1"/>`; }));
        x += glyph[0].length + 1;
    }
    return `<span class="pixel-title-text">${text}</span><svg class="pixel-title" aria-hidden="true" viewBox="0 0 ${x} 8" style="--title-width:${x * 2}px" shape-rendering="crispEdges">${pixels}</svg>`;
}

function pixelWorld(combat = false) {
    const enemyName = {Fire:'EMBER SLIME',Ice:'FROST SLIME',Earth:'MOSS SLIME',Wind:'SKY SLIME'}[state.realm];
    const scenery = state.realm === 'Ice' ? '<img src="assets/idle-clearing-pixel.png" alt="">' : `<div class="other-realm-art" style="--realm-x:${({Fire:0,Earth:50,Wind:100})[state.realm]}%"></div>`;
    return `<div class="pixel-world realm-${state.realm.toLowerCase()}" aria-hidden="true">${scenery}</div>${combat ? '' : `<div class="idle-stage realm-${state.realm.toLowerCase()}" aria-label="Simulated idle combat: mage standing and casting spells at monsters"><div class="idle-combat-badge">IDLE COMBAT <span class="combat-tick"></span></div><div class="idle-mage" id="idle-mage">${pixelSprite('mage')}<span class="actor-label">MAGE</span></div><div class="idle-enemy" id="idle-enemy"><div class="pixel-hp"><i id="idle-enemy-hp" style="width:100%"></i></div>${pixelSprite('slime')}<span class="actor-label">${enemyName}</span></div><div class="idle-projectile" id="idle-projectile"></div><span class="idle-damage" id="idle-damage"></span><div class="idle-scene-footer"><span>Spells cast automatically</span><span id="idle-kills">${idleVisual.kills} monsters defeated</span></div></div>`}`;
}

function pixelRealmView() {
    let [label, goal, cta, action, hint] = realmGoal();
    const crafting = !state.unlocked.includes('Icebolt');
    if (crafting) { goal = 'Magic grows with every fight.'; hint = `${state.shards} / 5 ice-shards · Icebolt is your next spell`; }
    return `${pixelWorld()}${header(({Fire:'Emberwood',Ice:'Hushed Glacier',Earth:'Verdant Hollow',Wind:'Skyreach'})[state.realm], `${state.realm.toUpperCase()} REALM / ${({Fire:'ASHEN PATH',Ice:'OLD CROSSING',Earth:'MILLBROOK',Wind:'CLOUDBRIDGE'})[state.realm]}`, true)}<div class="world-tools"><span class="badge"><span id="idle-shard-count">${farmingCount()}</span> ${farmingResource()}</span><button class="badge pixel-map-button" data-action="map">Realms ↗</button></div><section class="world-sheet"><div class="row"><span class="overline">${label}</span><span class="badge gold">${state.iceBossWon ? 'III' : 'II'}</span></div><h3 class="section-title">${goal}</h3><div class="stats-two"><div><div class="overline">SPELL DAMAGE</div><div class="measure">${damage()} <small>/ sec</small></div></div><div><div class="overline">SHARD RATE</div><div class="measure">${rate()} <small>/ sec</small></div></div></div><div class="world-loadout">${state.idle.map(s=>icon(s)).join('')}${Array.from({length:4-state.idle.length},()=>icon('Empty')).join('')}<span class="tiny">IDLE BUILD<br>All spells cast</span></div>${button(cta + ' →', action)}<div class="tiny center pixel-next-hint" id="idle-goal">${hint}</div>${progress()}</section>${nav()}`;
}

function pixelVenturesView() {
    const production = miningRate().toLocaleString('en',{maximumFractionDigits:1});
    return `${header('Your little settlement', 'VENTURES / MAGIC AT WORK')}<div class="phone-scroll"><div class="pixel-section-intro">Two ventures. A stronger mage.</div><section class="panel pixel-venture"><div class="pixel-building-row">${pixelSprite('mine','venture-building')}<div><div class="overline">MINING / LEVEL ${state.miningLevel}</div><h3 class="section-title">Moonstone mine</h3><span class="measure">${production} <small>ore / min</small></span><p class="tiny">${state.ore} ore stored</p></div></div><div class="pixel-workers">${pixelSprite('spirit')}<span>${state.miningLevel} base spirits<br><small>Always working</small></span><span class="pixel-worker-total">+20%<small>2 loot-spirits</small></span></div><p class="tiny pixel-formula">${state.miningLevel * 5} base × 1.20 spirits × ${state.synergy ? '1.25' : '1.00'} pond = ${production} / min</p>${button('+5 Spell damage · 40 ore','buyDamage','primary',state.ore<40)}${button('Mine level +1 · 60 ore','upgradeMine','secondary',state.ore<60)}</section><section class="panel pixel-venture"><div class="pixel-building-row">${pixelSprite('pond','venture-building')}<div><div class="overline">FISHING / LEVEL ${state.fishingLevel}</div><h3 class="section-title">Silverfin pond</h3><span class="measure">8 <small>pearls / min</small></span><p class="tiny">${state.pearls} pearls stored</p></div></div><div class="pixel-workers">${pixelSprite('spirit')}<span>${state.fishingLevel} base spirit<br><small>No loot-spirits yet</small></span></div>${button('+10 permanent HP · 30 pearls','buyHp','primary',state.pearls<30)}${button(state.synergy ? 'Mine synergy ×1.25 · Active' : 'Mine synergy · 50 pearls','synergy','secondary',state.synergy||state.pearls<50)}<p class="tiny">Pond improvement → mine production multiplier</p></section><div class="note">All collected loot-spirits contribute, including duplicates. Your base spirits keep working.</div></div>${nav()}`;
}

function pixelMap() {
    return `<div class="modal-shade"><section class="menu-sheet pixel-realm-map"><div class="row"><h3 class="section-title">The four realms</h3>${button('Close','closeMenu','small-button')}</div><p class="tiny">Choose a place. Your mage stands and fights there.</p>${[['Fire','Emberwood','Defeated','fire'],['Ice','Hushed Glacier','Current realm','ice'],['Earth','Verdant Hollow',state.iceBossWon?'Unlocked':'Defeat the Ice boss','spirit'],['Wind','Skyreach','Defeat the Earth boss','portal']].map(([realm,name,status,sprite])=>`<button class="pixel-realm-choice" data-realm="${realm}" ${realm==='Wind'||realm==='Earth'&&!state.iceBossWon?'disabled':''}>${pixelSprite(sprite)}<span><strong>${name}</strong><small>${realm} · ${status}</small></span><span>${realm===state.realm?'◆':'→'}</span></button>`).join('')}<p class="tiny">Bosses require active attempts. Idle cannot defeat them.</p></section></div>`;
}

function pixelFamiliarsView() {
    return `${header('Your companions', 'FAMILIARS / ONE PASSIVE BOSS ALLY')}<div class="phone-scroll"><p class="pixel-section-intro">Small companions. A little extra courage.</p><section class="panel pixel-companion-card"><div class="pixel-companion-art">${pixelSprite('moth')}</div><div class="row"><h3 class="section-title">Moon moth</h3><span class="badge">${state.familiar==='Moon moth'?'Selected':'Collected'}</span></div><p class="tiny">A lantern-winged companion for the long nights.</p><div class="pixel-companion-buff">+10% Health points <span>Boss fights only</span></div><button class="primary" data-familiar="Moon moth" ${state.familiar==='Moon moth'?'disabled':''}>${state.familiar==='Moon moth'?'Selected for boss fights':'Select Moon moth'}</button></section><section class="panel pixel-companion-card"><div class="pixel-companion-art">${pixelSprite('fox')}</div><div class="row"><h3 class="section-title">Ember fox</h3><span class="badge">${state.familiar==='Ember fox'?'Selected':'Collected'}</span></div><p class="tiny">A spark of bravery, wrapped in a very warm tail.</p><div class="pixel-companion-buff">+8% Spell damage <span>Boss fights only</span></div><button class="primary" data-familiar="Ember fox" ${state.familiar==='Ember fox'?'disabled':''}>${state.familiar==='Ember fox'?'Selected for boss fights':'Select Ember fox'}</button></section><div class="note">One familiar can be selected at a time. Familiars have no active spells and do not change idle combat or venture production.</div>${button('Back to spell Library','openLibrary','secondary')}</div>${nav()}`;
}

function decoratePixelView() {
    if (!isPixel()) return;
    const view = state.view;
    if (view === 'forge') {
        const craftHero = state.forgeTab === 'craft' ? phone.querySelector('.phone-scroll > .center[style]') : null;
        if (craftHero) craftHero.innerHTML = `<div class="pixel-workshop-row">${pixelSprite('workshop')}<div><span class="overline">THE SPELLFORGE</span><h3 class="section-title">A little magic,<br>made permanent.</h3><span class="tiny">Icebolt · 5 ice-shards</span></div></div>`;
        else phone.querySelector('.phone-scroll')?.insertAdjacentHTML('afterbegin',`<div class="pixel-workshop-mini">${pixelSprite('workshop')}<span>THE SPELLFORGE<br><small>Learn. Combine. Discover.</small></span></div>`);
    }
    if (view === 'boss') {
        phone.querySelector('.phone-scroll')?.insertAdjacentHTML('afterbegin',`<div class="pixel-boss-banner">${pixelSprite('golem')}<div><span class="overline">A MILESTONE BATTLE</span><strong>The Glacier Warden</strong><span class="tiny">90 seconds · Free attempts</span></div></div>`);
        const familiar = phone.querySelector('.spell-row > span[style]');
        if (familiar) familiar.outerHTML = pixelSprite(state.familiar === 'Ember fox'?'fox':'moth','familiar-sprite');
    }
    if (view === 'fight') {
        const boss = phone.querySelector('.boss-creature');
        if (boss) boss.innerHTML = pixelSprite('golem');
        const actor = phone.querySelector('.combat-mage');
        if (actor) actor.innerHTML = pixelSprite('mage');
    }
    if (view === 'library') {
        phone.querySelector('.segmented')?.insertAdjacentHTML('afterend',button('View your familiars →','openFamiliars','secondary'));
        phone.querySelector('.phone-scroll')?.insertAdjacentHTML('beforeend',`<section class="pixel-familiars"><div class="overline">FAMILIARS / PASSIVE BOSS BUFFS</div><div class="pixel-familiar-grid"><div>${pixelSprite('moth')}<strong>Moon moth</strong><span>+10% boss HP</span></div><div>${pixelSprite('fox')}<strong>Ember fox</strong><span>+8% boss damage</span></div></div>${button('Choose one in boss preparation','boss','secondary')}<p class="tiny center">One active familiar. No idle buffs.</p></section>`);
    }
    if (view === 'result' || view === 'return' || view === 'account') {
        const sigil = phone.querySelector('.result-sigil');
        if (sigil) sigil.innerHTML = pixelSprite(view==='return'?'mage':state.fight?.result==='win'?'portal':'moth');
        else phone.querySelector('.phone-scroll')?.insertAdjacentHTML('afterbegin',`<div class="pixel-account-mark">${pixelSprite('portal')}<span class="overline">YOUR JOURNEY / SAFELY KEPT</span></div>`);
    }
}

const idleVisual = { enemyHp: 40, kills: 0, lastStrike: 0, casting: false };
setInterval(() => {
    if (typeof state === 'undefined' || !isPixel() || state.view !== 'realm' || !state.connected || state.menu || document.hidden) return;
    const now = performance.now();
    if (now - idleVisual.lastStrike < 900) return;
    idleVisual.lastStrike = now;
    idleVisual.enemyHp -= damage();
    const mageEl = document.querySelector('#idle-mage .pixel-sprite');
    const enemy = document.querySelector('#idle-enemy .pixel-sprite');
    if (!mageEl || !enemy) return;
    setPixelPose(mageEl,'casting');
    setPixelPose(enemy,'hit');
    document.querySelector('#idle-projectile').classList.remove('shoot');
    void document.querySelector('#idle-projectile').offsetWidth;
    document.querySelector('#idle-projectile').classList.add('shoot');
    document.querySelector('#idle-damage').textContent = damage();
    if (idleVisual.enemyHp <= 0) {
        idleVisual.kills++;
        idleVisual.enemyHp = 40;
        if (state.realm === 'Earth') state.earthShards++; else if (state.realm === 'Fire') state.fireShards++; else state.shards++;
        document.querySelector('#idle-damage').textContent = '+1 shard';
    }
    document.querySelector('#idle-kills').textContent = `${idleVisual.kills} monsters defeated`;
    document.querySelector('#idle-enemy-hp').style.width = `${idleVisual.enemyHp / 40 * 100}%`;
    document.querySelector('#idle-shard-count').textContent = farmingCount();
    if (!state.unlocked.includes('Icebolt')) document.querySelector('#idle-goal').textContent = `${state.shards} / 5 ice-shards · Icebolt is your next spell`;
    updateInspector();
    setTimeout(()=>{ if(mageEl.isConnected) setPixelPose(mageEl,'mage'); if(enemy.isConnected) setPixelPose(enemy,'slime'); },450);
},150);
