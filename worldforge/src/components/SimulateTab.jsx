// frontend/src/components/SimulateTab.jsx

import React, { useState, useEffect } from 'react'; // Import useEffect
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid, // Use Grid for layout columns
    Paper, // For displaying results
    Divider, // For separating results
} from '@mui/material';

// Import the API service function for this tab
import { simulateInteraction } from '../api/apiService';

// Import the reusable data display helper (optional, can format output directly)
// import DisplayGeneratedData from './DisplayGeneratedData';


// Interaction Types based on original Streamlit code
const interactionTypes = [
    "Friendly Conversation", "Argument/Conflict", "Trade/Exchange", "Meeting/Discussion", "Exploration", "Other"
];

// Interaction Settings (Location Types) based on original Streamlit code
const interactionSettings = [
     "City", "Town", "Village", "Dungeon", "Wilderness Area", "Specific Landmark", "Other"
];


// Accept props from AppLayout (worldData, isLLMInitialized, onDataGenerated)
const SimulateTab = ({ worldData, isLLMInitialized, onDataGenerated }) => {
    // Local state for input fields
    const [entity1Selection, setEntity1Selection] = useState('None');
    const [entity2Selection, setEntity2Selection] = useState('None');
    const [interactionType, setInteractionType] = useState(interactionTypes[0]);
    const [settingSelection, setSettingSelection] = useState(interactionSettings[0]);

    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // State to hold the options for Entity dropdowns (all generated entities + 'None')
    const [entityOptions, setEntityOptions] = useState(['None']);

    // Check prerequisites: World Seed, Culture, Factions, Characters, AND Locations must be generated
    // Aligning with the Streamlit code check
    const worldSeedGenerated = worldData?.physical_world && Object.keys(worldData.physical_world).length > 0;
    const cultureGenerated = worldData?.culture && Object.keys(worldData.culture).length > 0;
    const factionsGenerated = worldData?.factions && Object.keys(worldData.factions).length > 0;
    const charactersGenerated = worldData?.characters && Object.keys(worldData.characters).length > 0;
    const locationsGenerated = worldData?.locations && Object.keys(worldData.locations).length > 0;
    const prerequisitesMet = worldSeedGenerated && cultureGenerated && factionsGenerated && charactersGenerated && locationsGenerated;

     // Get the list of interactions from worldData (passed as prop)
     const interactionHistory = worldData?.interactions || []; // Assuming interactions is a list

    // --- Effects ---
    // Effect to update the entity options for the dropdowns when worldData changes
    // Collect names from all relevant generated data sections
    useEffect(() => {
        const names = [];
        if (worldData?.factions) {
            names.push(...Object.keys(worldData.factions));
        }
         if (worldData?.characters) {
            names.push(...Object.keys(worldData.characters));
        }
         if (worldData?.locations) {
            names.push(...Object.keys(worldData.locations));
        }
         if (worldData?.artifacts) {
            names.push(...Object.keys(worldData.artifacts));
        }
         if (worldData?.events) {
            names.push(...Object.keys(worldData.events));
        }

        // Add 'None' as the first option and sort the rest alphabetically
        const sortedNames = names.sort((a, b) => a.localeCompare(b));
        setEntityOptions(['None', ...sortedNames]);

        // Reset selections if the previously selected entity was removed
        if (entity1Selection !== 'None' && !sortedNames.includes(entity1Selection)) {
             setEntity1Selection('None');
        }
         if (entity2Selection !== 'None' && !sortedNames.includes(entity2Selection)) {
             setEntity2Selection('None');
        }

    }, [worldData, entity1Selection, entity2Selection]); // Depend on worldData prop and current selections


    // --- Handlers for form inputs ---
    const handleEntity1SelectChange = (event) => { setEntity1Selection(event.target.value); setErrorMessage(''); };
    const handleEntity2SelectChange = (event) => { setEntity2Selection(event.target.value); setErrorMessage(''); };
    const handleInteractionTypeChange = (event) => { setInteractionType(event.target.value); setErrorMessage(''); };
    const handleSettingSelectChange = (event) => { setSettingSelection(event.target.value); setErrorMessage(''); };


    // --- Handler for form submission ---
    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default browser form submission

        // --- Frontend Validation ---
        if (!isLLMInitialized) {
            setErrorMessage("LLM provider not initialized. Go to Settings and apply settings first.");
            return;
        }

        if (!prerequisitesMet) {
            setErrorMessage("World Seed (Tab ①), Culture (Tab ②), Factions (Tab ③), Characters (Tab ④), AND Locations (Tab ⑤) are required first.");
            return;
        }

        // Check required local inputs (Two entities selected, not 'None', and different)
        if (entity1Selection === 'None' || entity2Selection === 'None') {
             setErrorMessage('Please select two entities for the interaction.');
             return;
        }
         if (entity1Selection === entity2Selection) {
             setErrorMessage('Please select two DIFFERENT entities for the interaction.');
             return;
         }
         if (!interactionType.trim() || !settingSelection.trim()) {
             setErrorMessage('Please select an Interaction Type and Setting.');
             return;
         }
        // --- End Validation ---


        setIsLoading(true); // Start loading state
        setErrorMessage(''); // Clear previous errors


        try {
            // Prepare input data for the API call
            const inputData = {
                entity1_name: entity1Selection,
                entity2_name: entity2Selection,
                interaction_type: interactionType,
                setting: settingSelection, // Using the selected setting (Location Type)
            };

            // Call the API service function to simulate the interaction
            const result = await simulateInteraction(inputData);

            // Call the callback from AppLayout to update central state
            // 'interaction_result' is a chosen key to signify this data type
            // 'result' is expected to be the simulation result object
            if (onDataGenerated) {
                 onDataGenerated('interaction_result', result); // Pass dataType 'interaction_result'
            }

            // Optional: Clear inputs after submission, or keep them to run again
            // setEntity1Selection('None');
            // setEntity2Selection('None');
            // setInteractionType(interactionTypes[0]);
            // setSettingSelection(interactionSettings[0]);


        } catch (error) {
            console.error('Simulate Interaction Error:', error); // Log the error
            // Display the error message from the apiService
             setErrorMessage(error.message || 'An error occurred during simulation.');

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
                ⑧ Simulate Interaction
            </Typography>
             <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Simulate an interaction between two generated entities in a specific setting.
             </Typography>


            {/* Display feedback messages */}
            {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

            {/* Form for simulation inputs and button */}
            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                 <Grid container spacing={2}> {/* Use MUI Grid for layout */}
                     <Grid item xs={12} sm={6}> {/* First column (Entity 1 & Type) */}
                          <FormControl fullWidth margin="normal">
                               <InputLabel id="entity1-select-label" sx={{ color: '#94a3b8' }}>
                                   Select Entity 1
                               </InputLabel>
                               <Select
                                   labelId="entity1-select-label"
                                   id="entity1-select"
                                   value={entity1Selection}
                                   label="Select Entity 1"
                                   onChange={handleEntity1SelectChange}
                                    disabled={isLoading || !isLLMInitialized || !prerequisitesMet || entityOptions.length <= 1} // Disable if no entities generated
                                   sx={{
                                        color: '#e2e8f0',
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#64748b' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                                        '.MuiSvgIcon-root': { color: '#e2e8f0' },
                                    }}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: '#1e293b', color: '#e2e8f0' } } }}
                               >
                                   {entityOptions.map((name) => (
                                       <MenuItem key={`e1-${name}`} value={name} disabled={name === entity2Selection && name !== 'None'}>
                                            {name}
                                        </MenuItem>
                                   ))}
                               </Select>
                          </FormControl>

                           <FormControl fullWidth margin="normal">
                               <InputLabel id="interaction-type-label" sx={{ color: '#94a3b8' }}>
                                   Interaction Type
                               </InputLabel>
                               <Select
                                   labelId="interaction-type-label"
                                   id="interaction-type-select"
                                   value={interactionType}
                                   label="Interaction Type"
                                   onChange={handleInteractionTypeChange}
                                    disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                                   sx={{
                                        color: '#e2e8f0',
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#64748b' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                                        '.MuiSvgIcon-root': { color: '#e2e8f0' },
                                    }}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: '#1e293b', color: '#e2e8f0' } } }}
                               >
                                   {interactionTypes.map((type) => (
                                       <MenuItem key={type} value={type}>{type}</MenuItem>
                                   ))}
                               </Select>
                          </FormControl>
                     </Grid>
                     <Grid item xs={12} sm={6}> {/* Second column (Entity 2 & Setting) */}
                         <FormControl fullWidth margin="normal">
                               <InputLabel id="entity2-select-label" sx={{ color: '#94a3b8' }}>
                                   Select Entity 2
                               </InputLabel>
                               <Select
                                   labelId="entity2-select-label"
                                   id="entity2-select"
                                   value={entity2Selection}
                                   label="Select Entity 2"
                                   onChange={handleEntity2SelectChange}
                                    disabled={isLoading || !isLLMInitialized || !prerequisitesMet || entityOptions.length <= 1} // Disable if no entities generated
                                   sx={{
                                        color: '#e2e8f0',
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                                        '&:hover fieldset': { borderColor: '#64748b' },
                                        '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                        '.MuiSvgIcon-root': { color: '#e2e8f0' },
                                    }}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: '#1e293b', color: '#e2e8f0' } } }}
                               >
                                   {entityOptions.map((name) => (
                                       <MenuItem key={`e2-${name}`} value={name} disabled={name === entity1Selection && name !== 'None'}>
                                            {name}
                                        </MenuItem>
                                   ))}
                               </Select>
                          </FormControl>

                           <FormControl fullWidth margin="normal">
                               <InputLabel id="setting-select-label" sx={{ color: '#94a3b8' }}>
                                   Interaction Setting
                               </InputLabel>
                               <Select
                                   labelId="setting-select-label"
                                   id="setting-select"
                                   value={settingSelection}
                                   label="Interaction Setting"
                                   onChange={handleSettingSelectChange}
                                    disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                                   sx={{
                                        color: '#e2e8f0',
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                                        '&:hover fieldset': { borderColor: '#64748b' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                                        '.MuiSvgIcon-root': { color: '#e2e8f0' },
                                    }}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: '#1e293b', color: '#e2e8f0' } } }}
                               >
                                   {/* Use Location Types as settings */}
                                   {interactionSettings.map((setting) => (
                                       <MenuItem key={setting} value={setting}>{setting}</MenuItem>
                                   ))}
                               </Select>
                          </FormControl>
                     </Grid>
                 </Grid>


                {/* Submit Button */}
                <Button
                    type="submit" fullWidth variant="contained"
                    sx={{
                        mt: 3, mb: 3,
                        bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' },
                        textTransform: 'none', fontSize: '1.125rem', fontWeight: '600',
                    }}
                    // Disable if loading, prerequisites not met, or required inputs missing
                    disabled={isLoading || !prerequisitesMet || !isLLMInitialized || entity1Selection === 'None' || entity2Selection === 'None' || entity1Selection === entity2Selection || !interactionType.trim() || !settingSelection.trim()}
                >
                   {/* Show loading spinner or button text */}
                   {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Simulate Interaction'}
                </Button>

                 {/* Messages if prerequisites not met or no entities generated */}
                 {!isLLMInitialized && !isLoading && (
                     <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         LLM provider is not initialized. Go to Settings (in sidebar) to configure it.
                     </Typography>
                 )}
                 {!prerequisitesMet && isLLMInitialized && !isLoading && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         World Seed (Tab ①), Culture (Tab ②), Factions (Tab ③), Characters (Tab ④), AND Locations (Tab ⑤) are required first.
                      </Typography>
                 )}
                 {prerequisitesMet && !isLoading && entityOptions.length <= 1 && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         Please generate at least two different entities (Factions, Characters, Locations, Artifacts, or Events) to simulate an interaction.
                      </Typography>
                 )}


            </Box>

             {/* Display Interaction History */}
             <Box sx={{ mt: 4 }}>
                 <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
                     Interaction History:
                 </Typography>
                 {interactionHistory.length > 0 ? (
                      <Paper sx={{ p: 2, bgcolor: '#2d3748', color: '#e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)' }}>
                          {/* Map through the interactions list (displaying newest first as added in AppLayout) */}
                          {interactionHistory.map((interaction, index) => (
                              <Box key={index} sx={{ mb: 3, pb: 2, borderBottom: index < interactionHistory.length - 1 ? '1px solid #475569' : 'none' }}>
                                   <Typography variant="subtitle1" sx={{ color: '#94a3b8', mb: 1 }}>
                                       Interaction {interactionHistory.length - index} (at {new Date(interaction.timestamp).toLocaleString()}):
                                   </Typography>
                                    {/* Assuming interaction object has a 'result' key with the narrative text */}
                                   {interaction.result && (
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {interaction.result}
                                        </Typography>
                                   )}
                                   {/* Display other interaction details if they exist */}
                                    {interaction.entity1_name && interaction.entity2_name && (
                                         <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                                             Entities: {interaction.entity1_name} and {interaction.entity2_name}
                                         </Typography>
                                    )}
                                     {interaction.interaction_type && interaction.setting && (
                                         <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                                             Type: {interaction.interaction_type}, Setting: {interaction.setting}
                                         </Typography>
                                    )}

                              </Box>
                          ))}
                      </Paper>
                 ) : (
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                         No interactions simulated yet.
                      </Typography>
                 )}
             </Box>


        </Box>
    );
};


export default SimulateTab; // Export the component