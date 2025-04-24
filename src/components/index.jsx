import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/buttons";
import { motion } from "framer-motion";
import "../assets/css/page/index.css";



const LandingPage = () => {
  return (
    <div className="landing-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="title-container"
      >
        <h1>
          <div className="pokeball-icon">
            <div className="pokeball-top"></div>
            <div className="pokeball-bottom"></div>
            <div className="pokeball-line" />
            <div className="pokeball-center" />
          </div>
          Pokémon Battle Arena
        </h1>
        <p>
          Build your ultimate team, explore Pokémon stats, and battle your favorite Pokémon with real-time data from the PokéAPI!
        </p>
        <div className="button-container">
        <Link to="/pokedex">
  <Button size="lg" className="primary-button">
    Open Pokédex
  </Button>
</Link>

          <Link to="/myteam">
            <Button size="lg" variant="outline" className="secondary-button">
              My Team
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;