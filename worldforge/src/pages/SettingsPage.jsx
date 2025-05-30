// frontend/src/pages/SettingsPage.jsx

import React, { useState, useEffect } from 'react';
import {
    Button,
    TextField,
    Typography,
    Container,
    Box,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress // For loading indicator
} from '@mui/material';

// Import the API service functions
import { fetchProvidersList, initLLM } from '../api/apiService';

const SettingsPage = () => {
    // State for LLM Settings form inputs
    const [providers, setProviders] = useState({}); // To store providers fetched from backend
    const [selectedProviderKey, setSelectedProviderKey] = useState(''); // Internal key (e.g., 'gemini', 'openai')
    const [apiKey, setApiKey] = useState('');
    const [hfModelId, setHfModelId] = useState('');

    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // --- Fetch Providers on component mount ---
    useEffect(() => {
        const loadProviders = async () => {
            try {
                const providersData = await fetchProvidersList();
                setProviders(providersData);
                // Optionally auto-select the first provider or the mock provider
                if (Object.keys(providersData).length > 0) {
                     const mockProviderKey = Object.keys(providersData).find(key => key.toLowerCase().includes('mock'));
                     if (mockProviderKey && providersData[mockProviderKey]) {
                         setSelectedProviderKey(providersData[mockProviderKey]);
                     } else {
                        setSelectedProviderKey(Object.values(providersData)[0]); // Select the internal key of the first provider
                     }
                }
            } catch (error) {
                console.error("Failed to fetch providers:", error);
                setErrorMessage(`Failed to load providers list: ${error.message}`);
            }
        };

        loadProviders();
    }, []); // Empty dependency array means this runs once on mount

    // --- Handlers ---
    const handleProviderChange = (event) => {
        const key = event.target.value; // This is the internal key (e.g., 'mock', 'gemini')
        setSelectedProviderKey(key);
        // Reset API key and HF Model ID when provider changes
        setApiKey('');
        setHfModelId('');
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        if (name === 'apiKey') {
            setApiKey(value);
        } else if (name === 'hfModelId') {
            setHfModelId(value);
        }
        // Clear feedback messages when input changes
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Basic validation - Check if required fields are filled
        const isMock = selectedProviderKey.toLowerCase().includes('mock'); // Case-insensitive check
        const isHuggingFace = selectedProviderKey === 'huggingface';

        if (!isMock && !apiKey) {
            setErrorMessage('API Key is required for the selected provider.');
            return;
        }
        if (isHuggingFace && !hfModelId) {
            setErrorMessage('Hugging Face Model ID is required.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const settingsData = {
                provider_key: selectedProviderKey, // Send the internal key
                api_key: isMock ? null : apiKey, // Don't send API key for mock
                hf_model_id: isHuggingFace ? hfModelId : null // Only send HF model ID for HF
            };

            const result = await initLLM(settingsData); // Call API service

            setSuccessMessage(result.message || 'LLM initialized successfully!'); // Display success message from backend
            // Optionally store a flag in context/state indicating LLM is initialized

        } catch (error) {
            console.error('LLM Initialization Error:', error);
            setErrorMessage(error.message || 'An error occurred during LLM initialization.');
        } finally {
            setIsLoading(false);
        }
    };

    // Map internal keys back to display names for the Select dropdown
    const getProviderDisplayName = (internalKey) => {
         const entry = Object.entries(providers).find(([display, key]) => key === internalKey);
         return entry ? entry[0] : internalKey; // Return display name or internal key if not found
    };


    return (
        <div className="min-h-screen antialiased bg-slate-900 text-slate-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Container component="main" maxWidth="sm">
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
                    <Typography component="h1" variant="h5" sx={{ mb: 3, color: 'white' }}>
                        LLM Settings
                    </Typography>

                    {/* Display feedback messages */}
                    {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}
                    {successMessage && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{successMessage}</Alert>}

                    {/* The Settings form */}
                    <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                        {/* Provider Select Dropdown */}
                        <FormControl fullWidth margin="normal">
                            <InputLabel
                                id="llm-provider-label"
                                sx={{ color: '#94a3b8' }}
                                data-darkreader-inline-color=""
                                style={{ '--darkreader-inline-color': 'var(--darkreader-text-94a3b8, #b0a99f)' }} // Keep potential darkreader styles
                            >
                                Select LLM Provider
                            </InputLabel>
                            <Select
                                labelId="llm-provider-label"
                                id="llm-provider-select"
                                value={selectedProviderKey}
                                label="Select LLM Provider"
                                onChange={handleProviderChange}
                                disabled={isLoading || Object.keys(providers).length === 0}
                                sx={{
                                     color: '#e2e8f0', // Slate 200
                                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#475569' }, // Slate 600
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#64748b' }, // Slate 500
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' }, // Indigo 500
                                    '.MuiSvgIcon-root': { color: '#e2e8f0' }, // Dropdown arrow color
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            bgcolor: '#1e293b', // Slate 800 background for dropdown
                                            color: '#e2e8f0', // Text color
                                        },
                                    },
                                }}
                            >
                                {/* Map provider options fetched from backend */}
                                {Object.entries(providers).map(([displayName, internalKey]) => (
                                    <MenuItem key={internalKey} value={internalKey}>
                                        {displayName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* API Key Input (Hidden for Mock) */}
                        {selectedProviderKey && !selectedProviderKey.toLowerCase().includes('mock') && (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="apiKey"
                                label={`${getProviderDisplayName(selectedProviderKey)} API Key`}
                                type="password"
                                id="apiKey"
                                value={apiKey}
                                onChange={handleInputChange}
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
                        )}

                        {/* Hugging Face Model ID Input (Shown only for HF) */}
                        {selectedProviderKey === 'huggingface' && (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="hfModelId"
                                label="Hugging Face Model ID"
                                type="text"
                                id="hfModelId"
                                value={hfModelId}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                helperText="e.g., mistralai/Mistral-7B-Instruct-v0.1"
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
                        )}


                        {/* Submit Button */}
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
                                textTransform: 'none',
                                fontSize: '1.125rem',
                                fontWeight: '600',
                            }}
                            disabled={isLoading || Object.keys(providers).length === 0 || (selectedProviderKey !== 'mock' && !apiKey) || (selectedProviderKey === 'huggingface' && !hfModelId)} // Disable logic
                        >
                           {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Apply Settings & Initialize LLM'}
                        </Button>

                         {/* Status Caption */}
                         {!isLoading && Object.keys(providers).length === 0 && (
                             <Typography variant="caption" color="error">
                                 Could not load LLM providers from backend.
                             </Typography>
                         )}
                         {!isLoading && Object.keys(providers).length > 0 && !successMessage && (
                             <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                 Select a provider and initialize.
                             </Typography>
                         )}


                    </Box>
                </Box>
            </Container>
        </div>
    );
};

export default SettingsPage;