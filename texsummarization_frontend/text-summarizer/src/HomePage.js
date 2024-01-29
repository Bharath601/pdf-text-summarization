import React from 'react';
import { useNavigate } from 'react-router-dom'; // Updated import
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate(); // Updated hook

  const handleButtonClick = () => {
    navigate('/chat'); // Updated function
  };
 

  return (
    // <div className="home-container">
    //   <h1>Text Summarization with Pegasus</h1>
    //   <p>Welcome to the Text Summarization .</p>
    //   <button className="start-summarizing-btn" onClick={handleButtonClick}>Start Summarizing</button>
      
    // </div>
    <div className="flex flex-col justify-center items-center h-screen bg-black text-center px-5">
  <h1 className="text-9xl mb-4 text-green-400 md:text-7xl">Text Summarization for "text and pdfs"</h1>
  <p className="text-2xl mb-10 text-gray-400 max-w-lg md:text-xl">With ChatBot feature which helps in preping urself about the doc or text provided.</p>
  <button className="text-2xl font-bold text-green-400 md:text-5xl border-2 border-green-400 px-10 py-4 rounded-full cursor-pointer transition duration-300 ease-in-out hover:bg-green-500 hover:text-gray-900 hover:border-transparent focus:outline-none md:text-lg md:px-10 md:py-5" onClick={handleButtonClick}>Start Summarizing</button>
</div>

  

  );
};

export default HomePage;
