/* THROWAWAY UI study. Illustrative values; never authoritative game rules. */
const variants = {
    A: { name: 'World first', chapter: 'Spelvärlden först', description: 'Världen tar plats. Ett flytande handlingsark knyter ihop det som händer med nästa meningsfulla val.', title: 'Hur mycket gränssnitt behöver magin?', points: [['Närvaro', 'En stor stridsyta gör farming till en plats, inte bara ett produktionsmått.'], ['Nästa handling', 'Förbättringen ligger nära tummen. Räcker sammanhanget för att förstå varför?'], ['Avvägning', 'Världen får utrymme, men mer information kräver att spelaren öppnar en annan vy.']] },
    B: { name: 'Living grimoire', chapter: 'En levande spellbok', description: 'En ljus bok med kapitel, kartvinjetter och anteckningar. Resan och samlingen blir något att bläddra i.', title: 'Kan boken göra systemen begripliga?', points: [['Sammanhang', 'En läsordning binder ihop plats, mål och förbättring.'], ['Samlande', 'Recept och spells känns som upptäckter att återvända till.'], ['Avvägning', 'Lugn läsning och tydlig struktur, men spelvärlden blir en mindre del av upplevelsen.']] },
    C: { name: 'Expedition console', chapter: 'Expeditionens kontrollrum', description: 'En kompakt översikt med mätvärden, prioriterade handlingar och en mindre spelvy. Sambanden får huvudrollen.', title: 'När blir tydlighet för mycket data?', points: [['Orsak och verkan', 'Skada och produktion kan jämföras direkt när bygget ändras.'], ['Prioritering', 'Nästa mål visas som ett steg i en expedition, med kort väg till handling.'], ['Avvägning', 'Fler värden syns samtidigt. Hjälper det en ny spelare eller höjer det tröskeln?']] }
};
const spellData = {
    Firebolt: { glyph: 'ϟ', type: 'fire', damage: 24, cooldown: 3 },
    Icebolt: { glyph: '❄', type: 'ice', damage: 20, cooldown: 4 },
    'Frostfire Bolt': { glyph: '✧', type: 'frost', damage: 62, cooldown: 3 }
};
const viewNames = { realm: 'Realm', forge: 'Spellforge', boss: 'Boss', ventures: 'Ventures', library: 'Library', return: 'Return', account: 'Account' };
let variant = new URLSearchParams(location.search).get('variant');
if (!variants[variant]) variant = 'A';
const fresh = () => ({ view: 'realm', scenario: 'early', realm: 'Ice', shards: 5, earthShards: 0, embers: 0, forgeLevel: 1, forgeCap: 1, unlocked: ['Firebolt'], idle: ['Firebolt'], boss: ['Firebolt'], autocast: [true, false, false, false], familiar: 'Moon moth', iceBossWon: false, fusionDiscovered: false, forgeTab: 'craft', libraryTab: 'idle', selectedPair: ['Firebolt', 'Icebolt'], miningLevel: 2, fishingLevel: 1, ore: 120, pearls: 80, hpBonus: 0, damageBonus: 0, synergy: true, returned: false, returnPending: false, connected: true, menu: false, toast: '', fight: null });
let state = fresh();
let toastTimer;
const phone = document.querySelector('#phone');
const icon = (name, extra = '') => {
    const d = spellData[name];
    return `<span class="spell-icon ${d ? d.type : name === 'Unknown' ? 'unknown' : 'empty'} ${extra}" aria-hidden="true">${d ? d.glyph : name === 'Unknown' ? '?' : '+'}</span>`;
};
const available = () => [...state.unlocked];
const damage = () => state.idle.reduce((n, s) => n + spellData[s].damage, 0) + state.damageBonus;
const farmingResource = () => state.realm === 'Earth' ? 'earth-shards' : 'ice-shards';
const farmingCount = () => state.realm === 'Earth' ? state.earthShards : state.shards;
const miningRate = () => 5 * state.miningLevel * 1.2 * (state.synergy ? 1.25 : 1);
const rate = () => (damage() / 24 * .6).toFixed(1);
const button = (text, action, style = 'primary', disabled = false, extra = '') => `<button class="${style}" data-action="${action}" ${disabled ? 'disabled' : ''} ${extra}>${text}</button>`;
const mage = `<svg viewBox="0 0 45 55" aria-hidden="true"><ellipse cx="23" cy="49" rx="17" ry="5" fill="#0b2537" opacity=".5"/><path d="M13 28L5 47Q22 54 37 47L30 27Z" fill="#d8e1d4"/><path d="M20 29L15 49L27 48L27 28" fill="#719eac"/><circle cx="22" cy="24" r="8" fill="#edcda5"/><path d="M4 23L16 15L23 1L30 16L39 23Q23 32 4 23" fill="#38556c"/><path d="M16 15L23 1L25 20" fill="#86b4bd"/><path d="M36 21L39 50" stroke="#cca66c" stroke-width="3"/><circle cx="36" cy="18" r="4" fill="#a6edf0"/></svg>`;

