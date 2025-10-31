import { useState } from 'react';
import RequestsList from './components/RequestsList';
import KnowledgeBaseList from './components/KnowledgeBaseList';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('escalation'); // Default to escalation requests

  return (
    <div className="App">
      <div className="view-toggle-container">
        <div className="toggle-buttons">
          <button
            className={`toggle-button ${currentView === 'escalation' ? 'active' : ''}`}
            onClick={() => setCurrentView('escalation')}
          >
            Escalation Requests
          </button>
          <button
            className={`toggle-button ${currentView === 'knowledge' ? 'active' : ''}`}
            onClick={() => setCurrentView('knowledge')}
          >
            Knowledge Base
          </button>
        </div>
      </div>
      {currentView === 'escalation' ? <RequestsList /> : <KnowledgeBaseList />}
    </div>
  );
}

export default App;
