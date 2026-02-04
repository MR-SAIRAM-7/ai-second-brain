import React from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { ArrowRight, Brain, Zap, Shield, Globe } from 'lucide-react';
import dashboardMockup from '../assets/dashboard_mockup.png';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Brain className="h-8 w-8 text-purple-500" />
                            <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                                SecondBrain
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all transform hover:scale-105"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/20 blur-[120px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">Digital Cognition</span> <br />
                            Amplified.
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 mb-10">
                            Capture, organize, and retrieve your thoughts with AI-powered precision.
                            The ultimate workspace for your second brain.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                to="/signup"
                                className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-1 flex items-center"
                            >
                                Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <a
                                href="#features"
                                className="px-8 py-4 rounded-full bg-gray-800 border border-gray-700 text-gray-300 font-bold text-lg hover:bg-gray-750 hover:text-white transition-all"
                            >
                                Learn More
                            </a>
                        </div>
                    </Motion.div>

                    <Motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="mt-16 rounded-xl border border-gray-800 shadow-2xl overflow-hidden"
                    >
                        <img
                            src={dashboardMockup}
                            alt="Dashboard Preview"
                            className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity duration-500"
                        />
                    </Motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose SecondBrain?</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Built for thinkers, creators, and developers. integrate your workflow seamlessly.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="h-8 w-8 text-yellow-400" />}
                            title="Lightning Fast"
                            description="Instant note switching and real-time synchronization across all your devices."
                        />
                        <FeatureCard
                            icon={<Shield className="h-8 w-8 text-green-400" />}
                            title="Secure by Design"
                            description="End-to-end encryption ensures your thoughts remain private and secure."
                        />
                        <FeatureCard
                            icon={<Globe className="h-8 w-8 text-blue-400" />}
                            title="Global Access"
                            description="Access your second brain from anywhere, anytime. Offline mode included."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-800 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                        <Brain className="h-6 w-6 text-gray-500" />
                        <span className="ml-2 text-gray-400 font-semibold">SecondBrain © 2026</span>
                    </div>
                    <div className="flex space-x-6 text-gray-400">
                        <a href="#" className="hover:text-purple-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-purple-400 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <Motion.div
        whileHover={{ y: -5 }}
        className="p-8 rounded-2xl bg-gray-800 border border-gray-700 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
    >
        <div className="mb-4 p-3 bg-gray-700/50 rounded-lg w-fit">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">
            {description}
        </p>
    </Motion.div>
);

export default LandingPage;
