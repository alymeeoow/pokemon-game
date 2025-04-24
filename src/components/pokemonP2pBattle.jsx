import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaLink, FaQrcode, FaCopy } from 'react-icons/fa';
import { GiSwordWound } from 'react-icons/gi';
import { QRCodeSVG } from 'qrcode.react';
import Peer from 'simple-peer';
import { v4 as uuidv4 } from 'uuid';
import '../assets/css/page/pokemonP2pBattle.css';
import Navbar from './navbar';

const MAX_POKEMON = 898; // Up to Gen 8

const PokemonP2PBattle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Battle state
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [enemyPokemon, setEnemyPokemon] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [battleStatus, setBattleStatus] = useState('connecting');
  const [currentTurn, setCurrentTurn] = useState(null);
  const [playerHP, setPlayerHP] = useState(0);
  const [enemyHP, setEnemyHP] = useState(0);
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Multiplayer state
  const [battleId, setBattleId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isHost, setIsHost] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [remotePokemonSelected, setRemotePokemonSelected] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  // Refs
  const peerRef = useRef(null);
  const battleLogRef = useRef(null);

  // Type colors
  const typeColors = {
    normal: "#A8A878", fire: "#F08030", water: "#6890F0", electric: "#F8D030",
    grass: "#78C850", ice: "#98D8D8", fighting: "#C03028", poison: "#A040A0",
    ground: "#E0C068", flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
    rock: "#B8A038", ghost: "#705898", dragon: "#7038F8", dark: "#705848",
    steel: "#B8B8D0", fairy: "#EE99AC"
  };

  // Type effectiveness chart
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

  // Fetch basic Pokémon list
  useEffect(() => {
    const fetchPokemonList = async () => {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON}`);
        const data = await response.json();
        setPokemonList(data.results.map((p, i) => ({
          id: i + 1,
          name: p.name,
          url: p.url
        })));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch Pokémon list:", error);
        setLoading(false);
      }
    };

    fetchPokemonList();
  }, []);

  // Fetch detailed Pokémon data
  const fetchPokemonDetails = async (pokemon) => {
    try {
      const response = await fetch(pokemon.url || `https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
      const data = await response.json();

      // Get 4 random moves
      const moves = data.moves
        .sort(() => 0.5 - Math.random())
        .slice(0, 4)
        .map(move => ({
          name: move.move.name,
          type: move.move.name.split('-')[0], // Simplified type
          power: Math.floor(Math.random() * 60) + 40 // Random power 40-100
        }));

      return {
        ...data,
        id: pokemon.id || data.id,
        name: pokemon.name || data.name,
        stats: data.stats,
        types: data.types,
        sprites: data.sprites,
        moves
      };
    } catch (error) {
      console.error("Failed to fetch Pokémon details:", error);
      return null;
    }
  };

  // Initialize connection based on URL params
  useEffect(() => {
    const offer = searchParams.get('offer');
    const hostId = searchParams.get('host');

    if (offer && hostId) {
      // Joining an existing battle
      try {
        const offerData = JSON.parse(decodeURIComponent(offer));
        joinBattle(hostId, offerData);
      } catch (e) {
        console.error('Error parsing offer:', e);
        setConnectionStatus('error');
      }
    } else {
      // Creating a new battle
      createBattle();
    }

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  // Scroll battle log to bottom
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [battleLog]);

  // Create a new battle
  const createBattle = () => {
    const newBattleId = uuidv4();
    setBattleId(newBattleId);
    setIsHost(true);
    setConnectionStatus('waiting');
    setWaitingForOpponent(true);

    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
        ]
      }
    });

    peer.on('signal', (data) => {
      if (data.type === 'offer') {
        const link = `${window.location.origin}${window.location.pathname}?host=${newBattleId}&offer=${encodeURIComponent(JSON.stringify(data))}`;
        setInvitationLink(link);
      }
    });

    peer.on('connect', () => {
      setConnectionStatus('connected');
      setBattleStatus('selecting');
    });

    peer.on('data', handleData);
    peer.on('error', handlePeerError);
    peer.on('close', handlePeerClose);

    peerRef.current = peer;
  };

  // Join an existing battle
  const joinBattle = (hostId, offer) => {
    setBattleId(hostId);
    setIsHost(false);
    setConnectionStatus('connecting');

    const peer = new Peer({
      initiator: false,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
        ]
      }
    });

    peer.on('signal', (data) => {
      if (data.type === 'answer') {
        sendMessage({ type: 'answer', payload: data });
      }
    });

    peer.on('connect', () => {
      setConnectionStatus('connected');
      setBattleStatus('selecting');
    });

    peer.on('data', handleData);
    peer.on('error', handlePeerError);
    peer.on('close', handlePeerClose);

    peer.signal(offer);
    peerRef.current = peer;
  };

  // Handle incoming data
  const handleData = (data) => {
    try {
      const message = JSON.parse(data);
      switch (message.type) {
        case 'pokemon_selected':
          setEnemyPokemon(message.payload);
          setRemotePokemonSelected(true);
          if (selectedPokemon) {
            startBattle(selectedPokemon, message.payload);
          }
          break;
        case 'move':
          opponentMove(message.payload);
          break;
        case 'battle_state':
          syncBattleState(message.payload);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (e) {
      console.error('Error handling message:', e);
    }
  };

  // Handle peer errors
  const handlePeerError = (err) => {
    console.error('Peer error:', err);
    setConnectionStatus('error');
    setBattleLog(prev => [...prev, 'Connection error!']);
  };

  // Handle peer disconnection
  const handlePeerClose = () => {
    console.log('Peer connection closed');
    setConnectionStatus('disconnected');
    setBattleLog(prev => [...prev, 'Opponent disconnected!']);
  };

  // Send message to peer
  const sendMessage = (message) => {
    if (peerRef.current && connectionStatus === 'connected') {
      peerRef.current.send(JSON.stringify(message));
    }
  };

  // Player selects Pokémon
  const selectPokemon = async (pokemon) => {
    const detailedPokemon = await fetchPokemonDetails(pokemon);
    if (!detailedPokemon) return;

    setSelectedPokemon(detailedPokemon);
    sendMessage({ 
      type: 'pokemon_selected', 
      payload: detailedPokemon 
    });

    if (remotePokemonSelected) {
      startBattle(detailedPokemon, enemyPokemon);
    }
  };

  // Start the battle
  const startBattle = (playerPokemon, opponentPokemon) => {
    setBattleStatus('battling');
    
    const playerMaxHP = playerPokemon.stats.find(s => s.stat.name === 'hp').base_stat;
    const enemyMaxHP = opponentPokemon.stats.find(s => s.stat.name === 'hp').base_stat;
    
    setPlayerHP(playerMaxHP);
    setEnemyHP(enemyMaxHP);
    
    const initialLog = [
      `Battle started between ${playerPokemon.name} and ${opponentPokemon.name}!`
    ];
    setBattleLog(initialLog);
    
    const playerSpeed = playerPokemon.stats.find(s => s.stat.name === 'speed').base_stat;
    const enemySpeed = opponentPokemon.stats.find(s => s.stat.name === 'speed').base_stat;
    
    const firstTurn = playerSpeed >= enemySpeed ? 
      (isHost ? 'player' : 'opponent') : 
      (isHost ? 'opponent' : 'player');
    
    setCurrentTurn(firstTurn);
    setBattleLog(prev => [...prev, 
      firstTurn === 'player' ? 
        `${playerPokemon.name} is faster and will attack first!` : 
        `${opponentPokemon.name} is faster and will attack first!`
    ]);

    sendMessage({
      type: 'battle_state',
      payload: {
        log: initialLog,
        playerHP: playerMaxHP,
        enemyHP: enemyMaxHP,
        currentTurn: firstTurn,
        status: 'battling'
      }
    });
  };

  // Player makes a move
  const playerMove = (move) => {
    if (battleStatus !== 'battling' || currentTurn !== 'player') return;

    const damage = calculateDamage(selectedPokemon, enemyPokemon, move);
    const newEnemyHP = Math.max(0, enemyHP - damage);

    let effectiveness = 1;
    enemyPokemon.types.forEach(t => {
      if (typeEffectiveness[move.type]?.[t.type.name]) {
        effectiveness *= typeEffectiveness[move.type][t.type.name];
      }
    });

    let effectivenessMsg = '';
    if (effectiveness > 1) effectivenessMsg = " It's super effective!";
    else if (effectiveness < 1 && effectiveness > 0) effectivenessMsg = " It's not very effective...";
    else if (effectiveness === 0) effectivenessMsg = " It has no effect!";

    const newLog = [
      ...battleLog,
      `${selectedPokemon.name} used ${move.name}!${effectivenessMsg}`,
      `It dealt ${damage} damage to ${enemyPokemon.name}!`
    ];

    setBattleLog(newLog);
    setEnemyHP(newEnemyHP);

    if (newEnemyHP <= 0) {
      const victoryLog = [...newLog, `${enemyPokemon.name} fainted!`, `${selectedPokemon.name} wins the battle!`];
      setBattleLog(victoryLog);
      setBattleStatus('finished');
      sendBattleState(victoryLog, playerHP, newEnemyHP, null, 'finished');
      return;
    }

    setCurrentTurn('opponent');
    sendMessage({
      type: 'move',
      payload: move
    });
    sendBattleState(newLog, playerHP, newEnemyHP, 'opponent');
  };

  // Opponent makes a move
  const opponentMove = (move) => {
    if (battleStatus !== 'battling' || currentTurn !== 'opponent') return;

    const damage = calculateDamage(enemyPokemon, selectedPokemon, move);
    const newPlayerHP = Math.max(0, playerHP - damage);

    let effectiveness = 1;
    selectedPokemon.types.forEach(t => {
      if (typeEffectiveness[move.type]?.[t.type.name]) {
        effectiveness *= typeEffectiveness[move.type][t.type.name];
      }
    });

    let effectivenessMsg = '';
    if (effectiveness > 1) effectivenessMsg = " It's super effective!";
    else if (effectiveness < 1 && effectiveness > 0) effectivenessMsg = " It's not very effective...";
    else if (effectiveness === 0) effectivenessMsg = " It has no effect!";

    const newLog = [
      ...battleLog,
      `${enemyPokemon.name} used ${move.name}!${effectivenessMsg}`,
      `It dealt ${damage} damage to ${selectedPokemon.name}!`
    ];

    setBattleLog(newLog);
    setPlayerHP(newPlayerHP);

    if (newPlayerHP <= 0) {
      const defeatLog = [...newLog, `${selectedPokemon.name} fainted!`, `${enemyPokemon.name} wins the battle!`];
      setBattleLog(defeatLog);
      setBattleStatus('finished');
      sendBattleState(defeatLog, newPlayerHP, enemyHP, null, 'finished');
      return;
    }

    setCurrentTurn('player');
    sendBattleState(newLog, newPlayerHP, enemyHP, 'player');
  };

  // Calculate damage
  const calculateDamage = (attacker, defender, move) => {
    const attackStat = attacker.stats.find(s => s.stat.name === 'attack').base_stat;
    const defenseStat = defender.stats.find(s => s.stat.name === 'defense').base_stat;

    const stab = attacker.types.some(t => t.type.name === move.type) ? 1.5 : 1;

    let effectiveness = 1;
    defender.types.forEach(t => {
      if (typeEffectiveness[move.type]?.[t.type.name]) {
        effectiveness *= typeEffectiveness[move.type][t.type.name];
      }
    });

    const randomFactor = 0.85 + Math.random() * 0.15;

    return Math.max(1, Math.floor(
      (move.power * (attackStat / defenseStat) * stab * effectiveness * randomFactor
    )));
  };

  // Send battle state to peer
  const sendBattleState = (log, playerHP, enemyHP, currentTurn, status = battleStatus) => {
    sendMessage({
      type: 'battle_state',
      payload: {
        log,
        playerHP,
        enemyHP,
        currentTurn,
        status
      }
    });
  };

  // Sync battle state from peer
  const syncBattleState = (state) => {
    setBattleLog(state.log);
    setPlayerHP(state.playerHP);
    setEnemyHP(state.enemyHP);
    setCurrentTurn(state.currentTurn);
    setBattleStatus(state.status);
  };

  // Get type color
  const getTypeColor = (type) => {
    return typeColors[type?.toLowerCase()] || "#777";
  };

  // Copy invitation link
  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    alert('Link copied to clipboard!');
  };

  // Reset battle
  const resetBattle = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    navigate('/pokemon-battle');
  };

  // Loading state
  if (loading) {
    return (
      <div className="p2p-loading">
        <div className="pokeball-spinner">
          <div className="pokeball-top"></div>
          <div className="pokeball-bottom"></div>
          <div className="pokeball-center"></div>
        </div>
        <p>Loading Pokémon...</p>
      </div>
    );
  }

  // Connection error state
  if (connectionStatus === 'error') {
    return (
      <div className="p2p-error">
        <h2>Connection Error</h2>
        <p>Failed to establish connection with opponent</p>
        <button onClick={resetBattle} className="p2p-button">
          Go Back
        </button>
      </div>
    );
  }

  // Waiting for opponent (host)
  if (waitingForOpponent) {
    return (
      <>
        <Navbar />
        <div className="p2p-waiting">
          <div className="p2p-waiting-header">
            <button onClick={resetBattle} className="p2p-back-button">
              <FaArrowLeft /> Cancel
            </button>
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
  }

  // Pokémon selection screen
  if (battleStatus === 'selecting') {
    return (
      <>
        <Navbar />
        <div className="p2p-selection">
          <div className="p2p-selection-header">
            <button onClick={resetBattle} className="p2p-back-button">
              <FaArrowLeft /> Cancel
            </button>
            <h2>Select Your Pokémon</h2>
            <div className={`p2p-status ${connectionStatus}`}>
              Status: {connectionStatus === 'connected' ? 'Connected!' : 'Connecting...'}
            </div>
          </div>
          
          <div className="p2p-pokemon-grid">
            {pokemonList.map(pokemon => (
              <div 
                key={pokemon.id} 
                className="p2p-pokemon-card"
                onClick={() => selectPokemon(pokemon)}
              >
                <div className="p2p-pokemon-image">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                    alt={pokemon.name}
                    onError={(e) => {
                      e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/0.png';
                    }}
                  />
                </div>
                <div className="p2p-pokemon-name">
                  {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                </div>
                <div className="p2p-pokemon-id">#{pokemon.id}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Battle screen
  return (
    <>
      <Navbar />
      <div className="p2p-battle">
        <div className="p2p-battle-header">
          <button onClick={resetBattle} className="p2p-back-button">
            <FaArrowLeft /> End Battle
          </button>
          <h2>Pokémon Battle</h2>
          <div className={`p2p-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        <div className="p2p-battle-field">
          {/* Opponent Pokémon */}
          <div className={`p2p-battle-pokemon p2p-opponent ${currentTurn === 'opponent' ? 'p2p-active-turn' : ''}`}>
            <div className="p2p-pokemon-info">
              <h3>{enemyPokemon.name.charAt(0).toUpperCase() + enemyPokemon.name.slice(1)}</h3>
              <div className="p2p-hp-bar-container">
                <div 
                  className="p2p-hp-bar"
                  style={{
                    width: `${(enemyHP / enemyPokemon.stats.find(s => s.stat.name === 'hp').base_stat) * 100}%`,
                    backgroundColor: enemyHP / enemyPokemon.stats.find(s => s.stat.name === 'hp').base_stat < 0.2 ? '#ff0000' :
                                    enemyHP / enemyPokemon.stats.find(s => s.stat.name === 'hp').base_stat < 0.5 ? '#ffa500' : '#4CAF50'
                  }}
                ></div>
              </div>
              <div className="p2p-hp-text">
                HP: {enemyHP} / {enemyPokemon.stats.find(s => s.stat.name === 'hp').base_stat}
              </div>
            </div>
            
            <div 
              className="p2p-pokemon-image-container"
              style={{
                backgroundColor: `${getTypeColor(enemyPokemon.types[0].type.name)}30`,
                backgroundImage: `radial-gradient(circle at center, ${getTypeColor(enemyPokemon.types[0].type.name)}30 0%, transparent 70%)`
              }}
            >
              <img
                src={enemyPokemon.sprites.other["official-artwork"].front_default}
                alt={enemyPokemon.name}
                onError={(e) => {
                  e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/0.png';
                }}
              />
            </div>
          </div>
          
          {/* VS Circle */}
          <div className="p2p-vs-circle">
            <span>VS</span>
          </div>
          
          {/* Player Pokémon */}
          <div className={`p2p-battle-pokemon p2p-player ${currentTurn === 'player' ? 'p2p-active-turn' : ''}`}>
            <div 
              className="p2p-pokemon-image-container"
              style={{
                backgroundColor: `${getTypeColor(selectedPokemon.types[0].type.name)}30`,
                backgroundImage: `radial-gradient(circle at center, ${getTypeColor(selectedPokemon.types[0].type.name)}30 0%, transparent 70%)`
              }}
            >
              <img
                src={selectedPokemon.sprites.other["official-artwork"].front_default}
                alt={selectedPokemon.name}
              />
            </div>
            
            <div className="p2p-pokemon-info">
              <h3>{selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}</h3>
              <div className="p2p-hp-bar-container">
                <div 
                  className="p2p-hp-bar"
                  style={{
                    width: `${(playerHP / selectedPokemon.stats.find(s => s.stat.name === 'hp').base_stat) * 100}%`,
                    backgroundColor: playerHP / selectedPokemon.stats.find(s => s.stat.name === 'hp').base_stat < 0.2 ? '#ff0000' :
                                    playerHP / selectedPokemon.stats.find(s => s.stat.name === 'hp').base_stat < 0.5 ? '#ffa500' : '#4CAF50'
                  }}
                ></div>
              </div>
              <div className="p2p-hp-text">
                HP: {playerHP} / {selectedPokemon.stats.find(s => s.stat.name === 'hp').base_stat}
              </div>
            </div>
          </div>
          
          {/* Move Selection */}
          {currentTurn === 'player' && battleStatus === 'battling' && (
            <div className="p2p-move-selection">
              <h4>Choose a Move:</h4>
              <div className="p2p-move-buttons">
                {selectedPokemon.moves.map((move, index) => (
                  <button
                    key={index}
                    className="p2p-move-button"
                    style={{ backgroundColor: getTypeColor(move.type) }}
                    onClick={() => playerMove(move)}
                  >
                    <span className="p2p-move-name">{move.name}</span>
                    <span className="p2p-move-power">{move.power}</span>
                    <span 
                      className="p2p-move-type"
                      style={{ backgroundColor: getTypeColor(move.type) }}
                    >
                      {move.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Battle Result */}
          {battleStatus === 'finished' && (
            <div className="p2p-battle-result">
              <button 
                onClick={resetBattle}
                className="p2p-button"
              >
                New Battle
              </button>
            </div>
          )}
        </div>
        
        {/* Battle Log */}
        <div className="p2p-battle-log" ref={battleLogRef}>
          <h4>Battle Log</h4>
          <div className="p2p-log-content">
            {battleLog.map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PokemonP2PBattle;