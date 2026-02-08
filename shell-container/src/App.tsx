import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="payments" element={<div className="alert alert-info">Payments MFE will load here</div>} />
          <Route path="orders" element={<div className="alert alert-info">Orders MFE will load here</div>} />
          <Route path="profile" element={<div className="alert alert-info">Profile MFE will load here</div>} />
          <Route path="*" element={<div className="alert alert-danger">404 - Page Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
