import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import PokeballIcon from '../assets/images/pokeball.png';
import "../assets/css/page/navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active-link' : '';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setIsOpen(false)}>
          <img src={PokeballIcon} alt="Pokéball" className="navbar-logo" />
          <span className="navbar-title">Pokemon</span>
        </Link>

        <div className={`navbar-links ${isOpen ? 'active' : ''}`}>
          <Link to="/pokedex" className={`navbar-link ${isActive('/pokedex')}`} onClick={() => setIsOpen(false)}>Pokédex</Link>
          <Link to="/myteam" className={`navbar-link ${isActive('/myteam')}`} onClick={() => setIsOpen(false)}>My Team</Link>
          <Link to="/statbattle" className={`navbar-link ${isActive('/statbattle')}`} onClick={() => setIsOpen(false)}>Stat-Battle</Link>
          <Link to="/skillbattle" className={`navbar-link ${isActive('/skillbattle')}`} onClick={() => setIsOpen(false)}>Skill-Battle</Link>
          <Link to="/battleHistory" className={`navbar-link ${isActive('/battleHistory')}`} onClick={() => setIsOpen(false)}>Battle History</Link>
        </div>

        <button 
          className="navbar-toggle" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
