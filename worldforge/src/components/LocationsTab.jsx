// frontend/src/components/LocationsTab.jsx

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
import { generateLocation } from '../api/apiService';

// Import the reusable data display helper
import DisplayGeneratedData from './DisplayGeneratedData'; // Assuming helper is in the same directory


// Location Types based on original Streamlit code
const locationTypes = [
    "City", "Town", "Village", "Dungeon", "Wilderness Area", "Specific Landmark", "Other"
];


// Accept props from AppLayout (worldData, isLLMInitialized, onDataGenerated)
const LocationsTab = ({ worldData, isLLMInitialized, onDataGenerated }) => {
    // Local state for input fields
    const [locationName, setLocationName] = useState('');
    const [locationType, setLocationType] = useState(locationTypes[0]); // Default to first type
    const [keyFeatures, setKeyFeatures] = useState('');
    const [description, setDescription] = useState('');
    const [entitySelection, setEntitySelection] = useState('None'); // State for the dropdown value

    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // State to hold the options for the Associated Entity dropdown
    const [entityOptions, setEntityOptions] = useState(['None']);

    // Check prerequisites: World Seed AND Cultural Tapestry must be generated
    // Aligning with the Streamlit code check
    const worldSeedGenerated = worldData?.physical_world && Object.keys(worldData.physical_world).length > 0;
    const cultureGenerated = worldData?.culture && Object.keys(worldData.culture).length > 0;
    const prerequisitesMet = worldSeedGenerated && cultureGenerated;


    // --- Effects ---
    // Effect to update the entity options for the dropdown when worldData changes
    // Same logic as in CharactersTab
    useEffect(() => {
        const names = [];
        // Collect names from all relevant generated data sections
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

        // Reset selection if the previously selected entity was removed
        if (entitySelection !== 'None' && !sortedNames.includes(entitySelection)) {
             setEntitySelection('None');
        }

    }, [worldData, entitySelection]); // Depend on worldData prop and current selection


    // --- Handlers for form inputs ---
    const handleNameChange = (event) => { setLocationName(event.target.value); setErrorMessage(''); };
    const handleTypeChange = (event) => { setLocationType(event.target.value); setErrorMessage(''); };
    const handleFeaturesChange = (event) => { setKeyFeatures(event.target.value); setErrorMessage(''); };
    const handleDescriptionChange = (event) => { setDescription(event.target.value); setErrorMessage(''); };
    const handleEntitySelectChange = (event) => { setEntitySelection(event.target.value); setErrorMessage(''); };


    // --- Handler for form submission ---
    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default browser form submission

        // --- Frontend Validation ---
        if (!isLLMInitialized) {
            setErrorMessage("LLM provider not initialized. Go to Settings and apply settings first.");
            return;
        }

        if (!prerequisitesMet) {
            setErrorMessage("World Seed (Tab ①) and Cultural Tapestry (Tab ②) are required first.");
            return;
        }

        // Check required local inputs (Name, Type, Features, Description)
        if (!locationName.trim() || !locationType.trim() || !keyFeatures.trim() || !description.trim()) {
            setErrorMessage('Please enter Location Name, Type, Key Features, and Description.');
            return;
        }
        // --- End Validation ---


        setIsLoading(true); // Start loading state
        setErrorMessage(''); // Clear previous errors


        try {
            // Prepare input data for the API call
            const inputData = {
                name: locationName,
                type: locationType,
                features: keyFeatures,
                description: description,
                // Only include 'associated_entity' if a valid entity was selected (not 'None')
                associated_entity: entitySelection !== 'None' ? entitySelection : null,
            };

            // Call the API service function
            const result = await generateLocation(inputData);

            // Call the callback from AppLayout to update central state
            // 'locations' is the key used in AppLayout's worldData state
            // 'result' is expected to be the generated location data (e.g., { "Location Name": { details... } })
            if (onDataGenerated) {
                 onDataGenerated('locations', result);
            }

            // Optional: Clear inputs after successful submission
            // setLocationName('');
            // setLocationType(locationTypes[0]);
            // setKeyFeatures('');
            // setDescription('');
            // setEntitySelection('None');


        } catch (error) {
            console.error('Location Generation Error:', error); // Log the error
            // Display the error message from the apiService
             setErrorMessage(error.message || 'An error occurred during location generation.');

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
                ⑤ Generate Locations
            </Typography>
             <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Create specific places within your world, from cities to dungeons.
             </Typography>


            {/* Display feedback messages */}
            {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

            {/* Form for generation inputs and button */}
            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                 <Grid container spacing={2}> {/* Use MUI Grid for layout */}
                     <Grid item xs={12} sm={6}> {/* First column (Name, Type) */}
                          <TextField
                              margin="normal" required fullWidth
                              id="locationName" label="Location Name" name="locationName"
                              value={locationName} onChange={handleNameChange}
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                              InputLabelProps={{ style: { color: '#94a3b8' } }}
                              InputProps={{ style: { color: '#e2e8f0' } }}
                              sx={{ '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#64748b' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
                          />
                          <FormControl fullWidth margin="normal">
                               <InputLabel id="location-type-label" sx={{ color: '#94a3b8' }}>
                                   Location Type
                               </InputLabel>
                               <Select
                                   labelId="location-type-label"
                                   id="location-type-select"
                                   value={locationType}
                                   label="Location Type"
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
                                   {locationTypes.map((type) => (
                                       <MenuItem key={type} value={type}>{type}</MenuItem>
                                   ))}
                               </Select>
                          </FormControl>
                           <FormControl fullWidth margin="normal"> {/* Associated Entity Select */}
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
                                {entityOptions.length <= 1 && isLLMInitialized && prerequisitesMet && !isLoading && ( // Message if no entities generated yet
                                     <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                                         Generate some Factions, Characters, Locations, etc. to associate here.
                                     </Typography>
                                )}
                          </FormControl>
                     </Grid>
                     <Grid item xs={12} sm={6}> {/* Second column (Features, Description) */}
                         <TextField
                              margin="normal" required fullWidth multiline
                              rows={4} // Adjust rows
                              id="keyFeatures" label="Key Features" name="keyFeatures"
                              value={keyFeatures} onChange={handleFeaturesChange}
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                              InputLabelProps={{ style: { color: '#94a3b8' } }}
                              InputProps={{ style: { color: '#e2e8f0' } }}
                              sx={{ '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#64748b' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
                          />
                          <TextField
                              margin="normal" required fullWidth multiline
                              rows={4} // Adjust rows
                              id="description" label="Description" name="description"
                              value={description} onChange={handleDescriptionChange}
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
                    // Disable if loading, prerequisites not met, or required inputs missing
                    disabled={isLoading || !prerequisitesMet || !isLLMInitialized || !locationName.trim() || !locationType.trim() || !keyFeatures.trim() || !description.trim()}
                >
                   {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Location'}
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

             {/* Display Generated Locations Data */}
            <DisplayGeneratedData header="Generated Locations:" data_dict={worldData?.locations} />


        </Box>
    );
};


export default LocationsTab; // Export the component