// frontend/src/api/apiService.js

// Define your backend API base URL
const API_BASE_URL = 'http://127.0.0.1:8000'; // Consider making this configurable

// Helper function to get the auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// Helper function to create headers including Authorization
const getAuthHeaders = () => {
    const token = getAuthToken();
    if (!token) {
        // In a real app, you might redirect to login or handle this differently
        console.error("No auth token found. User may not be logged in.");
         // Throwing an error here forces the calling code to handle the unauthenticated state
         throw new Error("Authentication token not found.");
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json', // Default to JSON for most new endpoints
    };
};


/**
 * Registers a new user by sending data to the backend.
 * @param {object} userData - The user data (e.g., { username: '', password: '' })
 * @returns {Promise<object>} - The registered user data (excluding password) on success
 * @throws {Error} - Throws an error if the request fails or returns a non-OK status
 */
export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred during registration' }));
        let errorMessage = `Registration failed: ${response.status}`;
         // Improved error formatting for FastAPI validation errors
         if (errorData.detail && Array.isArray(errorData.detail)) {
             errorMessage += " - Validation Errors:\n";
             errorData.detail.forEach(err => {
                 errorMessage += `- Field: ${err.loc.join(' -> ')}, Message: ${err.msg}\n`;
             });
         } else if (errorData.detail) {
             errorMessage += ` - ${errorData.detail}`;
         } else {
              errorMessage += ` - ${JSON.stringify(errorData)}`;
         }
        throw new Error(errorMessage);
    }

    return response.json();
};


/**
 * Logs in a user and retrieves an access token.
 * The backend /login endpoint expects form-urlencoded data due to OAuth2PasswordRequestForm.
 * @param {object} userData - The user data (e.g., { username: '', password: '' })
 * @returns {Promise<object>} - The token data ({ access_token: '', token_type: 'bearer', username: '' }) on success
 * @throws {Error} - Throws an error if the request fails or returns a non-OK status
 */
export const loginUser = async (userData) => {
     const formBody = new URLSearchParams(userData).toString();

     const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
         method: 'POST',
          headers: {
             'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody,
     });

     const data = await response.json().catch(() => ({ detail: 'Unknown error occurred during login' })); // Always try to parse error body

     if (!response.ok) {
          let errorMessage = `Login failed: ${response.status}`;
          // Handle 401 errors specifically if desired, otherwise generic message
          if (response.status === 401) {
              errorMessage = "Login failed: Invalid credentials.";
          } else if (data.detail) {
              errorMessage += ` - ${data.detail}`;
          } else {
               errorMessage += ` - ${JSON.stringify(data)}`;
          }
          throw new Error(errorMessage);
     }

     // Store the token and user info upon successful login
     if (data.access_token) {
         localStorage.setItem('authToken', data.access_token);
         // You might also store username or other user info if returned by login
         // localStorage.setItem('username', data.username);
     } else {
         console.warn("Login successful but no access_token received in response.");
     }


     return data; // Return the token data object
};


// --- New API Functions for AI Features ---

/**
 * Fetches the list of available LLM providers from the backend.
 * (Does NOT require authentication)
 * @returns {Promise<object>} - A dictionary of provider display names to keys.
 * @throws {Error}
 */
export const fetchProvidersList = async () => {
    const response = await fetch(`${API_BASE_URL}/api/settings/providers`);

    const data = await response.json().catch(() => ({ detail: 'Unknown error fetching providers' }));

    if (!response.ok) {
         throw new Error(`Failed to fetch providers: ${response.status} - ${data.detail || JSON.stringify(data)}`);
    }

    return data;
};


/**
 * Initializes the LLM provider and WorldBuilder on the backend for the current user.
 * Requires authentication (token).
 * @param {object} settingsData - { provider_key: string, api_key: string | null, hf_model_id: string | null }
 * @returns {Promise<object>} - Success message object.
 * @throws {Error} - Including 401 if not authenticated.
 */
