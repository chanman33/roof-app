import React, { useState } from 'react';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userObservation, setUserObservation] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // Mock data for testing
  const testData = {
    hailDamageLikely: false,
    probability: 0.1,
    userObservation: userObservation
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('hailDamageLikely', JSON.stringify(false));
      formData.append('probability', JSON.stringify(0.1));
      formData.append('userObservation', userObservation);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch('http://localhost:5050/api/generate-report', {
        method: 'POST',
        body: formData,
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
        
        {/* Add image upload section */}
        <div className="image-upload">
          <h3>Upload Roof Image:</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedImage(e.target.files[0])}
            className="file-input"
          />
          {selectedImage && (
            <div className="image-preview">
              <img 
                src={URL.createObjectURL(selectedImage)} 
                alt="Selected roof" 
                style={{ maxWidth: '300px', marginTop: '10px' }}
              />
            </div>
          )}
        </div>

        {/* Add text area for user observations */}
        <div className="observation-input">
          <h3>Enter Your Roof Observations:</h3>
          <textarea
            value={userObservation}
            onChange={(e) => setUserObservation(e.target.value)}
            placeholder="Describe what you observe about the roof damage..."
            rows={4}
            style={{ width: '80%', margin: '10px 0' }}
          />
        </div>

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
