import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import EnvironmentDetail from './pages/EnvironmentDetail'
import Sidebar from './components/Sidebar'

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-ephops-base text-ephops-text-primary">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/environments/:id" element={<EnvironmentDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
