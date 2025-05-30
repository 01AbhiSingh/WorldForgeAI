// frontend/src/components/SettingsView.jsx

import React, { useState, useEffect } from 'react';
import {
    Button,
    TextField,
    Typography,
    Box,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Paper // Import Paper if used for styling
} from '@mui/material';

// Import the API service functions needed within this component
import { initLLM } from '../api/apiService';
// REMOVE fetchProvidersList import - it's now fetched in AppLayout
// import { fetchProvidersList } from '../api/apiService'; // <--- REMOVE THIS LINE


// >>> ACCEPT PROPS FROM APPLAYOUT <<<
const SettingsView = ({ providers, isLLMInitialized, initializedProviderKey, onSettingsApplied }) => { // Accept props
// >>> END ACCEPT PROPS <<<

    // State for LLM Settings form inputs - these remain local
    const [selectedProviderKey, setSelectedProviderKey] = useState(initializedProviderKey || ''); // Initialize with existing key
    const [apiKey, setApiKey] = useState(''); // API key input is always local for security
    const [hfModelId, setHfModelId] = useState('');

    // State for UI feedback - these remain local
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');


    // --- REMOVE useEffect TO FETCH PROVIDERS ---
    // This is now done in AppLayout
    // useEffect(() => { ... loadProviders logic ... }, []); // <--- REMOVE THIS useEffect
    // --- END REMOVE ---

    // --- EFFECTS ---
    // Effect to update local selectedProviderKey if the initialized key changes from AppLayout
    useEffect(() => {
        // This helps if the user initializes, then logs out/in and comes back -
        // the view should reflect the existing initialization.
        setSelectedProviderKey(initializedProviderKey || '');
        // Clear local input fields when initialized key changes
        setApiKey('');
        setHfModelId('');
    }, [initializedProviderKey]); // Depend on the prop from AppLayout


    // --- Handlers ---
    const handleProviderChange = (event) => {
        const key = event.target.value;
        setSelectedProviderKey(key);
        setApiKey(''); // Clear API key/model ID when provider changes
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
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const isMock = selectedProviderKey.toLowerCase().includes('mock');
        const isHuggingFace = selectedProviderKey === 'huggingface';

        // Frontend validation
        if (!isMock && (!apiKey || apiKey.trim() === '')) {
            setErrorMessage('API Key is required for the selected provider.');
            return;
        }
        if (isHuggingFace && (!hfModelId || hfModelId.trim() === '')) {
            setErrorMessage('Hugging Face Model ID is required.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const settingsData = {
                provider_key: selectedProviderKey,
                api_key: isMock ? null : apiKey,
                hf_model_id: isHuggingFace ? hfModelId : null
            };

            const result = await initLLM(settingsData); // Use imported apiService function

            setSuccessMessage(result.message || 'LLM initialized successfully!');

            // >>> CALL THE CALLBACK FROM APPLAYOUT <<<
            // Notify the parent component (AppLayout) that initialization was successful
            if (onSettingsApplied) {
                 onSettingsApplied(selectedProviderKey); // Pass the key back
            }
            // >>> END CALL CALLBACK <<<

        } catch (error) {
            console.error('LLM Initialization Error:', error);
            // Specific error handling for LLM not initialized - less likely here now
            setErrorMessage(error.message || 'An error occurred during LLM initialization.');

        } finally {
            setIsLoading(false);
        }
    };

    // Helper to get display name (providers is now a prop)
    const getProviderDisplayName = (internalKey) => {
        // Check if providers prop is loaded before trying to find the key
         if (!providers || Object.keys(providers).length === 0) {
             return internalKey; // Fallback to internal key if providers not loaded yet
         }
         const entry = Object.entries(providers).find(([display, key]) => key === internalKey);
         return entry ? entry[0] : internalKey;
    };


    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#1e293b',
            padding: 4,
            borderRadius: '8px',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
            width: '100%' // Ensure it takes full width of its container
        }}>
            <Typography component="h2" variant="h5" sx={{ mb: 3, color: 'white' }}>
                LLM Settings
            </Typography>

            {/* Display layout-level error passed down, or local error */}
             {/* You could also display a layoutError prop if passed down */}
            {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}
            {successMessage && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{successMessage}</Alert>}

            {/* Conditionally render form or initialized message */}
             {isLLMInitialized ? (
                 // --- Display Initialized Message ---
                 <Box sx={{ textAlign: 'center', color: '#e2e8f0' }}>
                     <Typography variant="h6" sx={{ color: '#6366f1', mb: 1 }}>
                         LLM Provider Initialized!
                     </Typography>
                     <Typography variant="body1">
                         Using: {getProviderDisplayName(initializedProviderKey)}
                     </Typography>
                     <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                         You can now use the generation tabs.
                     </Typography>
                     {/* Optional: Add a button to reconfigure */}
                     {/* <Button onClick={() => onSettingsApplied('')}>Change Settings</Button> */}
                 </Box>
                 // --- End Initialized Message ---
             ) : (
                // --- Display Initialization Form ---
                 <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                     {/* Provider Select Dropdown */}
                     <FormControl fullWidth margin="normal">
                         <InputLabel
                             id="llm-provider-label"
                             sx={{ color: '#94a3b8' }}
                         >
                             Select LLM Provider
                         </InputLabel>
                         <Select
                             labelId="llm-provider-label"
                             id="llm-provider-select"
                             value={selectedProviderKey}
                             label="Select LLM Provider"
                             onChange={handleProviderChange}
                             // Disable if providers haven't loaded in AppLayout
                             disabled={isLoading || !providers || Object.keys(providers).length === 0}
                             sx={{
                                 color: '#e2e8f0',
                                 '.MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                                 '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#64748b' },
                                 '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                                 '.MuiSvgIcon-root': { color: '#e2e8f0' },
                             }}
                             MenuProps={{ PaperProps: { sx: { bgcolor: '#1e293b', color: '#e2e8f0' } } }}
                         >
                             {/* Map through providers prop */}
                             {providers && Object.entries(providers).map(([displayName, internalKey]) => (
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
                             type="password" // Use password type for API keys
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
                             bgcolor: '#4f46e5',
                             '&:hover': { bgcolor: '#4338ca' },
                             textTransform: 'none',
                             fontSize: '1.125rem',
                             fontWeight: '600',
                         }}
                         // Disable if loading, no providers loaded, or required fields are empty
                         disabled={isLoading || !providers || Object.keys(providers).length === 0 || (!selectedProviderKey.toLowerCase().includes('mock') && !apiKey) || (selectedProviderKey === 'huggingface' && !hfModelId)}
                     >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Apply Settings & Initialize LLM'}
                     </Button>

                      {/* Status Caption */}
                      {!isLoading && (!providers || Object.keys(providers).length === 0) && (
                          <Typography variant="caption" color="error">
                              Could not load LLM providers.
                          </Typography>
                      )}
                      {!isLoading && providers && Object.keys(providers).length > 0 && !successMessage && (
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              Select a provider and initialize.
                          </Typography>
                      )}

                 </Box>
                 // --- End Initialization Form ---
             )}


        </Box>
    );
};

export default SettingsView;