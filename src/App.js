import React, { useState, useEffect, useDebugValue, useReducer } from 'react';
import useInterval from '@use-it/interval';

import boarImg from './mobs/boar.jpg';
import brownBearImg from './mobs/brownbear.jpg';
import catImg from './mobs/cat.jpg';
import greenWolfImg from './mobs/greenwolf.jpg';
import greyWolfImg from './mobs/greywolf.jpg';

import foxImg from './mobs/fox.jpg';
import rayImg from './mobs/ray.jpg';
import mechaImg from './mobs/mecha.jpg';
import lizardImg from './mobs/lizard.jpg';
import spiderImg from './mobs/spider.jpg';

import VanCleefImg from './mobs/vancleef.jpg';

import './App.css';

function clamp(val, min, max) {
  if (val < min) {
    return min;
  }
  else if (val > max) {
    return max;
  }
  return val;
}

const spells = [
  {
    id: 1,
    cost: 30,
    damageMultiplier: 2,
    cooldown: 8,
    maxCharges: 3,
    name: 'Fire Blast',
    imageURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fireball.jpg'
  },
  {
    id: 2,
    cost: 40,
    damageMultiplier: 2,
    cooldown: 5,
    maxCharges: 1,
    name: 'Pyroblast',
    imageURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fireball02.jpg'
  },
  {
    id: 3,
    cost: 45,
    damageMultiplier: 1,
    cooldown: 0,
    maxCharges: 1,
    name: 'Fireball',
    imageURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_flamebolt.jpg'
  },
  {
    id: 4,
    cost: 0,
    damageMultiplier: 0,
    cooldown: 10,
    maxCharges: 1,
    name: 'Evocation',
    imageURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_purge.jpg',
    grantsPlayerAuras: [1]
  },
  {
    id: 5,
    cost: 20,
    damageMultiplier: 0,
    cooldown: 60,
    maxCharges: 1,
    name: 'EpicBuff',
    imageURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_sealoffire.jpg',
    grantsPlayerAuras: [2]
  }
]

const auras = [
  {
    id: 1,
    type: 'buff',
    effect: 'energyRegen',
    effectStrength: 3.5,
    duration: 11,
    maxStacks: 3,
    imageURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_purge.jpg'
  },
  {
    id: 2,
    type: 'buff',
    effect: 'damageFactorIncrease',
    effectStrength: 2,
    duration: 12,
    maxStacks: 1,
    imageURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_sealoffire.jpg'
  }
];

const spellsById = {};

spells.forEach(spell => spellsById[spell.id] = spell);

const aurasById = {};

auras.forEach(aura => aurasById[aura.id] = aura);

const hotkeys = [
  1, 2, 3, 4, 5
];

const mobs = [
  {
    id: 1,
    name: "Boar",
    imageURI: boarImg,
    hpMultiplier: 1

  },
  {
    id: 2,
    name: "Bear",
    imageURI: brownBearImg,
    hpMultiplier: 1
  },
  {
    id: 3,
    name: "Tiger",
    imageURI: catImg,
    hpMultiplier: 1
  },
  {
    id: 4,
    name: "Wolf",
    imageURI: greyWolfImg,
    hpMultiplier: 1
  },
  {
    id: 5,
    name: "Advanced Wolf",
    imageURI: greenWolfImg,
    hpMultiplier: 1
  },
  {
    id: 6,
    name: "Spider",
    imageURI: spiderImg,
    hpMultiplier: 1
  },
  {
    id: 7,
    name: "Mechanical Tiger",
    imageURI: mechaImg,
    hpMultiplier: 1
  },
  {
    id: 8,
    name: "Lizard",
    imageURI: lizardImg,
    hpMultiplier: 1
  },
  {
    id: 9,
    name: "Fox",
    imageURI: foxImg,
    hpMultiplier: 1
  },
  {
    id: 10,
    name: "Fathom Ray",
    imageURI: rayImg,
    hpMultiplier: 1
  },
  {
    id: 11,
    name: "Edwin VanCleef",
    imageURI: VanCleefImg,
    hpMultiplier: 10,
    xpMultiplier: 30
  }
];

