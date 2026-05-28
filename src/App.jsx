import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Tools from './pages/Tools.jsx';
import ProposalGenerator from './pages/ProposalGenerator.jsx';
import RoiCalculator from './pages/RoiCalculator.jsx';
import Insights from './pages/Insights.jsx';
import DealStories from './pages/DealStories.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/proposal-generator" element={<ProposalGenerator />} />
          <Route path="/roi-calculator" element={<RoiCalculator />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/deal-stories" element={<DealStories />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