function worldArt() {
    const earth = state.realm === 'Earth';
    return `<div class="world-art" aria-hidden="true"><svg viewBox="0 0 384 804" preserveAspectRatio="xMidYMid slice">
    <defs>
        <linearGradient id="sky-${variant}" x2="0" y2="1"><stop stop-color="${earth ? '#243d3c' : '#142c3c'}"/><stop offset="1" stop-color="${earth ? '#698066' : '#567c85'}"/></linearGradient>
        <linearGradient id="river-${variant}" x2="1" y2="1"><stop stop-color="#6ba5ab"/><stop offset=".55" stop-color="#315869"/><stop offset="1" stop-color="#a1c8c2"/></linearGradient>
        <linearGradient id="ice-${variant}" x2="1" y2="1"><stop stop-color="${earth ? '#a4af87' : '#b1d3cc'}"/><stop offset="1" stop-color="${earth ? '#56795f' : '#487c8b'}"/></linearGradient>
        <radialGradient id="glow-${variant}"><stop stop-color="#b6efdc" stop-opacity=".35"/><stop offset="1" stop-color="#8ee7d3" stop-opacity="0"/></radialGradient>
        <g id="pine-${variant}"><path d="M0 36V62" stroke="#7e9a9b" stroke-width="3"/><path d="M0 0L-14 25H-8L-23 44H-14L-29 58L0 68L29 58L14 44H23L8 25H14Z" fill="#2c535d"/><path d="M0 0L-14 25L-5 22L-23 44L-8 40L-29 58L0 51Z" fill="#80a4a5"/><path d="M0 0L14 25L3 22L23 44L6 40L29 58L0 51Z" fill="#4c7f87"/></g>
        <g id="crystal-${variant}"><path d="M0 0L-9 17L-5 39L7 33L12 12Z" fill="#b8e4dc"/><path d="M0 0L2 22L-5 39L-9 17Z" fill="#6fabb4"/><path d="M2 22L12 12L7 33L-5 39Z" fill="#8bcbd0"/><path d="M-11 20L-20 28L-16 40L-5 39Z" fill="#8bbfc4"/></g>
    </defs>
    <rect width="384" height="804" fill="url(#sky-${variant})"/>
    <path d="M-40 200L33 155L88 169L143 126L203 147L266 120L334 156L428 133V414L324 438L240 400L145 454L52 425L-40 456Z" fill="#183c4b"/>
    <path d="M-20 240L50 196L111 219L161 176L209 197L264 165L333 207L407 179V267L333 290L263 254L206 284L143 257L92 290L23 271Z" fill="#527e88"/>
    <path d="M-20 240L50 196L111 219L161 176L209 197L264 165L333 207L407 179L333 229L267 198L209 222L163 201L109 243L49 222Z" fill="#94b7b6" opacity=".63"/>
    <path d="M126 236Q227 270 178 326Q119 380 189 422T201 519Q138 576 190 641L254 804H404V239Z" fill="url(#river-${variant})" opacity=".8"/>
    <path d="M-20 299L50 279L91 300L148 290L182 326L152 368L156 405L196 441L164 483L182 527L131 584L168 650L130 709L-20 724Z" fill="#315563"/>
    <path d="M-20 282L50 263L96 283L143 277L165 313L135 355L140 388L180 427L146 468L161 511L108 570L144 633L108 692L-20 705Z" fill="url(#ice-${variant})"/>
    <path d="M-20 282L50 263L96 283L143 277L165 313L145 313L131 294L94 300L48 280L-20 300Z" fill="#d0e2d8" opacity=".6"/>
    <path d="M246 290L300 300L340 271L414 282V690L326 644L283 659L234 616L249 555L217 514L245 465L225 413L255 356Z" fill="#305561"/>
    <path d="M256 272L300 282L340 254L414 267V672L326 626L283 641L250 608L265 548L235 509L262 463L243 408L272 350Z" fill="url(#ice-${variant})"/>
    <path d="M256 272L300 282L340 254L414 267V282L343 269L303 298L252 289Z" fill="#c4e0d5" opacity=".65"/>
    <g opacity=".85"><use href="#pine-${variant}" x="23" y="293"/><use href="#pine-${variant}" x="77" y="332" transform="translate(14 55) scale(.85)"/><use href="#pine-${variant}" x="351" y="279"/><use href="#pine-${variant}" x="316" y="359"/><use href="#pine-${variant}" x="380" y="382"/><use href="#pine-${variant}" x="27" y="476"/><use href="#pine-${variant}" x="66" y="578"/><use href="#pine-${variant}" x="310" y="548"/></g>
    <path d="M155 382L240 367L251 393L163 408Z" fill="#304b59"/><path d="M154 374L239 359L248 384L162 399Z" fill="#98b6b5"/><path d="M161 382L241 368M164 391L245 378" stroke="#d1e0d2" stroke-width="2" opacity=".6"/>
    <g><use href="#crystal-${variant}" x="110" y="311"/><use href="#crystal-${variant}" x="286" y="416"/><use href="#crystal-${variant}" x="92" y="477"/><use href="#crystal-${variant}" x="341" y="508"/></g>
    <ellipse cx="198" cy="423" rx="110" ry="95" fill="url(#glow-${variant})"/>
    <g stroke="#d4e1d3" stroke-width="2" stroke-linecap="round" opacity=".5"><path d="M204 415L205 417M211 425L212 427M211 440L213 441M220 450L221 452M218 467L220 468M226 479L228 480"/></g>
    <g class="static-mage" transform="translate(173 310) scale(1.05)">${mage.replace(/<svg[^>]*>|<\/svg>/g, '')}</g>
    <g fill="#bce1da" opacity=".35"><circle cx="66" cy="203" r="1.4"/><circle cx="262" cy="245" r="1.2"/><circle cx="209" cy="325" r="1.8"/><circle cx="140" cy="237" r="1"/><circle cx="331" cy="218" r="1.4"/><circle cx="307" cy="461" r="1.5"/><circle cx="45" cy="419" r="1"/></g>
    <rect y="590" width="384" height="214" fill="#122a38" opacity=".22"/>
    </svg></div>`;
}

function header(title, subtitle, realm = false) {
    const chapter = variant === 'B' ? 'FIELD NOTES / ' : variant === 'C' ? 'EXPEDITION / ' : '';
    return `<div class="statusbar"><span>9:41</span><span class="status-icons">▴▴ ▰</span></div><header class="phone-header ${realm ? 'realm-header' : ''}"><div><div class="overline">${chapter}${subtitle}</div><h2>${title}</h2></div><button class="round-button" data-action="menu" aria-label="Open navigation and account menu">${variant === 'B' ? '☷' : '⋯'}</button></header>`;
}

