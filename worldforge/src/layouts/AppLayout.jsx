// frontend/src/layouts/AppLayout.jsx

import React, { useState, useEffect } from 'react';
import { Box, Drawer, CssBaseline, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Container, CircularProgress } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CasinoIcon from '@mui/icons-material/Casino'; // Example icons
import PublicIcon from '@mui/icons-material/Public';
import BookIcon from '@mui/icons-material/Book';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DiamondIcon from '@mui/icons-material/Diamond';
import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import ChatIcon from '@mui/icons-material/Chat';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

// Import necessary components/views
import SettingsView from '../components/SettingsView';
import WorldSeedTab from '../components/WorldSeedTab';
import CultureTab from '../components/CultureTab';
import FactionsTab from '../components/FactionsTab';
import CharactersTab from '../components/CharactersTab';
import LocationsTab from '../components/LocationsTab';
import ArtifactsTab from '../components/ArtifactsTab';
import EventsTab from '../components/EventsTab';
import SimulateTab from '../components/SimulateTab';
import ChatTab from '../components/ChatTab';
import ViewDataTab from '../components/ViewDataTab';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// >>> IMPORT API SERVICE FUNCTIONS NEEDED HERE <<<
import { fetchProvidersList, initLLM, generateWorldSeed } from '../api/apiService'; // Import functions needed for data fetching/initialization
// >>> END IMPORT <<<


const drawerWidth = 240;

// Define the list of main menu items
// Make sure the 'component' key matches the string used in activeComponent state
const mainMenuItems = [
    { text: 'Settings', icon: <SettingsIcon />, component: 'settings' },
    { text: 'World Seed', icon: <PublicIcon />, component: 'world-seed' },
    { text: 'Cultural Tapestry', icon: <BookIcon />, component: 'culture' },
    { text: 'Factions', icon: <GroupsIcon />, component: 'factions' },
    { text: 'Characters', icon: <PeopleIcon />, component: 'characters' },
    { text: 'Locations', icon: <LocationOnIcon />, component: 'locations' },
    { text: 'Artifacts', icon: <DiamondIcon />, component: 'artifacts' },
    { text: 'Events', icon: <EventIcon />, component: 'events' },
    { text: 'Simulate Interaction', icon: <CasinoIcon />, component: 'simulate' },
    { text: 'World Chat', icon: <ChatIcon />, component: 'chat' },
    { text: 'View World Data', icon: <DataObjectIcon />, component: 'view-data' },
];

