import React from 'react'

interface VoteReceiptEmailProps {
  recipientEmail: string
  electionTitle: string
  receiptHash: string
  timestamp: string
  voteCount: number
  verificationUrl: string
}

export function VoteReceiptEmail({
  recipientEmail,
  electionTitle,
  receiptHash,
  timestamp,
  voteCount,
  verificationUrl,
}: VoteReceiptEmailProps) {
  return (
    <html>
      <head>
        <style>
          {`
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .header {
              background-color: #10b981;
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .message {
              background-color: #ecfdf5;
              border-left: 4px solid #10b981;
              padding: 16px;
              margin-bottom: 24px;
              border-radius: 4px;
            }
            .message p {
              margin: 0;
              color: #065f46;
            }
            .receipt-section {
              background-color: #f3f4f6;
              padding: 20px;
              border-radius: 6px;
              margin-bottom: 24px;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .receipt-item:last-child {
              border-bottom: none;
            }
            .receipt-label {
              font-weight: 600;
              color: #4b5563;
            }
            .receipt-value {
              color: #6b7280;
            }
            .hash-box {
              background-color: #f9fafb;
              padding: 16px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 12px;
              word-break: break-all;
              margin-bottom: 24px;
              border: 1px solid #e5e7eb;
            }
            .verify-button {
              display: inline-block;
              background-color: #10b981;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 24px 0;
              text-align: center;
            }
            .footer {
              color: #9ca3af;
              font-size: 12px;
              text-align: center;
              margin-top: 24px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>✓ Vote Recorded</h1>
            <p>Your ballot has been securely received</p>
          </div>

          <div className="content">
            <div className="message">
              <p>
                Your vote was successfully submitted and securely recorded for <strong>{electionTitle}</strong>.
              </p>
            </div>

            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, color: '#1f2937' }}>
              Receipt Details
            </h2>

            <div className="receipt-section">
              <div className="receipt-item">
                <span className="receipt-label">Election</span>
                <span className="receipt-value">{electionTitle}</span>
              </div>
              <div className="receipt-item">
                <span className="receipt-label">Date & Time</span>
                <span className="receipt-value">{timestamp}</span>
              </div>
              <div className="receipt-item">
                <span className="receipt-label">Votes Cast</span>
                <span className="receipt-value">{voteCount}</span>
              </div>
            </div>

            <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 14, color: '#1f2937' }}>
              Your Receipt Hash
            </h3>
            <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>
              Use this hash to verify your vote at any time:
            </p>
            <div className="hash-box">{receiptHash}</div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <a href={verificationUrl} className="verify-button">
                Verify Your Vote
              </a>
            </div>

            <h3 style={{ marginTop: 32, marginBottom: 12, fontSize: 14, color: '#1f2937' }}>
              Privacy & Security
            </h3>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              Your vote is completely anonymous and private. This receipt contains only your receipt hash and the number of votes cast, never revealing your specific choices. You can verify your vote was recorded at any time using the hash above.
            </p>

            <div className="footer">
              <p>This email was sent to {recipientEmail}</p>
              <p>Do not share your receipt hash with anyone.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
