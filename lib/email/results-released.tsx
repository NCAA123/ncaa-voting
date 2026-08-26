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

interface ResultsReleasedProps {
  electionTitle: string
  resultLink: string
}

export const ResultsReleased = ({
  electionTitle,
  resultLink,
}: ResultsReleasedProps) => (
  <Html>
    <Head />
    <Preview>Results for {electionTitle} are now available</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Text style={heading}>NCAA Voting Platform</Text>
          <Hr style={hr} />
          <Text style={largeHeading}>Election Results Released</Text>
          
          <Text style={paragraph}>
            The results for <strong>{electionTitle}</strong> are now publicly available.
          </Text>

          <Text style={paragraph}>
            You can view the complete results, including vote counts by position and candidate rankings, at any time.
          </Text>

          <Section style={{ textAlign: 'center' as const }}>
            <Button style={button} href={resultLink}>
              View Results
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            This is an automated message from the NCAA Voting Platform.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

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
  backgroundColor: '#28a745',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 'bold',
  padding: '12px 30px',
  textDecoration: 'none',
}

const footer = {
  color: '#999',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '20px',
}

export default ResultsReleased