function nav() {
    const items = [['realm', '◇', 'Realm'], ['forge', '✧', 'Forge'], ['boss', '♜', 'Boss'], ['ventures', '♧', 'Ventures'], ['library', '▤', 'Library']];
    return `<nav class="bottom-nav" aria-label="Game navigation">${items.map(([key, glyph, name]) => `<button data-view="${key}" class="${state.view === key ? 'active' : ''}" ${state.view === key ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${glyph}</span>${name}</button>`).join('')}</nav>`;
}

function progress() {
    return `<div class="mini-journey"><span>Fire ✓</span><i></i><span class="${state.realm === 'Ice' ? 'current' : ''}">Ice ${state.iceBossWon ? '✓' : '◇'}</span><i></i><span class="${state.realm === 'Earth' ? 'current' : ''}">Earth ${state.iceBossWon ? '◇' : '⊘'}</span><i></i><span>Wind ⊘</span></div>`;
}

function realmGoal() {
    if (!state.unlocked.includes('Icebolt')) return ['YOUR NEXT DISCOVERY', 'A little ice. A lot of possibility.', 'Craft Icebolt', 'forge', '5 / 5 ice-shards collected'];
    if (!state.idle.includes('Icebolt') && !state.idle.includes('Frostfire Bolt')) return ['A STRONGER IDLE BUILD', 'Give your fire a little company.', 'Equip Icebolt', 'equipIce', 'Keep Firebolt. Add Icebolt.'];
    if (!state.iceBossWon) return ['AT THE BOSS GATE', 'The glacier is waiting.', 'Prepare for the boss', 'boss', 'Farming continues until you are ready.'];
    if (!state.fusionDiscovered) return ['A NEW KIND OF MAGIC', 'Two spells. One discovery.', 'Visit the Spellforge', 'forge', 'The Ice reward covers your first fusion.'];
    return ['A NEW REALM', 'Let the earth feel your magic.', 'Try your new spell', 'equipFrost', 'Your original spells are still in the Library.'];
}

function realmView() {
    const [label, goal, cta, action, hint] = realmGoal();
    const title = state.realm === 'Ice' ? 'Hushed Glacier' : 'Verdant Hollow';
    const sub = `${state.realm.toUpperCase()} REALM / ${state.iceBossWon ? '03' : '02'}`;
    const known = state.idle.map(s => icon(s)).join('');
    const summary = `<div><div class="overline">SPELL DAMAGE</div><div class="measure">${damage()} <small>/ sec</small></div></div><div><div class="overline">${farmingResource().toUpperCase()}</div><div class="measure">${rate()} <small>/ sec</small></div></div>`;
    if (variant === 'A') return `${worldArt()}${header(title, sub, true)}<div class="world-tools"><span class="badge">◈ ${farmingCount()} ${farmingResource()}</span><span class="badge">● Auto-farming</span></div><div class="world-region">THE OLD CROSSING<span>${state.iceBossWon ? 'Earth unlocked · return to Ice anytime' : 'Progress held at the ' + state.realm + ' boss gate'}</span></div><section class="world-sheet"><div class="row"><span class="overline">${label}</span><span class="badge gold">${state.iceBossWon ? 'III' : 'II'}</span></div><h3 class="section-title">${goal}</h3><div class="stats-two">${summary}</div><div class="world-loadout">${known}${Array.from({ length: 4 - state.idle.length }, () => icon('Empty')).join('')}<span class="tiny">IDLE BUILD<br>All auto</span></div>${button(cta + ' <span aria-hidden="true">↗</span>', action)}<div class="tiny center" style="margin-top:9px">${hint}</div>${progress()}</section>${nav()}`;
    if (variant === 'B') return `${header('A journey in frost', sub)}<div class="phone-scroll book-realm"><p class="book-quote">“Every new spell changes<br>the road ahead.”</p><div class="book-map">${worldArt()}<div class="map-caption">${title}</div></div><div class="book-ledger">${summary}</div><div class="chapter-line"><span>${state.iceBossWon ? 'III' : 'II'}</span><div><strong>${goal}</strong><p class="tiny">${hint}<br>◈ ${farmingCount()} ${farmingResource()} in your satchel.</p></div></div>${button(cta + ' →', action)}<div class="panel" style="margin-top:17px"><div class="row"><span class="overline">YOUR IDLE SPELLS</span><span class="tiny">Always automatic</span></div><div class="world-loadout" style="margin-top:13px;margin-bottom:0">${known}${Array.from({ length: 4 - state.idle.length }, () => icon('Empty')).join('')}</div></div>${progress()}<div class="book-page-number">— II —</div></div>${nav()}`;
    return `${header(state.realm + ' expedition', sub)}<div class="phone-scroll"><div class="console-kicker">Farming active / boss gate reached</div><div class="console-arena">${worldArt()}<span class="badge">◇ ${title}</span><div class="arena-drops"><span>${farmingResource().toUpperCase()} ${state.shards}</span><span>DROP PATH / GUARANTEED</span></div></div><div class="console-stats">${summary}</div><div class="mission-row"><span class="mission-index">${state.iceBossWon ? '03' : '02'}</span><div><span class="overline">${label}</span><p><strong>${goal}</strong></p><p class="tiny">${hint}</p></div></div>${button(cta + ' →', action)}<div class="row" style="margin-top:16px"><span class="overline">IDLE / ALL AUTO</span><div style="display:flex;gap:6px">${known}</div></div><div class="console-routes"><span>FIRE ✓</span><span>ICE ${state.iceBossWon ? '✓' : '●'}</span><span>EARTH ${state.iceBossWon ? '●' : '⊘'}</span><span>WIND ⊘</span></div></div>${nav()}`;
}

function forgeView() {
    const canCraft = !state.unlocked.includes('Icebolt');
    let content = `<div class="row" style="margin-bottom:16px"><span class="badge gold">Forge level ${state.forgeLevel}</span><span class="tiny">◈ ${state.shards} ice · ✦ ${state.embers} embers</span></div><div class="segmented">${button('Shard crafting', 'tabCraft', state.forgeTab === 'craft' ? 'active' : '')}${button('Fusion', 'tabFusion', state.forgeTab === 'fusion' ? 'active' : '')}</div>`;
    if (state.forgeTab === 'craft') {
        content += `<div class="center" style="padding:16px 0 6px"><div style="display:inline-block;transform:scale(1.3);margin:12px">${icon('Icebolt')}</div><h3 class="result-title" style="font-size:29px;margin-top:17px">Icebolt</h3><p class="tiny">A new spell. A faster harvest.</p></div><div class="panel"><div class="row"><span class="tiny">Add to your current idle build</span><span class="badge gold">${canCraft ? 'NEW' : 'UNLOCKED'}</span></div><div class="row" style="margin-top:15px"><div><div class="overline">SPELL DAMAGE</div><div class="measure">24 <small>→</small> 44</div></div><div><div class="overline">SHARDS / SEC</div><div class="measure">0.6 <small>→</small> 1.1</div></div></div><p class="tiny good" style="margin-bottom:0">+83% damage with Firebolt + Icebolt</p></div>${canCraft ? button('Craft Icebolt · 5 ice-shards', 'craft', 'primary', state.shards < 5) : button(state.idle.includes('Icebolt') ? 'Icebolt is in your idle build ✓' : 'Add Icebolt to idle build', 'equipIce', 'primary', state.idle.includes('Icebolt'))}<p class="tiny center">${canCraft ? 'Guaranteed crafting. No waiting, no random roll.' : 'Firebolt stays unlocked. Boss build is separate.'}</p><div class="note">Use shards to unlock a missing base spell. Spells have no individual levels.</div>`;
    } else if (state.forgeLevel < 2) {
        content += `<div class="result-sigil">✧</div><h3 class="result-title" style="font-size:27px">Room for new magic</h3><p class="tiny center">Fusion begins at Spellforge level 2.</p><div class="panel"><div class="row"><strong>Level 1 → Level 2</strong><span class="badge gold">${state.forgeCap >= 2 ? 'AVAILABLE' : 'LOCKED'}</span></div><p class="tiny">${state.forgeCap >= 2 ? 'The Ice boss reward covers this upgrade and your first fusion.' : 'Defeat the Ice boss to unlock the upgrade. Your Firebolt and Icebolt can win this fight.'}</p></div>${state.forgeCap >= 2 ? button('Upgrade forge · 20 embers', 'upgradeForge', 'primary', state.embers < 20) : button('Prepare for the Ice boss', 'boss')}<p class="tiny center">${state.forgeCap >= 2 ? '20 embers remain for your first fusion.' : 'No fusion required before the Ice boss.'}</p>`;
    } else {
        const discovered = state.fusionDiscovered;
        content += `<div class="overline center" style="margin-top:22px">${discovered ? 'DISCOVERED RECIPE' : 'TWO SPELLS. AN UNKNOWN POSSIBILITY.'}</div><div class="recipe-orbit">${icon(state.selectedPair[0])}<span>+</span>${icon(state.selectedPair[1])}</div><div class="row" style="justify-content:center;gap:12px">${state.selectedPair.map((s, i) => `<button class="small-button" data-pair="${i}" aria-label="Change fusion ingredient ${i + 1}">${s} ↻</button>`).join('')}</div><div class="center" style="margin:15px 0;color:var(--muted)">↓</div><div class="spell-row" style="justify-content:center;border:0">${icon(discovered ? 'Frostfire Bolt' : 'Unknown')}<div><strong>${discovered ? 'Frostfire Bolt' : 'Undiscovered spell'}</strong><span class="tiny">${discovered ? 'Firebolt + Icebolt · Forge level 2' : 'The result is revealed by forging.'}</span></div></div>${button(discovered ? 'Frostfire Bolt is in your Library ✓' : 'Forge & discover · 20 embers', 'fuse', 'primary', discovered || state.embers < 20)}<p class="tiny center">Original spells stay in your Library.<br>Invalid pairs spend no resources.</p>${discovered ? `<div class="note good">Fusion discovered. Replace an earlier spell in your build for a visible power increase.</div>${button('Equip Frostfire Bolt', 'equipFrost', 'secondary')}` : ''}`;
    }
    return `${header('Spellforge', variant === 'B' ? 'CHAPTER / THE ART OF COMBINING' : 'DISCOVER YOUR NEXT SPELL')}<div class="phone-scroll">${content}</div>${nav()}`;
}

function slots(build, toggles = false) {
    return `<div class="loadout-slots">${Array.from({ length: 4 }, (_, i) => `<div class="loadout-slot">${icon(build[i] || 'Empty')}<span>${build[i] || 'Empty slot'}</span>${toggles && build[i] ? `<button class="toggle ${state.autocast[i] ? 'on' : ''}" data-auto="${i}" aria-pressed="${state.autocast[i]}">${state.autocast[i] ? 'Auto ✓' : 'Manual'}</button>` : ''}</div>`).join('')}</div>`;
}

function bossView() {
    if (state.iceBossWon) return `${header('The Ice gate is open', 'BOSS / MILESTONE COMPLETE')}<div class="phone-scroll"><div class="result-sigil">♜</div><h3 class="result-title">A quiet glacier</h3><p class="tiny center">This boss has been defeated.<br>Milestone bosses cannot be challenged again.</p><div class="panel"><div class="reward-row"><span>Earth realm</span><span class="good">Unlocked ✓</span></div><div class="reward-row"><span>Forge level 2 cap</span><span class="good">Unlocked ✓</span></div></div>${button('Continue your journey', 'realm')}</div>${nav()}`;
    return `${header('The Glacier Warden', 'ICE BOSS / PREPARATION')}<div class="phone-scroll"><div class="row"><span class="badge gold">♜ One milestone. One reward.</span><span class="badge">90 sec</span></div><div class="panel" style="margin-top:16px"><div class="row"><span class="overline">BOSS BUILD</span>${button('Edit spells ↗', 'editBoss', 'small-button')}</div>${slots(state.boss, true)}<p class="tiny" style="margin-bottom:0">Auto-aim for every spell. Choose when to cast.<br>No mana. Each spell has its own cooldown.</p></div><div class="panel"><div class="overline">ONE FAMILIAR / BOSS ONLY</div><div class="spell-row" style="border:0"><span style="font-size:36px;color:#d1c5eb" aria-hidden="true">ʚїɞ</span><div class="grow"><strong>${state.familiar || 'No familiar'}</strong><span class="tiny">${state.familiar === 'Moon moth' ? '+10% Health points during boss fights' : state.familiar ? '+8% Spell damage during boss fights' : 'Your familiar never changes idle production.'}</span></div>${button('Change', 'familiar', 'small-button')}</div></div><div class="stats-two"><div><div class="overline">YOUR HEALTH POINTS</div><div class="measure">${Math.round((120 + state.hpBonus) * (state.familiar === 'Moon moth' ? 1.1 : 1))}</div></div><div><div class="overline">FIXED REWARD</div><div class="measure">40 <small>embers</small></div></div></div>${button('Enter boss fight →', 'startFight', 'primary', !state.boss.length)}<p class="tiny center">Free attempt · Keep all progression if you lose</p><div class="note">Win before 90 seconds to open Earth and unlock the level 2 forge upgrade.</div></div>${nav()}`;
}

function fightView() {
    const f = state.fight;
    const seconds = Math.max(0, 90 - f.elapsed);
    return `${header('The Glacier Warden', 'BOSS FIGHT / ICE REALM')}<div class="fight">${worldArt()}<div class="combat-hud"><div class="row"><span class="overline">GLACIER WARDEN</span><span class="timer" id="fight-timer">${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}</span></div><div class="health-track"><i id="boss-health" style="width:${f.bossHp / 9}%"></i></div><div class="row tiny"><span id="boss-health-label">${f.bossHp} / 900 HP</span><span>Win before 90 seconds</span></div></div><div class="combat-arena" id="combat-arena" aria-label="Drag to move your mage"><div class="boss-creature" aria-hidden="true">♜</div><div class="danger-ring" aria-hidden="true"></div><div class="combat-mage" id="combat-mage" style="left:${f.x}%;top:${f.y}%">${mage}</div><div class="joystick" aria-hidden="true"></div></div><div class="combat-bottom"><div class="row tiny"><span>YOUR HEALTH POINTS</span><span id="player-health-label">${f.playerHp} / ${f.maxHp}</span></div><div class="health-track player"><i id="player-health" style="width:${f.playerHp / f.maxHp * 100}%"></i></div><div class="combat-spells">${Array.from({ length: 4 }, (_, i) => `<button data-cast="${i}" ${!state.boss[i] || state.autocast[i] ? 'disabled' : ''} aria-label="${state.boss[i] ? `Cast ${state.boss[i]}` : 'Empty spell slot'}">${icon(state.boss[i] || 'Empty')}<span id="cooldown-${i}"></span>${state.boss[i] ? state.autocast[i] ? 'AUTO' : 'TAP TO CAST' : 'EMPTY'}</button>`).join('')}</div><div class="fight-hint">Drag in the arena to move · Spells aim automatically</div></div></div>`;
}

function resultView() {
    const won = state.fight && state.fight.result === 'win';
    return `${header(won ? 'A new path opens' : 'Another chance awaits', 'BOSS / RESULT')}<div class="phone-scroll"><div class="result-sigil">${won ? '✧' : '◇'}</div><h3 class="result-title">${won ? 'Glacier, unbound.' : state.fight && state.fight.reason === 'time' ? 'Time ran out.' : 'A spell of bad luck.'}</h3><p class="tiny center">${won ? 'The Glacier Warden is defeated.' : 'Your spells, resources and progression are safe.'}</p><div class="panel" style="margin-top:24px">${won ? '<div class="reward-row"><span>Fixed milestone reward</span><strong>40 embers</strong></div><div class="reward-row"><span>New realm</span><strong>Earth unlocked</strong></div><div class="reward-row"><span>Spellforge upgrade cap</span><strong>Level 2</strong></div>' : '<div class="reward-row"><span>Progression lost</span><strong>None</strong></div><div class="reward-row"><span>Next attempt</span><strong>Free</strong></div>'}</div>${button(won ? 'Discover your first fusion →' : 'Try again · Free', won ? 'firstFusion' : 'startFight')}${button(won ? 'Explore Earth' : 'Change boss build', won ? 'realm' : 'boss', 'secondary')}<p class="tiny center">${won ? 'Reward recorded once. This boss cannot be replayed.' : 'No tickets. No energy. Try as many times as you need.'}</p></div>${nav()}`;
}

function venturesView() {
    const production = miningRate().toFixed(0);
    return `${header('Small works, big magic', 'VENTURES / WORKING IN PARALLEL')}<div class="phone-scroll"><p class="tiny" style="margin-top:0">Your spirits keep working while you explore.</p><div class="panel"><div class="row"><h3 class="section-title" style="margin:0">◇ Moonstone mine</h3><span class="badge">Level ${state.miningLevel}</span></div><div class="row" style="margin-top:17px"><span class="measure">${production} <small>ore / min</small></span><span class="tiny">${state.ore} ore stored</span></div><hr class="soft-line"><div class="row tiny"><span>Base spirits · always working</span><strong>${state.miningLevel} workers</strong></div><div class="row tiny" style="margin-top:9px"><span>Loot-spirits · both contribute</span><strong>2 × +10%</strong></div><p class="tiny good">${state.miningLevel * 5} base × 1.20 spirits × ${state.synergy ? '1.25' : '1.00'} fishing = ${production} / min</p>${button('Permanent +5 Spell damage · 40 ore', 'buyDamage', 'secondary', state.ore < 40)}${button('Mine level +1 · 60 ore', 'upgradeMine', 'secondary', state.ore < 60)}</div><div class="panel"><div class="row"><h3 class="section-title" style="margin:0">≈ Silverfin pond</h3><span class="badge">Level ${state.fishingLevel}</span></div><div class="row" style="margin-top:17px"><span class="measure">8 <small>pearls / min</small></span><span class="tiny">${state.pearls} pearls stored</span></div><p class="tiny">${state.fishingLevel} base spirit · No loot-spirits collected yet</p>${button('Permanent +10 HP · 30 pearls', 'buyHp', 'secondary', state.pearls < 30)}${button(state.synergy ? 'Mine synergy active · ×1.25 ✓' : 'Buy mine synergy · 50 pearls', 'synergy', 'secondary', state.synergy || state.pearls < 50)}<p class="tiny">Pond improvement → multiplies mine production</p></div><p class="tiny center">Base stats: +${state.hpBonus} HP · +${state.damageBonus} Spell damage<br>All loot-spirit duplicates stack. No worker is replaced.</p></div>${nav()}`;
}

function libraryView() {
    const build = state[state.libraryTab];
    return `${header('Your collected magic', 'LIBRARY / SPELLS & BUILDS')}<div class="phone-scroll"><div class="segmented">${button('Idle build', 'libraryIdle', state.libraryTab === 'idle' ? 'active' : '')}${button('Boss build', 'libraryBoss', state.libraryTab === 'boss' ? 'active' : '')}</div><div class="overline">${state.libraryTab === 'idle' ? 'ALWAYS AUTOMATIC / UP TO FOUR SPELLS' : 'SEPARATE BUILD / AUTOCAST SET IN BOSS PREP'}</div>${slots(build)}<div class="panel">${available().map(s => `<div class="spell-row">${icon(s)}<div class="grow"><strong>${s}</strong><span class="tiny">${spellData[s].damage} damage / sec · ${spellData[s].cooldown}s cooldown</span></div><button class="small-button" data-equip="${s}" aria-pressed="${build.includes(s)}">${build.includes(s) ? 'Remove' : 'Equip'}</button></div>`).join('')}</div><div class="row"><h3 class="section-title">Discoveries ahead</h3><span class="tiny">${available().length} spells unlocked</span></div><p class="tiny">Six base spells and six fusion recipes await.<br>Farm elemental shards to unlock missing base spells.</p><div style="display:flex;gap:10px;margin:15px 0">${icon('Unknown')}${icon('Unknown')}${icon('Unknown')}</div><div class="note">Spells remain in your Library when used in fusion. Duplicate drops become resources, not spell levels.</div>${state.libraryTab === 'boss' ? button('Back to boss preparation', 'boss', 'secondary') : button('See your farming improvement', 'realm', 'secondary')}</div>${nav()}`;
}

function returnView() {
    return `${header('The world kept turning', 'WELCOME BACK / ABSENCE PROGRESS')}<div class="phone-scroll"><div class="result-sigil" style="font-size:62px">☾</div><h3 class="result-title" style="font-size:29px">A little time. A little magic.</h3><p class="tiny center">Away for 20 hours · 12 hours credited</p><div class="panel" style="margin-top:22px"><div class="reward-row"><span>Realm farming</span><strong>+${Math.round(Number(rate()) * 43200).toLocaleString('en')} ${farmingResource()}</strong></div><div class="reward-row"><span>Moonstone mine</span><strong>+${(miningRate() * 720).toLocaleString('en')} ore</strong></div><div class="reward-row"><span>Silverfin pond</span><strong>+5,760 pearls</strong></div></div><div class="note">The same 12-hour window applies to all three.<br>Your mage reached the ${state.realm} boss gate and kept farming behind it. The boss is still waiting.</div>${button(state.returned ? 'Progress already collected ✓' : 'Collect & continue', 'collectReturn', 'primary', state.returned)}${button('Back to realm', 'realm', 'secondary')}<p class="tiny center">Absence cap: 12 hours · Bosses require active play</p></div>${nav()}`;
}

function accountView() {
    return `${header('Always find your way back', 'ACCOUNT / CONNECTION')}<div class="phone-scroll"><div class="panel"><span class="badge good">● Connected</span><h3 class="section-title">Your journey is saved</h3><p class="tiny">Platform account connected.<br>Last confirmed save: just now</p><hr class="soft-line"><div class="reward-row"><span>Platform</span><strong>Google Play Games</strong></div><div class="reward-row"><span>Cloud save</span><strong>Up to date</strong></div></div><div class="note">Use the same platform account to restore progress after reinstalling or on another Android device. Android ↔ iOS transfer is unavailable.</div>${button('Restore confirmed progress', 'restore', 'secondary')}${button('Preview connection loss', 'disconnect', 'secondary')}<p class="tiny center">Interface preview · No real account is connected</p></div>${nav()}`;
}

function menu() {
    return `<div class="modal-shade"><div class="menu-sheet"><div class="row"><h3 class="section-title">Your journey</h3>${button('Close', 'closeMenu', 'small-button')}</div>${button('Realm & farming', 'realm', 'secondary')}${button('Return summary', 'return', 'secondary')}${button('Account & connection', 'account', 'secondary')}<p class="tiny">● Connected · Saved just now</p></div></div>`;
}

function render() {
    const views = { realm: realmView, forge: forgeView, boss: bossView, fight: fightView, result: resultView, ventures: venturesView, library: libraryView, return: returnView, account: accountView };
    phone.className = `variant-${variant.toLowerCase()}`;
    phone.innerHTML = (views[state.view] || realmView)() + (state.menu ? menu() : '') + (state.toast ? `<div class="toast" role="status">${state.toast}</div>` : '') + (!state.connected ? `<div class="full-block"><div><div class="result-sigil">⌁</div><h3>Let's reconnect.</h3><p class="tiny">An internet connection is needed to keep playing.<br>Your confirmed progress is safe.<br>Reconnect to return to your saved journey.</p>${button('Reconnect', 'reconnect')}</div></div>` : '');
    const v = variants[variant];
    document.querySelector('#variant-note').innerHTML = `<div class="direction"><h2><span class="direction-index">${variant}</span>${v.chapter}</h2><p>${v.description}</p></div>`;
    document.querySelector('#review-title').textContent = v.title;
    document.querySelector('#review-points').innerHTML = v.points.map(([title, text], i) => `<div class="review-point"><span>0${i + 1}</span><p><strong>${title}</strong>${text}</p></div>`).join('');
    document.querySelector('#view-links').innerHTML = Object.entries(viewNames).map(([key, name]) => `<button data-view="${key}" class="${state.view === key ? 'selected' : ''}">${name}</button>`).join('');
    document.querySelector('#demo-controls').innerHTML = state.view === 'fight' ? '<p class="fine" style="margin-bottom:0">SIMULERA BOSSRESULTAT</p><button class="demo-button" data-demo="win">Visa vinst</button><button class="demo-button" data-demo="lose">Visa förlust</button><button class="demo-button" data-demo="timeout">Visa 90 s</button>' : '';
    document.querySelector('#variant-label').textContent = `${variant} / ${v.name}`;
    document.querySelector('#variant-dots').innerHTML = Object.keys(variants).map(key => `<button class="${key === variant ? 'active' : ''}" data-variant="${key}" aria-label="Variant ${key}: ${variants[key].name}" aria-pressed="${key === variant}">${key}</button>`).join('');
    document.querySelector('.prototype-switcher').hidden = false; // Public prototype review build.
    updateInspector();
    if (state.view === 'fight') attachMovement();
}

function updateInspector() {
    document.querySelector('#state').textContent = JSON.stringify({ prototype: true, variant, ...state, idleDamagePerSecond: damage(), idleShardsPerSecond: rate(), miningMultiplier: 1.2 * (state.synergy ? 1.25 : 1) }, null, 2);
}

function notify(message) {
    clearTimeout(toastTimer);
    state.toast = message;
    render();
    toastTimer = setTimeout(() => { state.toast = ''; render(); }, 3500);
}

function setView(view) {
    state.view = view;
    state.menu = false;
    state.toast = '';
    render();
}

function switchVariant(key) {
    variant = key;
    const url = new URL(location.href);
    url.searchParams.set('variant', variant);
    history.replaceState(null, '', url);
    render();
}

function scenario(name) {
    clearTimeout(toastTimer);
    state = fresh();
    state.scenario = name;
    if (name === 'fusion') {
        Object.assign(state, { view: 'forge', forgeTab: 'fusion', unlocked: ['Firebolt', 'Icebolt'], idle: ['Firebolt', 'Icebolt'], boss: ['Firebolt', 'Icebolt'], iceBossWon: true, forgeCap: 2, embers: 40, realm: 'Earth' });
    }
    if (name === 'return') Object.assign(state, { view: 'return', unlocked: ['Firebolt', 'Icebolt'], idle: ['Firebolt', 'Icebolt'], boss: ['Firebolt', 'Icebolt'], returnPending: true });
    render();
}

function startFight() {
    if (state.iceBossWon || !state.boss.length) return;
    const maxHp = Math.round((120 + state.hpBonus) * (state.familiar === 'Moon moth' ? 1.1 : 1));
    state.fight = { elapsed: 0, bossHp: 900, playerHp: maxHp, maxHp, cooldowns: [0, 0, 0, 0], x: 54, y: 63, result: null, reason: null };
    state.view = 'fight';
    render();
}

function finishFight(won, reason = null) {
    if (!state.fight || state.fight.result || state.iceBossWon) return;
    state.fight.result = won ? 'win' : 'lose';
    state.fight.reason = reason;
    if (won) {
        state.iceBossWon = true;
        state.forgeCap = 2;
        state.embers += 40;
        state.realm = 'Earth';
    }
    state.view = 'result';
    render();
}

function cast(i) {
    const f = state.fight;
    const name = state.boss[i];
    if (!f || f.result || !name || f.cooldowns[i] || f.elapsed >= 90 || !state.connected) return;
    f.cooldowns[i] = spellData[name].cooldown;
    f.bossHp = Math.max(0, f.bossHp - Math.round(spellData[name].damage * spellData[name].cooldown * (state.familiar === 'Ember fox' ? 1.08 : 1)));
    if (!f.bossHp) finishFight(true);
    else updateFight();
}

function updateFight() {
    const f = state.fight;
    if (state.view !== 'fight') return;
    const seconds = Math.max(0, 90 - f.elapsed);
    document.querySelector('#fight-timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    document.querySelector('#boss-health').style.width = `${f.bossHp / 9}%`;
    document.querySelector('#boss-health-label').textContent = `${f.bossHp} / 900 HP`;
    document.querySelector('#player-health').style.width = `${f.playerHp / f.maxHp * 100}%`;
    document.querySelector('#player-health-label').textContent = `${f.playerHp} / ${f.maxHp}`;
    f.cooldowns.forEach((c, i) => { const el = document.querySelector(`#cooldown-${i}`); if (el) el.innerHTML = c ? `<span class="cooldown-overlay">${c}</span>` : ''; });
    updateInspector();
}

function attachMovement() {
    const arena = document.querySelector('#combat-arena');
    const move = event => {
        if (!state.connected) return;
        const box = arena.getBoundingClientRect();
        state.fight.x = Math.min(92, Math.max(8, (event.clientX - box.left) / box.width * 100));
        state.fight.y = Math.min(92, Math.max(8, (event.clientY - box.top) / box.height * 100));
        const el = document.querySelector('#combat-mage');
        el.style.left = `${state.fight.x}%`;
        el.style.top = `${state.fight.y}%`;
    };
    arena.onpointerdown = event => { arena.setPointerCapture(event.pointerId); move(event); };
    arena.onpointermove = event => { if (arena.hasPointerCapture(event.pointerId)) move(event); };
}

const actions = {
    menu: () => { state.menu = true; render(); },
    closeMenu: () => { state.menu = false; render(); },
    realm: () => setView('realm'),
    forge: () => { if (state.iceBossWon) state.forgeTab = 'fusion'; setView('forge'); },
    boss: () => setView('boss'),
    return: () => setView('return'),
    account: () => setView('account'),
    tabCraft: () => { state.forgeTab = 'craft'; render(); },
    tabFusion: () => { state.forgeTab = 'fusion'; render(); },
    craft: () => { if (state.shards >= 5 && !state.unlocked.includes('Icebolt')) { state.shards -= 5; state.unlocked.push('Icebolt'); notify('Icebolt unlocked. Add it to your idle build to increase farming speed.'); } },
    equipIce: () => { if (state.unlocked.includes('Icebolt') && !state.idle.includes('Icebolt') && state.idle.length < 4) state.idle.push('Icebolt'); state.view = 'realm'; notify('Icebolt equipped · 24 → 44 damage / sec · 0.6 → 1.1 ice-shards / sec'); },
    upgradeForge: () => { if (state.forgeCap >= 2 && state.forgeLevel === 1 && state.embers >= 20) { state.forgeLevel = 2; state.embers -= 20; notify('Spellforge level 2. Your remaining 20 embers cover the first fusion.'); } },
    fuse: () => {
        if (state.forgeLevel < 2 || state.embers < 20 || state.fusionDiscovered) return;
        if (!state.selectedPair.includes('Firebolt') || !state.selectedPair.includes('Icebolt')) return notify('No recipe found. No resources spent. Try another pair.');
        state.embers -= 20;
        state.unlocked.push('Frostfire Bolt');
        state.fusionDiscovered = true;
        notify('Discovered: Frostfire Bolt! Firebolt and Icebolt remain in your Library.');
    },
    equipFrost: () => { if (!state.unlocked.includes('Frostfire Bolt')) return; state.idle = ['Frostfire Bolt', ...state.idle.filter(s => s !== 'Firebolt' && s !== 'Frostfire Bolt')].slice(0, 4); state.view = 'realm'; notify(`Frostfire Bolt equipped · ${damage()} damage / sec · ${rate()} ${farmingResource()} / sec`); },
    editBoss: () => { state.libraryTab = 'boss'; setView('library'); },
    libraryIdle: () => { state.libraryTab = 'idle'; render(); },
    libraryBoss: () => { state.libraryTab = 'boss'; render(); },
    familiar: () => { const all = ['Moon moth', 'Ember fox', null]; state.familiar = all[(all.indexOf(state.familiar) + 1) % all.length]; render(); },
    startFight,
    firstFusion: () => { state.forgeTab = 'fusion'; setView('forge'); },
    buyDamage: () => { if (state.ore < 40) return; state.ore -= 40; state.damageBonus += 5; notify('Permanent Spell damage +5. Purchased through your mine.'); },
    buyHp: () => { if (state.pearls < 30) return; state.pearls -= 30; state.hpBonus += 10; notify('Permanent Health points +10. Purchased through your pond.'); },
    upgradeMine: () => { if (state.ore < 60) return; state.ore -= 60; state.miningLevel++; notify('Mine level increased. One more base spirit joins automatically.'); },
    synergy: () => { if (state.synergy || state.pearls < 50) return; state.pearls -= 50; state.synergy = true; notify('Fishing → mining ×1.25. Applies after the summed spirit bonuses.'); },
    collectReturn: () => { if (state.returned) return; if (state.realm === 'Earth') state.earthShards += Math.round(Number(rate()) * 43200); else state.shards += Math.round(Number(rate()) * 43200); state.ore += miningRate() * 720; state.pearls += 5760; state.returned = true; state.returnPending = false; notify('12 hours of progress collected once. Your boss gate is unchanged.'); },
    disconnect: () => { state.connected = false; render(); },
    reconnect: () => { state.connected = true; notify('Reconnected. Confirmed progress restored.'); },
    restore: () => notify('Preview only. Same-platform restoration is part of the proposed account flow.')
};

document.addEventListener('click', event => {
    const el = event.target.closest('button');
    if (!el || el.disabled) return;
    if (el.dataset.variant) return switchVariant(el.dataset.variant);
    if (el.dataset.scenario) return scenario(el.dataset.scenario);
    if (!state.connected && el.dataset.action !== 'reconnect') return;
    if (el.dataset.view) return setView(el.dataset.view);
    if (el.dataset.action) return actions[el.dataset.action]?.();
    if (el.dataset.auto !== undefined) { const i = Number(el.dataset.auto); state.autocast[i] = !state.autocast[i]; return render(); }
    if (el.dataset.equip) {
        const build = state[state.libraryTab];
        const s = el.dataset.equip;
        if (build.includes(s)) state[state.libraryTab] = build.filter(name => name !== s);
        else if (build.length < 4) build.push(s);
        else return notify('Four spell slots are available. Remove one before adding another.');
        return render();
    }
    if (el.dataset.pair !== undefined) { const i = Number(el.dataset.pair); const spells = available(); state.selectedPair[i] = spells[(spells.indexOf(state.selectedPair[i]) + 1) % spells.length]; return render(); }
    if (el.dataset.cast !== undefined) return cast(Number(el.dataset.cast));
    if (el.dataset.demo) return finishFight(el.dataset.demo === 'win', el.dataset.demo === 'timeout' ? 'time' : 'health');
});

const cycle = delta => { const keys = Object.keys(variants); switchVariant(keys[(keys.indexOf(variant) + delta + keys.length) % keys.length]); };
document.querySelector('#previous').onclick = () => cycle(-1);
document.querySelector('#next').onclick = () => cycle(1);
document.addEventListener('keydown', event => {
    if (event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); cycle(event.key === 'ArrowLeft' ? -1 : 1); }
});
window.addEventListener('popstate', () => { const key = new URLSearchParams(location.search).get('variant'); variant = variants[key] ? key : 'A'; render(); });
setInterval(() => {
    if (state.view !== 'fight' || !state.fight || state.fight.result || !state.connected) return;
    const f = state.fight;
    f.elapsed++;
    if (f.elapsed >= 90) return finishFight(false, 'time');
    f.cooldowns = f.cooldowns.map(c => Math.max(0, c - 1));
    state.boss.forEach((s, i) => { if (state.autocast[i] && !f.cooldowns[i] && !f.result) cast(i); });
    if (f.result) return;
    if (f.elapsed % 5 === 0) { const inDanger = f.x < 47 && f.y > 40 && f.y < 80; f.playerHp = Math.max(0, f.playerHp - (inDanger ? 18 : 3)); }
    if (!f.playerHp) return finishFight(false, 'health');
    updateFight();
}, 1000);
render();
