import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="container mt-4">
        <Outlet />
      </main>
      <footer className="footer mt-auto py-3 bg-light">
        <div className="container text-center">
          <span className="text-muted">&copy; 2026 MFE Platform</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
