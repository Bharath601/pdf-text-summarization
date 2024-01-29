import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createContext } from 'react';
import axios from 'axios';
import './ChatInterface.css';

import { useNavigate } from 'react-router-dom';
import { MdAttachFile, MdAndroid, MdPerson } from 'react-icons/md';

const ChatInterface = () => {

    const [summaryResponse, setSummaryResponse] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState([{ text: "Give text Or PDF for summarization", sender: 'bot' }]);
    const [show, setShow] = useState(false); // State to control visibility of Talk to bot button
    const textAreaRef = useRef(null);
    const navigate = useNavigate();
   
    const applySuggestion = (suggestion) => {
        setInputText(suggestion); 
        setSuggestions([]);
    };

    const SuggestionList = () => {
        return suggestions.length > 0 && (
            <div className="suggestions-container">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        className="suggestion-btn"
                        onClick={() => applySuggestion(suggestion.corrected)}
                    >
                        {suggestion.corrected}
                    </button>
                ))}
            </div>
        );
    };

    
    const handleGrammarCorrection = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/suggest-corrections', { text: inputText });
            if (response.data && Array.isArray(response.data)) {
                setSuggestions(response.data);
            } else {
                console.error('Received data is not in the expected format', response.data);
                setSuggestions([]);
            }
        } catch (error) {
            console.error('Error getting grammar corrections:', error);
            setSuggestions([]);
        }
    };
      
      
      

    
    
    const handleTextAreaChange = (e) => {
        const newText = e.target.value;
        setInputText(newText); // Update the inputText state with the new text
        // Rest of your code to adjust the height
        textAreaRef.current.style.height = 'inherit';
        textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    };
    

    const addMessage = (text, sender) => {
        setMessages(messages => [...messages, { text, sender }]);
    };

    const processInput = async (formData, isPDF = false) => {
        setShow(true); // Show the Talk to bot button
        addMessage('Processing, please wait...', 'bot');
        const endpoint = isPDF ? 'http://127.0.0.1:5000/summarize-pdf' : 'http://127.0.0.1:5000/summarize';
    
        try {
            const response = await axios.post(endpoint, formData, {
                headers: {
                    'Content-Type': isPDF ? 'multipart/form-data' : 'application/json',
                },
            });
            console.log("Received from Server:", response.data.summary);
            setSummaryResponse(response.data.summary)
            addMessage(response.data.summary, 'bot');
            
            
        } catch (error) {
            console.error('Processing error:', error);
            addMessage('Failed to process the input.', 'bot');
        }
        setInputText(''); // Clear the input text
    };
    

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setShow(true); // Show the Talk to bot button
            const formData = new FormData();
            formData.append('file', file);
            processInput(formData, true);
        } else {
            addMessage('Please upload a valid PDF file.', 'bot');
        }
    };


    

    const handleSendClick = async () => {
        
        if (inputText.trim()) {
            addMessage(inputText, 'user');
            const dataToSummarize = { text: inputText.trim() };
            processInput(dataToSummarize, false);
            setInputText('');
            if (textAreaRef.current) {
                textAreaRef.current.style.height = 'auto'; // Reset to default height
                textAreaRef.current.style.height = '20px';; // Set to scrollHeight if there is any overflow content
            }
        } else {
            addMessage('Please provide some text to summarize or upload a PDF.', 'bot');
        }
    };

    const handleButtonClick = async () => {
        
            navigate('/chatbot', { state: { summary: summaryResponse} });
        
    };
    
    

    return (
        <div className="chat-container">
            <h1 className="text-summarization-heading">Text Summarization</h1>
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender} ${msg.type === 'pdfResponse' ? 'pdf-response' : ''}`}>
                        {msg.sender === 'bot' && <MdAndroid className="icon" size="1.5em" />}
                        {msg.sender === 'user' && <MdPerson className="icon" size="1.5em" />}
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className='button-container'>
                {show && (
                    <button className="talk-bot-btn" onClick={handleButtonClick}>Talk to bot</button>
                )}
                <button className="correct-grammar-btn" onClick={handleGrammarCorrection}>Correct Grammar</button>
                <SuggestionList /> {/* This will render the suggestions next to the button */}
            </div>
            <div className="input-area">
                
                <textarea
                    ref={textAreaRef}
                    rows={3} // Set a default number of rows
                    className="input-textarea"
                    value={inputText}
                    onChange={handleTextAreaChange}
                    placeholder="Type your text here..."
                />
                <label className="file-input-label">
                    <MdAttachFile size="2.5em" />
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="application/pdf"
                        style={{ display: 'none' }}
                    />
                </label>
                <button onClick={handleSendClick}>Summarize Text</button>
            </div>
        </div>



        
    );
};

export default ChatInterface;
