import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './ChatBot.css';

import {  MdAndroid, MdPerson } from 'react-icons/md';

const ChatBot = () => {
    const location = useLocation();
    const summaryContext = location.state?.summary ;
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState([{ text: "How can I assist you?", sender: 'bot' }]);
    const textAreaRef = useRef(null);

    const handleTextAreaChange = (e) => {
        setInputText(e.target.value);
        textAreaRef.current.style.height = 'inherit'; // Reset height to recalculate
        textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`; // Set new height based on content
    };

    const addMessage = (text, sender) => {
        setMessages(messages => [...messages, { text, sender }]);
    };

    
      
    const processInput = async () => {
        
        if (inputText.trim()) {
            addMessage(inputText, 'user');
            const endpoint = 'http://127.0.0.1:5000/chat-bot';
            const payload = {
                summary: summaryContext,
                question: inputText.trim(),
            };
            try {
                const response = await axios.post(endpoint, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                addMessage(response.data.reply, 'bot');
            } catch (error) {
                console.error('Processing error:', error);
                addMessage('Failed to process the input.', 'bot');
            }
            setInputText('');
        } else {
            addMessage('Please type a question.', 'bot');
        }
    };
    
    
    return (
        <div className="chat-container">
            <h1 className="text-summarization-heading">Chat with Bot</h1>
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender} ${msg.type === 'pdfResponse' ? 'pdf-response' : ''}`}>
                        {msg.sender === 'bot' && <MdAndroid className="icon" size="1.5em" />}
                        {msg.sender === 'user' && <MdPerson className="icon" size="1.5em" />}
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className="input-area">
                <textarea
                    ref={textAreaRef}
                    className="input-textarea"
                    value={inputText}
                    onChange={handleTextAreaChange}
                    placeholder="Type your text here or ask the bot..."
                />
               
                <button className="button" onClick={processInput}>Send</button>
            </div>
        </div>
    );
};

export default ChatBot;
