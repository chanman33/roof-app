import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userObservation, setUserObservation] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your roof...');

  useEffect(() => {
    if (loading) {
      const messages = [
        'Analyzing your roof...',
        'Confirming your location and weather data...',
        'Loading image data...',
        'Performing technical analysis...',
        'Calculating damage severity...',
        'Finalizing recommendations...',
        'Generating report...'
      ];
      let currentIndex = 0;

      const intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % messages.length;
        setLoadingMessage(messages[currentIndex]);
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(intervalId);
    }
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('userObservation', userObservation);

      const response = await fetch('http://localhost:5050/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>RoofScan AI</h1>
        <p className="subheading">Instant AI-Powered Roof Inspection Report</p>
      </header>

      <main className="app-main">
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-section">
            <h2>Upload Roof Image</h2>
            <div className="file-input-container">
              <label className="file-input-label">
                {selectedImage ? 'Change Image' : 'Choose Image'}
                <input
                  type="file"
                  className="file-input"
                  onChange={(e) => setSelectedImage(e.target.files[0])}
                  accept="image/*"
                />
              </label>
              {selectedImage && (
                <div className="image-preview">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Selected Roof"
                    className="preview-image"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h2>Describe Roof Condition</h2>
            <textarea
              value={userObservation}
              onChange={(e) => setUserObservation(e.target.value)}
              placeholder="Describe any visible damage or concerns..."
              rows={4}
              className="text-area"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedImage}
            className="submit-button"
          >
            {loading ? 'Analyzing...' : 'Generate Report'}
          </button>
        </form>

        <div className="result-section">
          <h2>Inspection Report</h2>

          {loading && (
            <div className="result-loading">
              <div className="spinner"></div>
              <p>{loadingMessage}</p>
            </div>
          )}

          {error ? (
            <p className="error-message">Error: {error}</p>
          ) : result ? (
            <>
              <div className="report-content">
                {result.report.split('\n\n').map((section, index) => (
                  <div key={index} className="report-section">
                    {section.split('\n').map((line, lineIndex) => (
                      <p key={lineIndex}>{line}</p>
                    ))}
                  </div>
                ))}
                <div><p>Visit <a href="https://www.remihq.com/" target="_blank" rel="noopener noreferrer">www.remihq.com</a> for the best contractors, timeline, and pricing. All under one roof.</p></div>
              </div>

              {result.metadata.visualizations && (
                <div className="visualizations-container">
                  <h3>Damage Analysis</h3>
                  <div className="visualization-grid">
                    {result.metadata.visualizations.annotatedImage && (
                      <div className="visualization-item">
                        <h4>Detected Damage Areas</h4>
                        <img
                          src={`data:image/jpeg;base64,${result.metadata.visualizations.annotatedImage}`}
                          alt="Annotated damage locations"
                          className="annotated-image"
                        />
                      </div>
                    )}

                    {result.metadata.visualizations.croppedImages?.length > 0 && (
                      <div className="visualization-item">
                        <h4>Damage Close-ups</h4>
                        <div className="cropped-images-grid">
                          {result.metadata.visualizations.croppedImages.map((crop, index) => (
                            <img
                              key={index}
                              src={`data:image/jpeg;base64,${crop}`}
                              alt={`Damage area ${index + 1}`}
                              className="cropped-image"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="metadata-section">
                <h3>Metadata</h3>
                <pre className="metadata">
                  {JSON.stringify(
                    { ...result.metadata, visualizations: undefined },
                    null,
                    2
                  )}
                </pre>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Upload an image and submit the form to generate an inspection report.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 RoofScan AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;

