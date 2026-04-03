import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeModal({ quizId, quizTitle, onClose }) {
  const qrRef = useRef();

  const quizUrl = `${window.location.origin}/quiz/${quizId}/take`;

  const downloadQRCode = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `quiz-${quizId}-qr.png`;
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(quizUrl);
    alert('Quiz link copied to clipboard!');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '450px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8, color: '#1e293b' }}>Share Quiz</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          {quizTitle}
        </p>

        {/* QR Code */}
        <div
          ref={qrRef}
          style={{
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            display: 'inline-block',
            marginBottom: 24,
          }}
        >
          <QRCodeSVG
            value={quizUrl}
            size={256}
            level="H"
            includeMargin={true}
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>

        {/* Quiz URL */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Direct Link:</p>
          <div
            style={{
              backgroundColor: '#f1f5f9',
              padding: '12px',
              borderRadius: '6px',
              wordBreak: 'break-all',
              fontSize: 12,
              color: '#475569',
              fontFamily: 'monospace',
            }}
          >
            {quizUrl}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={downloadQRCode}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            📥 Download QR
          </button>
          <button
            onClick={copyLink}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            🔗 Copy Link
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#e2e8f0',
              color: '#1e293b',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
