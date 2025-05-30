// frontend/src/components/CharactersTab.jsx

import React, { useState, useEffect } from 'react'; // Import useEffect
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
import { generateCharacter } from '../api/apiService';

// Import the reusable data display helper
import DisplayGeneratedData from './DisplayGeneratedData'; // Assuming helper is in the same directory


// Accept props from AppLayout (worldData, isLLMInitialized, onDataGenerated)
const CharactersTab = ({ worldData, isLLMInitialized, onDataGenerated }) => {
    // Local state for input fields
    const [characterName, setCharacterName] = useState('');
    const [characterRole, setCharacterRole] = useState('');
    const [ethnicity, setEthnicity] = useState('');
    const [entitySelection, setEntitySelection] = useState('None'); // State for the dropdown value (renamed from factionSelection to entitySelection)
    const [characterQuirk, setCharacterQuirk] = useState('');

    // State for UI feedback (loading, error messages specific to this tab)
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // State to hold the options for the Associated Entity dropdown
    const [entityOptions, setEntityOptions] = useState(['None']);

    // Check prerequisite: Cultural Tapestry must be generated
    const cultureGenerated = worldData?.culture && Object.keys(worldData.culture).length > 0;
    const prerequisitesMet = cultureGenerated; // Character generation primarily needs Culture


    // --- Effects ---
    // Effect to update the entity options for the dropdown when worldData changes
    useEffect(() => {
        const names = [];
        // Collect names from all relevant generated data sections
        if (worldData?.factions) {
            names.push(...Object.keys(worldData.factions));
        }
         if (worldData?.characters) {
            // Include characters themselves as potential associations
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

        // Reset selection if the previously selected entity was removed
        if (entitySelection !== 'None' && !sortedNames.includes(entitySelection)) {
             setEntitySelection('None');
        }

    }, [worldData, entitySelection]); // Depend on worldData prop and current selection


    // --- Handlers for form inputs ---
    const handleNameChange = (event) => { setCharacterName(event.target.value); setErrorMessage(''); };
    const handleRoleChange = (event) => { setCharacterRole(event.target.value); setErrorMessage(''); };
    const handleEthnicityChange = (event) => { setEthnicity(event.target.value); setErrorMessage(''); };
    const handleEntitySelectChange = (event) => { setEntitySelection(event.target.value); setErrorMessage(''); }; // Updated handler name
    const handleQuirkChange = (event) => { setCharacterQuirk(event.target.value); setErrorMessage(''); };


    // --- Handler for form submission ---
    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default browser form submission

        // --- Frontend Validation ---
        if (!isLLMInitialized) {
            setErrorMessage("LLM provider not initialized. Go to Settings and apply settings first.");
            return;
        }

        if (!prerequisitesMet) {
            setErrorMessage("Cultural Tapestry (Tab ②) is required first.");
            return;
        }

        // Check required local inputs (Name, Role, Ethnicity)
        if (!characterName.trim() || !characterRole.trim() || !ethnicity.trim()) {
            setErrorMessage('Please enter Character Name, Role, and Ethnicity.');
            return;
        }
        // --- End Validation ---


        setIsLoading(true); // Start loading state
        setErrorMessage(''); // Clear previous errors


        try {
            // Prepare input data for the API call
            const inputData = {
                name: characterName,
                role: characterRole,
                ethnicity: ethnicity,
                // Only include 'faction' (or associated entity) in inputData if a valid entity was selected (not 'None')
                // Backend expects 'faction' key, even if it's an associated character/location etc.
                faction: entitySelection !== 'None' ? entitySelection : null, // Use the selected entity name or null
                // Include quirk if provided, otherwise null
                quirk: characterQuirk.trim() !== '' ? characterQuirk.trim() : null,
            };

            // Call the API service function
            const result = await generateCharacter(inputData);

            // Call the callback from AppLayout to update central state
            // 'characters' is the key used in AppLayout's worldData state
            // 'result' is expected to be the generated character data (e.g., { "Character Name": { details... } })
            if (onDataGenerated) {
                 onDataGenerated('characters', result);
            }

            // Optional: Clear inputs after successful submission for new entry
            // setCharacterName('');
            // setCharacterRole('');
            // setEthnicity('');
            // setEntitySelection('None'); // Reset select
            // setCharacterQuirk('');


        } catch (error) {
            console.error('Character Generation Error:', error); // Log the error
            // Display the error message from the apiService
             setErrorMessage(error.message || 'An error occurred during character generation.');

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
                ④ Generate Characters
            </Typography>
             <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Create individuals to populate your world.
             </Typography>


            {/* Display feedback messages */}
            {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

            {/* Form for generation inputs and button */}
            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                 <Grid container spacing={2}> {/* Use MUI Grid for a 2-column layout */}
                     <Grid item xs={12} sm={6}> {/* First column (Name, Role, Ethnicity) */}
                          <TextField
                              margin="normal" required fullWidth
                              id="characterName" label="Character Name" name="characterName"
                              value={characterName} onChange={handleNameChange}
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                              InputLabelProps={{ style: { color: '#94a3b8' } }}
                              InputProps={{ style: { color: '#e2e8f0' } }}
                              sx={{ '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#64748b' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
                          />
                          <TextField
                              margin="normal" required fullWidth
                              id="characterRole" label="Character Role / Profession" name="characterRole"
                              value={characterRole} onChange={handleRoleChange}
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                              InputLabelProps={{ style: { color: '#94a3b8' } }}
                              InputProps={{ style: { color: '#e2e8f0' } }}
                              sx={{ '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#64748b' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
                          />
                           <TextField
                              margin="normal" required fullWidth
                              id="ethnicity" label="Ethnicity / Cultural Background" name="ethnicity"
                              value={ethnicity} onChange={handleEthnicityChange}
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                              InputLabelProps={{ style: { color: '#94a3b8' } }}
                              InputProps={{ style: { color: '#e2e8f0' } }}
                              sx={{ '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#64748b' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
                          />
                     </Grid>
                     <Grid item xs={12} sm={6}> {/* Second column (Associated Entity & Quirk) */}
                         <FormControl fullWidth margin="normal" sx={{ mt: 2 }}> {/* Add margin top */}
                               <InputLabel id="entity-select-label" sx={{ color: '#94a3b8' }}>
                                   Associated Entity (Optional)
                               </InputLabel>
                               <Select
                                   labelId="entity-select-label"
                                   id="entity-select"
                                   value={entitySelection}
                                   label="Associated Entity (Optional)"
                                   onChange={handleEntitySelectChange}
                                    disabled={isLoading || !isLLMInitialized || !prerequisitesMet} // Disable if prerequisites not met
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
                                   {entityOptions.map((name) => (
                                       <MenuItem key={name} value={name}>{name}</MenuItem>
                                   ))}
                               </Select>
                                {entityOptions.length <= 1 && isLLMInitialized && prerequisitesMet && !isLoading && ( // Message if no entities generated yet (only 'None' is an option)
                                     <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                                         Generate some Factions, Characters, Locations, etc. to associate here.
                                     </Typography>
                                )}
                          </FormControl>

                          <TextField
                              margin="normal" fullWidth multiline
                              rows={3} // Adjust rows to align roughly with column 1 height
                              id="characterQuirk" label="Defining Quirk or Trait (Optional)" name="characterQuirk"
                              value={characterQuirk} onChange={handleQuirkChange}
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                              InputLabelProps={{ style: { color: '#94a3b8' } }}
                              InputProps={{ style: { color: '#e2e8f0' } }}
                              sx={{ '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#64748b' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
                          />
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
                    // Disable if loading, prerequisites not met, or required inputs missing (Name, Role, Ethnicity)
                    disabled={isLoading || !prerequisitesMet || !isLLMInitialized || !characterName.trim() || !characterRole.trim() || !ethnicity.trim()}
                >
                   {/* Show loading spinner or button text */}
                   {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Character'}
                </Button>

                 {/* Messages if prerequisites not met */}
                 {!isLLMInitialized && !isLoading && (
                     <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         LLM provider is not initialized. Go to Settings (in sidebar) to configure it.
                     </Typography>
                 )}
                 {!prerequisitesMet && isLLMInitialized && !isLoading && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         Cultural Tapestry (Tab ②) is required first.
                      </Typography>
                 )}

            </Box>

             {/* Display Generated Characters Data */}
            <DisplayGeneratedData header="Generated Characters:" data_dict={worldData?.characters} />


        </Box>
    );
};


export default CharactersTab; // Export the component