import React, { useEffect, useState, useCallback } from "react";
import { FaSearch, FaTimes, FaHeartBroken, FaShieldAlt } from "react-icons/fa";
import { GiBroadsword } from "react-icons/gi";
import Pokeball from "../assets/images/pokeballs.svg";
import "../assets/css/page/pokedex.css";
import Navbar from "./navbar";

const Pokedex = () => {

  const [allPokemon, setAllPokemon] = useState([]);
  const [displayedPokemon, setDisplayedPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [types, setTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilterLoading, setTypeFilterLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const pokemonPerPage = 30;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
const [successMessage, setSuccessMessage] = useState('');


  const [team, setTeam] = useState([]);
  const [teamError, setTeamError] = useState(null);

  const enhancedCache = React.useRef(new Map());

  const legendaryPokemon = new Set([144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384, 480, 481, 482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641, 642, 645, 643, 644, 646, 772, 773, 785, 786, 787, 788, 888, 889, 890, 800]);
  const mythicalPokemon = new Set([151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809, 893, 898, 1000]);
  const ultraBeasts = new Set([793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806]);

  const getPokemonClassification = (id) => {
    if (legendaryPokemon.has(id) && mythicalPokemon.has(id)) return { type: "mythical", label: "Mythical" };
    if (legendaryPokemon.has(id)) return { type: "legendary", label: "Legendary" };
    if (mythicalPokemon.has(id)) return { type: "mythical", label: "Mythical" };
    if (ultraBeasts.has(id)) return { type: "ultra", label: "Ultra Beast" };
    return { type: "basic", label: "Basic", icon: null };
  };

  const fetchAllPokemon = useCallback(async () => {
    try {
      setLoading(true);
      enhancedCache.current.clear();
      
      const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
      const data = await response.json();
      
      const basicPokemon = data.results.map((p, index) => ({
        id: index + 1,
        name: p.name,
        url: p.url,
        classification: getPokemonClassification(index + 1),
        loaded: false
      }));

      setAllPokemon(basicPokemon);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch all Pokémon:", error);
      setLoading(false);
    }
  }, []);

  
  const enhancePokemonDetails = useCallback(async (pokemon) => {
    if (enhancedCache.current.has(pokemon.id)) {
      return enhancedCache.current.get(pokemon.id);
    }

    try {
      const fullDetails = pokemon.sprites ? pokemon : await (await fetch(pokemon.url)).json();

      const typeResponses = await Promise.all(
        fullDetails.types.map((t) =>
          fetch(`https://pokeapi.co/api/v2/type/${t.type.name}`).then((res) => res.json())
        )
      );

      const weaknessMap = new Map();
      const resistanceMap = new Map();

      typeResponses.forEach((type) => {
        type.damage_relations.double_damage_from.forEach((t) => {
          const count = weaknessMap.get(t.name) || 0;
          weaknessMap.set(t.name, count + 1);
        });

        type.damage_relations.half_damage_from.forEach((t) => {
          const count = resistanceMap.get(t.name) || 0;
          resistanceMap.set(t.name, count + 1);
        });

        type.damage_relations.no_damage_from.forEach((t) => {
          resistanceMap.set(t.name, 2);
        });
      });

      const weaknesses = Array.from(weaknessMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([type]) => type);

      const resistances = Array.from(resistanceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([type]) => type);

      const moves = await Promise.all(
        fullDetails.moves.slice(0, 4).map(async (move) => {
          try {
            const moveResponse = await fetch(move.move.url);
            const moveData = await moveResponse.json();
            return { name: move.move.name, type: moveData.type.name };
          } catch (error) {
            console.error("Failed to fetch move:", move.move.name, error);
            return { name: move.move.name, type: "unknown" };
          }
        })
      );

      const enhancedPokemon = {
        ...fullDetails,
        classification: pokemon.classification,
        attacks: moves,
        weakness: weaknesses,
        resistance: resistances,
        loaded: true
      };

      enhancedCache.current.set(pokemon.id, enhancedPokemon);
      return enhancedPokemon;
    } catch (error) {
      console.error("Failed to enhance Pokémon details:", error);
      return pokemon;
    }
  }, []);

  const addToTeam = async (pokemon, e) => {
    try {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
        if (e.nativeEvent) {
          e.nativeEvent.stopImmediatePropagation();
        }
      }

      console.log("Running addToTeam");

      if (team.length >= 6) {
        alert("Your team is already full (maximum 6 Pokémon)");
        return;
      }

      if (team.some(p => p.pokemonId === pokemon.id)) {
        alert("This Pokémon is already in your team!");
        return;
      }

      setTeam(prevTeam => [...prevTeam, {
        pokemonId: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites?.front_default || ''
      }]);

      const detailedPokemon = pokemon.loaded ? pokemon : await enhancePokemonDetails(pokemon);

      const newPokemon = {
        pokemonId: detailedPokemon.id,
        name: detailedPokemon.name,
        classification: detailedPokemon.classification || getPokemonClassification(detailedPokemon.id),
        elements: detailedPokemon.types?.map(t => t.type.name) || [],
        moves: detailedPokemon.attacks?.map(a => a.name) || [],
        weakness: detailedPokemon.weakness || [],
        resistance: detailedPokemon.resistance || [],
        stats: {
          hp: detailedPokemon.stats?.[0]?.base_stat || 0,
          attack: detailedPokemon.stats?.[1]?.base_stat || 0,
          defense: detailedPokemon.stats?.[2]?.base_stat || 0,
          spAttack: detailedPokemon.stats?.[3]?.base_stat || 0,
          spDefense: detailedPokemon.stats?.[4]?.base_stat || 0,
          speed: detailedPokemon.stats?.[5]?.base_stat || 0,
        },
        sprite: detailedPokemon.sprites?.other?.['official-artwork']?.front_default ||
                detailedPokemon.sprites?.front_default || '',
      };

      const response = await fetch('http://localhost:3000/myteams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPokemon),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add Pokémon');
      }
  
      const addedPokemon = await response.json();
      setTeam(prevTeam => [
        ...prevTeam.filter(p => p.pokemonId !== pokemon.id),
        addedPokemon
      ]);


      setSuccessMessage(`${addedPokemon.name} has been added to your team!`);
      setShowSuccessModal(true);

    } catch (err) {
      console.error("Caught error inside addToTeam:", err);
      alert(`Something went wrong: ${err.message}`);
    }
  };

  
  
  

// Add this useEffect to load team from server on component mount
useEffect(() => {
  const fetchTeam = async () => {
    try {
      const response = await fetch('http://localhost:3000/myteams');
      if (!response.ok) throw new Error('Failed to fetch team');
      const data = await response.json();
      setTeam(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading team:', error);
      setTeamError('Failed to load team. Is JSON Server running?');
    }
  };

  fetchTeam();
}, []);

  
  useEffect(() => {
    const loadDetailsForDisplayed = async () => {
      const pokemonToEnhance = displayedPokemon.filter(p => !p.loaded);
      if (pokemonToEnhance.length === 0) return;

      try {
        const enhanced = await Promise.all(
          pokemonToEnhance.map(pokemon => enhancePokemonDetails(pokemon))
        );

        setAllPokemon(prev => {
          const newPokemon = [...prev];
          enhanced.forEach(enhancedPoke => {
            const index = newPokemon.findIndex(p => p.id === enhancedPoke.id);
            if (index !== -1) newPokemon[index] = enhancedPoke;
          });
          return newPokemon;
        });
      } catch (error) {
        console.error("Failed to enhance displayed Pokémon:", error);
      }
    };

    loadDetailsForDisplayed();
  }, [displayedPokemon, enhancePokemonDetails]);

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
    fetchAllPokemon();
    fetchTypes();
  }, [fetchAllPokemon, fetchTypes]);

  useEffect(() => {
    if (allPokemon.length === 0) return;
  
    const filtered = allPokemon.filter((pokemon) => {
      const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesType = selectedType === "all";
      
      if (!matchesType) {
        if (pokemon.loaded) {
          matchesType = pokemon.types?.some((type) => type.type.name === selectedType) || false;
        } else {
          matchesType = true;
        }
      }
      
      return matchesSearch && matchesType;
    });
  
    const totalPages = Math.ceil(filtered.length / pokemonPerPage);
    setTotalPages(totalPages);
  
    const startIndex = (currentPage - 1) * pokemonPerPage;
    const endIndex = startIndex + pokemonPerPage;
    const paginatedPokemon = filtered.slice(startIndex, endIndex);
  
    setDisplayedPokemon(paginatedPokemon);
  }, [allPokemon, searchTerm, selectedType, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const PokemonModal = ({ pokemon, onClose }) => {
    const [detailedPokemon, setDetailedPokemon] = useState(pokemon);
    const isInTeam = team.some(p => p.pokemonId === pokemon.id);

    
    useEffect(() => {
      document.body.classList.add('no-scroll');
      const loadFullDetails = async () => {
        if (!pokemon.loaded) {
          const enhanced = await enhancePokemonDetails(pokemon);
          setDetailedPokemon(enhanced);
        }
      };
      loadFullDetails();
      return () => document.body.classList.remove('no-scroll');
    }, [pokemon]);
    
    if (!detailedPokemon) return null;
    const mainType = detailedPokemon.types?.[0]?.type?.name;
    const typeColor = getTypeColor(mainType);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>                           
          
          <div className="modal-header">
            <div className="modal-header-left">
              <span className="pokemon-classification" data-classification={detailedPokemon.classification.type}>
                {detailedPokemon.classification.icon}
                {detailedPokemon.classification.label}
              </span>
              <h2 className="modal-title">
                {detailedPokemon.name.charAt(0).toUpperCase() + detailedPokemon.name.slice(1)}
              </h2>
            </div>
            <span className="modal-hp">{detailedPokemon.stats?.[0]?.base_stat || '??'} HP</span>
          </div>

          <div className="modal-image-container"
            style={{
              backgroundColor: `${typeColor}20`,
              backgroundImage: `radial-gradient(circle at center, ${typeColor}50 0%, transparent 70%)`
            }}>
            <img
              src={detailedPokemon.sprites?.other?.["official-artwork"]?.front_default || detailedPokemon.sprites?.front_default}
              alt={detailedPokemon.name}
              className="modal-image"
            />
          </div>

          <div className="modal-types">
            {detailedPokemon.types?.map((type, index) => (
              <span key={index} className="type-tag" style={{ backgroundColor: getTypeColor(type.type.name) }}>
                {type.type.name}
              </span>
            )) || <span>Unknown type</span>}
          </div>

          <div className="modal-stats-grid">
            {[0,1,2,3,4,5].map((statIndex) => (
              <div key={statIndex} className="stat-item">
                <span className="stat-label">
                  {statIndex === 0 ? 'HP' : 
                   statIndex === 1 ? 'Attack' :
                   statIndex === 2 ? 'Defense' :
                   statIndex === 3 ? 'Sp. Attack' :
                   statIndex === 4 ? 'Sp. Defense' : 'Speed'}
                </span>
                <span className="stat-value">{detailedPokemon.stats?.[statIndex]?.base_stat || '??'}</span>
              </div>
            ))}
          </div>

          <div className="modal-sections">
            <div className="modal-section">
              <h4><GiBroadsword className="icon sword-icon" /> Moves</h4>
              <ul className="modal-moves">
                {detailedPokemon.attacks?.length > 0 ? (
                  detailedPokemon.attacks.map((attack, index) => (
                    <li key={index}>
                      <span className="attack-dot" style={{ backgroundColor: getTypeColor(attack.type) }}></span>
                      {attack.name}
                    </li>
                  ))
                ) : <li>Loading moves...</li>}
              </ul>
            </div>

            <div className="modal-section">
              <h4><FaHeartBroken className="icon heart-icon" /> Weaknesses</h4>
              <div className="type-tags">
                {detailedPokemon.weakness?.length > 0 ? (
                  detailedPokemon.weakness.map((type, index) => (
                    <span key={index} className="type-tag" style={{ backgroundColor: getTypeColor(type) }}>
                      {type}
                    </span>
                  ))
                ) : <span>None</span>}
              </div>
            </div>

            <div className="modal-section">
              <h4><FaShieldAlt className="icon shield-icon" /> Resistances</h4>
              <div className="type-tags">
                {detailedPokemon.resistance?.length > 0 ? (
                  detailedPokemon.resistance.map((type, index) => (
                    <span key={index} className="type-tag" style={{ backgroundColor: getTypeColor(type) }}>
                      {type}
                    </span>
                  ))
                ) : <span>None</span>}
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
        <p className="loading-text">Loading Pokémon</p>
      </div>
    );
  }

  return (
    <>
      <Navbar/>



      {showSuccessModal && (
  <div id="pokedex-success-modal" className="success-modal" onClick={() => setShowSuccessModal(false)}>
    <div className="success-modal-content" onClick={(e) => e.stopPropagation()}>
     
      <h2>Success!</h2>
      <p id="pokedex-success-message">{successMessage}</p>
      <div className="success-modal-actions">
        <button onClick={() => setShowSuccessModal(false)}>Okay</button>
      </div>
    </div>
  </div>
)}

      
      
      <div className="pokedex-container">
        <div className="pokedex-header">
          <h1>Pokédex</h1>
          <div className="controls-container">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search Pokémon..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <FaSearch className="search-icon" />
            </div>
            <div className="filter-container">
  <select
    value={selectedType}
    onChange={(e) => {
      setSelectedType(e.target.value);
      setCurrentPage(1);
    }}
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
        </div>

        

        <div className="pokedex-grid">
          {displayedPokemon.length > 0 ? (
            displayedPokemon.map((pokemon) => {
              const isInTeam = team.some(p => p.pokemonId === pokemon.id);
              return (
                <div
                  key={pokemon.id}
                  className="pokemon-card"
                  style={{
                    "--type-color": pokemon.types ? getTypeColor(pokemon.types[0].type.name) : '#777',
                  }}
                  onClick={() => setSelectedPokemon(pokemon)}
                >
                  <div className="card-header">
                    <span className="pokemon-classification" data-classification={pokemon.classification.type}>
                      {pokemon.classification.icon}
                      {pokemon.classification.label}
                    </span>
                    <span className="pokemon-hp1">
                      {pokemon.stats?.[0]?.base_stat || '??'} HP
                    </span>
                  </div>
                  <div
                    className="pokemon-image-container"
                    style={{
                      backgroundColor: `${getTypeColor(pokemon.types?.[0]?.type?.name || 'normal')}30`,
                      backgroundImage: `radial-gradient(circle at center, ${getTypeColor(pokemon.types?.[0]?.type?.name || 'normal')}30 0%, transparent 70%)`,
                    }}
                  >
                    <img 
  src={pokemon.sprites?.other?.["official-artwork"]?.front_default || 
       pokemon.sprites?.front_default || 
       '/path/to/local/fallback.png'}
  alt={pokemon.name}
  className="pokemon-image"
  loading="lazy"
/>
                  </div>
                  <div className="card-body">
                 
                  <div className="pokemon-add-to-team">
                  <button
  type="button"
  className={isInTeam ? 'add-button-in-team' : 'add-button'}
  onClick={(e) => addToTeam(pokemon, e)}
  disabled={isInTeam || team.length >= 6}
>
  {team.length >= 6
    ? isInTeam
      ? 'IN TEAM - FULL'
      : 'ADD TO TEAM - FULL'
    : isInTeam
    ? 'IN TEAM'
    : 'ADD TO TEAM'}
</button>






</div>
                    <p className="pokemon-name">
                      {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                    </p>

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

                    <div className="pokemon-weakness">
                      <h4>
                        <FaHeartBroken className="icon heart-icon" /> Weakness:
                      </h4>
                      <div className="type-tags">
                        {pokemon.weakness?.length > 0 ? (
                          pokemon.weakness.map((type, index) => (
                            <span
                              key={index}
                              className="type-tag"
                              style={{ backgroundColor: getTypeColor(type) }}
                            >
                              {type}
                            </span>
                          ))
                        ) : <span>None</span>}
                      </div>
                    </div>

                    <div className="pokemon-resistance">
                      <h4>
                        <FaShieldAlt className="icon shield-icon" /> Resistance:
                      </h4>
                      <div className="type-tags">
                        {pokemon.resistance?.length > 0 ? (
                          pokemon.resistance.map((type, index) => (
                            <span
                              key={index}
                              className="type-tag"
                              style={{ backgroundColor: getTypeColor(type) }}
                            >
                              {type}
                            </span>
                          ))
                        ) : <span>None</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-results">
              <p>No Pokémon found matching your criteria</p>
            </div>
          )}
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
          Page {currentPage} of {totalPages} | Showing {displayedPokemon.length} Pokémon | Total {allPokemon.length} Pokémon
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

export default Pokedex;