function auraReducer(currAuras, action) {
  if (action.type === "add") {
    const aurasToAdd = action.auraIdsToAdd.map(id => aurasById[id]);

    const newAuras = Object.assign([], currAuras);

    aurasToAdd.forEach(addedAura => {
      const existingIdx = newAuras.findIndex(existingAura => existingAura.id === addedAura.id);
      if (existingIdx === -1) {
        newAuras.push({ id: addedAura.id, duration: addedAura.duration, stacks: 1 });
      }
      else {
        newAuras[existingIdx] = { id: addedAura.id, duration: addedAura.duration, stacks: Math.min(newAuras[existingIdx].stacks + 1, aurasById[addedAura.id].maxStacks) }; //FIXME: !!!!!
      }
    });

    return newAuras;
  }
  else if (action.type === "decrement") {
    return currAuras.map(aura => {
      const newAura = Object.assign({}, aura);
      newAura.duration -= action.by;
      return newAura
    }).filter(aura => aura.duration > 0);
  }
}

function Menu() {

}

document.addEventListener("visibilitychange", function () {
  if (!SETFPSFUN) { return; }
  if (document.visibilityState === 'visible') {
    SETFPSFUN(40);
  } else {
    SETFPSFUN(1);
  }
});

let SETFPSFUN = null;

function autoAttackMinsReducer(state, action) {
  return clamp(state + action, 0, 300);
}

