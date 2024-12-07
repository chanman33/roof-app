import React, { useState } from 'react';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userObservation, setUserObservation] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

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
        <h1>Roof Inspection Tool</h1>
        <p className="subheading">Generate detailed roof inspection reports with AI assistance.</p>

        <form onSubmit={handleSubmit} className="form-container">
          {/* Section: Image Upload */}
          <div className="form-section">
            <h2>Step 1: Upload Roof Image</h2>
            <div className="file-input-container">
              <label className="file-input-label">
                Choose File
                <input
                  type="file"
                  className="file-input"
                  onChange={(e) => setSelectedImage(e.target.files[0])}
                />
              </label>
              <div className="file-name">
                {selectedImage ? selectedImage.name : "No file chosen"}
              </div>
            </div>
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

          {/* Section: User Observations */}
          <div className="form-section">
            <h2>Step 2: Describe Roof Condition</h2>
            <textarea
              value={userObservation}
              onChange={(e) => setUserObservation(e.target.value)}
              placeholder="Describe what you observe about the roof damage..."
              rows={4}
              className="text-area"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Generating Report...' : 'Generate Report'}
          </button>
        </form>

        {/* Feedback */}
        {loading && <p className="loading-message">Processing... Please wait</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {result && (
          <div className="result-section">
            <h2>Inspection Report</h2>
            
            <div className="structured-report">
              {result.report.split('\n\n').map((section, index) => {
                if (section.trim()) {
                  return (
                    <div key={index} className="report-section">
                      {section.split('\n').map((line, lineIndex) => (
                        <p key={lineIndex}>{line}</p>
                      ))}
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Add Visualizations Section */}
            {result.metadata.visualizations ? (
              <div className="visualizations-container">
                <h2>Damage Analysis Visualizations</h2>
                <div className="visualization-grid">
                  {/* Annotated Image */}
                  {result.metadata.visualizations.annotatedImage ? (
                    <div className="visualization-item">
                      <h4>Detected Damage Locations</h4>
                      <img
                        src={`data:image/jpeg;base64,${result.metadata.visualizations.annotatedImage}`}
                        alt="Annotated damage locations"
                        className="annotated-image"
                      />
                    </div>
                  ) : (
                    <div className="visualization-item error-message">
                      <h4>Detected Damage Locations</h4>
                      <p>Annotated image unavailable</p>
                    </div>
                  )}

                  {/* Cropped Images */}
                  {result.metadata.visualizations.croppedImages?.length > 0 ? (
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
                  ) : (
                    <div className="visualization-item">
                      <h4>Damage Close-ups</h4>
                      <p className="error-message">Close-up images unavailable</p>
                    </div>
                  )}
                </div>
              </div>
            ) : result.metadata.roboflowError && (
              <div className="error-message visualization-error">
                <p>Detailed damage visualizations are currently unavailable: {result.metadata.roboflowError}</p>
                <p>The analysis continues with available data.</p>
              </div>
            )}

            {/* Existing metadata section */}
            <h3>Metadata:</h3>
            <pre className="metadata">
              {JSON.stringify(
                { ...result.metadata, visualizations: undefined }, // Exclude visualizations from JSON display
                null,
                2
              )}
            </pre>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
