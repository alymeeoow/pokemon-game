import React, { useState, useEffect, useCallback } from "react";
import { FaArrowLeft, FaSearch, FaChevronLeft, FaChevronRight, FaHeart, FaBolt, FaShieldAlt,FaHeartBroken } from "react-icons/fa";
import { GiSwordWound, GiBroadsword} from "react-icons/gi";
import Pokeball from "../assets/images/pokeballs.svg";
import "../assets/css/page/pokemonSkillBattle.css";
import Navbar from "./navbar";

const PokemonSkillBattle = () => {
  // State management
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [enemyPokemon, setEnemyPokemon] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [battleStatus, setBattleStatus] = useState('selecting'); 
  const [currentTurn, setCurrentTurn] = useState(null);
  const [playerHP, setPlayerHP] = useState(0);
  const [enemyHP, setEnemyHP] = useState(0);
  const [showOpponentSelector, setShowOpponentSelector] = useState(false);
  const [basicOpponents, setBasicOpponents] = useState([]);
  const [enhancedOpponents, setEnhancedOpponents] = useState(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  
  const [types, setTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const legendaryPokemon = new Set([
    144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 
    380, 381, 382, 383, 384, 480, 481, 482, 483, 484, 485, 486, 
    487, 488, 638, 639, 640, 641, 642, 645, 643, 644, 646, 772, 
    773, 785, 786, 787, 788, 888, 889, 890
  ]);

  const mythicalPokemon = new Set([
    151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 
    649, 719, 720, 721, 801, 802, 807, 808, 809, 893, 898, 1000
  ]);

  const ultraBeasts = new Set([
    793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806
  ]);

  const getPokemonClassification = (id) => {
    if (legendaryPokemon.has(id) && mythicalPokemon.has(id)) return { type: "mythical", label: "Mythical" };
    if (legendaryPokemon.has(id)) return { type: "legendary", label: "Legendary" };
    if (mythicalPokemon.has(id)) return { type: "mythical", label: "Mythical" };
    if (ultraBeasts.has(id)) return { type: "ultra", label: "Ultra Beast" };
    return { type: "basic", label: "Basic", icon: null };
  };

  
  

  const POKEMONS_PER_PAGE = 30;
  const MAX_POKEMON = 1000;


  const typeEffectiveness = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
  };

  const saveBattleHistory = async (playerPokemon, opponentPokemon, didPlayerWin) => {
    try {
      const battleRecord = {
        id: Math.random().toString(36).substring(2, 9),
        type: "SkillBattle",
        date: new Date().toISOString(),
        winner: didPlayerWin ? playerPokemon.name : opponentPokemon.name,
        loser: didPlayerWin ? opponentPokemon.name : playerPokemon.name,
        playerPokemon: {
          id: playerPokemon.id,
          name: playerPokemon.name,
          sprite: playerPokemon.sprites.other["official-artwork"].front_default,
          types: playerPokemon.types.map(t => t.type.name)
        },
        opponentPokemon: {
          id: opponentPokemon.id,
          name: opponentPokemon.name,
          sprite: opponentPokemon.sprites.other["official-artwork"].front_default,
          types: opponentPokemon.types.map(t => t.type.name)
        }
      };
  
      const response = await fetch('http://localhost:3000/battleHistory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(battleRecord)
      });
  
      if (!response.ok) {
        console.error('Failed to save battle history');
      }
    } catch (error) {
      console.error('Error saving battle history:', error);
    }
  };
  const fetchTypes = useCallback(async () => {
    try {
      const response = await fetch("https://pokeapi.co/api/v2/type");
      const data = await response.json();
      setTypes(data.results.filter(type => type.name !== "unknown" && type.name !== "shadow"));
    } catch (error) {
      console.error("Failed to fetch Pokémon types:", error);
    }
  }, []);

  
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch('http://localhost:3000/myteams');
        if (!response.ok) throw new Error('Failed to fetch team');
        const data = await response.json();
        
        const detailedTeam = await Promise.all(
          data.map(async (teamMember) => {
            try {
              const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${teamMember.pokemonId}`);
              const pokemonData = await pokemonResponse.json();
              
              
              const movesWithTypes = await Promise.all(
                (teamMember.moves || []).slice(0, 4).map(async moveName => {
                  try {
                    const moveResponse = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
                    const moveData = await moveResponse.json();
                    return {
                      name: moveName,
                      type: moveData.type.name,
                      power: moveData.power || 60, 
                      accuracy: moveData.accuracy || 100, 
                      damage_class: moveData.damage_class?.name || 'physical' 
                    };
                  } catch {
                    return {
                      name: moveName,
                      type: 'normal',
                      power: 60,
                      accuracy: 100,
                      damage_class: 'physical'
                    };
                  }
                })
              );
              
              return {
                ...pokemonData,
                ...teamMember,
                id: teamMember.pokemonId,
                classification: getPokemonClassification(teamMember.pokemonId),
                stats: [
                  { stat: { name: 'hp' }, base_stat: teamMember.stats.hp },
                  { stat: { name: 'attack' }, base_stat: teamMember.stats.attack },
                  { stat: { name: 'defense' }, base_stat: teamMember.stats.defense },
                  { stat: { name: 'special-attack' }, base_stat: teamMember.stats.spAttack },
                  { stat: { name: 'special-defense' }, base_stat: teamMember.stats.spDefense },
                  { stat: { name: 'speed' }, base_stat: teamMember.stats.speed }
                ],
                types: teamMember.elements.map(type => ({
                  type: { name: type }
                })),
                sprites: {
                  other: {
                    "official-artwork": {
                      front_default: teamMember.sprite || pokemonData.sprites.other["official-artwork"].front_default
                    }
                  }
                },
                attacks: movesWithTypes,
                weakness: teamMember.weakness || [],
                resistance: teamMember.resistance || []
              };
            } catch (error) {
              console.error(`Failed to process Pokémon ${teamMember.pokemonId}:`, error);
              return null;
            }
          })
        );
        
        setTeam(detailedTeam.filter(p => p !== null));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch team:", error);
        setLoading(false);
      }
    };
  
    fetchTeam();
    fetchTypes();
  }, [fetchTypes]);

 
  const fetchBasicOpponents = useCallback(async () => {
    if (basicOpponents.length > 0) return;

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const basicList = data.results.slice(0, MAX_POKEMON).map((p, index) => ({
        id: index + 1,
        name: p.name,
        url: p.url,
        classification: getPokemonClassification(index + 1),
        loaded: false
      }));

      setBasicOpponents(basicList);
      setFilteredOpponents(basicList);
      setTotalPages(Math.ceil(basicList.length / POKEMONS_PER_PAGE));
      
     
      const preloadPages = 3;
      const preloadCount = preloadPages * POKEMONS_PER_PAGE;
      const toPreload = basicList.slice(0, preloadCount);
      
      Promise.all(
        toPreload.map(pokemon => enhancePokemonDetails(pokemon))
      ).then(enhanced => {
        setEnhancedOpponents(prev => {
          const newMap = new Map(prev);
          enhanced.forEach(p => newMap.set(p.id, p));
          return newMap;
        });
      });
    } catch (error) {
      console.error("Failed to fetch opponent list:", error);
    }
  }, [basicOpponents.length]);

 
  const enhancePokemonDetails = useCallback(async (pokemon) => {
    if (enhancedOpponents.has(pokemon.id)) {
      return enhancedOpponents.get(pokemon.id);
    }
  
    try {
      const response = await fetch(pokemon.url);
      const pokemonData = await response.json();
      
    
      const allMoves = pokemonData.moves.map(m => m.move.name);
      const selectedMoves = getRandomMoves(allMoves, 4);
      
      const movesWithTypes = await Promise.all(
        selectedMoves.map(async moveName => {
          try {
            const moveResponse = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
            const moveData = await moveResponse.json();
            return {
              name: moveName,
              type: moveData.type.name,
              power: moveData.power || 60, 
              accuracy: moveData.accuracy || 100,
              damage_class: moveData.damage_class?.name || 'physical' 
            };
          } catch {
            return {
              name: moveName,
              type: 'normal',
              power: 60,
              accuracy: 100,
              damage_class: 'physical'
            };
          }
        })
      );
      
      const enhanced = {
        ...pokemon,
        ...pokemonData,
        classification: pokemon.classification,
        stats: pokemonData.stats || [
          { stat: { name: 'hp' }, base_stat: 0 },
          { stat: { name: 'attack' }, base_stat: 0 },
          { stat: { name: 'defense' }, base_stat: 0 },
          { stat: { name: 'special-attack' }, base_stat: 0 },
          { stat: { name: 'special-defense' }, base_stat: 0 },
          { stat: { name: 'speed' }, base_stat: 0 }
        ],
        attacks: movesWithTypes,
        loaded: true
      };
  
      return enhanced;
    } catch (error) {
      console.error(`Failed to enhance Pokémon ${pokemon.id}:`, error);
   
      return {
        ...pokemon,
        stats: [
          { stat: { name: 'hp' }, base_stat: 0 },
          { stat: { name: 'attack' }, base_stat: 0 },
          { stat: { name: 'defense' }, base_stat: 0 },
          { stat: { name: 'special-attack' }, base_stat: 0 },
          { stat: { name: 'special-defense' }, base_stat: 0 },
          { stat: { name: 'speed' }, base_stat: 0 }
        ],
        attacks: [
          { name: 'tackle', type: 'normal', power: 40, accuracy: 100, damage_class: 'physical' },
          { name: 'quick attack', type: 'normal', power: 40, accuracy: 100, damage_class: 'physical' },
          { name: 'scratch', type: 'normal', power: 40, accuracy: 100, damage_class: 'physical' },
          { name: 'pound', type: 'normal', power: 40, accuracy: 100, damage_class: 'physical' }
        ],
        loaded: false
      };
    }
  }, [enhancedOpponents]);


  const getRandomMoves = (moves, count) => {
    const shuffled = [...moves].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

 
  const [filteredOpponents, setFilteredOpponents] = useState([]);
  useEffect(() => {
    if (basicOpponents.length === 0) return;

    const filtered = basicOpponents.filter(pokemon => {
      const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
      
   
      let matchesType = selectedType === "all";
      if (enhancedOpponents.has(pokemon.id)) {
        const enhanced = enhancedOpponents.get(pokemon.id);
        matchesType = selectedType === "all" || 
          enhanced.types.some(type => type.type.name === selectedType);
      }
      
      return matchesSearch && matchesType;
    });

    setFilteredOpponents(filtered);
    setTotalPages(Math.ceil(filtered.length / POKEMONS_PER_PAGE));
    setCurrentPage(1); 
  }, [searchTerm, selectedType, basicOpponents, enhancedOpponents]);


  const getPaginatedOpponents = useCallback(() => {
    const startIndex = (currentPage - 1) * POKEMONS_PER_PAGE;
    const endIndex = startIndex + POKEMONS_PER_PAGE;
    
    return filteredOpponents
      .slice(startIndex, endIndex)
      .map(pokemon => enhancedOpponents.get(pokemon.id) || pokemon);
  }, [currentPage, filteredOpponents, enhancedOpponents]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };


  const startBattle = (pokemon) => {
    setSelectedPokemon(pokemon);
    setShowOpponentSelector(true);
    fetchBasicOpponents();
  };


  const handleOpponentSelection = async (pokemon) => {
    const enhanced = await enhancePokemonDetails(pokemon);
    setEnemyPokemon(enhanced);
    setShowOpponentSelector(false);
    

    const playerMaxHP = selectedPokemon.stats.find(s => s.stat.name === 'hp').base_stat;
    const enemyMaxHP = enhanced.stats.find(s => s.stat.name === 'hp').base_stat;
    
    setPlayerHP(playerMaxHP);
    setEnemyHP(enemyMaxHP);
    setBattleLog([`Battle started between ${selectedPokemon.name} and ${enhanced.name}!`]);
    setBattleStatus('battling');
    

    const playerSpeed = selectedPokemon.stats.find(s => s.stat.name === 'speed').base_stat;
    const enemySpeed = enhanced.stats.find(s => s.stat.name === 'speed').base_stat;
    
    if (playerSpeed >= enemySpeed) {
      setCurrentTurn('player');
      setBattleLog(prev => [...prev, `${selectedPokemon.name} is faster and will attack first!`]);
    } else {
      setCurrentTurn('opponent');
      setBattleLog(prev => [...prev, `${enhanced.name} is faster and will attack first!`]);
   
      setTimeout(opponentMove, 1000);
    }
  };


const calculateDamage = (attacker, defender, move) => {
    const attackStat = move.damage_class === 'physical' ?
      attacker.stats.find(s => s.stat.name === 'attack').base_stat :
      attacker.stats.find(s => s.stat.name === 'special-attack').base_stat;
  
    const defenseStat = move.damage_class === 'physical' ?
      defender.stats.find(s => s.stat.name === 'defense').base_stat :
      defender.stats.find(s => s.stat.name === 'special-defense').base_stat;
  
    const stab = attacker.types.some(t => t.type.name === move.type) ? 1.5 : 1;
  
    let effectiveness = 1;
    defender.types.forEach(t => {
      if (typeEffectiveness[move.type] && typeEffectiveness[move.type][t.type.name]) {
        effectiveness *= typeEffectiveness[move.type][t.type.name];
      }
    });
  
    const randomFactor = 0.85 + Math.random() * 0.15;
  
    const damage = Math.floor(
      (((2 * 50 / 5 + 2) * move.power * (attackStat / defenseStat)) / 50 + 2) *
      stab * effectiveness * randomFactor
    );
  
    return Math.max(1, Math.floor(damage));
  };
  

  const playerMove = (move) => {
    if (battleStatus !== 'battling' || currentTurn !== 'player') return;
  
    const doesHit = Math.random() * 100 <= move.accuracy;
  
    if (!doesHit) {
      setBattleLog(prev => [...prev, `${selectedPokemon.name}'s ${move.name} missed!`]);
      setCurrentTurn('opponent');
      return;
    }
  
    const damage = calculateDamage(selectedPokemon, enemyPokemon, move);
    const newEnemyHP = Math.max(0, enemyHP - damage);
  
    let effectiveness = 1;
    enemyPokemon.types.forEach(t => {
      if (typeEffectiveness[move.type] && typeEffectiveness[move.type][t.type.name]) {
        effectiveness *= typeEffectiveness[move.type][t.type.name];
      }
    });
  
    let effectivenessMsg = '';
    if (effectiveness > 1) {
      effectivenessMsg = " It's super effective!";
    } else if (effectiveness < 1 && effectiveness > 0) {
      effectivenessMsg = " It's not very effective...";
    } else if (effectiveness === 0) {
      effectivenessMsg = " It has no effect!";
    }
  
    setBattleLog(prev => [
      ...prev,
      `${selectedPokemon.name} used ${move.name}!${effectivenessMsg}`,
      `It dealt ${damage} damage to ${enemyPokemon.name}!`
    ]);
  
    setEnemyHP(newEnemyHP);
  
    if (newEnemyHP <= 0) {
      setBattleLog(prev => [...prev, `${enemyPokemon.name} fainted!`, `${selectedPokemon.name} wins the battle!`]);
      setBattleStatus('finished');
      saveBattleHistory(selectedPokemon, enemyPokemon, true); // true means player won
      return;
    }
  
    setCurrentTurn('opponent');
  };
  

  const opponentMove = useCallback(() => {
    if (battleStatus !== 'battling') return;
  
    const randomMove = enemyPokemon.attacks[Math.floor(Math.random() * enemyPokemon.attacks.length)];
    const doesHit = Math.random() * 100 <= randomMove.accuracy;
  
    if (!doesHit) {
      setBattleLog(prev => [...prev, `${enemyPokemon.name}'s ${randomMove.name} missed!`]);
      setCurrentTurn('player');
      return;
    }
  
    const damage = calculateDamage(enemyPokemon, selectedPokemon, randomMove);
    const newPlayerHP = Math.max(0, playerHP - damage);
  
    let effectiveness = 1;
    selectedPokemon.types.forEach(t => {
      if (typeEffectiveness[randomMove.type] && typeEffectiveness[randomMove.type][t.type.name]) {
        effectiveness *= typeEffectiveness[randomMove.type][t.type.name];
      }
    });
  
    let effectivenessMsg = '';
    if (effectiveness > 1) {
      effectivenessMsg = " It's super effective!";
    } else if (effectiveness < 1 && effectiveness > 0) {
      effectivenessMsg = " It's not very effective...";
    } else if (effectiveness === 0) {
      effectivenessMsg = " It has no effect!";
    }
  
    setBattleLog(prev => [
      ...prev,
      `${enemyPokemon.name} used ${randomMove.name}!${effectivenessMsg}`,
      `It dealt ${damage} damage to ${selectedPokemon.name}!`
    ]);
  
    setPlayerHP(newPlayerHP);
  
    if (newPlayerHP <= 0) {
      setBattleLog(prev => [...prev, `${selectedPokemon.name} fainted!`, `${enemyPokemon.name} wins the battle!`]);
      setBattleStatus('finished');
      saveBattleHistory(selectedPokemon, enemyPokemon, false); // false means player lost
      return;
    }
  
    setCurrentTurn('player');
  }, [battleStatus, enemyPokemon, selectedPokemon, playerHP]);
  

  useEffect(() => {
    if (currentTurn === 'opponent' && battleStatus === 'battling') {
      const timer = setTimeout(() => {
        opponentMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, battleStatus, opponentMove]);



  const resetBattle = () => {
    setSelectedPokemon(null);
    setEnemyPokemon(null);
    setBattleLog([]);
    setBattleStatus('selecting');
    setCurrentTurn(null);
  };
  

  const OpponentCard = ({ pokemon, onSelect }) => {
    const mainType = pokemon.types?.[0]?.type?.name || 'normal';
    const typeColor = getTypeColor(mainType);
  
    return (
      <div
        className="pokemon-card team-card"
        style={{ "--type-color": typeColor }}
    
      >
        <div className="battle-card-header">
          <span
            className="pokemon-classification"
            data-classification={pokemon.classification?.type}
          >
            {pokemon.classification?.label}
          </span>
          <span className="battle-pokemon-hp">
            {pokemon.stats?.[0]?.base_stat || '??'} HP
          </span>
        </div>
  
        <div
          className="battle-pokemon-image-container"
          style={{
            backgroundColor: `${typeColor}30`,
            backgroundImage: `radial-gradient(circle at center, ${typeColor}30 0%, transparent 70%)`,
          }}
        >
          {pokemon.loaded ? (
            <img
              src={pokemon.sprites?.other?.["official-artwork"]?.front_default}
              alt={pokemon.name}
              className="battle-pokemon-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/0.png';
              }}
            />
          ) : (
            <div className="image-placeholder">Loading...</div>
          )}
        </div>
  
        <p className="battle-pokemon-name">
          {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
        </p>
  
        <button
          className="add-button-in-team"
          style={{ backgroundColor: typeColor }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(pokemon);
          }}
        >
          Select Opponent
        </button>
  
        <div className="pokemon-types">
          <h4>
            <img src={Pokeball} alt="Pokeball" className="pokeball-icon2" />
            Elements:
          </h4>
          <div className="type-tags">
            {pokemon.types?.length > 0 ? (
              pokemon.types.map((type, index) => (
                <span
                  key={index}
                  className="type-tag"
                  style={{ backgroundColor: getTypeColor(type.type.name) }}
                >
                  {type.type.name}
                </span>
              ))
            ) : (
              <span>Loading types...</span>
            )}
          </div>
        </div>
  
        <div className="pokemon-attacks">
          <h4>
            <GiBroadsword className="icon sword-icon" /> Moves:
          </h4>
          <ul>
            {pokemon.attacks?.length > 0 ? (
              pokemon.attacks.map((attack, index) => (
                <li key={index}>
                  <span
                    className="attack-dot"
                    style={{ backgroundColor: getTypeColor(attack.type) }}
                  ></span>
                  {attack.name}
                </li>
              ))
            ) : (
              <li>Loading moves...</li>
            )}
          </ul>
        </div>
      </div>
    );
  };
  

  if (loading) {
    return (
      <div className="pokedex-loading">
        <div className="pokeball1-loading">
          <div className="pokeball1-top"></div>
          <div className="pokeball1-bottom"></div>
          <div className="pokeball1-middle"></div>
          <div className="pokeball1-center"></div>
          <div className="pokeball1-center-inner"></div>
        </div>
        <p className="loading-text">Loading Pokémon</p>
      </div>
    );
  }

  if (selectedPokemon && enemyPokemon && battleStatus !== 'selecting') {
    const playerMaxHP = selectedPokemon.stats.find(s => s.stat.name === 'hp').base_stat;
    const enemyMaxHP = enemyPokemon.stats.find(s => s.stat.name === 'hp').base_stat;
    
  return (
  <>
    <Navbar />
   
      
    <div className="pkmn-battle-container">

    <div className="battle-pokedex-header">
        <button className="back-button" onClick={resetBattle}>
          End Battle
        </button>
        <h1>Pokémon Skill-Battle</h1>
      </div>
    
      <div className="pkmn-battle-field-container">

        <div className="pkmn-battle-field">

          <div className={`pkmn-battle-pokemon pkmn-enemy ${currentTurn === 'opponent' ? 'pkmn-active-turn' : ''}`}>
            <div className="pkmn-pokemon-info">
              <h2>{enemyPokemon.name.charAt(0).toUpperCase() + enemyPokemon.name.slice(1)}</h2>
              <div className="pkmn-hp-bar-container">
                <div className="pkmn-hp-bar" style={{ 
                  width: `${(enemyHP / enemyMaxHP) * 100}%`,
                  backgroundColor: enemyHP/enemyMaxHP < 0.2 ? '#ff0000' : enemyHP/enemyMaxHP < 0.5 ? '#ffa500' : '#4CAF50'
                }}></div>
              </div>
              <div className="pkmn-hp-text">
                HP: {enemyHP} / {enemyMaxHP}
              </div>
            </div>
            <div className="pkmn-pokemon-image-container" style={{
                backgroundColor: `${getTypeColor(enemyPokemon.types[0].type.name)}30`,
                backgroundImage: `radial-gradient(circle at center, ${getTypeColor(enemyPokemon.types[0].type.name)}30 0%, transparent 70%)`
              }}>
              <img
                src={enemyPokemon.sprites.other["official-artwork"].front_default}
                alt={enemyPokemon.name}
                className="pkmn-pokemon-image"
              />
            </div>
          </div>
          
  
          <div className="pkmn-vs-container">
            <div className="pkmn-vs-circle">
              <span>VS</span>
            </div>
          </div>
          
 
          <div className={`pkmn-battle-pokemon pkmn-player ${currentTurn === 'player' ? 'pkmn-active-turn' : ''}`}>
            <div className="pkmn-pokemon-image-container" style={{
              backgroundColor: `${getTypeColor(selectedPokemon.types[0].type.name)}30`,
              backgroundImage: `radial-gradient(circle at center, ${getTypeColor(selectedPokemon.types[0].type.name)}30 0%, transparent 70%)`
            }}>
              <img
                src={selectedPokemon.sprites.other["official-artwork"].front_default}
                alt={selectedPokemon.name}
                className="pkmn-pokemon-image"
              />
            </div>
            <div className="pkmn-pokemon-info">
              <h2>{selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}</h2>
              <div className="pkmn-hp-bar-container">
                <div className="pkmn-hp-bar" style={{ 
                  width: `${(playerHP / playerMaxHP) * 100}%`,
                  backgroundColor: playerHP/playerMaxHP < 0.2 ? '#ff0000' : playerHP/playerMaxHP < 0.5 ? '#ffa500' : '#4CAF50'
                }}></div>
              </div>
              <div className="pkmn-hp-text">
                HP: {playerHP} / {playerMaxHP}
              </div>
            </div>
          </div>
          
    
          {currentTurn === 'player' && battleStatus === 'battling' && (
            <div className="pkmn-move-selection">
              <h3>Choose a move:</h3>
              <div className="pkmn-move-buttons">
                {selectedPokemon.attacks.map((move, index) => (
                  <button
                    key={index}
                    className="pkmn-move-button"
                    style={{ backgroundColor: getTypeColor(move.type) }}
                    onClick={() => playerMove(move)}
                  >
                    <span className="pkmn-move-name">{move.name}</span>
                    <span className="pkmn-move-details">
                      {move.accuracy}%
                    </span>
                    <span className="pkmn-move-type" style={{ backgroundColor: getTypeColor(move.type) }}>
                      {move.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          

          {battleStatus === 'finished' && (
            <div className="pkmn-battle-result">
              <button 
                className="pkmn-new-battle-btn"
                onClick={resetBattle}
              >
                Start New Battle
              </button>
            </div>
          )}
        </div>
        
  
        <div className="pkmn-battle-log">
          <h3>Battle Log</h3>
          <div className="pkmn-battle-log-content">
            {battleLog.map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);
  }


  if (showOpponentSelector) {
    return (
      <>
        <Navbar />
        <div className="battle-pokedex-container">
          <div className="battle-pokedex-header">
            <button 
              className="back-button"
              onClick={() => {
                setShowOpponentSelector(false);
                if (!enemyPokemon) {
                  setSelectedPokemon(null);
                }
              }}
            >
              <FaArrowLeft /> Back
            </button>
            <h1>Select Opponent</h1>
          </div>

          <div className="controls-container">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search Pokémon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-container">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                {types.map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="battle-grid">
            {getPaginatedOpponents().map((pokemon) => (
              <OpponentCard 
                key={pokemon.id}
                
                
                pokemon={pokemon}
                onSelect={handleOpponentSelection}
              />
            ))}
          </div>

          <div className="pagination">
            <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
              « First
            </button>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              ‹ Prev
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={currentPage === pageNum ? "active" : ""}
                >
                  {pageNum}
                </button>
              );
            })}

            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              Next ›
            </button>
            <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
              Last »
            </button>
          </div>

          <div className="page-info">
            Page {currentPage} of {totalPages} | Showing {getPaginatedOpponents().length} of {filteredOpponents.length} Pokémon
          </div>
        </div>
      </>
    );
  }


  return (
    <>
      <Navbar />
      <div className="battle-pokedex-container">
        <div className="battle-pokedex-header">
          <h1>Pokémon Skill-Battle</h1>
          <p className="battle-team-subtitle">Select a Pokémon to start battle</p>
        </div>

        <div className="battle-container">
          {team.length > 0 ? (
            <div className="battle-grid">
              {team.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="pokemon-card team-card"
                  style={{"--type-color": getTypeColor(pokemon.types[0].type.name)}}
                
                >
                  <div className="battle-card-header">
                  <span className="pokemon-classification" data-classification={pokemon.classification.type}>
            {pokemon.classification.label}
          </span>
                    <span className="battle-pokemon-hp">
                      {pokemon.stats?.[0]?.base_stat || '??'} HP
                    </span>
                  </div>
                  
                  <div
                    className="battle-pokemon-image-container"
                    style={{
                      backgroundColor: `${getTypeColor(pokemon.types[0].type.name)}30`,
                      backgroundImage: `radial-gradient(circle at center, ${getTypeColor(pokemon.types[0].type.name)}30 0%, transparent 70%)`,
                    }}
                  >

<img
                      src={pokemon.sprites.other["official-artwork"].front_default}
                      alt={pokemon.name}
                      className="battle-pokemon-image"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="battle-card-body">
                    <p className="battle-pokemon-name-player">
                      {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                    </p>

                    <div className="pokemon-add-to-team">
                      <button 
                        className="add-button-in-team"
                        onClick={() => startBattle(pokemon)}
                      >
                        Choose for Battle
                      </button>
                    </div>

                    <div className="pokemon-types">
                      <h4>
                        <img src={Pokeball} alt="Pokeball" className="pokeball-icon2" />
                        Elements:
                      </h4>
                      
                      <div className="type-tags">
                        {pokemon.types?.length > 0 ? (
                          pokemon.types.map((type, index) => (
                            <span
                              key={index}
                              className="type-tag"
                              style={{ backgroundColor: getTypeColor(type.type.name) }}
                            >
                              {type.type.name}
                            </span>
                          ))
                        ) : <span>Loading types...</span>}
                      </div>
                    </div>

                    <div className="pokemon-attacks">
                      <h4>
                        <GiBroadsword className="icon sword-icon" /> Moves:
                      </h4>
                      <ul>
                        {pokemon.attacks?.length > 0 ? (
                          pokemon.attacks.map((attack, index) => (
                            <li key={index}>
                              <span
                                className="attack-dot"
                                style={{ backgroundColor: getTypeColor(attack.type) }}
                              ></span>
                              {attack.name}
                            </li>
                          ))
                        ) : <li>Loading moves...</li>}
                      </ul>
                    </div>


                 
                    
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-battle">
              <p>Your battle team is empty!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const getTypeColor = (type) => {
  const typeColors = {
    normal: "#A8A878",
    fire: "#F08030",
    water: "#6890F0",
    electric: "#F8D030",
    grass: "#78C850",
    ice: "#98D8D8",
    fighting: "#C03028",
    poison: "#A040A0",
    ground: "#E0C068",
    flying: "#A890F0",
    psychic: "#F85888",
    bug: "#A8B820",
    rock: "#B8A038",
    ghost: "#705898",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    fairy: "#EE99AC",
  };
  return typeColors[type?.toLowerCase()] || "#777";
};

export default PokemonSkillBattle;
              