import React from 'react';
import { Typography, Container } from '@mui/material';

const WorldforgeApp = () => {
    // This component will contain the main interface after the user logs in
    // Add navigation, world building tools, chat interface, etc. here

    return (
         <div className="min-h-screen antialiased bg-slate-900 text-slate-200 py-12">
            <Container component="main" maxWidth="lg">
                 <Typography variant="h4" component="h1" sx={{ color: 'white', textAlign: 'center', mb: 4 }}>
                    Welcome to Your Worldforge Dashboard!
                 </Typography>
                 <Typography variant="body1" sx={{ color: '#94a3b8', textAlign: 'center' }}>
                    (This is where your world-building interface will go after successful login/registration)
                 </Typography>
                 {/* Add actual app content here */}
            </Container>
         </div>
    );
};

export default WorldforgeApp; // Export the main app component