import React, { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaHeartBroken, FaShieldAlt } from "react-icons/fa";
import { GiBroadsword } from "react-icons/gi";
import Pokeball from "../assets/images/pokeballs.svg";
import "../assets/css/page/myteam.css";
import Navbar from "./navbar";
import { useNavigate } from 'react-router-dom';

const MyTeam = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [error, setError] = useState(null);
  const [moveTypes, setMoveTypes] = useState({}); 
  


  const [confirmModal, setConfirmModal] = useState({
    show: false,
    pokemonId: null,
    pokemonName: ''
  });
  const navigate = useNavigate();
  const handleRedirect = () => {
    navigate('/pokedex'); 
  };

  const ConfirmModal = () => {
    if (!confirmModal.show) return null;
  
    return (
      <div className="confirm-modal-overlay" onClick={() => setConfirmModal({ show: false })}>
        <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
          <h3>Confirm Removal</h3>
          <p>Are you sure you want to remove {confirmModal.pokemonName} from your team?</p>
          
          <div className="confirm-modal-actions">
            <button 
              className="confirm-modal-cancel"
              onClick={() => setConfirmModal({ show: false })}
            >
              Cancel
            </button>
            <button 
  className="confirm-modal-confirm"
  onClick={async () => {
    await removeFromTeam(confirmModal.pokemonId);
    setConfirmModal({ show: false });
  }}
>
 Confirm
</button>
          </div>
        </div>
      </div>
    );
  };


  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/myteams');
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        setTeam(Array.isArray(data) ? data : []);
        setError(null);
        

        const typesMap = {};
        for (const pokemon of data) {
          if (pokemon.moves) {
            for (const move of pokemon.moves) {
              if (!typesMap[move]) {
             
                typesMap[move] = pokemon.elements?.[0] || 'normal';
              }
            }
          }
        }
        setMoveTypes(typesMap);
      } catch (err) {
        console.error("Failed to fetch team:", err);
        setError('Failed to load team. Is JSON Server running?');
        setTeam([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  const removeFromTeam = async (serverId) => {
    try {
      
      setTeam(prev => prev.filter(p => p.id !== serverId));
  
      const response = await fetch(`http://localhost:3000/myteams/${serverId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (!response.ok) {
        throw new Error('Delete failed');
      }
  
      
  
    } catch (err) {
      console.error("Delete error:", err);
 
      const freshData = await fetch('http://localhost:3000/myteams').then(res => res.json());
      setTeam(freshData);
      setError(`Failed to remove Pokémon: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };
  const PokemonModal = ({ pokemon, onClose }) => {
    useEffect(() => {
      document.body.classList.add('no-scroll');
      return () => document.body.classList.remove('no-scroll');
    }, []);

    const mainType = pokemon.elements?.[0] || 'normal';
    const typeColor = getTypeColor(mainType);

    return (
      <div className="team-modal-overlay" onClick={onClose}>
        <div className="team-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="team-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
          
          <div className="team-modal-header">
            <div className="team-modal-header-left">
              <span className="team-pokemon-classification" data-classification={pokemon.classification?.type || 'basic'}>
                {pokemon.classification?.label || 'Basic'}
              </span>
              <h2 className="team-modal-title">
                {pokemon.name?.charAt(0).toUpperCase() + pokemon.name?.slice(1) || 'Unknown'}
              </h2>
            </div>
            <span className="team-modal-hp">{pokemon.stats?.hp || '??'} HP</span>
          </div>

          <div 
            className="team-modal-image-container"
            style={{
              backgroundColor: `${typeColor}20`,
              backgroundImage: `radial-gradient(circle at center, ${typeColor}50 0%, transparent 70%)`
            }}
          >
            <img
              src={pokemon.sprite || 'https://via.placeholder.com/150?text=Pokemon'}
              alt={pokemon.name}
              className="team-modal-image"
            />
          </div>

          <div className="team-modal-types">
            {pokemon.elements?.map((type, index) => (
              <span
                key={index}
                className="team-type-tag"
                style={{ backgroundColor: getTypeColor(type) }}
              >
                {type}
              </span>
            )) || <span>Unknown type</span>}
          </div>

          <div className="team-modal-stats-grid">
            <div className="team-stat-item">
              <span className="team-stat-label">HP</span>
              <span className="team-stat-value">{pokemon.stats?.hp || '??'}</span>
            </div>
            <div className="team-stat-item">
              <span className="team-stat-label">Attack</span>
              <span className="team-stat-value">{pokemon.stats?.attack || '??'}</span>
            </div>
            <div className="team-stat-item">
              <span className="team-stat-label">Defense</span>
              <span className="team-stat-value">{pokemon.stats?.defense || '??'}</span>
            </div>
            <div className="team-stat-item">
              <span className="team-stat-label">Sp. Attack</span>
              <span className="team-stat-value">{pokemon.stats?.spAttack || '??'}</span>
            </div>
            <div className="team-stat-item">
              <span className="team-stat-label">Sp. Defense</span>
              <span className="team-stat-value">{pokemon.stats?.spDefense || '??'}</span>
            </div>
            <div className="team-stat-item">
              <span className="team-stat-label">Speed</span>
              <span className="team-stat-value">{pokemon.stats?.speed || '??'}</span>
            </div>
          </div>

          <div className="team-modal-sections">
            <div className="team-modal-section">
              <h4><GiBroadsword className="icon sword-icon" /> Moves</h4>
              <ul className="team-modal-moves">
                {pokemon.moves?.length > 0 ? (
                  pokemon.moves.slice(0, 4).map((move, index) => {
                    const moveType = moveTypes[move] || pokemon.elements?.[0] || 'normal';
                    return (
                      <li key={index}>
                        <span 
                          className="attack-dot" 
                          style={{ backgroundColor: getTypeColor(moveType) }}
                        ></span>
                        {move.replace('-', ' ')}
                      </li>
                    );
                  })
                ) : (
                  <li>No moves</li>
                )}
              </ul>
            </div>

            <div className="team-modal-section">
              <h4><FaHeartBroken className="icon heart-icon" /> Weaknesses</h4>
              <div className="team-type-tags">
                {pokemon.weakness?.length > 0 ? (
                  pokemon.weakness.map((type, index) => (
                    <span
                      key={index}
                      className="team-type-tag"
                      style={{ backgroundColor: getTypeColor(type) }}
                    >
                      {type}
                    </span>
                  ))
                ) : (
                  <span>None</span>
                )}
              </div>
            </div>

            <div className="team-modal-section">
              <h4><FaShieldAlt className="icon shield-icon" /> Resistances</h4>
              <div className="team-type-tags">
                {pokemon.resistance?.length > 0 ? (
                  pokemon.resistance.map((type, index) => (
                    <span
                      key={index}
                      className="team-type-tag"
                      style={{ backgroundColor: getTypeColor(type) }}
                    >
                      {type}
                    </span>
                  ))
                ) : (
                  <span>None</span>
                )}
              </div>
            </div>
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
        <p className="loading-text">Loading Team</p>
      </div>
    );
  }

  return (
    <>
    <ConfirmModal />
      <Navbar/>
      <div className="team-pokedex-container">
        <div className="team-pokedex-header">
          <h1>My Pokémon Team</h1>
          {error && <div className="team-error">{error}</div>}
        </div>

        <div className="team-container">
          {team.length > 0 ? (
            <div className="team-grid">
              {team.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="pokemon-card team-card"
                  style={{
                    "--type-color": pokemon.elements?.length ? getTypeColor(pokemon.elements[0]) : '#777',
                  }}
                  onClick={() => setSelectedPokemon(pokemon)}
                >
  <button 
  className="remove-from-team"
  onClick={(e) => {
    e.stopPropagation();
    setConfirmModal({
      show: true,
      pokemonId: pokemon.id,
      pokemonName: pokemon.name
    });
  }}
  aria-label={`Remove ${pokemon.name} from team`}
>
  <FaTimes />
</button>
                  
                  <div className="team-card-header">
                    <span className="team-pokemon-classification" data-classification={pokemon.classification?.type || 'basic'}>
                      {pokemon.classification?.label || 'Basic'}
                    </span>
                    <span className="team-pokemon-hp">
                      {pokemon.stats?.hp || '??'} HP
                    </span>
                  </div>
                  
                  <div
                    className="team-pokemon-image-container"
                    style={{
                      backgroundColor: `${getTypeColor(pokemon.elements?.[0] || 'normal')}30`,
                      backgroundImage: `radial-gradient(circle at center, ${getTypeColor(pokemon.elements?.[0] || 'normal')}30 0%, transparent 70%)`,
                    }}
                  >
                    <img
                      src={pokemon.sprite || 'https://via.placeholder.com/150?text=Pokemon'}
                      alt={pokemon.name}
                      className="team-pokemon-image"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="team-card-body">
                    <p className="team-pokemon-name">
                      {pokemon.name?.charAt(0).toUpperCase() + pokemon.name?.slice(1) || 'Unknown'}
                    </p>

                    <div className="team-pokemon-types">
                      <h4>
                        <img src={Pokeball} alt="Pokeball" className="team-pokeball-icon2" />
                        Elements:
                      </h4>
                      <div className="team-type-tags">
                        {pokemon.elements?.length > 0 ? (
                          pokemon.elements.map((type, index) => (
                            <span
                              key={index}
                              className="team-type-tag"
                              style={{ backgroundColor: getTypeColor(type) }}
                            >
                              {type}
                            </span>
                          ))
                        ) : (
                          <span>Unknown</span>
                        )}
                      </div>
                    </div>

                    <div className="team-pokemon-attacks">
                      <h4>
                        <GiBroadsword className="icon sword-icon" /> Moves:
                      </h4>
                      <ul>
                        {pokemon.moves?.length > 0 ? (
                          pokemon.moves.slice(0, 4).map((move, index) => {
                            const moveType = moveTypes[move] || pokemon.elements?.[0] || 'normal';
                            return (
                              <li key={index}>
                                <span 
                                  className="attack-dot"
                                  style={{ backgroundColor: getTypeColor(moveType) }}
                                ></span>
                                {move.replace('-', ' ')}
                              </li>
                            );
                          })
                        ) : (
                          <li>No moves</li>
                        )}
                      </ul>
                    </div>

                    <div className="team-pokemon-weakness">
                      <h4>
                        <FaHeartBroken className="icon heart-icon" /> Weaknesses:
                      </h4>
                      <div className="team-type-tags">
                        {pokemon.weakness?.length > 0 ? (
                          pokemon.weakness.map((type, index) => (
                            <span
                              key={index}
                              className="team-type-tag"
                              style={{ backgroundColor: getTypeColor(type) }}
                            >
                              {type}
                            </span>
                          ))
                        ) : (
                          <span>None</span>
                        )}
                      </div>
                    </div>

                    <div className="team-pokemon-resistance">
                      <h4>
                        <FaShieldAlt className="icon shield-icon" /> Resistances:
                      </h4>
                      <div className="team-type-tags">
                        {pokemon.resistance?.length > 0 ? (
                          pokemon.resistance.map((type, index) => (
                            <span
                              key={index}
                              className="team-type-tag"
                              style={{ backgroundColor: getTypeColor(type) }}
                            >
                              {type}
                            </span>
                          ))
                        ) : (
                          <span>None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {Array.from({ length: 6 - team.length }).map((_, index) => (
                <div key={`empty-${index}`} className="team-pokemon-card empty-slot" onClick={handleRedirect}>
                  <div className="team-empty-slot-content">
                  <FaPlus className="team-add-icon"  />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-team">
              <p>Your team is empty!</p>
              <button className="find-pokemon-btn">
                Find Pokémon to Add
              </button>
            </div>
          )}
        </div>

        {selectedPokemon && (
          <PokemonModal
            pokemon={selectedPokemon}
            onClose={() => setSelectedPokemon(null)}
          />
        )}
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

export default MyTeam;