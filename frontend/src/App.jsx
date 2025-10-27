// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MasterDataPage from './pages/MasterDataPage';
import CetakBarcodePage from './pages/CetakBarcodePage';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ padding: '0 20px' }}>
        
        {/* Header dan Navigasi Futuristik */}
        <header style={{ padding: '20px 0', borderBottom: '1px solid var(--color-card-bg)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>UD AMANAH</h1>
            <nav>
                <Link to="/" className="nav-link" style={{ marginRight: '10px' }}>
                    MASTER DATA
                </Link>
                <Link to="/cetak" className="nav-link">
                    CETAK BARCODE
                </Link>
            </nav>
        </header>
        
        {/* Konten Halaman */}
        <main style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
            <Routes>
                <Route path="/" element={<MasterDataPage />} />
                <Route path="/cetak" element={<CetakBarcodePage />} />
            </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;