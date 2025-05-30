// frontend/src/components/EventsTab.jsx

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
import { generateEvent } from '../api/apiService';

// Import the reusable data display helper
import DisplayGeneratedData from './DisplayGeneratedData'; // Assuming helper is in the same directory


// Event Types based on original Streamlit code
const eventTypes = [
    "Conflict", "Celebration", "Discovery", "Disaster", "Birth/Death", "Political Event", "Other"
];


// Accept props from AppLayout (worldData, isLLMInitialized, onDataGenerated)
const EventsTab = ({ worldData, isLLMInitialized, onDataGenerated }) => {
    // Local state for input fields
    const [eventName, setEventName] = useState('');
    const [eventType, setEventType] = useState(eventTypes[0]); // Default to first type
    const [participants, setParticipants] = useState('');
    const [summary, setSummary] = useState('');
    const [entitySelection, setEntitySelection] = useState('None'); // State for the dropdown value

    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // State to hold the options for the Associated Entity dropdown
    const [entityOptions, setEntityOptions] = useState(['None']);

    // Check prerequisites: World Seed, Culture, Factions, Characters, AND Locations must be generated
    // Aligning with the Streamlit code check
    const worldSeedGenerated = worldData?.physical_world && Object.keys(worldData.physical_world).length > 0;
    const cultureGenerated = worldData?.culture && Object.keys(worldData.culture).length > 0;
    const factionsGenerated = worldData?.factions && Object.keys(worldData.factions).length > 0;
    const charactersGenerated = worldData?.characters && Object.keys(worldData.characters).length > 0;
    const locationsGenerated = worldData?.locations && Object.keys(worldData.locations).length > 0;
    const prerequisitesMet = worldSeedGenerated && cultureGenerated && factionsGenerated && charactersGenerated && locationsGenerated;


    // --- Effects ---
    // Effect to update the entity options for the dropdown when worldData changes
    // Same logic as in CharactersTab and LocationsTab
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
    const handleNameChange = (event) => { setEventName(event.target.value); setErrorMessage(''); };
    const handleTypeChange = (event) => { setEventType(event.target.value); setErrorMessage(''); };
    const handleParticipantsChange = (event) => { setParticipants(event.target.value); setErrorMessage(''); };
    const handleSummaryChange = (event) => { setSummary(event.target.value); setErrorMessage(''); };
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
            setErrorMessage("World Seed (Tab ①), Culture (Tab ②), Factions (Tab ③), Characters (Tab ④), AND Locations (Tab ⑤) are required first.");
            return;
        }

        // Check required local inputs (Name, Type, Participants, Summary)
        if (!eventName.trim() || !eventType.trim() || !participants.trim() || !summary.trim()) {
            setErrorMessage('Please enter Event Name, Type, Participants, and Summary.');
            return;
        }
        // --- End Validation ---


        setIsLoading(true); // Start loading state
        setErrorMessage(''); // Clear previous errors


        try {
            // Prepare input data for the API call
            const inputData = {
                name: eventName,
                type: eventType,
                participants: participants, // Key name from backend schema
                summary: summary, // Key name from backend schema
                // Only include 'associated_entity' if a valid entity was selected (not 'None')
                associated_entity: entitySelection !== 'None' ? entitySelection : null,
            };

            // Call the API service function
            const result = await generateEvent(inputData);

            // Call the callback from AppLayout to update central state
            // 'events' is the key used in AppLayout's worldData state
            // 'result' is expected to be the generated event data (e.g., { "Event Name": { details... } })
            if (onDataGenerated) {
                 onDataGenerated('events', result);
            }

            // Optional: Clear inputs after successful submission
            // setEventName('');
            // setEventType(eventTypes[0]);
            // setParticipants('');
            // setSummary('');
            // setEntitySelection('None');


        } catch (error) {
            console.error('Event Generation Error:', error); // Log the error
            // Display the error message from the apiService
             setErrorMessage(error.message || 'An error occurred during event generation.');

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
                ⑦ Generate Events
            </Typography>
             <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Create significant occurrences that shape the world's history.
             </Typography>


            {/* Display feedback messages */}
            {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

            {/* Form for generation inputs and button */}
            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }} onSubmit={handleSubmit}>

                 <Grid container spacing={2}> {/* Use MUI Grid for layout */}
                     <Grid item xs={12} sm={6}> {/* First column (Name, Type, Associated Entity) */}
                          <TextField
                              margin="normal" required fullWidth
                              id="eventName" label="Event Name" name="eventName"
                              value={eventName} onChange={handleNameChange}
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                              InputLabelProps={{ style: { color: '#94a3b8' } }}
                              InputProps={{ style: { color: '#e2e8f0' } }}
                              sx={{ '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#64748b' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
                          />
                          <FormControl fullWidth margin="normal">
                               <InputLabel id="event-type-label" sx={{ color: '#94a3b8' }}>
                                   Event Type
                               </InputLabel>
                               <Select
                                   labelId="event-type-label"
                                   id="event-type-select"
                                   value={eventType}
                                   label="Event Type"
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
                                   {eventTypes.map((type) => (
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
                     <Grid item xs={12} sm={6}> {/* Second column (Participants, Summary) */}
                         <TextField
                              margin="normal" required fullWidth multiline
                              rows={4} // Adjust rows
                              id="participants" label="Key Participants / Entities" name="participants"
                              value={participants} onChange={handleParticipantsChange}
                              disabled={isLoading || !isLLMInitialized || !prerequisitesMet}
                              InputLabelProps={{ style: { color: '#94a3b8' } }}
                              InputProps={{ style: { color: '#e2e8f0' } }}
                              sx={{ '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#64748b' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
                          />
                          <TextField
                              margin="normal" required fullWidth multiline
                              rows={4} // Adjust rows
                              id="summary" label="Brief Summary / Concept" name="summary"
                              value={summary} onChange={handleSummaryChange}
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
                    disabled={isLoading || !prerequisitesMet || !isLLMInitialized || !eventName.trim() || !eventType.trim() || !participants.trim() || !summary.trim()}
                >
                   {/* Show loading spinner or button text */}
                   {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Event'}
                </Button>

                 {/* Messages if prerequisites not met */}
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

            </Box>

             {/* Display Generated Events Data */}
            <DisplayGeneratedData header="Generated Events:" data_dict={worldData?.events} />


        </Box>
    );
};


export default EventsTab; // Export the component