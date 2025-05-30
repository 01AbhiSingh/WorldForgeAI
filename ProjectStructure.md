WorldForgeAI/
├── backend/
│   ├── api/
│   │   ├── __init__.py  (Might exist to make 'api' a package)
│   │   ├── auth.py
│   │   ├── generation.py
│   │   └── settings.py
│   ├── core/
│   │   ├── __init__.py  (Might exist to make 'core' a package)
│   │   ├── security.py
        ├── fake_db.py         # Temporary user storage
│   │   ├── world_builder.py
│   │   ├── llm_providers.py # Based on settings.py import
│   │   
    ├──config
        ├──settings.py
│   ├── models/
│   │   ├── __init__.py  (Might exist to make 'models' a package)
│   │   └── schemas.py
│   └── constants.py     # Based on settings.py and security.py imports
│   └── main.py            # Main FastAPI application
│
└── frontend/
    ├── public/
    │   └── vite.svg
    ├── src/
    │   ├── api/
    │   │   └── apiService.js
    │   ├── components/
    │   │   ├── SettingsView.jsx
    │   │   ├── WorldSeedTab.jsx
    │   │   ├── CultureTab.jsx
    │   │   ├── FactionsTab.jsx    
    │   │   ├── CharactersTab.jsx  
    │   │   ├── LocationsTab.jsx   
    │   │   ├── ArtifactsTab.jsx   
    │   │   ├── EventsTab.jsx      
    │   │   ├── SimulateTab.jsx    
    │   │   ├── ChatTab.jsx        
    │   │   ├── ViewDataTab.jsx    
    │   │   └── DisplayGeneratedData.jsx 
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── layouts/
    │   │   └── AppLayout.jsx
    │   ├── pages/
            ├── LandingPage.jsx
            ├──SettingsPage.jsx
            ├──WorldSeedPage.jsx
    │   │   └── AuthPage.jsx
    │   ├── App.jsx            # Main React App component
        ├──index.css
    │   └── main.jsx           # Entry point (uses ReactDOM)
    ├── .gitignore
    ├── package.json
    └── vite.config.js     # Or similar build config (e.g., webpack.config.js)
