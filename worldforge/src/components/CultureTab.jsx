// frontend/src/components/CultureTab.jsx

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    // Import other MUI components if needed for this tab
} from '@mui/material';

// Import the API service function for this tab
import { generateCulturalTapestry } from '../api/apiService';

// Import the reusable data display helper
import DisplayGeneratedData from './DisplayGeneratedData'; // Assuming helper is in the same directory


// Accept props from AppLayout
const CultureTab = ({ worldData, isLLMInitialized, onDataGenerated }) => {
    // Local state for input prompt
    const [societalStructure, setSocietalStructure] = useState('');

    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Check if World Seed data exists (required for Culture generation)
    // This checks the worldData prop managed by AppLayout
    const worldSeedGenerated = worldData && worldData.physical_world && Object.keys(worldData.physical_world).length > 0;


    // --- Handlers ---
    const handleInputChange = (event) => {
        setSocietalStructure(event.target.value);
        setErrorMessage('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Check if LLM is initialized
        if (!isLLMInitialized) {
            setErrorMessage("LLM provider not initialized. Go to Settings and apply settings first.");
            return;
        }

        // Check if World Seed is generated - Frontend validation mirroring backend
        if (!worldSeedGenerated) {
            setErrorMessage("Please generate the World Seed first (Tab ①).");
            return;
        }


        if (!societalStructure.trim()) {
            setErrorMessage('Please describe the primary societal structure idea.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');


        try {
            const inputData = { societal_structure: societalStructure };

            // Call the API service function
            const result = await generateCulturalTapestry(inputData);

            // Call the callback from AppLayout with the generated data
            // 'culture' is the key used in AppLayout's worldData state
            if (onDataGenerated) {
                 onDataGenerated('culture', result);
            }

            // Optional: Clear input after submission
            // setSocietalStructure('');


        } catch (error) {
            console.error('Cultural Tapestry Generation Error:', error);
             // Display specific error messages from apiService
            setErrorMessage(error.message || 'An error occurred during cultural tapestry generation.');

        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%', // Take full width of parent container
        }}>
            <Typography component="h2" variant="h5" sx={{ mb: 2, color: 'white' }}>
                ② Generate Cultural Tapestry
            </Typography>
             <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Develop the societies and cultures that inhabit your world.
             </Typography>


            {/* Display feedback messages */}
            {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

            {/* Form for generation */}
            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                 <TextField
                     margin="normal"
                     required
                     fullWidth
                     // multiline // Use if needed for longer input
                     // rows={4}
                     id="societalStructure"
                     label="Primary Societal Structure Idea"
                     name="societalStructure"
                     value={societalStructure}
                     onChange={handleInputChange}
                     // Disable if loading, LLM not initialized, or World Seed not generated
                     disabled={isLoading || !isLLMInitialized || !worldSeedGenerated}
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
                    // Disable if loading, no input, LLM not initialized, or World Seed not generated
                    disabled={isLoading || !societalStructure.trim() || !isLLMInitialized || !worldSeedGenerated}
                >
                   {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Cultural Tapestry'}
                </Button>

                 {/* Messages if prerequisites not met */}
                 {!isLLMInitialized && !isLoading && (
                     <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         LLM provider is not initialized. Go to Settings (in sidebar) to configure it.
                     </Typography>
                 )}
                 {isLLMInitialized && !worldSeedGenerated && !isLoading && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         World Seed is required first. Generate it in Tab ①.
                      </Typography>
                 )}

            </Box>

             {/* Display Generated Data using the helper component */}
             {/* Pass the relevant section of worldData from AppLayout */}
            <DisplayGeneratedData header="Generated Cultural Details:" data_dict={worldData?.culture} />


        </Box>
    );
};


export default CultureTab;