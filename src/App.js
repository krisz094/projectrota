import React, { useState, useEffect, useDebugValue } from 'react';
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
    cost: 5,
    damage: 30,
    cooldown: 8,
    maxCharges: 3,
    castTime: 0,
    name: 'Fire Blast',
    iconURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fireball.jpg'
  },
  {
    id: 2,
    cost: 40,
    damage: 60,
    cooldown: 6,
    maxCharges: 1,
    castTime: 6,
    name: 'Pyroblast',
    iconURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fireball02.jpg'
  },
  {
    id: 3,
    cost: 40,
    damage: 18,
    cooldown: 0,
    maxCharges: 1,
    name: 'Fireball',
    castTime: 1.5,
    iconURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_flamebolt.jpg'
  },
  {
    id: 4,
    cost: -40,
    damage: 0,
    cooldown: 10,
    maxCharges: 1,
    name: 'Evocation',
    channeled: true,
    castTime: 6,
    iconURI: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_purge.jpg'
  },

]

const XPNeededToNextLevel = [
  NaN, // no level 0
  400, // level 1 to 2
  800, // level 2 to 3...
  1400, // 3 to 4
  2000, // 4 to 5
  2800, // 5 to 6
  3800, // 6 to 7
  5000, // 7 to 8
  6500, // 8 to 9
  8000, // 9 to 10
];

const hotkeys = [
  1, 2, 3, 4
];

const mobs = [
  {
    id: 1,
    name: "Boar",
    hp: 120,
    imageURI: boarImg,
    level: 1
  },
  {
    id: 2,
    name: "Bear",
    hp: 200,
    imageURI: brownBearImg,
    level: 2
  },
  {
    id: 3,
    name: "Tiger",
    hp: 280,
    imageURI: catImg,
    level: 3
  },
  {
    id: 4,
    name: "Wolf",
    hp: 320,
    imageURI: greyWolfImg,
    level: 4
  },
  {
    id: 5,
    name: "Advanced Wolf",
    hp: 400,
    imageURI: greenWolfImg,
    level: 5
  },
  {
    id: 6,
    name: "Spider",
    hp: 500,
    imageURI: spiderImg,
    level: 6
  },
  {
    id: 7,
    name: "Mechanical Tiger",
    hp: 560,
    imageURI: mechaImg,
    level: 7
  },
  {
    id: 8,
    name: "Lizard",
    hp: 620,
    imageURI: lizardImg,
    level: 8
  },
  {
    id: 9,
    name: "Fox",
    hp: 680,
    imageURI: foxImg,
    level: 9
  },
  {
    id: 10,
    name: "Fathom Ray",
    hp: 740,
    imageURI: rayImg,
    level: 10
  },
];

