// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Import Navigate
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AppLayout from './layouts/AppLayout';

// >>> IMPORT THE AUTH PROVIDER AND HOOK <<<
import { AuthProvider, useAuth } from './context/AuthContext';
// >>> END IMPORT <<<

// --- Helper component for Protected Routes ---
// This component checks if the user is logged in and redirects if not
const ProtectedRoute = ({ children }) => {
    const { user, isAuthLoading } = useAuth();

    // Show nothing or a loading state while checking auth status
    if (isAuthLoading) {
        return null; // Or <LoadingSpinner />
    }

    // If user is logged in, render the children (the route component)
    if (user) {
        return children;
    }

    // If not logged in, redirect to the auth page
    return <Navigate to="/auth" replace />;
};
// --- END Helper component ---


function App() {
  return (
    // >>> WRAP WITH AUTH PROVIDER <<<
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected route for the main application */}
          {/* It uses the ProtectedRoute helper */}
          <Route
              path="/app/*" // Use /* to match any sub-paths within /app
              element={
                  <ProtectedRoute>
                      <AppLayout />
                  </ProtectedRoute>
              }
          />

          {/* Redirect from root if authenticated (Optional) */}
           {/* <Route path="/" element={user ? <Navigate to="/app" /> : <LandingPage />} /> */}
           {/* This requires useAuth hook outside the provider, which is tricky */}
           {/* Let's keep / as landing and handle redirect after login in AuthPage */}


          {/* Add other routes here */}
           {/* You could also put all authenticated routes inside the ProtectedRoute */}
           {/* <Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} /> */}
           {/* <Route path="/world-seed" element={<ProtectedRoute><WorldSeedTab /></ProtectedRoute>} /> */}
           {/* But having them *within* /app/* and managed by AppLayout is cleaner */}


        </Routes>
      </Router>
    </AuthProvider> // >>> CLOSE AUTH PROVIDER <<<
  );
}

export default App;