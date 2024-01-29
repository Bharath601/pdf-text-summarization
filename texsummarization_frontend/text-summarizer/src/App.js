import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './HomePage'; // Import the HomePage component
import ChatInterface from './ChatInterface'; // Already imported
import ChatBot from './chatBot'

function App() {
 

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Define the route for the home page */}
          <Route exact path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path='/chatBot' element={<ChatBot/>}/>
          {/* You can add more routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
