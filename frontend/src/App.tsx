// Import required libraries and components
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom' // For client-side routing
import { ThemeProvider } from './contexts/ThemeContext'
import HomePage from './components/HomePage' // Landing page component
import LoginPage from './components/LoginPage' // Authentication page component
import FarmerDashboard from './components/FarmerDashboard' // Farmer portal dashboard
import ServiceProviderDashboard from './components/ServiceProviderDashboard' // Service provider portal dashboard
import BuyerDashboard from './components/BuyerDashboard' // Buyer portal dashboard
import AuthCallbackPage from './components/AuthCallbackPage' // Clerk Sync Handler
import SignUpPage from './components/SignUpPage' // Clerk Sign Up Page
import './index.css' // Global styles and Tailwind CSS

// Main App Component - Sets up routing for the entire application
function App() {
  return (
    <ThemeProvider> {/* Theme provider for dark mode support */}
      <Router> {/* Browser router for client-side navigation */}
        <div className="App"> {/* Main application container */}
          <Routes> {/* Route definitions for different pages */}
            <Route path="/" element={<HomePage />} /> {/* Homepage route */}
            <Route path="/login" element={<LoginPage />} /> {/* Login/registration route */}
            <Route path="/sign-up" element={<SignUpPage />} /> {/* Sign Up route */}
            <Route path="/farmer-dashboard" element={<FarmerDashboard />} /> {/* Farmer portal route */}
            <Route path="/service-provider-dashboard" element={<ServiceProviderDashboard />} /> {/* Service provider portal route */}
            <Route path="/buyer-dashboard" element={<BuyerDashboard />} /> {/* Buyer portal route */}
            <Route path="/auth-callback" element={<AuthCallbackPage />} /> {/* Clerk Sync Route */}
            {/* Future routes will be added here */}
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
