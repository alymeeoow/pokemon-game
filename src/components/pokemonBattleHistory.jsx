import React, { useState, useEffect } from 'react';
import { FaHistory, FaTrophy, FaEquals, FaSkull, FaChartLine, FaChevronDown, FaChevronUp, FaGamepad } from 'react-icons/fa';
import "../assets/css/page/pokemonBattleHistory.css";
import Navbar from "./navbar";

const BattleHistory = () => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); 
  const [battleTypeFilter, setBattleTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBattles, setExpandedBattles] = useState({});
  const battlesPerPage = 5;

  useEffect(() => {
    const fetchBattleHistory = async () => {
      try {
        const response = await fetch('http://localhost:3000/battleHistory');
        if (!response.ok) {
          throw new Error('Failed to fetch battle history');
        }
        const data = await response.json();
        setBattles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBattleHistory();
  }, []);

  const toggleStats = (battleId) => {
    setExpandedBattles(prev => ({
      ...prev,
      [battleId]: !prev[battleId]
    }));
  };

  const getBattleResult = (battle) => {
    return battle.result || 
           (battle.winner === battle.playerPokemon.name ? 'player' : 
            battle.winner === battle.opponentPokemon.name ? 'opponent' : 'draw');
  };

  const filteredBattles = battles.filter(battle => {
    const result = getBattleResult(battle);
    
    const resultMatch = 
      filter === 'all' || 
      (filter === 'wins' && result === 'player') ||
      (filter === 'losses' && result === 'opponent') ||
      (filter === 'draws' && result === 'draw');
    
    const typeMatch = 
      battleTypeFilter === 'all' || 
      battle.type === battleTypeFilter;
    
    return resultMatch && typeMatch;
  });

  const totalPages = Math.ceil(filteredBattles.length / battlesPerPage);
  const paginatedBattles = filteredBattles.slice(
    (currentPage - 1) * battlesPerPage,
    currentPage * battlesPerPage
  );

  const changePage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const getResultIcon = (battle) => {
    const result = getBattleResult(battle);
    
    switch (result) {
      case 'player':
        return (
          <div className="history-result-container">
            <FaTrophy className="history-icon history-icon-win" />
            <span className="history-result-text">WIN</span>
          </div>
        );
      case 'opponent':
        return (
          <div className="history-result-container">
            <FaSkull className="history-icon history-icon-loss" />
            <span className="history-result-text">LOSE</span>
          </div>
        );
      case 'draw':
        return (
          <div className="history-result-container">
            <FaEquals className="history-icon history-icon-draw" />
            <span className="history-result-text">DRAW</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getBattleTypeIcon = (type) => {
    switch (type) {
      case 'StatBattle':
        return (
          <span className="history-battle-type" title="Stat Battle">
            <FaChartLine className="history-type-icon stat-battle" /> Stat-Battle
          </span>
        );
      case 'SkillBattle':
        return (
          <span className="history-battle-type" title="Skill Battle">
            <FaGamepad className="history-type-icon skill-battle" /> Skill-Battle
          </span>
        );
      default:
        return (
          <span className="history-battle-type" title="Standard Battle">
            <FaHistory className="history-type-icon default-battle" /> Standard
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="history-loading-container">
        <div className="history-pokeball-spinner">
          <div className="history-pokeball-top"></div>
          <div className="history-pokeball-bottom"></div>
          <div className="history-pokeball-middle"></div>
          <div className="history-pokeball-center"></div>
        </div>
        <p className="history-loading-text">Loading Battle History</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error-container">
        <p>Error loading battle history: {error}</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="history-container">
        <div className="history-header">
          <h1 className="history-title">
            <FaHistory className="history-title-icon" /> Battle History
          </h1>

          <div className="history-filter-section">
            <div className="history-filter-group">
              <h4>Result Filter:</h4>
              <div className="history-filter-buttons">
                <button className={`history-filter-btn ${filter === 'all' ? 'history-filter-active' : ''}`} 
                  onClick={() => { setFilter('all'); setCurrentPage(1); }}>
                  All Battles
                </button>
                <button className={`history-filter-btn ${filter === 'wins' ? 'history-filter-active' : ''}`} 
                  onClick={() => { setFilter('wins'); setCurrentPage(1); }}>
                  Wins
                </button>
                <button className={`history-filter-btn ${filter === 'losses' ? 'history-filter-active' : ''}`} 
                  onClick={() => { setFilter('losses'); setCurrentPage(1); }}>
                  Losses
                </button>
                <button className={`history-filter-btn ${filter === 'draws' ? 'history-filter-active' : ''}`} 
                  onClick={() => { setFilter('draws'); setCurrentPage(1); }}>
                  Draws
                </button>
              </div>
            </div>

            <div className="history-filter-group">
              <h4>Battle Type:</h4>
              <div className="history-filter-buttons">
                <button className={`history-filter-btn ${battleTypeFilter === 'all' ? 'history-filter-active' : ''}`} 
                  onClick={() => { setBattleTypeFilter('all'); setCurrentPage(1); }}>
                  All Types
                </button>
                <button className={`history-filter-btn ${battleTypeFilter === 'StatBattle' ? 'history-filter-active' : ''}`} 
                  onClick={() => { setBattleTypeFilter('StatBattle'); setCurrentPage(1); }}>
                  Stat Battles
                </button>
                <button className={`history-filter-btn ${battleTypeFilter === 'SkillBattle' ? 'history-filter-active' : ''}`} 
                  onClick={() => { setBattleTypeFilter('SkillBattle'); setCurrentPage(1); }}>
                  Skill Battles
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredBattles.length === 0 ? (
          <div className="history-empty-state">
            <p>No battle history found matching your filters</p>
          </div>
        ) : (
          <div className="history-battle-list">
            {paginatedBattles.map((battle, index) => (
              <div key={battle.id || index} className="history-battle-card">
                <div className="history-battle-header">
                  <div className="history-battle-meta">
                    {getResultIcon(battle)}
                    {getBattleTypeIcon(battle.type)}
                  </div>
                  <span className="history-battle-date">{formatDate(battle.date)}</span>
                </div>

                <div className="history-battle-teams">
                  <div className="history-pokemon-card history-player-pokemon">
                    <div
                      className="history-pokemon-avatar"
                      style={{
                        backgroundColor: `${getTypeColor(battle.playerPokemon.types[0])}20`,
                        backgroundImage: `radial-gradient(circle at center, ${getTypeColor(battle.playerPokemon.types[0])}30 0%, transparent 70%)`
                      }}
                    >
                      <img
                        src={battle.playerPokemon.sprite}
                        alt={battle.playerPokemon.name}
                        className="history-pokemon-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/0.png';
                        }}
                      />
                    </div>
                    <div className="history-pokemon-info">
                      <h3 className="history-pokemon-name">
                        {battle.playerPokemon.name.charAt(0).toUpperCase() + battle.playerPokemon.name.slice(1)}
                      </h3>
                      <div className="history-pokemon-types">
                        {battle.playerPokemon.types.map((type, i) => (
                          <span key={i} className="history-type-badge" style={{ backgroundColor: getTypeColor(type) }}>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="history-vs-container">
                    <div className="history-vs-badge">
                      <span className="history-vs-text">VS</span>
                    </div>
                  </div>

                  <div className="history-pokemon-card history-opponent-pokemon">
                    <div
                      className="history-pokemon-avatar"
                      style={{
                        backgroundColor: `${getTypeColor(battle.opponentPokemon.types[0])}20`,
                        backgroundImage: `radial-gradient(circle at center, ${getTypeColor(battle.opponentPokemon.types[0])}30 0%, transparent 70%)`
                      }}
                    >
                      <img
                        src={battle.opponentPokemon.sprite}
                        alt={battle.opponentPokemon.name}
                        className="history-pokemon-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/0.png';
                        }}
                      />
                    </div>
                    <div className="history-pokemon-info">
                      <h3 className="history-pokemon-name">
                        {battle.opponentPokemon.name.charAt(0).toUpperCase() + battle.opponentPokemon.name.slice(1)}
                      </h3>
                      <div className="history-pokemon-types">
                        {battle.opponentPokemon.types.map((type, i) => (
                          <span key={i} className="history-type-badge" style={{ backgroundColor: getTypeColor(type) }}>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {battle.type === 'StatBattle' && battle.statsComparison && (
                  <>
                    <button 
                      className="history-toggle-stats-btn"
                      onClick={() => toggleStats(battle.id)}
                    >
                      {expandedBattles[battle.id] ? (
                        <>
                          <FaChevronUp /> Hide Stats
                        </>
                      ) : (
                        <>
                          <FaChevronDown /> Show Stats
                        </>
                      )}
                    </button>
                    
                    {expandedBattles[battle.id] && (
                      <div className="history-stats-comparison">
                        <h4 className="history-stats-title">Stat Comparison</h4>
                        <div className="history-stats-grid">
                          {battle.statsComparison.map((stat, i) => (
                            <div key={i} className="history-stat-row">
                              <div className="history-stat-name">{stat.stat}</div>
                              <div className="history-stat-values">
                                <span className="history-stat-value history-player-stat">
                                  {stat.playerStat}
                                </span>
                                <div className="history-stat-bar-container">
                                  <div
                                    className="history-stat-bar"
                                    style={{
                                      width: `${(stat.playerStat / (stat.playerStat + stat.opponentStat)) * 100}%`,
                                      backgroundColor: getTypeColor(battle.playerPokemon.types[0])
                                    }}
                                  ></div>
                                  <div
                                    className="history-stat-bar"
                                    style={{
                                      width: `${(stat.opponentStat / (stat.playerStat + stat.opponentStat)) * 100}%`,
                                      backgroundColor: getTypeColor(battle.opponentPokemon.types[0])
                                    }}
                                  ></div>
                                </div>
                                <span className="history-stat-value history-opponent-stat">
                                  {stat.opponentStat}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {battle.type === 'SkillBattle' && (
                  <div className="history-skill-info">
                    <p>This was a skill-based battle decided by player choices and the AI.</p>
                    {battle.turns && <p>Turns: {battle.turns}</p>}
                    {battle.duration && <p>Duration: {battle.duration} seconds</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => changePage(currentPage - 1)} 
              disabled={currentPage === 1}
              className="page-btn"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => changePage(pageNum)}
                className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
              >
                {pageNum}
              </button>
            ))}

            <button 
              onClick={() => changePage(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className="history-page-btn"
            >
              Next
            </button>
          </div>
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

export default BattleHistory;