export const initLLM = async (settingsData) => {
    // IMPORTANT: Add the Authorization header with the token
    const headers = getAuthHeaders(); // This throws if token is missing

    const response = await fetch(`${API_BASE_URL}/api/settings/init-llm`, {
        method: 'POST',
        headers: headers, // Include token and Content-Type
        body: JSON.stringify(settingsData),
    });

    const data = await response.json().catch(() => ({ detail: 'Unknown error initializing LLM' }));

    if (!response.ok) {
         // Handle specific backend errors (401, 400 validation/LLM init errors)
         if (response.status === 401) {
             throw new Error("Initialization failed: Not authenticated. Please log in.");
         }

         let errorMessage = `LLM Initialization failed: ${response.status}`;
         if (data.detail) {
             // Check for specific LLM initialization error detail string
             if (typeof data.detail === 'string' && data.detail.includes("Failed to initialize LLM provider:")) {
                  errorMessage = `LLM Initialization failed: ${data.detail}`; // Use backend's specific error
             } else if (typeof data.detail === 'string') {
                   errorMessage += ` - ${data.detail}`;
             } else {
                   // Handle validation errors or other structured details
                   errorMessage += ` - ${JSON.stringify(data.detail)}`;
             }
         } else {
              errorMessage += ` - ${JSON.stringify(data)}`;
         }
         throw new Error(errorMessage);
    }

    return data; // Should return { message: "..." }
};


/**
 * Triggers the backend to generate the initial World Seed.
 * Requires authentication (token).
 * Requires LLM to be initialized first via initLLM.
 * @param {object} promptData - { prompt: string }
 * @returns {Promise<object>} - The generated PhysicalWorldData object.
 * @throws {Error} - Including 401 if not authenticated or 400 if LLM not initialized.
 */
export const generateWorldSeed = async (promptData) => {
     // IMPORTANT: Add the Authorization header with the token
     const headers = getAuthHeaders(); // This throws if token is missing

     const response = await fetch(`${API_BASE_URL}/api/generation/seed`, {
          method: 'POST',
          headers: headers, // Include token and Content-Type
          body: JSON.stringify(promptData),
     });

     const data = await response.json().catch(() => ({ detail: 'Unknown error generating world seed' }));

     if (!response.ok) {
          // Handle specific backend errors (401, 400 LLM not initialized)
          if (response.status === 401) {
              throw new Error("World Seed generation failed: Not authenticated. Please log in.");
          }
          if (response.status === 400 && data.detail && typeof data.detail === 'string' && data.detail.includes("LLM provider not initialized")) {
               throw new Error("World Seed generation failed: LLM provider not initialized. Go to Settings.");
          }

          let errorMessage = `World Seed generation failed: ${response.status}`;
          if (data.detail) {
              errorMessage += ` - ${data.detail}`;
          } else {
               errorMessage += ` - ${JSON.stringify(data)}`;
          }
          throw new Error(errorMessage);
     }

     // *** CORRECTED: Removed the incorrect localStorage.setItem call ***
     return data; // Should return schemas.PhysicalWorldData object
};

/**
 * Sends a request to generate the world's cultural tapestry.
 * Requires authentication (token).
 * Requires a world seed (physical_world data) to have been generated first.
 * @param {object} data - The input data ({ societal_structure: string })
 * @returns {Promise<object>} - The generated cultural data object on success
 * @throws {Error}
 */
 export const generateCulturalTapestry = async (data) => {
     const headers = getAuthHeaders(); // Get auth headers (throws if token missing)

     const response = await fetch(`${API_BASE_URL}/api/generation/culture`, {
         method: 'POST',
         headers: {
             ...headers, // Include auth headers
             'Content-Type': 'application/json',
         },
         body: JSON.stringify(data), // Send input data as JSON
     });

     const responseBody = await response.text(); // Read as text first to handle potential non-JSON errors
     console.log("API Raw Response (Culture):", responseBody); // Log raw response for debugging

     if (!response.ok) {
          let errorMessage = `Cultural Tapestry generation failed: ${response.status}`;
          let errorData = null;
          try {
              errorData = JSON.parse(responseBody); // Try parsing as JSON
          } catch (e) {
              // If parsing fails, the body itself is the error message or not JSON
              errorMessage += ` - Non-JSON Response: ${responseBody.substring(0, Math.min(responseBody.length, 200))}...`;
              throw new Error(errorMessage);
          }

          // Handle specific backend errors based on parsed JSON
          if (errorData && errorData.detail) {
               if (typeof errorData.detail === 'string') {
                   if (errorData.detail.includes('LLM provider not initialized')) {
                        errorMessage = "LLM provider not initialized. Go to Settings (in sidebar) and apply settings first.";
                   } else if (errorData.detail.includes('Physical world data (World Seed) is missing')) { // Match the exact error message from backend
                         errorMessage = "World Seed is required first. Generate it in Tab ①.";
                   } else {
                         errorMessage += ` - ${errorData.detail}`;
                   }
               } else {
                    // Handle validation errors or other structured details
                    errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
               }
          } else {
               // Fallback if detail is missing but response was not ok
               errorMessage += ` - ${JSON.stringify(errorData)}`;
          }

          throw new Error(errorMessage);
     }

     // If response is OK, parse as JSON and return
     try {
         const result = JSON.parse(responseBody);
         return result; // Assuming the backend returns the generated cultural data object
     } catch (e) {
         console.error("Failed to parse JSON response for Cultural Tapestry:", e);
         throw new Error("Cultural Tapestry generation succeeded, but failed to parse response data.");
     }
 };

