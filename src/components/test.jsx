import React, { useState, useEffect, useCallback } from "react";
import { FaArrowLeft, FaSearch, FaChevronLeft, FaChevronRight, FaHeart, FaBolt, FaShieldAlt } from "react-icons/fa";
import { GiSwordWound, GiSwordman } from "react-icons/gi";

import "../assets/css/page/pokemonSkillBattle.css";
import Navbar from "./navbar";

const PokemonSkillBattle = () => {
  // State management
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [enemyPokemon, setEnemyPokemon] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [battleStatus, setBattleStatus] = useState('selecting'); // 'selecting', 'battling', 'finished'
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
  
  // Constants
  const POKEMONS_PER_PAGE = 30;
  const MAX_POKEMON = 1000;

  // Type effectiveness chart (simplified)
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

  // Fetch types
  const fetchTypes = useCallback(async () => {
    try {
      const response = await fetch("https://pokeapi.co/api/v2/type");
      const data = await response.json();
      setTypes(data.results.filter(type => type.name !== "unknown" && type.name !== "shadow"));
    } catch (error) {
      console.error("Failed to fetch Pokémon types:", error);
    }
  }, []);

  // Fetch team with enhanced details
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
              
              // Get moves with type information (limit to 4 moves)
              const movesWithTypes = await Promise.all(
                (teamMember.moves || []).slice(0, 4).map(async moveName => {
                  try {
                    const moveResponse = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
                    const moveData = await moveResponse.json();
                    return {
                      name: moveName,
                      type: moveData.type.name,
                      power: moveData.power || 60, // Default to 60 if no power
                      accuracy: moveData.accuracy || 100, // Default to 100% if no accuracy
                      damage_class: moveData.damage_class?.name || 'physical' // Default to physical
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

  // Load basic opponent list (names/IDs only)
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
        loaded: false
      }));

      setBasicOpponents(basicList);
      setFilteredOpponents(basicList);
      setTotalPages(Math.ceil(basicList.length / POKEMONS_PER_PAGE));
      
      // Pre-load first few pages in background
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

  // Enhance individual Pokémon details when needed
  const enhancePokemonDetails = useCallback(async (pokemon) => {
    if (enhancedOpponents.has(pokemon.id)) {
      return enhancedOpponents.get(pokemon.id);
    }
  
    try {
      const response = await fetch(pokemon.url);
      const pokemonData = await response.json();
      
      // Get 4 random moves with type information
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
              power: moveData.power || 60, // Default to 60 if no power
              accuracy: moveData.accuracy || 100, // Default to 100% if no accuracy
              damage_class: moveData.damage_class?.name || 'physical' // Default to physical
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
        ...pokemonData, // Spread the full details
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
      // Return a fallback with basic stats
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

  // Helper to get random moves
  const getRandomMoves = (moves, count) => {
    const shuffled = [...moves].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Filter opponents based on search and type
  const [filteredOpponents, setFilteredOpponents] = useState([]);
  useEffect(() => {
    if (basicOpponents.length === 0) return;

    const filtered = basicOpponents.filter(pokemon => {
      const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // For unenhanced Pokémon, we can't filter by type yet
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedType, basicOpponents, enhancedOpponents]);

  // Get paginated opponents with enhanced data where available
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

  // Start battle with selected Pokémon
  const startBattle = (pokemon) => {
    setSelectedPokemon(pokemon);
    setShowOpponentSelector(true);
    fetchBasicOpponents();
  };

  // Select opponent and initialize battle
  const handleOpponentSelection = async (pokemon) => {
    const enhanced = await enhancePokemonDetails(pokemon);
    setEnemyPokemon(enhanced);
    setShowOpponentSelector(false);
    
    // Initialize battle state
    const playerMaxHP = selectedPokemon.stats.find(s => s.stat.name === 'hp').base_stat;
    const enemyMaxHP = enhanced.stats.find(s => s.stat.name === 'hp').base_stat;
    
    setPlayerHP(playerMaxHP);
    setEnemyHP(enemyMaxHP);
    setBattleLog([`Battle started between ${selectedPokemon.name} and ${enhanced.name}!`]);
    setBattleStatus('battling');
    
    // Determine who goes first based on speed
    const playerSpeed = selectedPokemon.stats.find(s => s.stat.name === 'speed').base_stat;
    const enemySpeed = enhanced.stats.find(s => s.stat.name === 'speed').base_stat;
    
    if (playerSpeed >= enemySpeed) {
      setCurrentTurn('player');
      setBattleLog(prev => [...prev, `${selectedPokemon.name} is faster and will attack first!`]);
    } else {
      setCurrentTurn('opponent');
      setBattleLog(prev => [...prev, `${enhanced.name} is faster and will attack first!`]);
      // Start opponent's turn immediately
      setTimeout(opponentMove, 1000);
    }
  };

  // Calculate damage based on move, attacker, and defender
  const calculateDamage = (attacker, defender, move) => {
    // Get relevant stats
    const attackStat = move.damage_class === 'physical' ? 
      attacker.stats.find(s => s.stat.name === 'attack').base_stat :
      attacker.stats.find(s => s.stat.name === 'special-attack').base_stat;
      
    const defenseStat = move.damage_class === 'physical' ?
      defender.stats.find(s => s.stat.name === 'defense').base_stat :
      defender.stats.find(s => s.stat.name === 'special-defense').base_stat;
    
    // Check for STAB (Same Type Attack Bonus)
    const stab = attacker.types.some(t => t.type.name === move.type) ? 1.5 : 1;
    
    // Check type effectiveness
    let effectiveness = 1;
    defender.types.forEach(t => {
      if (typeEffectiveness[move.type] && typeEffectiveness[move.type][t.type.name]) {
        effectiveness *= typeEffectiveness[move.type][t.type.name];
      }
    });
    
    // Random factor (0.85 to 1.0)
    const randomFactor = 0.85 + Math.random() * 0.15;
    
    // Damage formula (simplified)
    const damage = Math.floor(
      (((2 * 50 / 5 + 2) * move.power * (attackStat / defenseStat)) / 50 + 2
    ) * stab * effectiveness * randomFactor)
    
    return Math.max(1, Math.floor(damage));
  };

  // Player makes a move
  const playerMove = (move) => {
    if (battleStatus !== 'battling' || currentTurn !== 'player') return;
    
    // Check if move hits (based on accuracy)
    const doesHit = Math.random() * 100 <= move.accuracy;
    
    if (!doesHit) {
      setBattleLog(prev => [...prev, `${selectedPokemon.name}'s ${move.name} missed!`]);
      setCurrentTurn('opponent');
      // Use a small timeout to allow the state to update before opponent moves
      setTimeout(opponentMove, 1000);
      return;
    }
    
    // Calculate damage
    const damage = calculateDamage(selectedPokemon, enemyPokemon, move);
    const newEnemyHP = Math.max(0, enemyHP - damage);
    
    // Check effectiveness
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
    
    setBattleLog(prev => [...prev, 
      `${selectedPokemon.name} used ${move.name}!${effectivenessMsg}`,
      `It dealt ${damage} damage to ${enemyPokemon.name}!`
    ]);
    
    setEnemyHP(newEnemyHP);
    
    // Check if enemy fainted
    if (newEnemyHP <= 0) {
      setBattleLog(prev => [...prev, `${enemyPokemon.name} fainted!`, `${selectedPokemon.name} wins the battle!`]);
      setBattleStatus('finished');
      return;
    }
    
    // Opponent's turn - use a small timeout to allow state updates
    setCurrentTurn('opponent');
    setTimeout(opponentMove, 1000);
  };
  
  // Opponent AI makes a move
  const opponentMove = useCallback(() => {
    if (battleStatus !== 'battling' || currentTurn !== 'opponent') return;
    
    // Simple AI: choose a random move
    const randomMove = enemyPokemon.attacks[Math.floor(Math.random() * enemyPokemon.attacks.length)];
    
    // Check if move hits (based on accuracy)
    const doesHit = Math.random() * 100 <= randomMove.accuracy;
    
    if (!doesHit) {
      setBattleLog(prev => [...prev, `${enemyPokemon.name}'s ${randomMove.name} missed!`]);
      setCurrentTurn('player');
      return;
    }
    
    // Calculate damage
    const damage = calculateDamage(enemyPokemon, selectedPokemon, randomMove);
    const newPlayerHP = Math.max(0, playerHP - damage);
    
    // Check effectiveness
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
    
    setBattleLog(prev => [...prev, 
      `${enemyPokemon.name} used ${randomMove.name}!${effectivenessMsg}`,
      `It dealt ${damage} damage to ${selectedPokemon.name}!`
    ]);
    
    setPlayerHP(newPlayerHP);
    
    // Check if player fainted
    if (newPlayerHP <= 0) {
      setBattleLog(prev => [...prev, `${selectedPokemon.name} fainted!`, `${enemyPokemon.name} wins the battle!`]);
      setBattleStatus('finished');
      return;
    }
    
    // Player's turn
    setCurrentTurn('player');
  }, [battleStatus, currentTurn, enemyPokemon, playerHP, selectedPokemon]);

  // Reset battle
  const resetBattle = () => {
    setSelectedPokemon(null);
    setEnemyPokemon(null);
    setBattleLog([]);
    setBattleStatus('selecting');
    setCurrentTurn(null);
  };

  // Opponent card component
  const OpponentCard = ({ pokemon, onSelect }) => {
    const mainType = pokemon.types?.[0]?.type?.name || 'normal';
    const typeColor = getTypeColor(mainType);

    return (
      <div className="opponent-card" onClick={() => onSelect(pokemon)}>
        <div className="battle-pokemon-image-container" style={{
          backgroundColor: `${typeColor}30`,
          backgroundImage: `radial-gradient(circle at center, ${typeColor}30 0%, transparent 70%)`,
        }}>
          {pokemon.loaded ? (
            <img
              src={pokemon.sprites?.other?.["official-artwork"]?.front_default}
              alt={pokemon.name}
              className="battle-pokemon-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/0.png';
              }}
            />
          ) : (
            <div className="image-placeholder">Loading...</div>
          )}
        </div>
        
        <div className="battle-pokemon-name">
          {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
        </div>
        
        <div className="battle-pokemon-stats">
          <div className="stat-item">
            <span className="stat-name">HP</span>
            <span className="stat-value">
              {pokemon.stats?.find(s => s.stat.name === 'hp')?.base_stat || '?'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-name">ATK</span>
            <span className="stat-value">
              {pokemon.stats?.find(s => s.stat.name === 'attack')?.base_stat || '?'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-name">SPD</span>
            <span className="stat-value">
              {pokemon.stats?.find(s => s.stat.name === 'speed')?.base_stat || '?'}
            </span>
          </div>
        </div>
        
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
      </div>
    );
  };

  // Loading state
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

  // Battle screen
  if (selectedPokemon && enemyPokemon && battleStatus !== 'selecting') {
    const playerMaxHP = selectedPokemon.stats.find(s => s.stat.name === 'hp').base_stat;
    const enemyMaxHP = enemyPokemon.stats.find(s => s.stat.name === 'hp').base_stat;
    
    return (
      <>
        <Navbar />
        <div className="battle-container">
          <div className="battle-header">
            <button className="back-button" onClick={resetBattle}>
              <FaArrowLeft /> End Battle
            </button>
            <h1>Pokémon Skills Battle</h1>
          </div>
          
          <div className="battle-field">
            {/* Enemy Pokémon */}
            <div className={`battle-pokemon enemy ${currentTurn === 'opponent' ? 'active' : ''}`}>
              <div className="pokemon-info">
                <h2>{enemyPokemon.name.charAt(0).toUpperCase() + enemyPokemon.name.slice(1)}</h2>
                <div className="hp-bar-container">
                  <div className="hp-bar" style={{ 
                    width: `${(enemyHP / enemyMaxHP) * 100}%`,
                    backgroundColor: enemyHP/enemyMaxHP < 0.2 ? '#ff0000' : enemyHP/enemyMaxHP < 0.5 ? '#ffa500' : '#4CAF50'
                  }}></div>
                </div>
                <div className="hp-text">
                  HP: {enemyHP} / {enemyMaxHP}
                </div>
              </div>
                <div className="pokemon-image-container" style={{
                    backgroundColor: `${getTypeColor(enemyPokemon.types[0].type.name)}30`,
                    backgroundImage: `radial-gradient(circle at center, ${getTypeColor(enemyPokemon.types[0].type.name)}30 0%, transparent 70%)`
                  }}>
                <img
                  src={enemyPokemon.sprites.other["official-artwork"].front_default}
                  alt={enemyPokemon.name}
                  className="pokemon-image"
                />
              </div>
            </div>
            
            {/* Battle log */}
            <div className="battle-log">
              {battleLog.map((log, index) => (
                <p key={index}>{log}</p>
              ))}
            </div>
            
            {/* Player Pokémon */}
            <div className={`battle-pokemon player ${currentTurn === 'player' ? 'active' : ''}`}>
              <div className="pokemon-image-container" style={{
                backgroundColor: `${getTypeColor(selectedPokemon.types[0].type.name)}30`,
                backgroundImage: `radial-gradient(circle at center, ${getTypeColor(selectedPokemon.types[0].type.name)}30 0%, transparent 70%)`
              }}>
                <img
                  src={selectedPokemon.sprites.other["official-artwork"].front_default}
                  alt={selectedPokemon.name}
                  className="pokemon-image"
                />
              </div>
              <div className="pokemon-info">
                <h2>{selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}</h2>
                <div className="hp-bar-container">
                  <div className="hp-bar" style={{ 
                    width: `${(playerHP / playerMaxHP) * 100}%`,
                    backgroundColor: playerHP/playerMaxHP < 0.2 ? '#ff0000' : playerHP/playerMaxHP < 0.5 ? '#ffa500' : '#4CAF50'
                  }}></div>
                </div>
                <div className="hp-text">
                  HP: {playerHP} / {playerMaxHP}
                </div>
              </div>
            </div>
            
            {/* Move selection (only visible during player's turn) */}
            {currentTurn === 'player' && battleStatus === 'battling' && (
              <div className="move-selection">
                <h3>Choose a move:</h3>
                <div className="move-buttons">
                  {selectedPokemon.attacks.map((move, index) => (
                    <button
                      key={index}
                      className="move-button"
                      style={{ backgroundColor: getTypeColor(move.type) }}
                      onClick={() => playerMove(move)}
                    >
                      <span className="move-name">{move.name}</span>
                      <span className="move-details">
                        <GiSwordWound /> {move.power} | <FaBolt /> {move.accuracy}%
                      </span>
                      <span className="move-type" style={{ backgroundColor: getTypeColor(move.type) }}>
                        {move.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Battle result */}
            {battleStatus === 'finished' && (
              <div className="battle-result">
                <button 
                  className="new-battle-btn"
                  onClick={resetBattle}
                >
                  Start New Battle
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Opponent selection screen
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

  // Team selection screen
  return (
    <>
      <Navbar />
      <div className="battle-pokedex-container">
        <div className="battle-pokedex-header">
          <h1>Pokémon  Skill Battle</h1>
          <p className="battle-team-subtitle">Select a Pokémon to start battle</p>
        </div>

        <div className="battle-container">
          {team.length > 0 ? (
            <div className="battle-grid">
              {team.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="battle-pokemon-card team-card"
                  style={{"--type-color": getTypeColor(pokemon.types[0].type.name)}}
                  onClick={() => startBattle(pokemon)}
                >
                  <div className="battle-card-header">
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
                    <p className="battle-pokemon-name">
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

                    <div className="battle-pokemon-moves">
                      <h4>
                        <GiBroadsword className="icon sword-icon" /> Moves:
                      </h4>
                      <ul>
                        {pokemon.attacks.map((move, index) => (
                          <li key={index}>
                            <span
                              className="move-dot"
                              style={{ backgroundColor: getTypeColor(move.type) }}
                            ></span>
                            {move.name} ({move.power} power)
                          </li>
                        ))}
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
              