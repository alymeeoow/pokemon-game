import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom"; 
import Index from "./components/index";
import Pokedex from "./components/pokedex";
import MyTeam from "./components/myteam";
import StatBattle from "./components/pokemonStatBattle";
import SKillBattle from "./components/pokemonSkillBattle";
import PtoPBattle from "./components/pokemonP2pBattle";

import StatBattleHistory from "./components/pokemonBattleHistory";




import './App.css'; 

function App() {
  return (
    <BrowserRouter>



      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/pokedex" element={<Pokedex />} />
        <Route path="/myteam" element={<MyTeam />} />
        <Route path="/statbattle" element={<StatBattle />} />
        <Route path="/skillbattle" element={<SKillBattle />} />
        <Route path="/p2pbattle" element={<PtoPBattle />} />
        <Route path="/battleHistory" element={<StatBattleHistory />} />
        
 
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