function App() {
  const incVal = 12;
  const maxEnergy = 120;
  const FPS = 60;
  const frameTime = 1000 / FPS;
  const maxGCD = 1.5;

  const [autoAttack, setAutoAttack] = useState(4);
  const [energy, setEnergy] = useState(maxEnergy);
  const [mobHp, setMobHp] = useState(200);
  const [mobMaxHp, setMobMaxHp] = useState(200);
  const [mobAlive, setMobAlive] = useState(true);
  const [mobXP, setMobXP] = useState(40);
  const [copper, setCopper] = useState(0);
  const [cooldowns, setCooldowns] = useState({});
  const [last10SecAttacks, setLast10SecAttacks] = useState([]);
  const [playerXP, setPlayerXP] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [GCD, setGCD] = useState(0);
  const [currMob, setCurrMob] = useState(null);

  const critChance = 20 + playerLevel * 2;


  function putNewRandomMob() {
    let availables = mobs.filter(mob => mob.level >= playerLevel - 3 && mob.level <= playerLevel + 2);
    if (availables.length == 0) {
      availables = mobs;
    }
    const mob = availables[getRndInteger(0, availables.length)];
    setMobMaxHp(mob.hp);
    setMobHp(mob.hp);
    setMobXP(Math.max(80 + (mob.level) * 40 - playerLevel * 20, 0));
    setMobAlive(true);
    setCurrMob(mob);
  }

  useEffect(() => {

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

    const loadlevel = localStorage.getItem('l')
    if (loadlevel && !Number.isNaN(+loadlevel)) {
      setPlayerLevel(+loadlevel);
    }

    const cds = {};
    spells.forEach(spell => {
      cds[spell.id] = 0;
    })

    setCooldowns(cds);

    const interval = setInterval(() => {
      decrementCooldownsBy(1 / FPS);
      setGCD(gcd => {
        if (gcd <= 0) {
          return 0;
        }
        else return gcd - 1 / FPS;
      });
      setEnergy(energy => clamp(energy + incVal / FPS, 0, maxEnergy));
      setLast10SecAttacks(lasts => {
        const allowed = +new Date() - 10000;
        const lastsnew = lasts.filter(attack => attack.timestamp > allowed);
        lastsnew.forEach(attack => attack.y++);
        return lastsnew;
      });
    }, frameTime);

    document.addEventListener('keydown', e => {

      if (+e.key >= 1 && +e.key <= 4) {
        const elem = document.getElementById('spell_' + e.key);
        if (elem) {
          elem.click();
        }
      }
    });

    putNewRandomMob();

    return () => { clearInterval(interval); }
  }, []);

  useEffect(() => {
    if (!mobAlive) {
      setCopper(copper => copper + getRndInteger(5, 80));
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

  function addToDps(amount, isCrit = false) {
    if (amount === 0) { return; }
    setLast10SecAttacks(lasts => {
      const newLasts = Object.assign([], lasts);
      newLasts.push({ dmg: amount, timestamp: +new Date(), y: 0, isCrit });
      return newLasts;
    });
  }

  function getDps() {
    if (last10SecAttacks.length === 0) {
      return 0;
    }
    else {
      const first = last10SecAttacks[0];

      const timeDiff = (+new Date() - first.timestamp) / 1000;

      const sum = last10SecAttacks.reduce((p, c) => p + c.dmg, 0);
      return Math.round(sum / timeDiff * 100) / 100;
    }
  }

  function addXP(xp) {
    if (playerLevel === 10 || xp === 0) { return; }
    setPlayerXP(currXP => currXP + xp);
  }

  React.useEffect(() => {
    if (playerXP > XPNeededToNextLevel[playerLevel]) {
      setPlayerXP(xp => xp - XPNeededToNextLevel[playerLevel]);
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
        newcds[key] = cooldowns[key] - amount;

        if (newcds[key] < 0) {
          newcds[key] = 0;
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
      newcds[spell.id] = spell.cooldown;
      return newcds;
    });
  }

  function getRndInteger(min, max) {
    return Math.floor(Math.floor(Math.random() * (max - min)) + min);
  }

  function castSpell(spell) {
    setGCD(maxGCD);

    let spellDmg = Math.floor(getRndInteger(spell.damage * 0.8, spell.damage * 1.2) * (1 + playerLevel / 4));

    let isCrit = false;
    if (getRndInteger(0, 100) < critChance) {
      spellDmg *= 2;
      isCrit = true;
    }
    damageMob(spellDmg, isCrit);
    lowerEnergy(spell.cost);
    setUsedCooldownFor(spell);
  }

  return (
    <div className="App">

      <div style={{ fontSize: 30, fontWeight: 800 }}>DPS: {getDps()}</div>
      <hr></hr>
      <div id="imgcont">
        {currMob && <img
          className="mob-img"
          style={!mobAlive ? { filter: 'grayscale(100%)' } : null}
          src={currMob.imageURI}></img>}

        {last10SecAttacks.map(attack =>
          <span key={attack.timestamp} className="attack-text" style={{
            top: 300 - attack.y,
            fontSize: attack.isCrit ? 50 : null,
            color: attack.isCrit ? "darkorange" : null
          }}>{attack.dmg}</span>
        )}
      </div>

      <div>
        <div style={{ fontSize: 30 }}>{currMob && currMob.name} (Lv.{currMob && currMob.level})</div>
        <div><progress id="progress-mobhp" value={mobHp} max={mobMaxHp} ></progress></div>
        <div>{mobHp}/{mobMaxHp}</div>
      </div>
      <hr></hr>
      <div>
        <div>Mana</div>
        <div><progress id="progress-mana" value={energy} max={maxEnergy}></progress></div>
      </div>

      <div>{Math.round(energy)}</div>

      {/* {spells.map((spell, idx) => <button
        key={spell.id}
        id={"spell_" + spell.id}
        className="spell-btn"
        disabled={cooldowns[idx] > 0 || !mobAlive || energy < spell.cost}
        onClick={() => { damageMob(spell.damage); lowerEnergy(spell.cost); setCooldownOf(idx, spell.cooldown); }}
      >{spell.name}{cooldowns[idx] > 0 ? " (" + Math.round(cooldowns[idx]) + ")" : null}</button>)} */}

      {spells.map((spell, idx) => <div
        key={spell.id}
        id={"spell_" + hotkeys[idx]}
        className="spell-btn"
        onClick={(GCD > 0 || cooldowns[spell.id] > 0 || !mobAlive || energy < spell.cost) ? null : () => { castSpell(spell) }}
        style={{ backgroundImage: `url(${spell.iconURI})`, filter: energy < spell.cost ? 'saturate(0.18)' : null }}
      >

        {(cooldowns[spell.id] > 0 || GCD > 0) && <div className="spell-cooldown-overlay" style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          top: 60 - (GCD > cooldowns[spell.id] ? GCD / maxGCD : cooldowns[spell.id] / spell.cooldown) * 60,
          background: "black",
          opacity: 0.5
        }}>
        </div>}

        {cooldowns[spell.id] > 0 && <span className="spell-cooldown-text" style={{
          fontSize: cooldowns[spell.id] > 2 ? '20px' : null
        }}>{Math.ceil(cooldowns[spell.id] * 10) / 10}</span>}



        <span className="spell-hotkey">{hotkeys[idx]}</span>
      </div>)
      }

      <div>
        <b>Money</b>: {stringFromCopper(copper)} | <b>Crit chance</b>: {critChance}%
      </div>
      <hr></hr>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Level {playerLevel}</div>
        {playerLevel !== 10 ?
          <div>
            <div>XP</div>
            <progress id="progress-xp" value={playerXP} max={XPNeededToNextLevel[playerLevel]}></progress>
            <div>{playerXP}/{XPNeededToNextLevel[playerLevel]} ({Math.round(playerXP / XPNeededToNextLevel[playerLevel] * 100)}%)</div>
          </div>
          : null}
      </div>
    </div >
  );
}

export default App;