// You will add functions for Factions, Characters, Save/Load, etc. here later
// export const generateFactions = async (data) => { ... }
// export const saveWorld = async (data) => { ... }
// export const loadWorld = async () => { ... }

/**
 * Sends a request to generate a new faction.
 * Assumes backend endpoint is POST /api/generation/faction
 * Assumes backend requires World Seed and Cultural Tapestry prerequisites.
 * Assumes backend returns the newly generated faction data, potentially keyed by name.
 *
 * @param {object} data - The input data ({ name: string, type: string, goal: string })
 * @returns {Promise<object>} - The generated faction data object (e.g., { "Faction Name": { details... } }) on success
 * @throws {Error}
 */
export const generateFaction = async (data) => {
    const headers = getAuthHeaders(); // Get auth headers

    const response = await fetch(`${API_BASE_URL}/api/generation/faction`, {
        method: 'POST',
        headers: {
            ...headers, // Include auth headers (like Authorization: Bearer <token>)
            'Content-Type': 'application/json', // Send data as JSON
        },
        body: JSON.stringify(data), // Send the input data (name, type, goal)
    });

    // --- Error Handling ---
    if (!response.ok) {
         // Attempt to parse JSON error response, fallback to text
         const errorText = await response.text();
         console.error("API Error Response (Faction):", errorText); // Log the raw error response

         let errorMessage = `Faction generation failed: ${response.status}`;

         try {
             const errorData = JSON.parse(errorText);
             if (errorData.detail) {
                  // Check for specific backend error messages like validation failures
                 if (typeof errorData.detail === 'string') {
                     if (errorData.detail.includes('LLM provider not initialized')) {
                         errorMessage = "LLM provider not initialized. Go to Settings (in sidebar) and apply settings first.";
                     } else if (errorData.detail.includes('Cultural Tapestry data not found') || errorData.detail.includes('World Seed data not found')) {
                          // Assuming backend validates World Seed AND Culture
                          errorMessage = "World Seed (Tab ①) and Cultural Tapestry (Tab ②) are required first.";
                     } else {
                          errorMessage += ` - ${errorData.detail}`;
                     }
                 } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
                      // Handle FastAPI validation errors (pydantic)
                     errorMessage += ` - Validation error: ${errorData.detail[0].msg}`;
                 }
                 else { // Handle other unexpected JSON structures
                     errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
                 }
             } else { // Handle cases where the error response is JSON but doesn't have a 'detail' field
                 errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
             }
         } catch (e) {
             // If response wasn't JSON at all, just use the status and text
             errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
         }

        throw new Error(errorMessage); // Throw a new Error object with the constructed message
    }
    // --- End Error Handling ---


    const result = await response.json();
    // Assuming the backend returns the new faction data structured as an object keyed by the faction name
    // e.g., { "The Shadow Syndicate": { "details": {...}, "type": "Criminal", ... } }
    return result;
};

/**
 * Sends a request to generate a new character.
 * Assumes backend endpoint is POST /api/generation/character
 * Assumes backend requires Cultural Tapestry prerequisite.
 * Assumes backend returns the newly generated character data, keyed by name.
 *
 * @param {object} data - The input data ({ name: string, role: string, ethnicity: string, faction: string | null, quirk: string | null })
 * @returns {Promise<object>} - The generated character data object (e.g., { "Character Name": { details... } }) on success
 * @throws {Error}
 */
