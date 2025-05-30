// frontend/src/components/FactionsTab.jsx

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid, // Use Grid for layout columns
} from '@mui/material';

// Import the API service function for this tab
import { generateFaction } from '../api/apiService';

// Import the reusable data display helper
import DisplayGeneratedData from './DisplayGeneratedData'; // Assuming helper is in the same directory


// Faction Types from your original Streamlit code
const factionTypes = [
    "Political", "Religious", "Criminal", "Guild (Craftsmen/Merchants)",
    "Military", "Magical Order", "Secret Society", "Other"
];


// Accept props from AppLayout (worldData, isLLMInitialized, onDataGenerated)
const FactionsTab = ({ worldData, isLLMInitialized, onDataGenerated }) => {
    // Local state for input fields
    const [factionName, setFactionName] = useState('');
    const [factionType, setFactionType] = useState(factionTypes[0]); // Default to the first type
    const [factionGoal, setFactionGoal] = useState('');

    // State for UI feedback (loading, error messages specific to this tab)
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Check prerequisites: World Seed and Cultural Tapestry must be generated
    // Access worldData prop passed down from AppLayout
    const worldSeedGenerated = worldData?.physical_world && Object.keys(worldData.physical_world).length > 0;
    const cultureGenerated = worldData?.culture && Object.keys(worldData.culture).length > 0;
    const prerequisitesMet = worldSeedGenerated && cultureGenerated;


    // --- Handlers for form inputs ---
    const handleNameChange = (event) => {
        setFactionName(event.target.value);
        setErrorMessage(''); // Clear error on input change
    };

     const handleTypeChange = (event) => {
        setFactionType(event.target.value);
        setErrorMessage(''); // Clear error on input change
    };

    const handleGoalChange = (event) => {
        setFactionGoal(event.target.value);
        setErrorMessage(''); // Clear error on input change
    };


    // --- Handler for form submission ---
    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default browser form submission

        // --- Frontend Validation (mirroring backend checks where possible) ---
        // Check if LLM is initialized (managed in AppLayout, passed as prop)
        if (!isLLMInitialized) {
            setErrorMessage("LLM provider not initialized. Go to Settings and apply settings first.");
            return;
        }

        // Check prerequisites (managed in AppLayout, passed as prop)
        if (!prerequisitesMet) {
            setErrorMessage("World Seed (Tab ①) and Cultural Tapestry (Tab ②) are required first.");
            return;
        }

        // Check required local inputs (Name and Goal)
        if (!factionName.trim() || !factionGoal.trim()) {
            setErrorMessage('Please enter a Faction Name and Goal.');
            return;
        }
        // --- End Validation ---


        setIsLoading(true); // Start loading state
        setErrorMessage(''); // Clear previous errors


        try {
            // Prepare input data for the API call
            const inputData = {
                name: factionName,
                type: factionType, // Include selected type
                goal: factionGoal
            };

            // Call the API service function to generate the faction
            // This function includes authentication headers
            const result = await generateFaction(inputData);

            // Call the callback function from AppLayout to update central state
            // 'factions' is the key used in AppLayout's worldData state for this data type
            // 'result' is expected to be the generated faction data (e.g., { "Faction Name": {...} })
            if (onDataGenerated) {
                 onDataGenerated('factions', result);
            }

            // Optional: Clear inputs after successful submission for new entry
            // setFactionName('');
            // setFactionGoal('');
            // setFactionType(factionTypes[0]); // Reset type to default


        } catch (error) {
            console.error('Faction Generation Error:', error); // Log the error
            // Display the error message from the apiService (which includes backend details)
             setErrorMessage(error.message || 'An error occurred during faction generation.');

        } finally {
            setIsLoading(false); // End loading state
        }
    };


    // --- Component Render ---
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%', // Take full width of parent container
        }}>
            <Typography component="h2" variant="h5" sx={{ mb: 2, color: 'white' }}>
                ③ Generate Factions
            </Typography>
             <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Create organizations, guilds, political groups, or secret societies.
             </Typography>


            {/* Display feedback messages (error or success if using success state) */}
            {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

            {/* Form for generation inputs and button */}
            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                 <Grid container spacing={2}> {/* Use MUI Grid for a 2-column layout */}
                     <Grid item xs={12} sm={6}> {/* First column (Name & Type) */}
                          <TextField
                              margin="normal" // Standard spacing
                              required // Mark as required
                              fullWidth // Take full width of the grid item
                              id="factionName"
                              label="Faction Name"
                              name="factionName"
                              value={factionName}
                              onChange={handleNameChange}
                              // Disable based on loading state, LLM, and prerequisites
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                              InputLabelProps={{ style: { color: '#94a3b8' } }} // Style label color
                              InputProps={{ style: { color: '#e2e8f0' } }} // Style input text color
                              sx={{
                                   '& .MuiOutlinedInput-root': { // Style border colors
                                       fieldset: { borderColor: '#475569' },
                                       '&:hover fieldset': { borderColor: '#64748b' },
                                       '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                   },
                               }}
                          />
                          <FormControl fullWidth margin="normal" sx={{ mt: 2 }}> {/* Add margin top */}
                               <InputLabel id="faction-type-label" sx={{ color: '#94a3b8' }}>
                                   Faction Type
                               </InputLabel>
                               <Select
                                   labelId="faction-type-label"
                                   id="faction-type-select"
                                   value={factionType}
                                   label="Faction Type"
                                   onChange={handleTypeChange}
                                   disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                                   sx={{
                                        color: '#e2e8f0', // Text color
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#64748b' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                                        '.MuiSvgIcon-root': { color: '#e2e8f0' }, // Dropdown arrow color
                                    }}
                                    // Style the dropdown menu paper
                                    MenuProps={{ PaperProps: { sx: { bgcolor: '#1e293b', color: '#e2e8f0' } } }}
                               >
                                   {/* Map through the predefined faction types */}
                                   {factionTypes.map((type) => (
                                       <MenuItem key={type} value={type}>{type}</MenuItem>
                                   ))}
                               </Select>
                          </FormControl>
                     </Grid>
                     <Grid item xs={12} sm={6}> {/* Second column (Goal) */}
                          <TextField
                              margin="normal" // Standard spacing
                              required // Mark as required
                              fullWidth // Take full width of the grid item
                              multiline // Allow multiple lines
                              rows={5} // Set visible rows (adjust to align roughly with col1 height)
                              id="factionGoal"
                              label="Primary Goal / Motivation"
                              name="factionGoal"
                              value={factionGoal}
                              onChange={handleGoalChange}
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
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
                     </Grid>
                 </Grid>


                {/* Submit Button */}
                <Button
                    type="submit" // Make it a submit button
                    fullWidth // Take full width of container
                    variant="contained" // Styled button
                    sx={{
                        mt: 3, // Add margin top to separate from form fields
                        mb: 3, // Add margin bottom
                        bgcolor: '#4f46e5', // Tailwind indigo-600
                        '&:hover': { bgcolor: '#4338ca' }, // Darker indigo on hover
                        textTransform: 'none', // Prevent uppercase button text
                        fontSize: '1.125rem', // Larger font size
                        fontWeight: '600', // Semi-bold font weight
                    }}
                    // Disable if loading, prerequisites not met, or required inputs missing
                    disabled={isLoading || !prerequisitesMet || !isLLMInitialized || !factionName.trim() || !factionGoal.trim()}
                >
                   {/* Show loading spinner or button text */}
                   {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Faction'}
                </Button>

                 {/* Messages if prerequisites not met */}
                 {!isLLMInitialized && !isLoading && (
                     <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         LLM provider is not initialized. Go to Settings (in sidebar) to configure it.
                     </Typography>
                 )}
                 {!prerequisitesMet && isLLMInitialized && !isLoading && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         World Seed (Tab ①) and Cultural Tapestry (Tab ②) are required first.
                      </Typography>
                 )}

            </Box>

             {/* Display Generated Factions Data */}
             {/* Pass the relevant section of worldData from AppLayout (worldData.factions) */}
             {/* Use optional chaining ?. to prevent errors if factions is null/undefined */}
            <DisplayGeneratedData header="Generated Factions:" data_dict={worldData?.factions} />


        </Box>
    );
};


export default FactionsTab; // Export the component