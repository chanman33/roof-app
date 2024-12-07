import React, { useState } from 'react';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock data for testing
  const testData = {
    hailDamageLikely: false,
    probability: 0.1
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5050/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Roof Inspection Report Generator</h1>
        
        {/* Display test data being sent */}
        <div className="test-data">
          <h3>Test Data:</h3>
          <pre>{JSON.stringify(testData, null, 2)}</pre>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>

        {/* Error display */}
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}

        {/* Result display */}
        {result && (
          <div className="result">
            <h3>Generated Report:</h3>
            <pre>{result.report}</pre>
            <h4>Metadata:</h4>
            <pre>{JSON.stringify(result.metadata, null, 2)}</pre>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
