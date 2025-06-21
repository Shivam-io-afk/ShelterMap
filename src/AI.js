import React, { useState } from "react";
import axios from "axios";
import API_CONFIG from './config/api';
import { handleApiError, logError } from './utils/errorHandler';
import { sanitizeInput } from './utils/validation';
import Notification from './components/Notification';
import './AI.css';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [notification, setNotification] = useState(null);

    // Emergency response database for fallback
    const emergencyResponses = {
        // Emergency procedures
        "emergency": {
            keywords: ["emergency", "urgent", "help", "danger", "crisis", "accident", "fire", "flood", "earthquake"],
            responses: [
                "Hey, in an emergency, the first thing you need to do is call 911 immediately. Then move to a safe location and try to stay calm. I'm here to help guide you through this.",
                "For any emergency situation, dial 911 right away. They'll send help and guide you through what to do next. Stay safe and follow their instructions."
            ]
        },
        // First aid instructions
        "firstaid": {
            keywords: ["first aid", "injury", "bleeding", "burn", "broken", "unconscious", "choking", "heart attack", "stroke"],
            responses: [
                "For serious injuries, call 911 first. For bleeding, apply direct pressure with a clean cloth. For burns, cool with running water. Don't try to move broken bones.",
                "If someone's seriously hurt, get medical help immediately by calling 911. For minor bleeding, apply pressure. For burns, use cool water. Always prioritize getting professional help."
            ]
        },
        // Shelter information
        "shelter": {
            keywords: ["shelter", "safe zone", "evacuation", "refuge", "safe place", "where to go", "protection"],
            responses: [
                "Use the map to find nearby safe zones. Follow evacuation routes and bring essential items like water, food, and medications. Stay informed through emergency broadcasts.",
                "Look for sturdy buildings or designated shelters on the map. Follow marked evacuation routes and pack water and food. Listen to emergency radio for updates."
            ]
        },
        // Emergency contacts
        "contacts": {
            keywords: ["contact", "phone", "number", "call", "emergency services", "police", "ambulance", "fire"],
            responses: [
                "For any emergency, call 911. For poisoning, call 1-800-222-1222. These are the most important numbers to have ready.",
                "911 is your go-to for all emergencies. For poison control, it's 1-800-222-1222. Keep these numbers handy and don't hesitate to call 911 for any life-threatening situation."
            ]
        },
        // Disaster preparedness
        "preparedness": {
            keywords: ["prepare", "preparedness", "kit", "supplies", "plan", "disaster", "survival", "emergency kit"],
            responses: [
                "You'll want water and food for 3 days, a first aid kit, flashlight with batteries, and a radio. Also pack important documents and some cash.",
                "Prepare a 72-hour kit with water, non-perishable food, first aid supplies, and a flashlight. Don't forget important documents and a family emergency plan."
            ]
        },
        // Resource availability
        "resources": {
            keywords: ["resources", "food", "water", "medical", "supplies", "aid", "help", "assistance", "support"],
            responses: [
                "Check the Resource Availability panel (top-right) for real-time information about food, water, medical aid, and shelter at safe zones. This shows what's available and when it was last updated.",
                "The Resource Availability panel shows current supplies at emergency shelters including food, water, medical staff, and shelter capacity. Filter by resource type or location to find what you need."
            ]
        },
        // Medical assistance
        "medical": {
            keywords: ["medical", "doctor", "nurse", "hospital", "medicine", "treatment", "health", "sick", "ill"],
            responses: [
                "Medical assistance is available at designated emergency centers. Check the Resource Availability panel for current medical staff and capacity. For life-threatening emergencies, call 911 immediately.",
                "Emergency medical centers have doctors and nurses on standby. The Resource Availability panel shows which centers have medical staff available and their current capacity."
            ]
        },
        // Food and water
        "foodwater": {
            keywords: ["food", "water", "hungry", "thirsty", "eat", "drink", "supplies", "rations"],
            responses: [
                "Food and water supplies are available at emergency shelters. Check the Resource Availability panel to see current quantities and when supplies were last restocked.",
                "Emergency shelters provide food and water. The Resource Availability panel shows real-time supply levels and helps you find the nearest location with available resources."
            ]
        }
    };

    const showNotification = (message, type = 'info', duration = 5000) => {
        setNotification({ message, type, duration });
    };

    const clearNotification = () => {
        setNotification(null);
    };

    // Function to get emergency-specific response (fallback)
    const getEmergencyResponse = (userMessage) => {
        const lowerMessage = userMessage.toLowerCase();
        
        for (const [category, data] of Object.entries(emergencyResponses)) {
            if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
                const randomIndex = Math.floor(Math.random() * data.responses.length);
                return data.responses[randomIndex];
            }
        }
        
        // Default emergency response if no specific category matches
        return "I'm here to help with emergency situations! For life-threatening emergencies, call 911 immediately. I can help with emergency procedures, first aid, shelter info, and disaster prep. What do you need help with?";
    };

    // Function to create emergency-focused prompt for API
    const createEmergencyPrompt = (userMessage) => {
        const emergencyContext = "You are a helpful Emergency Response AI Assistant. Respond in a friendly, conversational tone like you're talking to a friend. Keep responses under 80 words. Be reassuring but direct. Always mention calling 911 for life-threatening emergencies. Use natural language and be supportive. ";
        
        return emergencyContext + "User question: " + userMessage;
    };

    // Function to handle quick question clicks
    const handleQuickQuestion = async (question) => {
        const userMessage = { text: question, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);

        setIsTyping(true);
        
        try {
            // Try API first, fallback to local responses
            const apiResponse = await fetchAPIResponse(question);
            if (apiResponse) {
                typeResponse(apiResponse);
            } else {
                // Fallback to local emergency response
                const emergencyResponse = getEmergencyResponse(question);
                setTimeout(() => {
                    typeResponse(emergencyResponse);
                }, 1000);
            }
        } catch (error) {
            // Fallback to local emergency response
            const emergencyResponse = getEmergencyResponse(question);
            setTimeout(() => {
                typeResponse(emergencyResponse);
            }, 1000);
        }
    };

    // Function to fetch response from API
    const fetchAPIResponse = async (userMessage) => {
        try {
            const formattedPrompt = encodeURIComponent(createEmergencyPrompt(userMessage));
            const apiUrl = `${API_CONFIG.RAPIDAPI.CHAT_URL}?prompt=${formattedPrompt}`;

        const options = {
            method: "GET",
            url: apiUrl,
            headers: {
                    "x-rapidapi-key": API_CONFIG.RAPIDAPI.KEY,
                    "x-rapidapi-host": API_CONFIG.RAPIDAPI.HOST
                }
            };

            const res = await axios.request(options);
            
            if (res.data && res.data.response) {
                return res.data.response;
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            const appError = handleApiError(error, 'AI Chat');
            logError(appError, 'fetchAPIResponse');
            return null; // Return null to trigger fallback
        }
    };

    const fetchResponse = async () => {
        if (!prompt.trim()) return;

        const sanitizedPrompt = sanitizeInput(prompt.trim());
        if (!sanitizedPrompt) {
            showNotification("Please enter a valid message.", "error");
            return;
        }

        const userMessage = { text: sanitizedPrompt, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);

        try {
            setIsTyping(true);
            
            // Try API first, fallback to local responses
            const apiResponse = await fetchAPIResponse(sanitizedPrompt);
            if (apiResponse) {
                typeResponse(apiResponse);
            } else {
                // Fallback to local emergency response
                const emergencyResponse = getEmergencyResponse(sanitizedPrompt);
                setTimeout(() => {
                    typeResponse(emergencyResponse);
                }, 1000);
            }
            
        } catch (error) {
            logError(error, 'fetchResponse');
            // Fallback to local emergency response
            const emergencyResponse = getEmergencyResponse(sanitizedPrompt);
            setTimeout(() => {
                typeResponse(emergencyResponse);
            }, 1000);
            showNotification("Using offline emergency guidance", "info", 3000);
        }

        setPrompt("");
    };

    const typeResponse = (text) => {
        let index = 0;
        setIsTyping(true);
        let typedText = "";

        const typeNextChar = () => {
            if (index < text.length) {
                typedText += text[index];
                setMessages((prev) => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.sender === "bot") {
                        return [...prev.slice(0, -1), { text: typedText, sender: "bot" }];
                    } else {
                        return [...prev, { text: typedText, sender: "bot" }];
                    }
                });
                index++;
                setTimeout(typeNextChar, 25);
            } else {
                setIsTyping(false);
            }
        };

        typeNextChar();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isTyping) {
            fetchResponse();
        }
    };

    const clearChat = () => {
        setMessages([]);
        showNotification("Chat history cleared", "info", 2000);
    };

    const toggleChat = () => {
        console.log('Toggling chat, current state:', isOpen);
        setIsOpen(!isOpen);
    };

    return (
        <div className="ai-chatbot-container">
            <button
                onClick={toggleChat}
                className="ai-chatbot-toggle"
                title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
            >
                {isOpen ? "✕" : "🤖"}
            </button>

            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    duration={notification.duration}
                    onClose={clearNotification}
                />
            )}

            {isOpen && (
                <div className="ai-chatbot-window">
                    <div className="ai-chatbot-header">
                        <div className="ai-chatbot-title">
                            <span className="ai-icon">🚨</span>
                            <h3>Emergency AI Assistant</h3>
                        </div>
                        <div className="ai-header-controls">
                            <button
                                onClick={toggleChat}
                                className="ai-close-button"
                                title="Close AI Assistant"
                            >
                                ✕
                            </button>
                            <button
                                onClick={clearChat}
                                className="ai-clear-button"
                                title="Clear chat history"
                            >
                                🗑️ Clear
                            </button>
                        </div>
                    </div>
                    
                    <div className="ai-chatbot-messages">
                        {messages.length === 0 && (
                            <div className="ai-welcome-message">
                                <div className="ai-welcome-icon">🆘</div>
                                <h4>Emergency Response Assistant</h4>
                                <p>Click on any topic below or type your question:</p>
                                <div className="ai-quick-questions">
                                    <button 
                                        className="ai-quick-question-btn"
                                        onClick={() => handleQuickQuestion("What should I do in an emergency?")}
                                    >
                                        🚨 Emergency procedures
                                    </button>
                                    <button 
                                        className="ai-quick-question-btn"
                                        onClick={() => handleQuickQuestion("How do I provide first aid?")}
                                    >
                                        🏥 First aid instructions
                                    </button>
                                    <button 
                                        className="ai-quick-question-btn"
                                        onClick={() => handleQuickQuestion("Where can I find shelter?")}
                                    >
                                        🏠 Shelter information
                                    </button>
                                    <button 
                                        className="ai-quick-question-btn"
                                        onClick={() => handleQuickQuestion("What emergency numbers should I call?")}
                                    >
                                        📞 Emergency contacts
                                    </button>
                                    <button 
                                        className="ai-quick-question-btn"
                                        onClick={() => handleQuickQuestion("How should I prepare for disasters?")}
                                    >
                                        🌪️ Disaster preparedness
                                    </button>
                                    <button 
                                        className="ai-quick-question-btn"
                                        onClick={() => handleQuickQuestion("Where can I find food and water?")}
                                    >
                                        🍽️ Food & water resources
                                    </button>
                                    <button 
                                        className="ai-quick-question-btn"
                                        onClick={() => handleQuickQuestion("Where can I get medical help?")}
                                    >
                                        🏥 Medical assistance
                                    </button>
                                    <button 
                                        className="ai-quick-question-btn"
                                        onClick={() => handleQuickQuestion("What resources are available at shelters?")}
                                    >
                                        📦 Available resources
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {messages.map((msg, index) => (
                            <div key={index} className={`ai-message ${msg.sender}`}>
                                <div className="ai-message-content">
                                    <div className="ai-message-avatar">
                                        {msg.sender === "user" ? "👤" : "🤖"}
                                    </div>
                                    <div className="ai-message-text">
                                    {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isTyping && (
                            <div className="ai-message bot">
                                <div className="ai-message-content">
                                    <div className="ai-message-avatar">🤖</div>
                                    <div className="ai-typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="ai-chatbot-input">
                    <input
                        type="text"
                            placeholder="Type your emergency question..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="ai-input-field"
                        disabled={isTyping}
                    />
                    <button
                        onClick={fetchResponse}
                            className="ai-send-button"
                            disabled={isTyping || !prompt.trim()}
                            title="Send message"
                        >
                            📤
                    </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
