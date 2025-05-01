import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaLink, FaQrcode, FaCopy, FaSearch, FaTimes } from 'react-icons/fa';
import { GiBroadsword } from "react-icons/gi";
import { QRCodeSVG } from 'qrcode.react';
import Pokeball from "../assets/images/pokeballs.svg";
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';


import "../assets/css/page/pokemonP2PBattle.css";
import Navbar from './navbar';

const SOCKET_SERVER_URL = 'http://192.168.1.133:3001';

const PokemonP2PBattle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const MAX_POKEMON = 1000;
  const POKEMONS_PER_PAGE = 30;

  // Battle state
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [enemyPokemon, setEnemyPokemon] = useState(null);
  const [battleResult, setBattleResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isHost, setIsHost] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [remotePokemonSelected, setRemotePokemonSelected] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  // Pokemon list state
  const [types, setTypes] = useState([]);
  const [basicOpponents, setBasicOpponents] = useState([]);
  const [enhancedOpponents, setEnhancedOpponents] = useState(new Map());
  const [filteredOpponents, setFilteredOpponents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoadingOpponents, setIsLoadingOpponents] = useState(false);

  // Refs
  const socketRef = useRef(null);
  const playerIdRef = useRef(uuidv4());
  const [battleId, setBattleId] = useState('');

  // Pokemon classifications
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

  // Socket.io connection setup
  useEffect(() => {
    const battleIdParam = searchParams.get('battleId');
    
    socketRef.current = io(SOCKET_SERVER_URL, {
      autoConnect: false,
      query: { playerId: playerIdRef.current },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      setConnectionStatus('connected');

      const initializeData = async () => {
        await fetchBasicOpponents();
        await fetchTypes();
        setLoading(false);
      };
      
      initializeData();
    
      if (!battleIdParam) {
        setWaitingForOpponent(true);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      setConnectionStatus('error');
    });

    socket.on('player_connected', () => {
      setConnectionStatus('connected');
      if (isHost) {
        setBattleLog(prev => [...prev, 'Opponent connected!']);
      }
      setWaitingForOpponent(false);
    });

    socket.on('pokemon_selected', (pokemon) => {
      setEnemyPokemon(pokemon);
      setRemotePokemonSelected(true);
      if (selectedPokemon) {
        calculateBattleResult(selectedPokemon, pokemon);
      }
    });

    socket.on('battle_state', (state) => {
      syncBattleState(state);
    });

    socket.on('error', (error) => {
      console.error('Server error:', error);
      setConnectionStatus('error');
    });

    socket.on('room_created', (roomId) => {
      setBattleId(roomId);
      setIsHost(true);
      setConnectionStatus('waiting');
      const link = `${window.location.origin}${window.location.pathname}?battleId=${roomId}`;
      setInvitationLink(link);
      setLoading(false);
    });

    socket.on('room_joined', (roomId) => {
      setBattleId(roomId);
      setIsHost(false);
      setConnectionStatus('connected');
      setWaitingForOpponent(false);
      setLoading(false);
    });

    socket.on('room_full', () => {
      alert('This battle room is already full!');
      navigate('/pokemon-battle');
    });

    socket.connect();

    if (battleIdParam) {
      socket.emit('join_room', battleIdParam);
    } else {
      socket.emit('create_room');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchTypes = useCallback(async () => {
    try {
      const response = await fetch("https://pokeapi.co/api/v2/type");
      const data = await response.json();
      setTypes(data.results.filter(type => type.name !== "unknown" && type.name !== "shadow"));
    } catch (error) {
      console.error("Failed to fetch Pokémon types:", error);
    }
  }, []);

  const fetchBasicOpponents = useCallback(async () => {
    if (basicOpponents.length > 0) {
      setLoading(false);
      return;
    }
  
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
      
      // Preload first page of Pokémon details
      const toPreload = basicList.slice(0, POKEMONS_PER_PAGE);
      const enhanced = await Promise.all(
        toPreload.map(pokemon => enhancePokemonDetails(pokemon))
      );
      
      setEnhancedOpponents(prev => {
        const newMap = new Map(prev);
        enhanced.forEach(p => newMap.set(p.id, p));
        return newMap;
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch opponent list:", error);
      setLoading(false);
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
      
      // Ensure stats are properly formatted
      const stats = [
        { stat: { name: 'hp' }, base_stat: pokemonData.stats[0].base_stat },
        { stat: { name: 'attack' }, base_stat: pokemonData.stats[1].base_stat },
        { stat: { name: 'defense' }, base_stat: pokemonData.stats[2].base_stat },
        { stat: { name: 'special-attack' }, base_stat: pokemonData.stats[3].base_stat },
        { stat: { name: 'special-defense' }, base_stat: pokemonData.stats[4].base_stat },
        { stat: { name: 'speed' }, base_stat: pokemonData.stats[5].base_stat }
      ];

      const enhanced = {
        ...pokemon,
        ...pokemonData,
        classification: pokemon.classification,
        stats: stats,
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
    if (basicOpponents.length === 0) return;

    const filtered = basicOpponents.filter(pokemon => {
      const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesType = selectedType === "all";
      if (enhancedOpponents.has(pokemon.id)) {
        const enhanced = enhancedOpponents.get(pokemon.id);
        matchesType = selectedType === "all" || 
          (enhanced.types && enhanced.types.some(type => type.type.name === selectedType));
      }
      
      return matchesSearch && matchesType;
    });

    setFilteredOpponents(filtered);
    setTotalPages(Math.ceil(filtered.length / POKEMONS_PER_PAGE));
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
    
    // Enhance Pokémon details for the new page
    const paginated = getPaginatedOpponents();
    const toEnhance = paginated.filter(p => !p.loaded && !enhancedOpponents.has(p.id));
    
    if (toEnhance.length > 0) {
      setIsLoadingOpponents(true);
      Promise.all(
        toEnhance.map(pokemon => enhancePokemonDetails(pokemon))
      ).then(enhanced => {
        setEnhancedOpponents(prev => {
          const newMap = new Map(prev);
          enhanced.forEach(p => newMap.set(p.id, p));
          return newMap;
        });
        setIsLoadingOpponents(false);
      });
    }
  };

  const selectPokemon = async (pokemon) => {
    const detailedPokemon = await enhancePokemonDetails(pokemon);
    if (!detailedPokemon) return;
  
    setSelectedPokemon(detailedPokemon);
    
    // Send selection to opponent
    socketRef.current.emit('pokemon_selected', {
      room: battleId,
      pokemon: detailedPokemon
    });
  
    // If both Pokémon are selected, calculate result
    if (remotePokemonSelected && enemyPokemon) {
      calculateBattleResult(detailedPokemon, enemyPokemon);
    }
  };

  const calculateBattleResult = (playerPokemon, opponentPokemon) => {
    if (!playerPokemon || !opponentPokemon) return null;
    
    let playerWins = 0;
    let enemyWins = 0;
    let draws = 0;
    
    const comparisons = playerPokemon.stats.map((playerStat, index) => {
      const enemyStat = opponentPokemon.stats[index].base_stat;
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

    setBattleResult({
      comparisons,
      totalWins: {
        player: playerWins,
        enemy: enemyWins,
        draws: draws,
        total: comparisons.length
      }
    });

    // Send battle state to opponent
    sendBattleState({
      playerPokemon,
      opponentPokemon,
      result: {
        comparisons,
        totalWins: {
          player: playerWins,
          enemy: enemyWins,
          draws: draws,
          total: comparisons.length
        }
      }
    });
  };

  const sendBattleState = (state) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('battle_state', {
      room: battleId,
      state: state
    });
  };

  const syncBattleState = (state) => {
    if (state.playerPokemon && !selectedPokemon) {
      setSelectedPokemon(state.playerPokemon);
    }
    if (state.opponentPokemon && !enemyPokemon) {
      setEnemyPokemon(state.opponentPokemon);
    }
    
    if (state.result) {
      setBattleResult(state.result);
    }
  };

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    alert('Link copied to clipboard!');
  };

  

  const getStatPercentage = (value) => {
    return Math.min(100, Math.round((value / 255) * 100));
  };

  const PokemonBattleCard = ({ pokemon, isPlayer }) => {
    if (!pokemon) return null;
    
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
          <span className="pokemon-classification" data-classification={pokemon.classification?.type}>
            {pokemon.classification?.label}
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
            backgroundColor: `${getTypeColor(pokemon.types?.[0]?.type?.name)}30`,
            backgroundImage: `radial-gradient(circle at center, ${getTypeColor(pokemon.types?.[0]?.type?.name)}30 0%, transparent 70%)`
          }}
        >
          <img
            src={pokemon.sprites?.other?.["official-artwork"]?.front_default}
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
            {pokemon.name?.charAt(0).toUpperCase() + pokemon.name?.slice(1)}
          </h2>
          
          <div className="type-container">
            <div className="type-tags">
              {pokemon.types?.map((type, index) => (
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
            {pokemon.stats?.map((stat, index) => (
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
                      backgroundColor: getTypeColor(pokemon.types?.[0]?.type?.name),
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

  const PokemonCard = ({ pokemon, onSelect }) => {
    const mainType = pokemon.types?.[0]?.type?.name || 'normal';
    const typeColor = getTypeColor(mainType);
    const enhancedPokemon = enhancedOpponents.get(pokemon.id) || pokemon;

    return (
      <div className="pokemon-card" style={{ "--type-color": typeColor }}>
        <div className="battle-card-header">
          <span className="battle-pokemon-classification" data-classification={pokemon.classification?.type}>
            {pokemon.classification?.label}
          </span>
          <span className="battle-pokemon-hp">
            {enhancedPokemon.stats?.find(s => s.stat.name === 'hp')?.base_stat || '??'} HP
          </span>
        </div>
        
        <div className="battle-pokemon-image-container" style={{
          backgroundColor: `${typeColor}30`,
          backgroundImage: `radial-gradient(circle at center, ${typeColor}30 0%, transparent 70%)`,
        }}>
          {enhancedPokemon.loaded ? (
            <img
              src={enhancedPokemon.sprites?.other?.["official-artwork"]?.front_default}
              alt={enhancedPokemon.name}
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
          {enhancedPokemon.name?.charAt(0).toUpperCase() + enhancedPokemon.name?.slice(1)}
        </div>
        
        <button 
          className="add-button-in-team"
          style={{ backgroundColor: typeColor }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(enhancedPokemon);
          }}
        >
          Choose for Battle
        </button>
        
        <div className="battle-pokemon-stats">
          {enhancedPokemon.stats?.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-name">
                {stat.stat.name.replace('-', ' ')
                  .replace('special', 'Sp.')
                  .replace('attack', 'Atk')
                  .replace('defense', 'Def')
                  .replace('hp', 'HP')
                  .replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className="stat-value">
                {stat.base_stat || '?'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LoadingScreen = () => (
    <div className="pokedex-loading">
      <div className="pokeball1-loading">
        <div className="pokeball1-top"></div>
        <div className="pokeball1-bottom"></div>
        <div className="pokeball1-middle"></div>
        <div className="pokeball1-center"></div>
        <div className="pokeball1-center-inner"></div>
      </div>
      <p className="loading-text">Waiting for Opponent to choose</p>
    </div>
  );

  const ErrorScreen = () => (
    <div className="p2p-error">
      <h2>Connection Error</h2>
      <p>Failed to establish connection with opponent</p>
      <button onClick={resetBattle} className="p2p-button">
        Go Back
      </button>
    </div>
  );

  const WaitingForOpponentScreen = () => (
    <>
      <Navbar />
      <div className="p2p-waiting">
        <div className="p2p-waiting-header">
          
          <h2>Waiting for Opponent</h2>
        </div>
        
        <div className="p2p-waiting-content">
          <div className="p2p-spinner"></div>
          <p>Share this invitation with your opponent</p>
          
          <button 
            onClick={() => setShowInvitationModal(true)}
            className="p2p-button"
          >
            <FaQrcode /> Show Invitation
          </button>
          
          <div className={`p2p-status ${connectionStatus}`}>
            Status: {connectionStatus === 'waiting' ? 'Waiting for opponent...' : 'Connected!'}
          </div>
        </div>
        
        {showInvitationModal && (
          <div className="p2p-modal">
            <div className="p2p-modal-content">
              <h3>Invite Your Opponent</h3>
              <div className="p2p-qr-code">
                <QRCodeSVG value={invitationLink} size={200} />
              </div>
              <div className="p2p-link-container">
                <input 
                  type="text" 
                  value={invitationLink} 
                  readOnly 
                  className="p2p-link-input"
                />
                <button onClick={copyInvitationLink} className="p2p-copy-button">
                  <FaCopy /> Copy
                </button>
              </div>
              <button 
                onClick={() => setShowInvitationModal(false)}
                className="p2p-button"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const PokemonSelectionScreen = () => (
    <>
      <Navbar />
      <div className="battle-pokedex-container">
        <div className="battle-pokedex-header">
          <h1>Pokémon Stats-Battle</h1>
          <p className="battle-team-subtitle">Select your Pokémon</p>
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
          <LoadingScreen />
        ) : (
          <>
            <div className="battle-grid">
              {getPaginatedOpponents().map((pokemon) => (
                <PokemonCard 
                  key={pokemon.id}
                  pokemon={pokemon}
                  onSelect={selectPokemon}
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

  const BattleResultsScreen = () => (
    <>
      <Navbar />
      <div className="battle-pokedex-container">
        <div className="battle-pokedex-header">
          <button 
            className="back-button"
            onClick={() => {
              setSelectedPokemon(null);
              setEnemyPokemon(null);
              setBattleResult(null);
            }}
          >
            <FaArrowLeft /> New Battle
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
          <>
            <div className="battle-result">
              <h3 className="result-text">
                {battleResult.totalWins.player > battleResult.totalWins.enemy 
                  ? `${selectedPokemon.name?.toUpperCase()} WINS!`
                  : battleResult.totalWins.player < battleResult.totalWins.enemy
                    ? `${enemyPokemon.name?.toUpperCase()} WINS!`
                    : `IT'S A DRAW!`}
              </h3>
              <div className="score-display">
                <span className="player-score" style={{ color: getTypeColor(selectedPokemon?.types?.[0]?.type?.name) }}>
                  {battleResult.totalWins.player} 
                </span>
                -
                <span className="draws-score">
                  {battleResult.totalWins.draws}
                </span>
                -
                <span className="enemy-score" style={{ color: getTypeColor(enemyPokemon?.types?.[0]?.type?.name) }}>
                  {battleResult.totalWins.enemy}
                </span>
              </div>
            </div>

            <div className="stat-comparison-container">
              <h3 className="comparison-title">Stat Comparison</h3>
              <div className="comparison-grid">
                {battleResult?.comparisons.map((stat, index) => (
                  <div key={index} className="comparison-item">
                    <div className="stat-name">{stat.name.replace('special-', 'Sp. ')}</div>
                    <div className="stat-values">
                      <span className="player-value" style={{ color: getTypeColor(selectedPokemon?.types?.[0]?.type?.name) }}>
                        {stat.player}
                      </span>
                      <div className="stat-bar-container">
                        <div 
                          className="stat-bar" 
                          style={{ 
                            width: '100%',
                            background: `linear-gradient(to right, 
                              ${getTypeColor(selectedPokemon?.types?.[0]?.type?.name)} ${(stat.player / (stat.player + stat.enemy)) * 100}%, 
                              ${getTypeColor(enemyPokemon?.types?.[0]?.type?.name)} ${(stat.player / (stat.player + stat.enemy)) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="enemy-value" style={{ color: getTypeColor(enemyPokemon?.types?.[0]?.type?.name) }}>
                        {stat.enemy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  // Main render logic
  if (loading) {
    return <LoadingScreen />;
  }

  if (connectionStatus === 'error') {
    return <ErrorScreen />;
  }

  if (isHost && waitingForOpponent) {
    return <WaitingForOpponentScreen />;
  }

  if (!selectedPokemon) {
    return <PokemonSelectionScreen />;
  }

  if (selectedPokemon && enemyPokemon) {
    return <BattleResultsScreen />;
  }

  // Fallback - should never reach here
  return <LoadingScreen />;
};

export default PokemonP2PBattle;