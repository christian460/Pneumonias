import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Datos from "./pages/Datos";
import Predicciones from "./pages/Predicciones";
import Modelos from "./pages/Modelos";
import Resultados from "./pages/Resultados";

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/datos" element={<Datos />} />
            <Route path="/predicciones" element={<Predicciones />} />
            <Route path="/modelos" element={<Modelos />} />
            <Route path="/resultados" element={<Resultados />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;