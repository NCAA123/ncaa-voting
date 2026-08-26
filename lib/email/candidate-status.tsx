import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface CandidateStatusProps {
  candidateName: string
  electionTitle: string
  status: 'approved' | 'rejected'
  rejectionReason?: string
  profileLink?: string
}

export const CandidateStatus = ({
  candidateName,
  electionTitle,
  status,
  rejectionReason,
  profileLink,
}: CandidateStatusProps) => {
  const isApproved = status === 'approved'
  const statusColor = isApproved ? '#28a745' : '#dc3545'
  const statusTitle = isApproved ? 'Application Approved' : 'Application Status'

  return (
    <Html>
      <Head />
      <Preview>{statusTitle} - {electionTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>NCAA Voting Platform</Text>
            <Hr style={hr} />
            <Text style={largeHeading}>{statusTitle}</Text>
            
            <Text style={paragraph}>
              Dear {candidateName},
            </Text>

            {isApproved ? (
              <>
                <Text style={paragraph}>
                  Congratulations! Your candidate application for <strong>{electionTitle}</strong> has been <strong style={{ color: '#28a745' }}>approved</strong>.
                </Text>
                <Text style={paragraph}>
                  Your profile is now visible to voters. Campaign period will begin on the announced date.
                </Text>
                <Section style={{ textAlign: 'center' as const }}>
                  <Button style={{ ...button, backgroundColor: '#28a745' }} href={profileLink}>
                    View Your Profile
                  </Button>
                </Section>
              </>
            ) : (
              <>
                <Text style={paragraph}>
                  Thank you for your application to <strong>{electionTitle}</strong>. Unfortunately, your application has been <strong style={{ color: '#dc3545' }}>not approved</strong> at this time.
                </Text>
                {rejectionReason && (
                  <Section style={reasonBox}>
                    <Text style={reasonLabel}>Reason:</Text>
                    <Text style={reasonText}>{rejectionReason}</Text>
                  </Section>
                )}
                <Text style={paragraph}>
                  You may reapply for future elections. Please contact us if you have any questions.
                </Text>
              </>
            )}

            <Hr style={hr} />
            <Text style={footer}>
              This is an automated message from the NCAA Voting Platform.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f4f4f4',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  maxWidth: '580px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
}

const box = {
  padding: '0 20px',
}

const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  marginTop: '20px',
  marginBottom: '10px',
  textAlign: 'center' as const,
  color: '#333',
}

const largeHeading = {
  fontSize: '24px',
  fontWeight: '600',
  marginTop: '20px',
  marginBottom: '20px',
  textAlign: 'center' as const,
  color: '#1a1a1a',
}

const hr = {
  borderColor: '#e0e0e0',
  margin: '20px 0',
}

const paragraph = {
  color: '#666',
  fontSize: '15px',
  lineHeight: '1.5',
  textAlign: 'left' as const,
  marginBottom: '15px',
}

const button = {
  borderRadius: '4px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 'bold',
  padding: '12px 30px',
  textDecoration: 'none',
}

const reasonBox = {
  backgroundColor: '#f9f9f9',
  padding: '15px',
  borderRadius: '5px',
  marginBottom: '20px',
  borderLeft: '4px solid #dc3545',
}

const reasonLabel = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#666',
  marginBottom: '8px',
}

const reasonText = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.5',
}

const footer = {
  color: '#999',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '20px',
}

export default CandidateStatus
