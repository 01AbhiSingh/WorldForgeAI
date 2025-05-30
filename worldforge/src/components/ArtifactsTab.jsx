// frontend/src/components/ArtifactsTab.jsx

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
import { generateArtifact } from '../api/apiService';

// Import the reusable data display helper
import DisplayGeneratedData from './DisplayGeneratedData'; // Assuming helper is in the same directory


// Artifact Types based on original Streamlit code
const artifactTypes = [
    "Weapon", "Armor", "Jewelry", "Talisman", "Container", "Tool", "Other"
];


// Accept props from AppLayout (worldData, isLLMInitialized, onDataGenerated)
const ArtifactsTab = ({ worldData, isLLMInitialized, onDataGenerated }) => {
    // Local state for input fields
    const [artifactName, setArtifactName] = useState('');
    const [artifactType, setArtifactType] = useState(artifactTypes[0]); // Default to first type
    const [properties, setProperties] = useState('');
    const [entitySelection, setEntitySelection] = useState('None'); // State for the dropdown value

    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // State to hold the options for the Associated Entity dropdown
    const [entityOptions, setEntityOptions] = useState(['None']);

    // Check prerequisites: World Seed, Cultural Tapestry, AND Locations must be generated
    // Aligning with the Streamlit code check
    const worldSeedGenerated = worldData?.physical_world && Object.keys(worldData.physical_world).length > 0;
    const cultureGenerated = worldData?.culture && Object.keys(worldData.culture).length > 0;
    const locationsGenerated = worldData?.locations && Object.keys(worldData.locations).length > 0; // New check
    const prerequisitesMet = worldSeedGenerated && cultureGenerated && locationsGenerated;


    // --- Effects ---
    // Effect to update the entity options for the dropdown when worldData changes
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
             // Can artifacts be associated with other artifacts? Yes.
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
    const handleNameChange = (event) => { setArtifactName(event.target.value); setErrorMessage(''); };
    const handleTypeChange = (event) => { setArtifactType(event.target.value); setErrorMessage(''); };
    const handlePropertiesChange = (event) => { setProperties(event.target.value); setErrorMessage(''); };
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
            setErrorMessage("World Seed (Tab ①), Cultural Tapestry (Tab ②), AND Locations (Tab ⑤) are required first.");
            return;
        }

        // Check required local inputs (Name, Type, Properties)
        if (!artifactName.trim() || !artifactType.trim() || !properties.trim()) {
            setErrorMessage('Please enter Artifact Name, Type, and Properties.');
            return;
        }
        // --- End Validation ---


        setIsLoading(true); // Start loading state
        setErrorMessage(''); // Clear previous errors


        try {
            // Prepare input data for the API call
            const inputData = {
                name: artifactName,
                type: artifactType,
                properties: properties, // Use the correct key based on backend expected input
                // Only include 'associated_entity' if a valid entity was selected (not 'None')
                associated_entity: entitySelection !== 'None' ? entitySelection : null,
            };

            // Call the API service function
            const result = await generateArtifact(inputData);

            // Call the callback from AppLayout to update central state
            // 'artifacts' is the key used in AppLayout's worldData state
            // 'result' is expected to be the generated artifact data (e.g., { "Artifact Name": { details... } })
            if (onDataGenerated) {
                 onDataGenerated('artifacts', result);
            }

            // Optional: Clear inputs after successful submission
            // setArtifactName('');
            // setArtifactType(artifactTypes[0]);
            // setProperties('');
            // setEntitySelection('None');


        } catch (error) {
            console.error('Artifact Generation Error:', error); // Log the error
            // Display the error message from the apiService
             setErrorMessage(error.message || 'An error occurred during artifact generation.');

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
                ⑥ Generate Artifacts
            </Typography>
             <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Create significant items or objects within your world.
             </Typography>


            {/* Display feedback messages */}
            {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

            {/* Form for generation inputs and button */}
            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                 <Grid container spacing={2}> {/* Use MUI Grid for layout */}
                     <Grid item xs={12} sm={6}> {/* First column (Name, Type) */}
                          <TextField
                              margin="normal" required fullWidth
                              id="artifactName" label="Artifact Name" name="artifactName"
                              value={artifactName} onChange={handleNameChange}
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                              InputLabelProps={{ style: { color: '#94a3b8' } }}
                              InputProps={{ style: { color: '#e2e8f0' } }}
                              sx={{ '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#64748b' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
                          />
                          <FormControl fullWidth margin="normal">
                               <InputLabel id="artifact-type-label" sx={{ color: '#94a3b8' }}>
                                   Artifact Type
                               </InputLabel>
                               <Select
                                   labelId="artifact-type-label"
                                   id="artifact-type-select"
                                   value={artifactType}
                                   label="Artifact Type"
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
                                   {artifactTypes.map((type) => (
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
                     <Grid item xs={12} sm={6}> {/* Second column (Properties) */}
                         <TextField
                              margin="normal" required fullWidth multiline
                              rows={6} // Adjust rows
                              id="properties" label="Desired Properties / Purpose" name="properties"
                              value={properties} onChange={handlePropertiesChange}
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
                    disabled={isLoading || !prerequisitesMet || !isLLMInitialized || !artifactName.trim() || !artifactType.trim() || !properties.trim()}
                >
                   {/* Show loading spinner or button text */}
                   {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Artifact'}
                </Button>

                 {/* Messages if prerequisites not met */}
                 {!isLLMInitialized && !isLoading && (
                     <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         LLM provider is not initialized. Go to Settings (in sidebar) to configure it.
                     </Typography>
                 )}
                 {!prerequisitesMet && isLLMInitialized && !isLoading && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                         World Seed (Tab ①), Cultural Tapestry (Tab ②), AND Locations (Tab ⑤) are required first.
                      </Typography>
                 )}

            </Box>

             {/* Display Generated Artifacts Data */}
            <DisplayGeneratedData header="Generated Artifacts:" data_dict={worldData?.artifacts} />


        </Box>
    );
};


export default ArtifactsTab; // Export the component