export const generateCharacter = async (data) => {
    const headers = getAuthHeaders(); // Get auth headers

    const response = await fetch(`${API_BASE_URL}/api/generation/character`, {
        method: 'POST',
        headers: {
            ...headers, // Include auth headers
            'Content-Type': 'application/json', // Send data as JSON
        },
        body: JSON.stringify(data), // Send the input data (name, role, ethnicity, faction, quirk)
    });

    // --- Error Handling ---
    if (!response.ok) {
         const errorText = await response.text();
         console.error("API Error Response (Character):", errorText);

         let errorMessage = `Character generation failed: ${response.status}`;
         try {
             const errorData = JSON.parse(errorText);
             if (errorData.detail) {
                  if (typeof errorData.detail === 'string') {
                     if (errorData.detail.includes('LLM provider not initialized')) {
                         errorMessage = "LLM provider not initialized. Go to Settings (in sidebar) and apply settings first.";
                     } else if (errorData.detail.includes('Cultural Tapestry data not found')) { // Assuming backend validates Culture exists
                          errorMessage = "Cultural Tapestry is required first (Tab ②).";
                     }
                      // You might add checks for other backend validation errors here if they exist
                     else {
                          errorMessage += ` - ${errorData.detail}`;
                     }
                 } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
                      // Handle FastAPI validation errors (pydantic)
                     errorMessage += ` - Validation error: ${errorData.detail[0].msg}`;
                 }
                 else { // Handle other unexpected JSON structures
                     errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
                 }
             } else { // Handle cases where the error response is JSON but doesn't have a 'detail' field
                 errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
             }
         } catch (e) {
             // If response wasn't JSON at all, just use the status and text
             errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
         }

        throw new Error(errorMessage); // Throw a new Error object with the constructed message
    }
    // --- End Error Handling ---

    const result = await response.json();
    // Assuming backend returns the new character data keyed by name: { "Character Name": { details... } }
    return result;
};

/**
 * Sends a request to generate a new location.
 * Assumes backend endpoint is POST /api/generation/location
 * Assumes backend requires World Seed AND Cultural Tapestry prerequisites.
 * Assumes backend returns the newly generated location data, keyed by name.
 *
 * @param {object} data - The input data ({ name: string, type: string, features: string, description: string, associated_entity: string | null })
 * @returns {Promise<object>} - The generated location data object (e.g., { "Location Name": { details... } }) on success
 * @throws {Error}
 */
export const generateLocation = async (data) => {
    const headers = getAuthHeaders(); // Get auth headers

    const response = await fetch(`${API_BASE_URL}/api/generation/location`, {
        method: 'POST',
        headers: {
            ...headers, // Include auth headers (like Authorization: Bearer <token>)
            'Content-Type': 'application/json', // Send data as JSON
        },
        body: JSON.stringify(data), // Send the input data
    });

    // --- Error Handling ---
    if (!response.ok) {
         // Attempt to parse JSON error response, fallback to text
         const errorText = await response.text();
         console.error("API Error Response (Location):", errorText); // Log the raw error response

         let errorMessage = `Location generation failed: ${response.status}`;
         try {
             const errorData = JSON.parse(errorText);
             if (errorData.detail) {
                  // Check for specific backend error messages like validation failures
                 if (typeof errorData.detail === 'string') {
                     if (errorData.detail.includes('LLM provider not initialized')) {
                         errorMessage = "LLM provider not initialized. Go to Settings (in sidebar) and apply settings first.";
                     } else if (errorData.detail.includes('Cultural Tapestry data not found') || errorData.detail.includes('World Seed data not found')) {
                          // Based on Streamlit code prerequisite
                          errorMessage = "World Seed (Tab ①) and Cultural Tapestry (Tab ②) are required first.";
                     }
                      // You might add checks for other backend validation errors here if they exist
                     else {
                          errorMessage += ` - ${errorData.detail}`;
                     }
                 } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
                      // Handle FastAPI validation errors (pydantic)
                     errorMessage += ` - Validation error: ${errorData.detail[0].msg}`;
                 }
                 else { // Handle other unexpected JSON structures
                     errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
                 }
             } else { // Handle cases where the error response is JSON but doesn't have a 'detail' field
                 errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
             }
         } catch (e) {
             // If response wasn't JSON at all, just use the status and text
             errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
         }

        throw new Error(errorMessage); // Throw a new Error object with the constructed message
    }
    // --- End Error Handling ---


    const result = await response.json();
    // Assuming backend returns the new location data keyed by name: { "Location Name": { details... } }
    return result;
};

