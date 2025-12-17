import React, { useState, useEffect } from 'react';
import './ModelSelector.css';

const ModelSelector = ({ socket, onModelChange }) => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('models:list', (data) => {
      console.log('📋 Received models list:', data);
      setModels(data.models || []);
      setSelectedModel(data.defaultModel || '');
      if (onModelChange) {
        onModelChange(data.defaultModel);
      }
    });

    return () => {
      socket.off('models:list');
    };
  }, [socket, onModelChange]);

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    setIsOpen(false);
    if (onModelChange) {
      onModelChange(modelId);
    }
    console.log('🤖 Model changed to:', modelId);
  };

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <div className="model-selector">
      <button 
        className="model-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Chọn mô hình AI"
      >
        <span className="model-icon">✨</span>
        <span className="model-name">
          {selectedModelData?.name || 'Đang tải...'}
        </span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="model-dropdown">
          {models.map((model) => (
            <button
              key={model.id}
              className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
              onClick={() => handleModelChange(model.id)}
            >
              <div className="model-option-header">
                <span className="model-option-name">{model.name}</span>
                {model.type === 'cloud' && <span className="cloud-badge">☁️ Cloud</span>}
                {selectedModel === model.id && <span className="check-icon">✓</span>}
              </div>
              <div className="model-option-description">{model.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
