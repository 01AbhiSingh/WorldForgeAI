// frontend/src/pages/WorldSeedPage.jsx

import React, { useState } from 'react';
import {
    Button,
    TextField,
    Typography,
    Container,
    Box,
    Alert,
    CircularProgress,
    Paper // To style the generated data display area
} from '@mui/material';

// Import the API service function for World Seed generation
import { generateWorldSeed } from '../api/apiService';

const WorldSeedPage = () => {
    // State for input prompt
    const [prompt, setPrompt] = useState('');
    // State for generated world data (matching PhysicalWorldData schema)
    const [generatedData, setGeneratedData] = useState(null);
    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // --- Handlers ---
    const handlePromptChange = (event) => {
        setPrompt(event.target.value);
        // Clear feedback messages when input changes
        setErrorMessage('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Basic validation
        if (!prompt.trim()) {
            setErrorMessage('Please enter a prompt to generate the world seed.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setGeneratedData(null); // Clear previous results

        try {
            const promptData = { prompt: prompt }; // Match backend schema

            const result = await generateWorldSeed(promptData); // Call API service

            setGeneratedData(result); // Store the generated data

        } catch (error) {
            console.error('World Seed Generation Error:', error);
            setErrorMessage(error.message || 'An error occurred during world seed generation.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen antialiased bg-slate-900 text-slate-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Container component="main" maxWidth="md"> {/* Increased maxWidth for more space */}
                <Box
                    sx={{
                        marginTop: 4, // Adjusted margin
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
                        Generate World Seed
                    </Typography>

                    {/* Display feedback messages */}
                    {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

                    {/* The Generation form */}
                    <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            multiline // Allow multiple lines for prompt
                            rows={4} // Set default number of rows
                            id="prompt"
                            label="Enter Core World Concept / Prompt"
                            name="prompt"
                            value={prompt}
                            onChange={handlePromptChange}
                            disabled={isLoading}
                            InputLabelProps={{ style: { color: '#94a3b8' } }}
                            InputProps={{ style: { color: '#e2e8f0' } }}
                            sx={{
                                 '& .MuiOutlinedInput-root': {
                                     fieldset: { borderColor: '#475569' },
                                     '&:hover fieldset': { borderColor: '#64748b' },
                                     '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                 },
                                 mb: 2, // Add margin bottom
                             }}
                        />


                        {/* Submit Button */}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                bgcolor: '#4f46e5', // Tailwind indigo-600
                                '&:hover': {
                                    bgcolor: '#4338ca', // Tailwind indigo-700
                                },
                                textTransform: 'none',
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                mb: 3, // Add margin bottom
                            }}
                            disabled={isLoading || !prompt.trim()} // Disable logic
                        >
                           {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate World Seed'}
                        </Button>
                    </Box>

                     {/* Display Generated Data */}
                    {generatedData && (
                        <Paper sx={{ p: 3, mt: 3, width: '100%', bgcolor: '#2d3748', color: '#e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)' }}> {/* Slate 700 */}
                             <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
                                 Generated World Seed Details:
                             </Typography>
                             {/* Iterate over the keys in generatedData and display */}
                             {Object.entries(generatedData).map(([category, text]) => (
                                 text && ( // Only display if the category has content
                                     <Box key={category} sx={{ mb: 2 }}>
                                         <Typography variant="subtitle1" sx={{ color: '#94a3b8' }}> {/* Slate 400 */}
                                             {category.replace(/_/g, ' ').toUpperCase()}: {/* Format category name */}
                                         </Typography>
                                         <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}> {/* Preserve line breaks */}
                                             {text}
                                         </Typography>
                                     </Box>
                                 )
                             ))}
                             {Object.keys(generatedData).length === 0 && (
                                  <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                                      No details were successfully generated.
                                  </Typography>
                             )}
                        </Paper>
                    )}

                </Box>
            </Container>
        </div>
    );
};

export default WorldSeedPage;