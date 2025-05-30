// frontend/src/components/WorldSeedTab.jsx

import React, { useState } from 'react'; // Keep useState for local prompt input
import {
    Button,
    TextField,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Import the API service function needed within this component
import { generateWorldSeed } from '../api/apiService';

// Keep DisplayGeneratedData helper component
import DisplayGeneratedData from './DisplayGeneratedData'; 

// >>> ACCEPT PROPS FROM APPLAYOUT <<<
const WorldSeedTab = ({ worldData, isLLMInitialized, onDataGenerated }) => { // Accept props
// >>> END ACCEPT PROPS <<<

    // State for local prompt input - This can remain local as it's cleared on submit
    const [prompt, setPrompt] = useState('');

    // State for UI feedback - these remain local
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // --- REMOVE local generatedData state ---
    // This data is now managed in AppLayout
    // const [generatedData, setGeneratedData] = useState(null); // <--- REMOVE THIS STATE
    // --- END REMOVE ---


    // --- Handlers ---
    const handlePromptChange = (event) => {
        setPrompt(event.target.value);
        setErrorMessage('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // --- Add Check for LLM Initialization ---
        if (!isLLMInitialized) {
            setErrorMessage("LLM provider not initialized. Go to Settings and apply settings first.");
            return;
        }
        // --- End Check ---


        if (!prompt.trim()) {
            setErrorMessage('Please enter a prompt to generate the world seed.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        // No need to clear generatedData state here, it's managed in AppLayout


        try {
            const promptData = { prompt: prompt };

            const result = await generateWorldSeed(promptData); // Use imported apiService function

            // --- CALL THE CALLBACK FROM APPLAYOUT ---
            // Notify the parent component (AppLayout) with the new data
            if (onDataGenerated) {
                 onDataGenerated(result); // Pass the generated physical world data back
            }
            // --- END CALL CALLBACK ---

            // No local state update for generatedData needed here

        } catch (error) {
            console.error('World Seed Generation Error:', error);
            // Specific error handling for LLM not initialized - less likely here now
             if (error.message.includes("LLM provider not initialized")) { // Still good to keep this check
                 setErrorMessage("LLM provider not initialized. Go to Settings (in sidebar) and apply settings first.");
             } else {
                setErrorMessage(error.message || 'An error occurred during world seed generation.');
             }

        } finally {
            setIsLoading(false);
            setPrompt(''); // Clear prompt after submission (optional UX improvement)
        }
    };

    // --- REMOVE useEffect to load world data on mount ---
    // This is now done in AppLayout or happens implicitly as worldData prop updates
    // useEffect(() => { ... loadWorldData logic ... }, []); // <--- REMOVE THIS useEffect
    // --- END REMOVE ---


    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
        }}>
            <Typography component="h2" variant="h5" sx={{ mb: 2, color: 'white' }}>
                ① Generate World Seed
            </Typography>
             <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Define the fundamental physical aspects of your world.
             </Typography>


            {/* Display feedback messages */}
            {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

            {/* The Generation form */}
            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                <TextField
                    margin="normal"
                    required
                    fullWidth
                    multiline
                    rows={4}
                    id="prompt"
                    label="Enter Core World Concept / Prompt"
                    name="prompt"
                    value={prompt}
                    onChange={handlePromptChange}
                    // Disable prompt and button if LLM is not initialized or loading
                    disabled={isLoading || !isLLMInitialized}
                    InputLabelProps={{ style: { color: '#94a3b8' } }}
                    InputProps={{ style: { color: '#e2e8f0' } }}
                    sx={{
                         '& .MuiOutlinedInput-root': {
                             fieldset: { borderColor: '#475569' },
                             '&:hover fieldset': { borderColor: '#64748b' },
                             '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                         },
                         mb: 2,
                     }}
                />


                {/* Submit Button */}
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                        bgcolor: '#4f46e5',
                        '&:hover': { bgcolor: '#4338ca' },
                        textTransform: 'none',
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        mb: 3,
                    }}
                    // Disable if loading, no prompt, or LLM is not initialized
                    disabled={isLoading || !prompt.trim() || !isLLMInitialized}
                >
                   {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate World Seed'}
                </Button>

                 {/* Message if LLM is not initialized */}
                 {!isLLMInitialized && !isLoading && (
                     <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         LLM provider is not initialized. Go to Settings (in sidebar) to configure it.
                     </Typography>
                 )}

            </Box>

             {/* Display Generated Data using the helper component */}
             {/* Pass the relevant section of worldData from AppLayout */}
            <DisplayGeneratedData header="Generated Physical World Details:" data_dict={worldData?.physical_world} />


        </Box>
    );
};

export default WorldSeedTab;