function App() {
  const [FPS, setFPS] = useState(40);
  SETFPSFUN = setFPS;
  const frameTime = 1000 / FPS;
  const maxGCD = 1.5;
  const keepAttacksForSec = 20;
  const maxEnergy = 120;

  const [energy, setEnergy] = useState(maxEnergy);
  const [autoAttackMins, dispatchAutoAttackMins] = useReducer(autoAttackMinsReducer, 0)
  const [mobHp, setMobHp] = useState(200);
  const [mobMaxHp, setMobMaxHp] = useState(200);
  const [mobAlive, setMobAlive] = useState(true);
  const [mobXP, setMobXP] = useState(40);
  const [copper, setCopper] = useState(0);
  const [cooldowns, setCooldowns] = useState({});
  const [currentPlayerAuras, dispatchCurrentPlayerAuras] = useReducer(auraReducer, []);
  const [lastXSecAttacks, setLastXSecAttacks] = useState([]);
  const [playerXP, setPlayerXP] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [GCD, setGCD] = useState(0);
  const [currMob, setCurrMob] = useState(null);
  const [gameIsSetUp, setGameIsSetUp] = useState(false);

  const maxLevel = 999999;
  const baseEnergyRegen = 10;

  const baseAttackVal = 20 * Math.pow(playerLevel, 1.2) * currentPlayerAuras.map(aura => aurasById[aura.id])
    .filter(aura => aura.effect === "damageFactorIncrease")
    .reduce((p, c) => p + c.effectStrength, 1);

  const baseMobHp = 150 * Math.pow(playerLevel, 1.2);

  const critChance = 10 + playerLevel;

  const baseXpGain = 200;
  const baseXpNeed = 800;
  const xpGainExp = 0.6;
  const xpNeedExp = 1.3;
  const XPNeededToNextLevel = Math.floor(baseXpNeed * Math.pow(playerLevel, xpNeedExp));
  const XPGainedCurrentLevel = Math.floor(baseXpGain * Math.pow(playerLevel, xpGainExp));

  function getEnergyRegen() {
    return baseEnergyRegen + currentPlayerAuras/* .map(aura => aurasById[aura.id]) */
      .filter(aura => aurasById[aura.id].effect === "energyRegen")
      .reduce((p, c) => p + aurasById[c.id].effectStrength * c.stacks, 0);
  }

  const actualEnergyRegen = getEnergyRegen();

  useInterval(() => {
    if (gameIsSetUp) {
      decrementCooldownsBy(1 / FPS);
      dispatchCurrentPlayerAuras({ type: "decrement", by: 1 / FPS });
      setGCD(gcd => {
        if (gcd <= 0) {
          return 0;
        }
        else return gcd - 1 / FPS;
      });
      setLastXSecAttacks(lasts => {
        const allowed = +new Date() - keepAttacksForSec * 1000;
        const lastsnew = lasts.filter(attack => attack.timestamp > allowed);
        lastsnew.forEach(attack => { attack.isCrit ? attack.y += 0.5 : attack.y += 2; attack.opacity -= 0.01 });
        return lastsnew;
      });
      setEnergy(energy => clamp(energy + actualEnergyRegen / FPS, 0, maxEnergy));
    }
  }, frameTime);

  useInterval(() => {
    if (autoAttackMins > 0) {

      let isCrit = false;
      let spellDmg = getRndInteger(90, 110) / 100 * baseAttackVal * 1.5;
      if (getRndInteger(0, 100) < critChance) {
        spellDmg *= 2;
        isCrit = true;
      }

      damageMob(Math.floor(spellDmg), isCrit);
      dispatchAutoAttackMins(-1 / 30);
    }
  }, 2000);

  function putNewRandomMob() {
    const mob = mobs[getRndInteger(0, mobs.length)];

    putMob(mob.id);
  }

  function putMob(id) {
    const mob = mobs.find(mob => mob.id === +id);

    const mobStrength = getRndInteger(80, 121);

    const xpMultiplier = mob.xpMultiplier || 1;
    const hpMultiplier = mob.hpMultiplier || 1;

    const mobHp = Math.round(hpMultiplier * baseMobHp * mobStrength / 100);
    const mobXp = Math.round(xpMultiplier * XPGainedCurrentLevel * mobStrength / 100);

    setMobMaxHp(mobHp);
    setMobHp(mobHp);
    setMobXP(mobXp);
    setMobAlive(true);
    setCurrMob(mob);
  }

  useEffect(() => {
    if (currMob) {
      localStorage.setItem('lfm', currMob.id);
    }
  }, [currMob]);

  useEffect(() => {
    const loadedAppVer = localStorage.getItem('appVer');
    if (loadedAppVer) {
      const loadc = localStorage.getItem('c');
      if (loadc && !Number.isNaN(+loadc)) {
        setCopper(+loadc);
      }

      const loade = localStorage.getItem('e');
      if (loade && !Number.isNaN(+loade)) {
        setEnergy(clamp(+loade, 0, 120));
      }

      const loadxp = localStorage.getItem('x');
      if (loadxp && !Number.isNaN(+loadxp)) {
        setPlayerXP(+loadxp);
      }

      const loadlevel = localStorage.getItem('l');
      if (loadlevel && !Number.isNaN(+loadlevel)) {
        setPlayerLevel(+loadlevel);
      }

      const loadAutoAttackMins = localStorage.getItem('aam');
      if (loadAutoAttackMins && !Number.isNaN(+loadAutoAttackMins)) {
        dispatchAutoAttackMins(+loadAutoAttackMins);
      }
    }
    else {
      localStorage.clear();
      localStorage.setItem('appVer', '0.1');
    }


    const cds = {};

    spells.forEach(spell => {
      cds[spell.id] = { cooldown: 0, charges: spell.maxCharges };
    });

    setCooldowns(cds);

    document.addEventListener('keydown', e => {
      if (+e.key >= 1 && +e.key <= 5) {
        const elem = document.getElementById('spell_' + e.key);
        if (elem) {
          elem.click();
        }
      }
    });

    setGameIsSetUp(true);
  }, []);

  useEffect(() => {
    if (gameIsSetUp) {
      const loadLastFoughtMob = localStorage.getItem('lfm')
      if (loadLastFoughtMob && !Number.isNaN(loadLastFoughtMob)) {
        putMob(loadLastFoughtMob);
      }
      else {
        putNewRandomMob();
      }
    }
  }, [gameIsSetUp])

  useEffect(() => {
    if (!mobAlive) {
      setCopper(copper => Math.floor(copper + XPGainedCurrentLevel / 50 * getRndInteger(80, 120) / 100));
      setTimeout(() => {
        putNewRandomMob();
      }, 1000)
    }
  }, [mobAlive]);

  useEffect(() => {
    localStorage.setItem('c', copper);
  }, [copper]);

  useEffect(() => {
    localStorage.setItem('e', energy);
  }, [energy]);

  useEffect(() => {
    localStorage.setItem('l', playerLevel);
    localStorage.setItem('x', playerXP);
  }, [playerXP, playerLevel]);

  useEffect(() => {
    localStorage.setItem('aam', autoAttackMins);
  }, [autoAttackMins]);

  function addToDps(amount, isCrit = false) {
    if (amount === 0) { return; }
    setLastXSecAttacks(lasts => {
      const newLasts = Object.assign([], lasts);
      newLasts.push({ dmg: amount, timestamp: +new Date(), y: 0, opacity: 1, isCrit });
      return newLasts;
    });
  }

  function getDps() {
    if (lastXSecAttacks.length === 0) {
      return 0;
    }
    else {
      const first = lastXSecAttacks[0];

      const timeDiff = (+new Date() - first.timestamp) / 1000;

      const sum = lastXSecAttacks.reduce((p, c) => p + c.dmg, 0);
      return Math.round(sum / timeDiff);
    }
  }

  function addXP(xp) {
    if (playerLevel === maxLevel || xp === 0) { return; }
    setPlayerXP(currXP => currXP + xp);
  }

  React.useEffect(() => {
    if (playerXP > XPNeededToNextLevel) {
      setPlayerXP(xp => xp - XPNeededToNextLevel);
      setPlayerLevel(playerLevel => playerLevel + 1);
    }
  }, [playerXP, playerLevel]);

  function damageMob(amount, isCrit = false) {
    if (!mobAlive) {
      return false;
    }
    if (mobHp - amount <= 0) {
      setMobAlive(false);
      addXP(mobXP);
    }

    setMobHp(mobHp => { const decremented = mobHp - amount; if (decremented < 0) { return 0; } return decremented; });
    addToDps(amount, isCrit);
  }

  function lowerEnergy(amount) {
    setEnergy(energy => clamp(energy - amount, 0, maxEnergy));
  }

  function decrementCooldownsBy(amount) {
    setCooldowns(cooldowns => {
      const newcds = Object.assign({}, cooldowns);
      for (let key in newcds) {
        const origiCd = newcds[key];
        if (origiCd.cooldown - amount < 0) {
          if (origiCd.charges < spellsById[key].maxCharges) {
            newcds[key] = { cooldown: spellsById[key].cooldown, charges: origiCd.charges + 1 }
          }
          if (newcds[key].charges === spellsById[key].maxCharges) {
            newcds[key].cooldown = 0;
          }
        }
        else {
          newcds[key] = { cooldown: origiCd.cooldown - amount, charges: origiCd.charges };
        }
      }
      return newcds;
    });
  }

  function stringFromCopper(copper) {
    const gold = Math.floor(copper / 10000);
    copper -= gold * 10000;
    const silver = Math.floor(copper / 100);
    copper -= silver * 100;
    return `${gold} Gold ${silver} Silver ${copper} Copper`;
  }

  function setUsedCooldownFor(spell) {
    setCooldowns(cooldowns => {
      const newcds = Object.assign({}, cooldowns);
      const origiCd = newcds[spell.id];
      newcds[spell.id] = { charges: origiCd.charges - 1, cooldown: spell.cooldown };
      return newcds;
    });
  }

  function getRndInteger(min, max) {
    return Math.floor(Math.floor(Math.random() * (max - min)) + min);
  }



  function castSpell(spell) {
    setGCD(maxGCD);

    let spellDmg = Math.round(baseAttackVal * spell.damageMultiplier * getRndInteger(80, 120) / 100);
    let isCrit = false;
    if (getRndInteger(0, 100) < critChance) {
      spellDmg *= 2;
      isCrit = true;
    }
    damageMob(spellDmg, isCrit);
    lowerEnergy(spell.cost);
    setUsedCooldownFor(spell);

    if ('grantsPlayerAuras' in spell) {
      dispatchCurrentPlayerAuras({ type: "add", auraIdsToAdd: spell.grantsPlayerAuras });
    }

    if (spell.damageMultiplier != 0) {
      dispatchAutoAttackMins(2);
    }
  }

  function isSpellCastable(spell) {
    return mobAlive && (GCD === 0 || spell.notOnGCD) && cooldowns[spell.id].charges > 0 && energy >= spell.cost;
  }

  return gameIsSetUp ? (
    <div className="App" style={{
      background: 'url(https://i.pinimg.com/originals/f7/7c/e8/f77ce86768566acf48b51008af7dd882.jpg)',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover'
    }}>

      <div style={{
        marginBottom: 10,
        padding: 10,
        background: 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 5px 0px #0000004a'
      }}>
        <div>
          {currMob && <img
            className="mob-img"
            style={{
              filter: !mobAlive ? 'grayscale(100%)' : null,
              width: 200,
              height: 200,
              objectFit: 'contain',
              marginRight: 10,
              borderRadius: 5,
              boxShadow: '0 2px 5px 0px #bdbdbd'
            }}
            src={currMob.imageURI}></img>}

          {lastXSecAttacks.map(attack =>
            <span key={attack.timestamp} className="attack-text" style={{
              top: 250 - attack.y,
              opacity: attack.opacity,
              fontSize: attack.isCrit ? 50 : null,
              color: attack.isCrit ? "darkorange" : null
            }}>{attack.dmg}</span>
          )}
        </div>

        <div>
          <div style={{ fontSize: 30 }}>{currMob && currMob.name}</div>
          <div><progress id="progress-mobhp" value={mobHp} max={mobMaxHp} ></progress></div>
          <div>{mobHp}/{mobMaxHp}</div>
        </div>
      </div>

      <div style={{ padding: 10 }}>
        <div className="auras" style={{ height: 40, marginBottom: 10, textAlign: 'center' }}>
          {currentPlayerAuras.map(aura => <div
            key={aura.id}
            style={{
              display: 'inline-block',
              position: 'relative',
              width: 40,
              height: 40,
              marginRight: 5,
              background: `url(${aurasById[aura.id].imageURI})`,
              backgroundSize: 'contain'
            }}>
            <div className="spell-cooldown-text" style={{ fontSize: 18, top: -6 }}>{Math.round(aura.duration * 10) / 10}</div>
            {aura.stacks > 1 && <div className="spell-stack-text" style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'white',
              position: 'absolute',
              left: 4,
              bottom: 0
            }}>{aura.stacks}</div>}
          </div>)}
        </div>
        <div><progress id="progress-mana" value={energy} max={maxEnergy}></progress></div>
        <div>Mana: {Math.round(energy)}/{Math.round(maxEnergy)}</div>
      </div>

      {spells.map((spell, idx) => <div
        key={spell.id}
        id={"spell_" + hotkeys[idx]}
        className="spell-btn"
        onClick={isSpellCastable(spell) ? () => { castSpell(spell) } : null}
        style={{ backgroundImage: `url(${spell.imageURI})`, filter: energy < spell.cost ? 'saturate(0.18)' : null }}
      >

        {(cooldowns[spell.id].cooldown > 0 || GCD > 0) && <div className="spell-cooldown-overlay" style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          top: 60 - (GCD > cooldowns[spell.id].cooldown || cooldowns[spell.id].charges > 0 && GCD != 0 ? GCD / maxGCD : cooldowns[spell.id].cooldown / spell.cooldown) * 60,
          background: "black",
          opacity: 0.5
        }}>

        </div>}

        {cooldowns[spell.id].cooldown > 0 && cooldowns[spell.id].charges == 0 && <span className="spell-cooldown-text" style={{
          fontSize: cooldowns[spell.id].cooldown > 2 ? '20px' : null
        }}>{Math.ceil(cooldowns[spell.id].cooldown * 10) / 10}</span>}



        <span className="spell-hotkey">{hotkeys[idx]}</span>
        {cooldowns[spell.id] && spell.maxCharges > 1 && <span className="spell-charges">{cooldowns[spell.id].charges}</span>}

      </div>)
      }

      <div style={{ fontSize: 26, fontWeight: 600, marginBottom: 5, color: 'cyan' }}> <span style={{ borderRadius: 5, padding: 3, background: 'rgba(0,0,0,0.5)' }}>DPS: {getDps()}</span></div>


      <div>
        <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: 5 }}>

          <div>
            {autoAttackMins > 0 ?
              <b>Auto attacking for <span style={{ fontSize: 20 }}>{Math.ceil(autoAttackMins)}</span> minutes.</b> :
              <b>Auto attacking paused.</b>}<br/>
               (Max 300 minutes. Increased by 2 every time you hit with a damaging spell. Only active when game is running.)
            <br /><br />
          </div>

          <b>Money</b>: {stringFromCopper(copper)} | <b>Crit chance</b>: {critChance}% | <b>Energy regen</b>: {actualEnergyRegen}/sec
        </div>

        <div className="bottom-div" style={{
          marginTop: 10,
          padding: 10,
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          boxShadow: '0 0 5px 0px #0000004a'
        }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Level {playerLevel}</div>
          {playerLevel < maxLevel ?
            <div>
              <progress id="progress-xp" style={{ margin: '5px 0' }} value={playerXP} max={XPNeededToNextLevel}></progress>
              <div>XP: {playerXP}/{XPNeededToNextLevel} ({Math.round(playerXP / XPNeededToNextLevel * 100)}%)</div>
            </div>
            : null}
        </div>

      </div>
    </div >
  ) : <div>Loading...</div>;
}

export default App;
