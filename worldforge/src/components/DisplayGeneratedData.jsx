// frontend/src/components/DisplayGeneratedData.jsx

import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Accordion, // Using Accordion for expander-like behavior (if needed for complex data)
    AccordionSummary,
    AccordionDetails,
    Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Helper component to display nested dictionary data using basic formatting
// This is a simplified translation of the Streamlit display_generated_data helper
const DisplayGeneratedData = ({ header, data_dict }) => { // Removed defaultExpanded as Accordion handles it
    if (!data_dict || Object.keys(data_dict).length === 0) {
        return null; // Don't render header if no data
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
                {header}
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#2d3748', color: '#e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)' }}>
                 {data_dict && Object.keys(data_dict).length > 0 ? (
                     Object.entries(data_dict).map(([key, value]) => {
                         // Basic rendering: check if value is string, array, or object
                         // You can expand this logic later for more complex data structures
                         const title = key.replace(/_/g, ' ').toUpperCase();

                         if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                             return (
                                 <Box key={key} sx={{ mb: 2 }}>
                                      <Typography variant="subtitle1" sx={{ color: '#94a3b8' }}>{title}:</Typography>
                                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{String(value)}</Typography>
                                      <Divider sx={{ bgcolor: '#475569', my: 1 }}/>
                                 </Box>
                             );
                         } else if (Array.isArray(value)) {
                             // Handle lists, maybe display items as JSON or formatted
                             return (
                                 <Box key={key} sx={{ mb: 2 }}>
                                      <Typography variant="subtitle1" sx={{ color: '#94a3b8' }}>{title}:</Typography>
                                      <Box sx={{ ml: 2 }}> {/* Indent list items */}
                                           {value.length > 0 ? (
                                                value.map((item, index) => (
                                                     <Box key={index} sx={{ mb: 1 }}>
                                                         <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>
                                                             {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)} {/* Display objects as JSON, others as strings */}
                                                         </Typography>
                                                         {index < value.length - 1 && <Divider sx={{ bgcolor: '#334155', my: 0.5 }}/>} {/* Divider between list items */}
                                                     </Box>
                                                ))
                                           ) : (
                                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>No items in this list.</Typography>
                                           )}
                                      </Box>
                                      <Divider sx={{ bgcolor: '#475569', my: 1 }}/> {/* Divider after the list */}
                                 </Box>
                             );
                         } else if (typeof value === 'object' && value !== null) {
                              // Handle nested objects - could use Accordion or just nested display
                              // For simplicity, let's just display nested objects as JSON for now
                              // Or you can recursively call DisplayGeneratedData here if you enhance it
                              return (
                                  <Box key={key} sx={{ mb: 2 }}>
                                       <Typography variant="subtitle1" sx={{ color: '#94a3b8' }}>{title}:</Typography>
                                        {/* Recursively call or display JSON */}
                                       <Box sx={{ ml: 2 }}>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>
                                                {JSON.stringify(value, null, 2)}
                                            </Typography>
                                       </Box>
                                       <Divider sx={{ bgcolor: '#475569', my: 1 }}/>
                                  </Box>
                              );
                         } else {
                            // Fallback for other types
                             return (
                                 <Box key={key} sx={{ mb: 2 }}>
                                      <Typography variant="subtitle1" sx={{ color: '#94a3b8' }}>{title}:</Typography>
                                      <Typography variant="body1" sx={{ color: '#94a3b8' }}>Cannot display data of type: {typeof value}</Typography>
                                      <Divider sx={{ bgcolor: '#475569', my: 1 }}/>
                                 </Box>
                             );
                         }
                     })
                 ) : (
                      <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                          No details were successfully generated.
                      </Typography>
                 )}
            </Paper>
        </Box>
    );
};

export default DisplayGeneratedData; // Export the component