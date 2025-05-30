// frontend/src/components/ViewDataTab.jsx

import React from 'react';
import {
    Box,
    Typography,
    Accordion, // Using Accordion for collapsible sections
    AccordionSummary,
    AccordionDetails,
    Paper, // Optional: Wrap sections in Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Import the reusable data display helper
import DisplayGeneratedData from './DisplayGeneratedData'; // Assuming helper is in the same directory


// Accept props from AppLayout (worldData)
const ViewDataTab = ({ worldData }) => {

    // Check if any world data exists
    const hasData = worldData && Object.values(worldData).some(data =>
        (typeof data === 'object' && data !== null && Object.keys(data).length > 0) ||
        (Array.isArray(data) && data.length > 0)
    );

    // Define the order and titles for the sections
    const sections = [
        { key: 'physical_world', title: '① World Seed Details' },
        { key: 'culture', title: '② Cultural Tapestry Details' },
        { key: 'factions', title: '③ Factions Details' },
        { key: 'characters', title: '④ Characters Details' },
        { key: 'locations', title: '⑤ Locations Details' },
        { key: 'artifacts', title: '⑥ Artifacts Details' },
        { key: 'events', title: '⑦ Events Details' },
        { key: 'interactions', title: '⑧ Interaction History' },
        { key: 'chat_history', title: '⑨ World Chat History' },
        // Add other keys as needed if you expand worldData structure
    ];


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography component="h2" variant="h5" sx={{ mb: 2, color: 'white' }}>
                ⑩ View World Data
            </Typography>
             <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Review all generated world data.
             </Typography>

            {!hasData && (
                 <Typography variant="body1" sx={{ textAlign: 'center', color: '#94a3b8', mt: 4 }}>
                     No world data has been generated yet. Use the tabs in the sidebar to create content.
                 </Typography>
             )}

             {/* Map through sections and display data if it exists */}
             {sections.map(section => {
                 const data = worldData?.[section.key]; // Access data using optional chaining
                 // Check if data exists and is not empty (handle objects and arrays)
                 const sectionHasData = (typeof data === 'object' && data !== null && Object.keys(data).length > 0) || (Array.isArray(data) && data.length > 0);

                 if (sectionHasData) {
                     // For Interaction History and Chat History, DisplayGeneratedData might need adjustments
                     // or you could render them slightly differently if needed.
                     // For simplicity, we'll pass them to DisplayGeneratedData for now,
                     // which has basic handling for arrays.
                     return (
                         <Accordion key={section.key} defaultExpanded sx={{ mb: 2, bgcolor: '#1e293b', border: '1px solid #475569', '&:before': { display: 'none' } }}>
                             <AccordionSummary
                                 expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}
                                 sx={{ bgcolor: '#334155', color: '#e2e8f0', borderBottom: '1px solid #475569' }}
                             >
                                 <Typography variant="h6">{section.title}</Typography>
                             </AccordionSummary>
                             <AccordionDetails sx={{ p: 2 }}>
                                 {/* Pass the specific section data to DisplayGeneratedData */}
                                 {/* Note: For interactions/chat_history (arrays), you might format them explicitly here */}
                                 {/* rather than passing the whole array to DisplayGeneratedData if its array handling is basic. */}
                                 {/* Let's assume DisplayGeneratedData can handle the data structure passed. */}

                                  {section.key === 'interactions' ? (
                                       // Special rendering for interactions list if needed, or pass to helper
                                       // Example: Just display the list using JSON for now, or format it here
                                        <Box sx={{ color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                                             {/* You can add specific rendering for interactions here,
                                                 like mapping over the array and formatting each entry.
                                                 For now, passing the array to DisplayGeneratedData might work
                                                 depending on how you built the helper. If not,
                                                 map here: interactionHistory.map(...)
                                             */}
                                             {/* Re-using DisplayGeneratedData helper for list format */}
                                            <DisplayGeneratedData header="" data_dict={{ [section.key]: data }} /> {/* Pass array wrapped in object */}

                                        </Box>
                                   ) : section.key === 'chat_history' ? (
                                        // Special rendering for chat history list if needed
                                         <Box sx={{ color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                                             {/* Similar to interactions, map and format chat messages here */}
                                              {/* Re-using DisplayGeneratedData helper for list format */}
                                            <DisplayGeneratedData header="" data_dict={{ [section.key]: data }} /> {/* Pass array wrapped in object */}
                                         </Box>
                                   ) : (
                                        // Default rendering for dictionary-based data (Seed, Culture, Factions, etc.)
                                        <DisplayGeneratedData header="" data_dict={data} />
                                   )}

                             </AccordionDetails>
                         </Accordion>
                     );
                 }
                 return null; // Don't render section if no data
             })}

        </Box>
    );
};


export default ViewDataTab; // Export the component