const AppLayout = () => {
     const navigate = useNavigate();
     const { user, logout, isAuthLoading } = useAuth();

     // --- CENTRALIZED STATE ---
     // State for fetched LLM providers list
     const [providers, setProviders] = useState({});
     // State to track LLM initialization status and selected provider
     const [isLLMInitialized, setIsLLMInitialized] = useState(false);
     const [initializedProviderKey, setInitializedProviderKey] = useState('');
     // State to hold all generated world data
     const [worldData, setWorldData] = useState({
          physical_world: {},
          culture: {},
          factions: {},
          characters: {},
          locations: {},
          artifacts: {},
          events: {},
          interactions: [], // Initialize interactions as an empty array
          chat_history: [], // Initialize chat_history as an empty array (for later)
     }); // Object to hold seed, culture, factions, etc.
     const [layoutLoading, setLayoutLoading] = useState(false);
     const [layoutError, setLayoutError] = useState('');
     // --- END CENTRALIZED STATE ---


     // State to manage which component/view is currently displayed in the main content area
     const [activeComponent, setActiveComponent] = useState('settings'); // Default to settings

     // --- EFFECTS ---
     // Effect to redirect to auth if not logged in (Handled by ProtectedRoute, but also here for safety)
     useEffect(() => {
         console.log("AppLayout useEffect: user=", user, "isAuthLoading=", isAuthLoading); // Debug print
         if (!isAuthLoading && !user) {
             console.log("AppLayout useEffect: No user detected after loading, navigating to /auth"); // Debug print
             navigate('/auth');
         }
     }, [user, navigate, isAuthLoading]); // Re-run if user, navigate, or isAuthLoading changes

     // Effect to fetch providers list ONCE when AppLayout mounts
     useEffect(() => {
        console.log("AppLayout useEffect: Fetching providers list..."); // Debug print
        const loadProviders = async () => {
            setLayoutLoading(true);
            setLayoutError('');
            try {
                const providersData = await fetchProvidersList(); // Use imported apiService function
                setProviders(providersData);
                // Optional: Auto-select a default provider key here if needed (e.g., Mock)
                // You might also want to fetch current settings if a user reloads and was already initialized
            } catch (error) {
                console.error("AppLayout: Failed to fetch providers:", error); // Debug print
                setLayoutError(`Failed to load providers list: ${error.message}`);
            } finally {
                 setLayoutLoading(false);
            }
        };

        if (!isAuthLoading && user) { // Only load providers if not loading and user is logged in
            loadProviders();
        }

     }, [user, isAuthLoading]); // Depend on user and loading state


     // --- HANDLERS & STATE UPDATERS PASSED AS PROPS ---

     // Handler for sidebar item click
     const handleMenuItemClick = (componentName) => {
         console.log(`AppLayout: Menu item clicked: ${componentName}`); // Debug print
         setActiveComponent(componentName);
     };

     // Handle Logout
     const handleLogout = () => {
         console.log("AppLayout: Logging out..."); // Debug print
         logout(); // Call the logout function from AuthContext
         // The useEffect above (or ProtectedRoute) will handle the redirect to /auth
     };

     // Function called by SettingsView after successful LLM initialization
     const handleLLMInitialized = (providerKey) => {
         console.log(`AppLayout: LLM initialized with provider: ${providerKey}`); // Debug print
         setIsLLMInitialized(true);
         setInitializedProviderKey(providerKey);
         setLayoutError(''); // Clear layout error if settings were successful
         // Optionally switch to the World Seed tab after successful initialization
         // setActiveComponent('world-seed');
     };

     // Function called by generation tabs (like WorldSeedTab) after successful generation
      const handleDataGenerated = (dataType, data) => {
         console.log(`AppLayout: Data generated for ${dataType}:`, data);
         setWorldData(prevData => {
             const newData = { ...prevData }; // Start with previous data

             // Handle different data types
             if (dataType === 'physical_world') {
                 newData.physical_world = data; // Replace World Seed data
             } else if (dataType === 'culture') {
                 newData.culture = data; // Replace Culture data
             } else if (dataType === 'factions') {
                 // Factions data is an object where keys are faction names
                 // Assume 'data' is the new { "Faction Name": { details... } } object
                 // Merge the new faction(s) into the existing factions object
                 // Use || {} to ensure prevData.factions is an object even if undefined
                 newData.factions = { ...(newData.factions || {}), ...data };
             }
             else if (dataType === 'characters') {
                  // Characters data is an object where keys are character names
                  // Assume 'data' is the new { "Character Name": { details... } } object
                  newData.characters = { ...(newData.characters || {}), ...data }; // Merge new character(s)
             }
              else if (dataType === 'locations') {
                 // Locations data is an object where keys are location names
                 // Assume 'data' is the new { "Location Name": { details... } } object
                 newData.locations = { ...(newData.locations || {}), ...data }; // Merge new location(s)
             }

             else if (dataType === 'artifacts') {
                 // Artifacts data is an object where keys are artifact names
                 // Assume 'data' is the new { "Artifact Name": { details... } } object
                 newData.artifacts = { ...(newData.artifacts || {}), ...data }; // Merge new artifact(s)
             }
             else if (dataType === 'events') {
                  // Events data is an object where keys are event names
                  // Assume 'data' is the new { "Event Name": { details... } } object
                  newData.events = { ...(newData.events || {}), ...data }; // Merge new event(s)
              }
            else if (dataType === 'interaction_result') {
                 // >>> This is different: Interactions are a list. Append the new result. <<<
                 // Assume 'data' is the new interaction object { result: ..., timestamp: ..., ...}
                 // Add the new interaction object to the beginning of the interactions list (newest first)
                 newData.interactions = [data, ...(newData.interactions || [])];
             }
            else if (dataType === 'chat_message') {
                 // Chat messages are a list. Append the new message.
                 // Assume 'data' is the new message object { sender: ..., text: ..., timestamp: ..., ...}
                 // Add the new message object to the end of the chat_history list
                 newData.chat_history = [...(newData.chat_history || []), data];
             }

             console.log("AppLayout: Updated worldData:", newData); // Debug print the resulting state
             return newData; // Return the updated state
         });

         
         setLayoutError(''); // Clear layout error on successful generation
         // Optional: Switch to the View Data tab after generation for easy inspection
         // setActiveComponent('view-data');
     };

     // --- RENDER LOGIC ---

     // Function to render the active component based on state
     const renderActiveComponent = () => {
         // Pass central state and update handlers as props
        switch (activeComponent) {
            case 'settings':
                return (
                     <SettingsView
                         providers={providers} // Pass the fetched providers list
                         isLLMInitialized={isLLMInitialized} // Pass the initialization status
                         initializedProviderKey={initializedProviderKey} // Pass the key if initialized
                         onSettingsApplied={handleLLMInitialized} // Pass the callback
                         // You might need to pass API keys here if SettingsView needs to display them (careful with security)
                         // Or fetch/manage API key input state locally within SettingsView,
                         // only sending it via initLLM call. Let's keep API key input local to SettingsView.
                     />
                 );
            case 'world-seed':
                return (
                     <WorldSeedTab
                         worldData={worldData} // Pass the entire world data
                         isLLMInitialized={isLLMInitialized} // Pass initialization status
                         onDataGenerated={(data) => handleDataGenerated('physical_world', data)} // Pass callback to update physical_world
                         // WorldSeedTab also needs the API call function, but that's imported inside it from apiService
                     />
                 );
            case 'culture':
                return (
                     <CultureTab
                         worldData={worldData} // Pass the entire world data
                         isLLMInitialized={isLLMInitialized} // Pass initialization status
                         onDataGenerated={(data) => handleDataGenerated('culture', data)} // Pass dataType 'culture'
                     />
                 );
            case 'factions':
                 return (
                     <FactionsTab
                         worldData={worldData} // Pass the entire world data
                         isLLMInitialized={isLLMInitialized} // Pass initialization status
                         onDataGenerated={(data) => handleDataGenerated('factions', data)} // Pass dataType 'factions'
                     />
                 );
            case 'characters':
                 return (
                     <CharactersTab
                         worldData={worldData}
                         isLLMInitialized={isLLMInitialized}
                         onDataGenerated={(data) => handleDataGenerated('characters', data)} // Pass dataType 'characters'
                     />
                );
            
            case 'locations':
                 return (
                     <LocationsTab
                         worldData={worldData}
                         isLLMInitialized={isLLMInitialized}
                         onDataGenerated={(data) => handleDataGenerated('locations', data)} // Pass dataType 'locations'
                     />
                 );

             case 'artifacts':
                 return (
                     <ArtifactsTab
                         worldData={worldData}
                         isLLMInitialized={isLLMInitialized} // Note: Fixed typo here from previous response
                         onDataGenerated={(data) => handleDataGenerated('artifacts', data)} // Pass dataType 'artifacts'
                     />
                 );
            case 'events':
                 return (
                     <EventsTab
                         worldData={worldData}
                         isLLMInitialized={isLLMInitialized}
                         onDataGenerated={(data) => handleDataGenerated('events', data)} // Pass dataType 'events'
                     />
                 );

            case 'simulate':
                 return (
                     <SimulateTab
                         worldData={worldData} // Pass the entire world data (needed for entity lists)
                         isLLMInitialized={isLLMInitialized}
                         onDataGenerated={(data) => handleDataGenerated('interaction_result', data)} // Use 'interaction_result' as dataType
                     />
                 );
            case 'chat':
                 return (
                     <ChatTab
                         worldData={worldData} // Pass the entire world data (needed for history and context)
                         isLLMInitialized={isLLMInitialized}
                         onDataGenerated={(data) => handleDataGenerated('chat_message', data)} // Use 'chat_message' as dataType for individual messages
                     />
                 );
            case 'view-data':
                 return (
                     <ViewDataTab
                         worldData={worldData} // Pass the entire world data for display
                         // No onDataGenerated needed as this is a view-only tab
                     />
                 );

            default:
                // Default view or instruction
                return (
                     <Box sx={{ textAlign: 'center', mt: 4 }}>
                         <Typography variant="h5" sx={{ color: '#e2e8f0' }}>
                             Welcome to Worldforge AI
                         </Typography>
                         {user && (
                              <Typography variant="h6" sx={{ color: '#94a3b8', mt: 1 }}>
                                 Logged in as {user.username}
                              </Typography>
                         )}
                         <Typography variant="body1" sx={{ color: '#94a3b8', mt: 2 }}>
                            Select an option from the sidebar to start building your world.
                         </Typography>
                          {!isLLMInitialized && (
                               <Typography variant="body1" color="error" sx={{ mt: 2 }}>
                                  Please go to Settings and initialize an LLM provider first.
                               </Typography>
                           )}
                     </Box>
                 );
        }
     };


    // Show loading or error state for layout-level operations (like fetching providers)
    if (layoutLoading) {
        return (
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f172a', color: '#e2e8f0' }}>
                 <CircularProgress color="inherit" size={60} />
                 <Typography variant="h6" sx={{ ml: 2 }}>Loading application data...</Typography>
             </Box>
         );
    }
    if (layoutError) {
         return (
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f172a', color: '#e2e8f0' }}>
                 <Alert severity="error">Layout Error: {layoutError}</Alert>
             </Box>
         );
    }


    // If user is not logged in after loading, redirect (ProtectedRoute handles this)
    // This condition should ideally not be met if ProtectedRoute works correctly
    if (!user) {
        return null; // Or a simple message like "Redirecting..."
    }


    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}> {/* Ensure minHeight for full background */}
            <CssBaseline />

            {/* Sidebar (Drawer) */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                         width: drawerWidth,
                         boxSizing: 'border-box',
                         backgroundColor: '#1e293b', // Slate 800
                         color: '#e2e8f0', // Slate 200
                         borderRight: '1px solid #475569', // Slate 600 border
                         pt: { xs: 0, sm: 0, md: 2, lg: 2 }, // Adjust padding top
                         overflow: 'auto', // Allow sidebar content to scroll
                    },
                }}
            >
                <Box sx={{ overflowY: 'auto' }}> {/* Allow scrolling if content overflows */}
                     {/* Worldforge Title/Logo in Sidebar */}
                     <Box sx={{ textAlign: 'center', py: 2 }}>
                         <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 'bold' }}>
                             Worldforge AI
                         </Typography>
                          {user && (
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                  Logged in as: {user.username}
                              </Typography>
                          )}
                     </Box>
                     <Divider sx={{ bgcolor: '#475569', my: 1 }}/>


                    {/* Main Navigation List */}
                    <List>
                        {mainMenuItems.map((item) => (
                            <ListItem key={item.component} disablePadding> {/* Use component key for react list key */}
                                <ListItemButton
                                     onClick={() => handleMenuItemClick(item.component)}
                                     selected={activeComponent === item.component}
                                     sx={{
                                         '&.Mui-selected': {
                                             backgroundColor: '#334155',
                                             color: '#e2e8f0',
                                             '&:hover': { backgroundColor: '#475569' },
                                         },
                                         '&:hover': { backgroundColor: '#334155' },
                                         color: activeComponent === item.component ? '#e2e8f0' : '#94a3b8',
                                     }}
                                >
                                    <ListItemIcon sx={{ color: activeComponent === item.component ? '#e2e8f0' : '#94a3b8' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Divider sx={{ bgcolor: '#475569', my: 1 }}/>

                    {/* Logout Button */}
                    <List>
                         <ListItem disablePadding>
                             <ListItemButton onClick={handleLogout}>
                                  <ListItemIcon sx={{ color: '#f87171' }}>{/* Red 400 */}<ExitToAppIcon /></ListItemIcon>
                                  <ListItemText primary="Logout" sx={{ color: '#f87171' }} />
                             </ListItemButton>
                         </ListItem>
                    </List>

                </Box>
            </Drawer>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: '#0f172a',
                    p: 3,
                    width: `calc(100% - ${drawerWidth}px)`, // Explicitly define width
                    // Removed minHeight here to let flex container handle it
                    // overflowY: 'auto', // Allow main content to scroll if needed
                }}
            >
                {/* Content of the active view/tab */}
                 <Container maxWidth="lg">
                     {/* Display layout-level error if any */}
                     {layoutError && !layoutLoading && (
                         <Alert severity="error" sx={{ mb: 3 }}>
                              Layout Error: {layoutError}
                         </Alert>
                     )}
                     {/* Render the active component */}
                     {renderActiveComponent()}
                 </Container>

            </Box>
        </Box>
    );
};

export default AppLayout;