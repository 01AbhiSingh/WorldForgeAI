// frontend/src/pages/AuthPage.jsx - Replace with this entire code

import React, { useState, useEffect } from 'react'; // Make sure useEffect is imported
import { Button, TextField, Typography, Container, Box, Alert, Tabs, Tab, CircularProgress } from '@mui/material'; // Make sure CircularProgress is imported
import { useNavigate } from 'react-router-dom';

// Import useAuth hook
import { useAuth } from '../context/AuthContext'; // Ensure this import path is correct
import { registerUser, loginUser } from '../api/apiService';

const AuthPage = () => {
    const navigate = useNavigate();
    // Get user and isAuthLoading from useAuth
    const { user, login, isAuthLoading } = useAuth();


    const [tabValue, setTabValue] = useState(0); // 0 for Login, 1 for Register

    // State for form inputs
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');


    // Handlers for input changes
    const handleLoginChange = (event) => { setLoginUsername(event.target.value); setErrorMessage(''); setSuccessMessage(''); };
    const handleLoginPasswordChange = (event) => { setLoginPassword(event.target.value); setErrorMessage(''); setSuccessMessage(''); };
    const handleRegisterChange = (event) => { setRegisterUsername(event.target.value); setErrorMessage(''); setSuccessMessage(''); };
    const handleRegisterPasswordChange = (event) => { setRegisterPassword(event.target.value); setErrorMessage(''); setSuccessMessage(''); };
    const handleConfirmPasswordChange = (event) => { setConfirmPassword(event.target.value); setErrorMessage(''); setSuccessMessage(''); };


    // Handler for tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        // Clear inputs and messages when switching tabs
        setLoginUsername(''); setLoginPassword('');
        setRegisterUsername(''); setRegisterPassword(''); setConfirmPassword('');
        setErrorMessage(''); setSuccessMessage('');
    };


    // >>> THIS useEffect HANDLES STATE-DRIVEN REDIRECTION <<<
    useEffect(() => {
        // Check if the user is logged in (!null) AND not in the initial loading state
        // If so, navigate to the main application page (/app)
        console.log("AuthPage useEffect check: user=", user, "isAuthLoading=", isAuthLoading); // Debug print
        if (!isAuthLoading && user) {
             console.log("AuthPage useEffect: User detected, navigating to /app"); // Debug print
             navigate('/app');
        }
        // This effect depends on 'user', 'navigate', and 'isAuthLoading'.
        // It runs when any of these values change.
    }, [user, navigate, isAuthLoading]);
    // >>> END useEffect <<<


    // Handler for Login form submission
    const handleLoginSubmit = async (event) => {
        event.preventDefault();

        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // loginUser now returns { access_token, token_type, username }
            const tokenData = await loginUser({ username: loginUsername, password: loginPassword });

            // Call the login function provided by AuthContext
            // This updates the user state in AuthContext.
            // The useEffect above will now handle the navigation
            login(tokenData);

            setSuccessMessage('Login successful!'); // Message will show briefly before redirect


            // >>> REMOVE THIS navigate CALL <<<
            // navigate('/app'); // <-- REMOVE THIS LINE
            // The useEffect above handles the navigation now, triggered by the state update from login()
            // >>> END REMOVE <<<


        } catch (error) {
            console.error('Login Error:', error);
            setErrorMessage(error.message || 'An error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };


    // Handler for Register form submission
    const handleRegisterSubmit = async (event) => {
        event.preventDefault();

        // Basic client-side validation
        if (registerPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const userData = await registerUser({ username: registerUsername, password: registerPassword });

            setSuccessMessage(`Registration successful! Username: ${userData.username}. You can now log in.`);
            // Optionally switch to the Login tab after successful registration
            setTabValue(0);

        } catch (error) {
            console.error('Registration Error:', error);
            setErrorMessage(error.message || 'An error occurred during registration.');
        } finally {
            setIsLoading(false);
        }
    };

    // Optional: Render a loading state if initially checking auth
    // This prevents the form from showing briefly if already logged in
    // Make sure CircularProgress is imported if used here
     if (isAuthLoading) {
         return <div className="min-h-screen antialiased bg-slate-900 text-slate-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">Loading authentication status...</div>; // Simple loading message
     }


    return (
        <div className="min-h-screen antialiased bg-slate-900 text-slate-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: '#1e293b', // Slate 800
                        padding: 4,
                        borderRadius: '8px',
                        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
                    }}
                >
                     <Typography component="h1" variant="h5" sx={{ mb: 2, color: 'white' }}>
                         Welcome to Worldforge
                     </Typography>

                    {/* Tabs for Login/Register */}
                     <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3, '.MuiTabs-indicator': { backgroundColor: '#4f46e5' } }}>
                         <Tab label="Login" sx={{ color: tabValue === 0 ? '#e2e8f0' : '#94a3b8' }} />
                         <Tab label="Register" sx={{ color: tabValue === 1 ? '#e2e8f0' : '#94a3b8' }} />
                     </Tabs>


                    {/* Display feedback messages */}
                    {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}
                    {successMessage && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{successMessage}</Alert>}

                    {/* Login Form */}
                    {tabValue === 0 && (
                        <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleLoginSubmit}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="loginUsername"
                                label="Username"
                                name="loginUsername"
                                autoComplete="username"
                                autoFocus
                                value={loginUsername}
                                onChange={handleLoginChange}
                                disabled={isLoading}
                                InputLabelProps={{ style: { color: '#94a3b8' } }}
                                InputProps={{ style: { color: '#e2e8f0' } }}
                                sx={{
                                     '& .MuiOutlinedInput-root': {
                                         fieldset: { borderColor: '#475569' },
                                         '&:hover fieldset': { borderColor: '#64748b' },
                                         '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                     },
                                 }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="loginPassword"
                                label="Password"
                                type="password"
                                id="loginPassword"
                                autoComplete="current-password"
                                value={loginPassword}
                                onChange={handleLoginPasswordChange}
                                disabled={isLoading}
                                InputLabelProps={{ style: { color: '#94a3b8' } }}
                                InputProps={{ style: { color: '#e2e8f0' } }}
                                sx={{
                                     '& .MuiOutlinedInput-root': {
                                         fieldset: { borderColor: '#475569' },
                                         '&:hover fieldset': { borderColor: '#64748b' },
                                         '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                     },
                                 }}
                            />
                             {/* Login Button */}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                     bgcolor: '#4f46e5', // Tailwind indigo-600
                                     '&:hover': {
                                         bgcolor: '#4338ca', // Tailwind indigo-700
                                     },
                                    textTransform: 'none', // Prevent uppercase
                                    fontSize: '1.125rem', // Larger font
                                    fontWeight: '600', // Semi-bold
                                 }}
                                disabled={isLoading}
                            >
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                            </Button>
                        </Box>
                    )}

                    {/* Register Form */}
                    {tabValue === 1 && (
                        <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleRegisterSubmit}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="registerUsername"
                                label="Username"
                                name="registerUsername"
                                autoComplete="username"
                                autoFocus
                                value={registerUsername}
                                onChange={handleRegisterChange}
                                disabled={isLoading}
                                InputLabelProps={{ style: { color: '#94a3b8' } }}
                                InputProps={{ style: { color: '#e2e8f0' } }}
                                sx={{
                                     '& .MuiOutlinedInput-root': {
                                         fieldset: { borderColor: '#475569' },
                                         '&:hover fieldset': { borderColor: '#64748b' },
                                         '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                     },
                                 }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="registerPassword"
                                label="Password"
                                type="password"
                                id="registerPassword"
                                autoComplete="new-password"
                                value={registerPassword}
                                onChange={handleRegisterPasswordChange}
                                disabled={isLoading}
                                InputLabelProps={{ style: { color: '#94a3b8' } }}
                                InputProps={{ style: { color: '#e2e8f0' } }}
                                sx={{
                                     '& .MuiOutlinedInput-root': {
                                         fieldset: { borderColor: '#475569' },
                                         '&:hover fieldset': { borderColor: '#64748b' },
                                         '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                     },
                                 }}
                            />
                             <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="confirmPassword"
                                label="Confirm Password"
                                type="password"
                                id="confirmPassword"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                disabled={isLoading}
                                InputLabelProps={{ style: { color: '#94a3b8' } }}
                                InputProps={{ style: { color: '#e2e8f0' } }}
                                sx={{
                                     '& .MuiOutlinedInput-root': {
                                         fieldset: { borderColor: '#475569' },
                                         '&:hover fieldset': { borderColor: '#64748b' },
                                         '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                     },
                                 }}
                            />
                             {/* Register Button */}
                             <Button
                                 type="submit"
                                 fullWidth
                                 variant="contained"
                                 sx={{
                                     mt: 3,
                                     mb: 2,
                                      bgcolor: '#4f46e5', // Tailwind indigo-600
                                      '&:hover': {
                                          bgcolor: '#4338ca', // Tailwind indigo-700
                                      },
                                     textTransform: 'none', // Prevent uppercase
                                     fontSize: '1.125rem', // Larger font
                                     fontWeight: '600', // Semi-bold
                                 }}
                                 disabled={isLoading || registerPassword !== confirmPassword || !registerUsername || !registerPassword} // Disable if passwords don't match or fields are empty
                             >
                                 {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                             </Button>
                        </Box>
                    )}
                </Box>
            </Container>
        </div>
    );
};

export default AuthPage;