/**
 * Sends a request to generate a new artifact.
 * Assumes backend endpoint is POST /api/generation/artifact
 * Assumes backend requires World Seed, Cultural Tapestry, AND Locations prerequisites.
 * Assumes backend returns the newly generated artifact data, keyed by name.
 *
 * @param {object} data - The input data ({ name: string, type: string, properties: string, associated_entity: string | null })
 * @returns {Promise<object>} - The generated artifact data object (e.g., { "Artifact Name": { details... } }) on success
 * @throws {Error}
 */
export const generateArtifact = async (data) => {
    const headers = getAuthHeaders(); // Get auth headers

    const response = await fetch(`${API_BASE_URL}/api/generation/artifact`, {
        method: 'POST',
        headers: {
            ...headers, // Include auth headers
            'Content-Type': 'application/json', // Send data as JSON
        },
        body: JSON.stringify(data), // Send the input data
    });

    // --- Error Handling ---
    if (!response.ok) {
         const errorText = await response.text();
         console.error("API Error Response (Artifact):", errorText);

         let errorMessage = `Artifact generation failed: ${response.status}`;
         try {
             const errorData = JSON.parse(errorText);
             if (errorData.detail) {
                  if (typeof errorData.detail === 'string') {
                     if (errorData.detail.includes('LLM provider not initialized')) {
                         errorMessage = "LLM provider not initialized. Go to Settings (in sidebar) and apply settings first.";
                     } else if (errorData.detail.includes('World Seed data not found') || errorData.detail.includes('Cultural Tapestry data not found') || errorData.detail.includes('Locations data not found')) {
                          // Based on Streamlit code prerequisite
                          errorMessage = "World Seed (Tab ①), Cultural Tapestry (Tab ②), AND Locations (Tab ⑤) are required first.";
                     }
                     else {
                          errorMessage += ` - ${errorData.detail}`;
                     }
                 } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
                      errorMessage += ` - Validation error: ${errorData.detail[0].msg}`;
                 }
                 else {
                     errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
                 }
             } else {
                 errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
             }
         } catch (e) {
             errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
         }

        throw new Error(errorMessage);
    }
    // --- End Error Handling ---

    const result = await response.json();
    // Assuming backend returns the new artifact data keyed by name: { "Artifact Name": { details... } }
    return result;
};

/**
 * Sends a request to generate a new event.
 * Assumes backend endpoint is POST /api/generation/event
 * Assumes backend requires World Seed, Culture, Factions, Characters, AND Locations prerequisites.
 * Assumes backend returns the newly generated event data, keyed by name.
 *
 * @param {object} data - The input data ({ name: string, type: string, participants: string, summary: string, associated_entity: string | null })
 * @returns {Promise<object>} - The generated event data object (e.g., { "Event Name": { details... } }) on success
 * @throws {Error}
 */
export const generateEvent = async (data) => {
    const headers = getAuthToken(); // Get auth headers

    const response = await fetch(`${API_BASE_URL}/api/generation/event`, {
        method: 'POST',
        headers: {
            ...headers, // Include auth headers
            'Content-Type': 'application/json', // Send data as JSON
        },
        body: JSON.stringify(data), // Send the input data
    });

    // --- Error Handling ---
    if (!response.ok) {
         const errorText = await response.text();
         console.error("API Error Response (Event):", errorText);

         let errorMessage = `Event generation failed: ${response.status}`;
         try {
             const errorData = JSON.parse(errorText);
             if (errorData.detail) {
                  if (typeof errorData.detail === 'string') {
                     if (errorData.detail.includes('LLM provider not initialized')) {
                         errorMessage = "LLM provider not initialized. Go to Settings (in sidebar) and apply settings first.";
                     } else if (errorData.detail.includes('Cultural Tapestry data not found') || errorData.detail.includes('World Seed data not found') || errorData.detail.includes('Factions data not found') || errorData.detail.includes('Characters data not found') || errorData.detail.includes('Locations data not found')) {
                          // Based on Streamlit code prerequisite (all previous generated entities except Artifacts)
                          errorMessage = "World Seed (Tab ①), Cultural Tapestry (Tab ②), Factions (Tab ③), Characters (Tab ④), AND Locations (Tab ⑤) are required first.";
                     }
                     else {
                          errorMessage += ` - ${errorData.detail}`;
                     }
                 } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
                      errorMessage += ` - Validation error: ${errorData.detail[0].msg}`;
                 }
                 else {
                     errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
                 }
             } else {
                 errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
             }
         } catch (e) {
             errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
         }

        throw new Error(errorMessage);
    }
    // --- End Error Handling ---

    const result = await response.json();
    // Assuming backend returns the new event data keyed by name: { "Event Name": { details... } }
    return result;
};

