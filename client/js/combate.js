let inventoryLocked = false;
let missionRunning = false;

const CombatEvents = {
listeners: {},

on(event, callback) {
    if (!this.listeners[event]) {
    this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
},

emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
}
};

const missionEnemies = [
{ name: "Goblin", hp: 30, attack: 6, defense: 2, isBoss: false },
{ name: "Slime", hp: 25, attack: 4, defense: 1, isBoss: false },
{ name: "Orc Vesgo gosta das sub 13", hp: 80, attack: 12, defense: 5, isBoss: true }
];


function performAttack(enemy) {
const stats = Inventory.playerStats();

const playerAttack = stats.strength || 0;
const playerDefense = stats.defense || 0;

const damageToEnemy = Math.max(1, playerAttack - enemy.defense);
const damageToPlayer = Math.max(1, enemy.attack - playerDefense);

enemy.hp -= damageToEnemy;
playerHp -= damageToPlayer;

console.log(`Você deu ${damageToEnemy} em ${enemy.name}`);
console.log(`${enemy.name} deu ${damageToPlayer}`);
console.log(`HP: ${playerHp}/${Inventory.getPlayerMaxHp()}`);
CombatEvents.emit('enemyUpdate', enemy);
CombatEvents.emit('playerHpUpdate');
if (enemy.hp <= 0) {
CombatEvents.emit("enemy_dead", enemy);
}
}


function startAutoBattle(enemy, onEnd) {
inventoryLocked = true;
CombatEvents.emit('combatStart');

const interval = setInterval(() => {

    if (playerHp <= 0 || enemy.hp <= 0) {
    clearInterval(interval);
    onEnd(playerHp > 0);
    return;
    }

    performAttack(enemy);

}, 1000);
}


function startRest(duration, onEnd) {
inventoryLocked = false;
CombatEvents.emit("inventory_Open");
CombatEvents.emit('inventoryUnlocked');

console.log("Descansando...");

let timeLeft = duration;

CombatEvents.emit('restStart', { timeLeft });

const timer = setInterval(() => {
    timeLeft--;

    CombatEvents.emit('restStart', { timeLeft });

    console.log(`Tempo restante: ${timeLeft}s`);

    if (timeLeft <= 0) {
    clearInterval(timer);
    inventoryLocked = true;
    onEnd();
    }
}, 1000);
CombatEvents.emit("inventory_close");
}

function startMission(onEnd) {
let currentEnemyIndex = 0;
CombatEvents.emit("mission_end");

function fightNext() {
    if (currentEnemyIndex >= missionEnemies.length) {
    console.log("MISSÃO COMPLETA! RESPECT+");
    CombatEvents.emit('missionComplete');
    if (onEnd) onEnd();
    return;
    }

    const data = missionEnemies[currentEnemyIndex];

    const enemy = {
    name: data.name,
    hp: data.hp,
    attack: data.attack,
    defense: data.defense,
    isBoss: data.isBoss
    };

    if (enemy.isBoss) {
    console.log(`CHEFE: ${enemy.name}`);
    } else {
    console.log(`Inimigo: ${enemy.name}`);
    }
    if (enemy.isBoss) {
    CombatEvents.emit("boss_intro", {...enemy, maxHp: enemy.hp});
    } else {
    CombatEvents.emit("enemy_appear", {...enemy, maxHp: enemy.hp});
}

    startAutoBattle(enemy, (won) => {
    if (!won) {
        console.log("SE FODEU");
        CombatEvents.emit('gameOver');
        return;
    }

    console.log(`${enemy.name} derrotado`);

    currentEnemyIndex++;

    startRest(5, fightNext);
    });
}

fightNext();
}


function startGameLoop() {
if (missionRunning) return;

missionRunning = true;
CombatEvents.emit("mission_start");

startRest(15, () => {
    startMission(() => {
    console.log("Acabou!");

    if (typeof UI !== "undefined") {
        UI.giveGold(200);
    }

    missionRunning = false;
    });
});
}