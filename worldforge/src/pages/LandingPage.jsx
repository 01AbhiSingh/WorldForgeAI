import React, { useEffect } from 'react';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const LandingPage = () => {

    // Effect for scroll-based fade-in animation (specific to this page)
    useEffect(() => {
        const sections = document.querySelectorAll('.fade-in-section');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Optional: stop observing once visible
                    // observer.unobserve(entry.target);
                } else {
                    // Optional: remove class when out of view to re-trigger on scroll back up
                    // entry.target.classList.remove('is-visible');
                }
            });
        }, {
            threshold: 0
        });

        sections.forEach(section => {
            observer.observe(section);
        });

        // Cleanup observer on component unmount
        return () => {
            sections.forEach(section => {
                observer.unobserve(section);
            });
        };
    }, []); // Empty dependency array means this effect runs once after initial render

    return (
        <div className="min-h-screen antialiased">
            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="text-2xl font-bold text-indigo-500">🌍</span>
                        <span className="ml-2 text-xl font-semibold text-white">Worldforge</span>
                    </div>
                    {/* Navigation Links - Use Link for internal navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                         {/* Note: Internal navigation anchors should ideally use Link component */}
                        <a href="#features" className="text-slate-300 hover:text-white transition duration-300">Features</a>
                        <a href="#how-it-works" className="text-slate-300 hover:text-white transition duration-300">How it Works</a>
                        {/* Material UI Button acting as a React Router Link */}
                        <Button
                            variant="contained"
                            color="primary"
                            // *** Use component={Link} and the "to" prop for React Router navigation ***
                            component={Link}
                            to="/auth" // Link to your authentication page route
                            sx={{
                                bgcolor: '#4f46e5',
                                '&:hover': {
                                    bgcolor: '#4338ca',
                                },
                                borderRadius: '9999px',
                                textTransform: 'none',
                                paddingX: '1rem',
                                paddingY: '0.5rem',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            Get Started
                        </Button>
                    </div>
                    {/* Mobile Menu Button (Placeholder) */}
                    <div className="md:hidden">
                        <button className="text-slate-300 hover:text-white focus:outline-none">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                        </button>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-b from-slate-900 to-slate-800">
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up">
                        Forge <span className="text-indigo-400">Epic Worlds</span><br/> with AI Precision
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto animate-fade-in-up delay-100">
                        Worldforge empowers creators to build rich, detailed, and consistent fantasy universes, from cosmic seeds to intricate character backstories, all guided by powerful AI.
                    </p>
                    {/* Material UI Button acting as a React Router Link */}
                   <Button
                        variant="contained"
                        color="primary"
                        // *** Use component={Link} and the "to" prop for React Router navigation ***
                        component={Link}
                        to="/auth" // Link to your authentication page route
                        sx={{
                            bgcolor: '#4f46e5',
                            '&:hover': {
                                bgcolor: '#4338ca',
                            },
                            borderRadius: '9999px',
                            textTransform: 'none',
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            paddingX: '2.5rem',
                            paddingY: '1rem',
                            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.2)',
                            animation: 'fadeInUp 0.6s ease-out forwards',
                            animationDelay: '0.2s',
                        }}
                    >
                        Start Building Your World
                    </Button>
                </div>
                <div className="absolute inset-0 pointer-events-none z-0">
                     <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-800 to-transparent"></div>
                     <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-900 opacity-10 blur-3xl"></div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="fade-in-section py-20 md:py-24 bg-slate-800">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">Key Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <div className="bg-slate-700 p-8 rounded-lg shadow-xl transform transition duration-300 hover:scale-105 hover:bg-slate-600">
                            <div className="text-indigo-400 mb-4">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Modular Generation</h3>
                            <p className="text-slate-300">Build your world piece by piece: geography, climate, culture, history, and more. Control the details you care about.</p>
                        </div>
                        <div className="bg-slate-700 p-8 rounded-lg shadow-xl transform transition duration-300 hover:scale-105 hover:bg-slate-600">
                            <div className="text-indigo-400 mb-4">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.146-1.269-.4-.1857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.146-1.269.4-.1857m0 0a2.001 2.001 0 011.415-.415c.931-.052 1.791.786 2.692 1.786.459.504 1.136.85 1.871.85s1.412-.346 1.871-.85c1-.999 1.76-1.838 2.692-1.784a2.001 2.001 0 011.415.415m0 0A2.001 2.001 0 0017 18v2m2 0h2a2 2 0 002-2v-2h-2m-7 2v-2c0-.653.146-1.269.4-.1857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.146-1.269.4-.1857m0 0a2.001 2.001 0 011.415-.415c.931-.052 1.791.786 2.692 1.786.459.504 1.136.85 1.871.85s1.412-.346 1.871-.85c1-.999 1.76-1.838 2.692-1.784a2.001 2.001 0 011.415.415m0 0A2.001 2.001 0 0017 18v2"></path></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Character & Faction Detail</h3>
                            <p className="text-slate-300">Generate compelling characters, intricate factions, and their relationships, backstories, and motivations.</p>
                        </div>
                        <div className="bg-slate-700 p-8 rounded-lg shadow-xl transform transition duration-300 hover:scale-105 hover:bg-slate-600">
                            <div className="text-indigo-400 mb-4">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6H4m6 4H4m12 0h2m-6 4h2m-6 0h-2m6 0v2m0-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-2h4m-4 2h4m-4 0h-2m4 0h-2m-4 0h-2m6 0v2m0-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2"></path></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Simulate Interactions</h3>
                            <p className="text-slate-300">See how your characters and factions interact in dynamic scenarios, generating narrative outcomes.</p>
                        </div>
                         <div className="bg-slate-700 p-8 rounded-lg shadow-xl transform transition duration-300 hover:scale-105 hover:bg-slate-600">
                            <div className="text-indigo-400 mb-4">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Historical Events & Artifacts</h3>
                            <p className="text-slate-300">Define key historical moments and powerful artifacts that shape your world's past and future.</p>
                        </div>
                         <div className="bg-slate-700 p-8 rounded-lg shadow-xl transform transition duration-300 hover:scale-105 hover:bg-slate-600">
                            <div className="text-indigo-400 mb-4">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.004 9.004 0 01-7.504-4.583A9.987 9.007 0 003 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Interactive World Chat</h3>
                            <p className="text-slate-300">Chat directly with your AI to ask questions, brainstorm ideas, and explore your world's lore.</p>
                        </div>
                         <div className="bg-slate-700 p-8 rounded-lg shadow-xl transform transition duration-300 hover:scale-105 hover:bg-slate-600">
                            <div className="text-indigo-400 mb-4">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Flexible LLM Integration</h3>
                            <p className="text-slate-300">Connect your own API keys for various LLM providers (Gemini, OpenAI, Anthropic, Hugging Face, Deepseek).</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
             <section id="how-it-works" className="fade-in-section py-20 md:py-24 bg-slate-900">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">How It Works</h2>
                    <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-12">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 flex items-center justify-center bg-indigo-600 text-white rounded-full text-2xl font-bold mb-4 shadow-lg">1</div>
                            <p className="text-lg text-slate-300 max-w-xs">Define your core concept & connect your AI provider.</p>
                        </div>
                        <div className="text-indigo-500 hidden md:block">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </div>
                         <div className="text-indigo-500 block md:hidden rotate-90">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 flex items-center justify-center bg-indigo-600 text-white rounded-full text-2xl font-bold mb-4 shadow-lg">2</div>
                            <p className="text-lg text-slate-300 max-w-xs">Generate world elements module by module.</p>
                        </div>
                        <div className="text-indigo-500 hidden md:block">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </div>
                         <div className="text-indigo-500 block md:hidden rotate-90">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </div>
                         <div className="flex flex-col items-center">
                            <div className="w-16 h-16 flex items-center justify-center bg-indigo-600 text-white rounded-full text-2xl font-bold mb-4 shadow-lg">3</div>
                            <p className="text-lg text-slate-300 max-w-xs">Explore, refine, and chat with your world!</p>
                        </div>
                    </div>
                </div>
            </section>


            {/* Call to Action Section */}
            <section id="cta" className="fade-in-section py-20 md:py-24 bg-slate-800 text-center">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Build Your Masterpiece?</h2>
                    <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
                        Unlock the full potential of your imagination. Get started with Worldforge today and bring your most ambitious worlds to life.
                    </p>
                     {/* Material UI Button acting as a React Router Link */}
                    <Button
                        variant="contained"
                        color="primary"
                        // *** Use component={Link} and the "to" prop for React Router navigation ***
                        component={Link}
                        to="/auth" // Link to your authentication page route
                         sx={{
                            bgcolor: '#4f46e5',
                            '&:hover': {
                                bgcolor: '#4338ca',
                            },
                            borderRadius: '9999px',
                            textTransform: 'none',
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            paddingX: '2.5rem',
                            paddingY: '1rem',
                            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.2)',
                        }}
                    >
                        Launch Worldforge
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 py-8">
                <div className="container mx-auto px-6 text-center text-slate-500">
                    <p>&copy; 2023 Worldforge. All rights reserved.</p>
                    {/* Add more footer links if needed */}
                </div>
            </footer>
        </div>
    );
};

export default LandingPage; // Export as LandingPage