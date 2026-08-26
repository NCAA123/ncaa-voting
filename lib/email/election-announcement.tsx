import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface ElectionAnnouncementProps {
  electionTitle: string
  electionType: string
  startTime: string
  endTime: string
  eligibleVoterCount: number
  candidateCount: number
  votingLink: string
}

export const ElectionAnnouncement = ({
  electionTitle,
  electionType,
  startTime,
  endTime,
  eligibleVoterCount,
  candidateCount,
  votingLink,
}: ElectionAnnouncementProps) => (
  <Html>
    <Head />
    <Preview>Election {electionTitle} is now open for voting</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Text style={heading}>NCAA Voting Platform</Text>
          <Hr style={hr} />
          <Text style={paragraph}>Election Opening Notification</Text>
          <Text style={largeHeading}>{electionTitle}</Text>
          
          <Section style={infoSection}>
            <Text style={infoLabel}>Election Type:</Text>
            <Text style={infoValue}>{electionType}</Text>
            
            <Text style={infoLabel}>Voting Period:</Text>
            <Text style={infoValue}>{new Date(startTime).toLocaleString()} - {new Date(endTime).toLocaleString()}</Text>
            
            <Text style={infoLabel}>Eligible Voters:</Text>
            <Text style={infoValue}>{eligibleVoterCount}</Text>
            
            <Text style={infoLabel}>Candidates:</Text>
            <Text style={infoValue}>{candidateCount}</Text>
          </Section>

          <Text style={paragraph}>
            You are eligible to vote in this election. This is an important opportunity to participate in the democratic process.
          </Text>

          <Section style={{ textAlign: 'center' as const }}>
            <Button style={button} href={votingLink}>
              Cast Your Vote
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            This is an automated message from the NCAA Voting Platform. Please do not reply to this email.
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

const infoSection = {
  backgroundColor: '#f9f9f9',
  padding: '15px',
  borderRadius: '5px',
  marginBottom: '20px',
}

const infoLabel = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#666',
  marginTop: '10px',
}

const infoValue = {
  fontSize: '14px',
  color: '#333',
  marginTop: '5px',
  marginBottom: '15px',
}

const button = {
  backgroundColor: '#007bff',
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

export default ElectionAnnouncement
