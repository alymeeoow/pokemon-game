import React, { useState, useEffect, useCallback } from "react";
import { FaTimes, FaPlus, FaHeartBroken, FaShieldAlt, FaCrown, FaStar, FaArrowLeft, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { GiBroadsword } from "react-icons/gi";
  
import "../assets/css/page/pokemonStatBattle.css";
import Navbar from "./navbar";

const PokemonStatBattle = () => {

  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [enemyPokemon, setEnemyPokemon] = useState(null);
  const [battleResult, setBattleResult] = useState(null);
  

  const [basicOpponents, setBasicOpponents] = useState([]);
  const [enhancedOpponents, setEnhancedOpponents] = useState(new Map());
  const [filteredOpponents, setFilteredOpponents] = useState([]);
  

  const [showOpponentSelector, setShowOpponentSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingOpponents, setIsLoadingOpponents] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  

  const POKEMONS_PER_PAGE = 30;
  const MAX_POKEMON = 1000;
  const BATCH_SIZE = 50;


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


  const saveBattleHistory = async (playerPokemon, opponentPokemon, result, battleStats) => {
    try {
      // Define stat names for comparison
      const statNames = {
        hp: "HP",
        attack: "Attack",
        defense: "Defense",
        "special-attack": "Sp. Atk",
        "special-defense": "Sp. Def",
        speed: "Speed"
      };

      // Create stats comparison array
      const statsComparison = Object.entries(statNames).map(([statKey, statName]) => {
        const playerStat = playerPokemon.stats.find(s => s.stat.name === statKey)?.base_stat || 0;
        const opponentStat = opponentPokemon.stats.find(s => s.stat.name === statKey)?.base_stat || 0;
        
        return {
          stat: statName,
          playerStat,
          opponentStat,
          advantage: playerStat > opponentStat ? "player" : 
                    playerStat < opponentStat ? "opponent" : "equal"
        };
      });

      // Calculate total stats for comparison
      const playerTotal = statsComparison.reduce((sum, {playerStat}) => sum + playerStat, 0);
      const opponentTotal = statsComparison.reduce((sum, {opponentStat}) => sum + opponentStat, 0);

      // Add total to comparison
      statsComparison.push({
        stat: "Total",
        playerStat: playerTotal,
        opponentStat: opponentTotal,
        advantage: playerTotal > opponentTotal ? "player" : 
                  playerTotal < opponentTotal ? "opponent" : "equal"
      });

      const battleRecord = {
        id: Math.random().toString(36).substring(2, 6), // short random ID
        type: "StatBattle", // Added type field
        playerPokemon: {
          id: playerPokemon.id,
          name: playerPokemon.name,
          sprite: playerPokemon.sprites.other["official-artwork"].front_default,
          types: playerPokemon.types.map(t => t.type.name),
          stats: playerPokemon.stats.reduce((acc, stat) => {
            acc[stat.stat.name] = stat.base_stat;
            return acc;
          }, {})
        },
        opponentPokemon: {
          id: opponentPokemon.id,
          name: opponentPokemon.name,
          sprite: opponentPokemon.sprites.other["official-artwork"].front_default,
          types: opponentPokemon.types.map(t => t.type.name),
          stats: opponentPokemon.stats.reduce((acc, stat) => {
            acc[stat.stat.name] = stat.base_stat;
            return acc;
          }, {})
        },
        result: result,
        date: new Date().toISOString(),
        statsComparison: statsComparison,
        turns: battleStats?.turns || 0,
        duration: battleStats?.duration || 0
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
                attacks: teamMember.moves?.slice(0, 4).map(move => ({
                  name: move,
                  type: 'unknown'
                })),
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

    setIsLoadingOpponents(true);
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
    } finally {
      setIsLoadingOpponents(false);
    }
  }, [basicOpponents.length]);


  const enhancePokemonDetails = useCallback(async (pokemon) => {
    if (enhancedOpponents.has(pokemon.id)) {
      return enhancedOpponents.get(pokemon.id);
    }
  
    try {
      const response = await fetch(pokemon.url);
      const pokemonData = await response.json();
      
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
        loaded: false
      };
    }
  }, [enhancedOpponents]);

  
  useEffect(() => {
    const enhanceDisplayedOpponents = async () => {
      const paginated = getPaginatedOpponents();
      const toEnhance = paginated.filter(p => !p.loaded && !enhancedOpponents.has(p.id));
      
      if (toEnhance.length > 0) {
        setIsLoadingOpponents(true);
        try {
          const enhanced = await Promise.all(
            toEnhance.map(pokemon => enhancePokemonDetails(pokemon))
          );
          
          setEnhancedOpponents(prev => {
            const newMap = new Map(prev);
            enhanced.forEach(p => newMap.set(p.id, p));
            return newMap;
          });
        } finally {
          setIsLoadingOpponents(false);
        }
      }
    };

    enhanceDisplayedOpponents();
  }, [currentPage, filteredOpponents]);


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
  }, [searchTerm, selectedType, basicOpponents, enhancedOpponents]);


  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType]);


  const getPaginatedOpponents = useCallback(() => {
    const startIndex = (currentPage - 1) * POKEMONS_PER_PAGE;
    const endIndex = startIndex + POKEMONS_PER_PAGE;
    
    return filteredOpponents
      .slice(startIndex, endIndex)
      .map(pokemon => enhancedOpponents.get(pokemon.id) || pokemon);
  }, [currentPage, filteredOpponents, enhancedOpponents]);

  const startBattle = async (pokemon) => {
    setSelectedPokemon(pokemon);
    setShowOpponentSelector(true);
    await fetchBasicOpponents();
  };

  const handleOpponentSelection = (pokemon) => {
  
    enhancePokemonDetails(pokemon).then(enhanced => {
      setEnemyPokemon(enhanced);
      setShowOpponentSelector(false);
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };
  

    const calculateBattleResult = () => {
      if (!selectedPokemon || !enemyPokemon) return null;
    
      let playerWins = 0;
      let enemyWins = 0;
      let draws = 0;
      
      const comparisons = selectedPokemon.stats.map((playerStat, index) => {
        const enemyStat = enemyPokemon.stats[index].base_stat;
        if (playerStat.base_stat > enemyStat) playerWins++;
        else if (playerStat.base_stat < enemyStat) enemyWins++;
        else draws++;
        
        return {
          name: playerStat.stat.name.replace('-', ' '),
          player: playerStat.base_stat,
          enemy: enemyStat,
          winner: playerStat.base_stat > enemyStat ? 'player' : 
                  playerStat.base_stat < enemyStat ? 'enemy' : 'draw'
        };
      });

  
      let result;
      if (playerWins > enemyWins) {
        result = 'player';
      } else if (playerWins < enemyWins) {
        result = 'opponent';
      } else {
        result = 'draw';
      }

 
      saveBattleHistory(selectedPokemon, enemyPokemon, result);
  
      setBattleResult({
        comparisons,
        totalWins: {
          player: playerWins,
          enemy: enemyWins,
          draws: draws,
          total: comparisons.length
        }
      });
    };

  useEffect(() => {
    if (selectedPokemon && enemyPokemon) {
      calculateBattleResult();
    }
  }, [selectedPokemon, enemyPokemon]);

  const getStatPercentage = (value) => {
    return Math.min(100, Math.round((value / 255) * 100));
  };

  const PokemonBattleCard = ({ pokemon, isPlayer }) => {
    const formatStatName = (name) => {
      return name.replace('-', ' ')
                .replace('special', 'Sp.')
                .replace('attack', 'Atk')
                .replace('defense', 'Def')
                .replace('hp', 'HP')
                .replace(/\b\w/g, l => l.toUpperCase());
    };
  
    return (
      <div className={`battle-card ${isPlayer ? 'player' : 'enemy'}`}>
        <div className="battle-card-header">
          <span className="pokemon-classification" data-classification={pokemon.classification.type}>
            {pokemon.classification.label}
          </span>
          <div className="hp-display">
            <span className="hp-value">
              {pokemon.stats && pokemon.stats[0] ? pokemon.stats[0].base_stat : '—'}
            </span>
            <span className="hp-icon">HP</span>
          </div>
        </div>
  
        <div 
          className="pokemon-image-container"
          style={{
            backgroundColor: `${getTypeColor(pokemon.types[0].type.name)}30`,
            backgroundImage: `radial-gradient(circle at center, ${getTypeColor(pokemon.types[0].type.name)}30 0%, transparent 70%)`
          }}
        >
          <img
            src={pokemon.sprites.other["official-artwork"].front_default}
            alt={pokemon.name}
            className="pokemon-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/0.png';
            }}
          />
        </div>
  
        <div className="card-body">
          <h2 className="pokemon-name">
            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
          </h2>
          
          <div className="type-container">
            <div className="type-tags">
              {pokemon.types.map((type, index) => (
                <span
                  key={index}
                  className="type-tag"
                  style={{ backgroundColor: getTypeColor(type.type.name) }}
                >
                  {type.type.name}
                </span>
              ))}
            </div>
          </div>
  
          <div className="stats-container">
            {pokemon.stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-info">
                  <span className="stat-name">{formatStatName(stat.stat.name)}</span>
                  <span className="stat-value">{stat.base_stat}</span>
                </div>
                <div className="stat-bar-wrapper">
                  <div 
                    className="stat-bar" 
                    style={{
                      width: `${getStatPercentage(stat.base_stat)}%`,
                      backgroundColor: getTypeColor(pokemon.types[0].type.name),
                      opacity: 0.8
                    }}
                  >
                    <div className="stat-bar-highlight"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const OpponentCard = ({ pokemon, onSelect }) => {
    const mainType = pokemon.types?.[0]?.type?.name || 'normal';
    const typeColor = getTypeColor(mainType);

    return (
      <div className="opponent-card">
        <div className="battle-card-header">
                    <span className="battle-pokemon-classification" data-classification={pokemon.classification.type}>
                      {pokemon.classification.label}
                    </span>
                    <span className="battle-pokemon-hp">
                      {pokemon.stats?.[0]?.base_stat || '??'} HP
                    </span>
                  </div>
        
        
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
        
        <div className="battle-pokemon-stats">
  <div className="stat-item">
    <span className="stat-name">HP</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'hp')?.base_stat || '?'}
    </span>
  </div>
  <div className="stat-item">
    <span className="stat-name">Attack</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'attack')?.base_stat || '?'}
    </span>
  </div>
  <div className="stat-item">
    <span className="stat-name">Defense</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'defense')?.base_stat || '?'}
    </span>
  </div>
  <div className="stat-item">
    <span className="stat-name">Sp. Attack</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'special-attack')?.base_stat || '?'}
    </span>
  </div>
  <div className="stat-item">
    <span className="stat-name">Sp. Defense</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'special-defense')?.base_stat || '?'}
    </span>
  </div>
  <div className="stat-item">
    <span className="stat-name">Speed</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'speed')?.base_stat || '?'}
    </span>
  </div>
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

  if (selectedPokemon && enemyPokemon) {
    return (
      <>
        <Navbar/>
        <div className="battle-pokedex-container">
          <div className="battle-pokedex-header">
            <button 
              className="back-button"
              onClick={() => {
                setEnemyPokemon(null);
                setBattleResult(null);
              }}
            >
              <FaArrowLeft /> Back to Team
            </button>
            <h1>Pokémon Stats-Battle</h1>
          </div>

          <div className="battle-comparison-container">
            <PokemonBattleCard pokemon={selectedPokemon} isPlayer={true} />
            
            <div className="vs-container">
              <div className="vs-badge">
                <div className="vs-label">VS</div>
              </div>
            </div>

            <PokemonBattleCard pokemon={enemyPokemon} isPlayer={false} />
          </div>

          {battleResult && (
            <div className="battle-result">
              <h3 className="result-text">
                {battleResult.totalWins.player > battleResult.totalWins.enemy 
                  ? `${selectedPokemon.name.toUpperCase()} WINS!`
                  : battleResult.totalWins.player < battleResult.totalWins.enemy
                    ? `${enemyPokemon.name.toUpperCase()} WINS!`
                    : `IT'S A DRAW!`}
              </h3>
              <div className="score-display">
                <span className="player-score" style={{ color: getTypeColor(selectedPokemon?.types[0].type.name) }}>
                  {battleResult.totalWins.player} 
                </span>
                -
                <span className="draws-score">
                  {battleResult.totalWins.draws}
                </span>
                -
                <span className="enemy-score" style={{ color: getTypeColor(enemyPokemon?.types[0].type.name) }}>
                  {battleResult.totalWins.enemy}
                </span>
              </div>
            </div>
          )}

          <div className="stat-comparison-container">
            <h3 className="comparison-title">Stat Comparison</h3>
            <div className="comparison-grid">
              {battleResult?.comparisons.map((stat, index) => (
                <div key={index} className="comparison-item">
                  <div className="stat-name">{stat.name.replace('special-', 'Sp. ')}</div>
                  <div className="stat-values">
                    <span className="player-value" style={{ color: getTypeColor(selectedPokemon?.types[0].type.name) }}>
                      {stat.player}
                    </span>
                    <div className="stat-bar-container">
                      <div 
                        className="stat-bar" 
                        style={{ 
                          width: '100%',
                          background: `linear-gradient(to right, 
                            ${getTypeColor(selectedPokemon?.types[0].type.name)} ${(stat.player / (stat.player + stat.enemy)) * 100}%, 
                            ${getTypeColor(enemyPokemon?.types[0].type.name)} ${(stat.player / (stat.player + stat.enemy)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="enemy-value" style={{ color: getTypeColor(enemyPokemon?.types[0].type.name) }}>
                      {stat.enemy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="button-group">
            <button 
              className="new-opponent-btn"
              onClick={async () => {
                setEnemyPokemon(null);
                setBattleResult(null);
                setShowOpponentSelector(true);
                setCurrentPage(1);
              }}
            >
              Choose Different Opponent
            </button>

            <button 
              className="new-team-btn"
              onClick={() => {
                setSelectedPokemon(null);
                setBattleResult(null);
              }}
            >
              Choose New Team Pokémon
            </button>
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

          {isLoadingOpponents ? (
            <div className="pokedex-loading">
              <div className="pokeball1-loading">
                <div className="pokeball1-top"></div>
                <div className="pokeball1-bottom"></div>
                <div className="pokeball1-middle"></div>
                <div className="pokeball1-center"></div>
                <div className="pokeball1-center-inner"></div>
              </div>
              <p className="loading-text">Loading Opponents</p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar/>
      <div className="battle-pokedex-container">
        <div className="battle-pokedex-header">
          <h1>Pokémon Stats-Battle</h1>
          <p className="battle-team-subtitle">Select a Pokémon to start battle</p>
        </div>

        <div className="battle-container">
          {team.length > 0 ? (
            <div className="battle-grid">
              {team.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="pokemon-card"
                  style={{
                    "--type-color": pokemon.types ? getTypeColor(pokemon.types[0].type.name) : '#777',
                  }}
                
          
                >
                  <div className="battle-card-header">
                    <span className="battle-pokemon-classification" data-classification={pokemon.classification.type}>
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
                    <div className="battle-pokemon-stats">
  <div className="stat-item">
    <span className="stat-name">HP</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'hp')?.base_stat || '?'}
    </span>
  </div>
  <div className="stat-item">
    <span className="stat-name">Attack</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'attack')?.base_stat || '?'}
    </span>
  </div>
  <div className="stat-item">
    <span className="stat-name">Defense</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'defense')?.base_stat || '?'}
    </span>
  </div>
  <div className="stat-item">
    <span className="stat-name">Sp. Attack</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'special-attack')?.base_stat || '?'}
    </span>
  </div>
  <div className="stat-item">
    <span className="stat-name">Sp. Defense</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'special-defense')?.base_stat || '?'}
    </span>
  </div>
  <div className="stat-item">
    <span className="stat-name">Speed</span>
    <span className="stat-value">
      {pokemon.stats?.find(s => s.stat.name === 'speed')?.base_stat || '?'}
    </span>
  </div>
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

export default PokemonStatBattle;