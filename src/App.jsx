import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Tools from './pages/Tools'
import ProposalGenerator from './pages/ProposalGenerator'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/proposal-generator" element={<ProposalGenerator />} />
      </Routes>
    </div>
  )
}
