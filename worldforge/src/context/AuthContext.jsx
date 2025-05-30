// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
// No need to import apiService here; context manages state based on API results

// 1. Create the Context
const AuthContext = createContext(null);

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
    // State to hold the authenticated user's information (e.g., { username: string })
    // null means not logged in
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true); // State to check initial load

    // Effect to check local storage on component mount
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        // In a real app, you would ideally validate this token with the backend
        // (e.g., via a /api/auth/me endpoint) to ensure it's still valid and get user info.
        // For this project's scope, we'll just check for token existence
        // and rely on the username stored separately or re-fetch it if needed.
        // Since we updated login to return username, let's also store username in localStorage
        // or derive user state from token existence + username from localStorage.
        // Let's retrieve username from localStorage if token exists.
        const username = localStorage.getItem('username'); // Assuming you save username too

        if (token && username) {
            // Assuming token presence + username means logged in for this basic setup
            setUser({ username: username }); // Set user state
            console.log("AuthContext: Found token and username in localStorage. User set.");
        } else {
             console.log("AuthContext: No token or username found in localStorage.");
            setUser(null); // Ensure user is null if no valid token/username
            // Optional: clear localStorage if only one piece is missing
            // localStorage.removeItem('authToken');
            // localStorage.removeItem('username');
        }
        setIsAuthLoading(false); // Initial loading is complete

    }, []); // Empty dependency array means this effect runs only once on mount

    // Login function: called after successful API login
    const login = (tokenData) => { // tokenData should now include username
        localStorage.setItem('authToken', tokenData.access_token);
        localStorage.setItem('username', tokenData.username); // Save username
        setUser({ username: tokenData.username }); // Set user state
        console.log("AuthContext: User logged in:", tokenData.username);
    };

    // Logout function: clears auth state
    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username'); // Clear username
        setUser(null); // Set user state to null
        console.log("AuthContext: User logged out.");
    };

    // The value provided to consuming components
    const contextValue = {
        user, // user object ({ username: string } or null)
        login, // login function
        logout, // logout function
        isAuthLoading, // Optional: indicate if the initial check is happening
        // You could also expose the token directly here if needed, but accessing via apiService is often sufficient
        // token: localStorage.getItem('authToken'),
    };

    // Provide the context value to children components
    return (
        <AuthContext.Provider value={contextValue}>
             {/* Optionally render a loading spinner while checking local storage */}
             {/* {isAuthLoading ? <div>Loading Auth...</div> : children} */}
             {children} {/* Render children immediately */}
        </AuthContext.Provider>
    );
};

// 3. Create a custom hook to easily consume the context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // This happens if useAuth is called outside of an AuthProvider
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Note: The token is saved in localStorage. apiService can retrieve it from there.
// You might want to synchronize user state based on token validation with backend
// in a real-world app (e.g., a /me endpoint called in useEffect).