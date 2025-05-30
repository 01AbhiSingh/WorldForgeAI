// frontend/src/components/ChatTab.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Paper,
} from '@mui/material';

import { sendChatMessage } from '../api/apiService';


// Accept props from AppLayout (worldData, isLLMInitialized, onDataGenerated)
const ChatTab = ({ worldData, isLLMInitialized, onDataGenerated }) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Assuming chat_history is a list in worldData
    const chatHistory = worldData?.chat_history || [];

    // Check prerequisites: LLM initialized and some world data generated (e.g., World Seed + Culture)
    const worldSeedGenerated = worldData?.physical_world && Object.keys(worldData.physical_world).length > 0;
    const cultureGenerated = worldData?.culture && Object.keys(worldData.culture).length > 0;
    const prerequisitesMet = worldSeedGenerated && cultureGenerated; // Minimal world data required for context

     // Ref for auto-scrolling chat history
     const chatHistoryRef = useRef(null);

    // --- Effects ---
    // Auto-scroll to the bottom when chat history updates
    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory]); // Depend on chatHistory


    // --- Handlers ---
    const handleMessageChange = (event) => {
        setMessage(event.target.value);
        setErrorMessage('');
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !isLoading && message.trim()) {
            event.preventDefault(); // Prevent newline in textarea
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!message.trim()) return;

        if (!isLLMInitialized) {
            setErrorMessage("LLM provider not initialized. Go to Settings and apply settings first.");
            return;
        }

         if (!prerequisitesMet) {
             setErrorMessage("Some world data is required first (Tabs ① & ②).");
             return;
         }

        setIsLoading(true);
        setErrorMessage('');

        const userMessage = message.trim();

        try {
            // Add user message to history immediately for better UX
            if (onDataGenerated) {
                 onDataGenerated('chat_message', { sender: 'user', text: userMessage, timestamp: new Date().toISOString() });
            }
            setMessage(''); // Clear input field

            const result = await sendChatMessage(userMessage);

            // Add AI response to history
            if (onDataGenerated && result?.response) {
                onDataGenerated('chat_message', { sender: 'ai', text: result.response, timestamp: new Date().toISOString() });
            } else if (result && !result?.response) {
                console.warn("Chat API returned unexpected structure:", result);
                setErrorMessage("Received unexpected response from AI.");
                 // Optionally add a generic AI message saying something went wrong
                 if (onDataGenerated) {
                      onDataGenerated('chat_message', { sender: 'ai', text: "Sorry, I couldn't process that message.", timestamp: new Date().toISOString() });
                 }
            }


        } catch (error) {
            console.error('Chat Error:', error);
             setErrorMessage(error.message || 'An error occurred during chat.');
             // Optionally add an error message to the chat history
             if (onDataGenerated) {
                  onDataGenerated('chat_message', { sender: 'ai', text: `Error: ${error.message || 'An error occurred.'}`, timestamp: new Date().toISOString(), isError: true });
             }

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', width: '100%' }}> {/* Adjust height as needed */}
            <Typography component="h2" variant="h5" sx={{ mb: 2, color: 'white' }}>
                ⑨ World Chat
            </Typography>
             <Typography variant="body1" sx={{ mb: 3, color: '#94a3b8' }}>
                Chat with the AI agent about your generated world.
             </Typography>

             {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

             {/* Chat History Display Area */}
            <Paper
                 ref={chatHistoryRef} // Attach ref here
                 sx={{
                    flexGrow: 1, // Takes available space
                    overflowY: 'auto', // Enable scrolling
                    p: 2, mb: 2,
                    bgcolor: '#2d3748', // Slate 700
                    color: '#e2e8f0', // Slate 200
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
                    display: 'flex', // Use flex to keep items at top
                    flexDirection: 'column', // Stack messages
                    gap: 1, // Space between messages
                }}
            >
                {chatHistory.length > 0 ? (
                    chatHistory.map((msg, index) => (
                        <Box
                            key={index}
                            sx={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', // Align messages
                                bgcolor: msg.sender === 'user' ? '#4f46e5' : '#475569', // Different background colors
                                color: msg.sender === 'user' ? 'white' : '#e2e8f0',
                                p: 1, borderRadius: 2,
                                maxWidth: '70%', // Limit message width
                                wordBreak: 'break-word', // Break long words
                                ...(msg.isError && { bgcolor: '#ef4444' }), // Red background for error messages
                            }}
                        >
                             <Typography variant="caption" sx={{ display: 'block', textAlign: msg.sender === 'user' ? 'right' : 'left', color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'rgba(226,232,240,0.7)' }}>
                                 {msg.sender === 'user' ? 'You' : 'AI'} at {new Date(msg.timestamp).toLocaleTimeString()}
                             </Typography>
                             <Typography variant="body1">{msg.text}</Typography>
                        </Box>
                    ))
                ) : (
                     <Typography variant="body2" sx={{ textAlign: 'center', color: '#94a3b8' }}>
                         Start the conversation!
                     </Typography>
                )}
            </Paper>

            {/* Message Input Area */}
            <Box component="form" noValidate sx={{ display: 'flex', gap: 1 }} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                 <TextField
                    fullWidth
                    variant="outlined"
                    label="Enter your message"
                    value={message}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress} // Allow sending with Enter key
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
                 <Button
                    variant="contained"
                    color="primary"
                    type="submit" // Set button type to submit
                    disabled={isLoading || !message.trim() || !isLLMInitialized || !prerequisitesMet}
                     sx={{
                         bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' },
                         textTransform: 'none', fontWeight: '600', minWidth: '100px'
                     }}
                 >
                     {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
                 </Button>
            </Box>

             {/* Messages if prerequisites not met */}
             {!isLLMInitialized && !isLoading && (
                 <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                     LLM provider is not initialized. Go to Settings (in sidebar) to configure it.
                 </Typography>
             )}
             {isLLMInitialized && !prerequisitesMet && !isLoading && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                     Some world data is required first (Tabs ① & ②).
                  </Typography>
             )}

        </Box>
    );
};


export default ChatTab; // Export the component