/**
 * Sends a request to simulate an interaction between two entities.
 * Assumes backend endpoint is POST /api/interaction/simulate
 * Assumes backend requires World Seed, Culture, Factions, Characters, AND Locations prerequisites (same as Events).
 * Assumes backend returns the simulation result, likely a text string or an object containing it.
 *
 * @param {object} data - The input data ({ entity1_name: string, entity2_name: string, interaction_type: string, setting: string })
 * @returns {Promise<object>} - The simulation result data object (e.g., { result: string, timestamp: string, ... }) on success
 * @throws {Error}
 */
export const simulateInteraction = async (data) => {
    const headers = getAuthHeaders(); // Get auth headers

    const response = await fetch(`${API_BASE_URL}/api/interaction/simulate`, {
        method: 'POST',
        headers: {
            ...headers, // Include auth headers
            'Content-Type': 'application/json', // Send data as JSON
        },
        body: JSON.stringify(data), // Send the input data
    });

    // --- Error Handling ---
    if (!response.ok) {
         const errorText = await response.text();
         console.error("API Error Response (Simulate Interaction):", errorText);

         let errorMessage = `Simulate Interaction failed: ${response.status}`;
         try {
             const errorData = JSON.parse(errorText);
             if (errorData.detail) {
                  if (typeof errorData.detail === 'string') {
                     if (errorData.detail.includes('LLM provider not initialized')) {
                         errorMessage = "LLM provider not initialized. Go to Settings (in sidebar) and apply settings first.";
                     } else if (errorData.detail.includes('Cultural Tapestry data not found') || errorData.detail.includes('World Seed data not found') || errorData.detail.includes('Factions data not found') || errorData.detail.includes('Characters data not found') || errorData.detail.includes('Locations data not found')) {
                          // Based on Streamlit code prerequisite
                          errorMessage = "World Seed (Tab ①), Culture (Tab ②), Factions (Tab ③), Characters (Tab ④), AND Locations (Tab ⑤) are required first.";
                     } else if (errorData.detail.includes('Entity not found')) {
                          errorMessage = "One or both selected entities were not found in the generated world data.";
                     }
                     else {
                          errorMessage += ` - ${errorData.detail}`;
                     }
                 } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
                      errorMessage += ` - Validation error: ${errorData.detail[0].msg}`;
                 }
                 else {
                     errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
                 }
             } else {
                 errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
             }
         } catch (e) {
             errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
         }

        throw new Error(errorMessage);
    }
    // --- End Error Handling ---

    const result = await response.json();
    // Assuming backend returns the simulation result object
    // e.g., { result: "Narrative description...", timestamp: "...", ... }
    return result;
};

/**
 * Sends a chat message to the backend AI.
 */
export const sendChatMessage = async (message) => {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/chat`, { // Assuming the endpoint is /api/chat
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message }), // Send the message
    });

    if (!response.ok) {
         const errorText = await response.text();
         console.error("API Error Response (Chat):", errorText);
         let errorMessage = `Chat failed: ${response.status}`;
         try {
             const errorData = JSON.parse(errorText);
             if (errorData.detail) {
                  if (typeof errorData.detail === 'string') {
                     if (errorData.detail.includes('LLM provider not initialized')) {
                         errorMessage = "LLM provider not initialized. Go to Settings (in sidebar) and apply settings first.";
                     } else { // Assuming backend validates if world data exists
                          errorMessage = "Some world data is required first (Tabs ① & ②).";
                     }
                 } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
                      errorMessage += ` - Validation error: ${errorData.detail[0].msg}`;
                 }
                 else {
                     errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
                 }
             } else {
                 errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
             }
         } catch (e) {
             errorMessage += ` - ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
         }
        throw new Error(errorMessage);
    }

    const result = await response.json();
    // Assuming backend returns an object like { response: "AI's message" }
    return result;
};