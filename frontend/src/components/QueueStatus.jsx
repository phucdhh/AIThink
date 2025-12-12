import React from 'react';

const QueueStatus = ({ status }) => {
  if (!status) return null;
  
  const { activeRequests, queuedRequests, maxConcurrent } = status;
  const isActive = activeRequests < maxConcurrent && queuedRequests === 0;
  
  return (
    <div className={`queue-status ${isActive ? 'active' : ''}`}>
      {isActive ? (
        <span>✅ Sẵn sàng xử lý yêu cầu</span>
      ) : (
        <span>
          ⏳ Đang xử lý: {activeRequests}/{maxConcurrent} 
          {queuedRequests > 0 && ` | Chờ: ${queuedRequests}`}
        </span>
      )}
    </div>
  );
};

export default QueueStatus;
