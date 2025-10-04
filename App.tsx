import './global.css';
import { AuthProvider } from './src/contexts/AuthContext';
import Navigation from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}