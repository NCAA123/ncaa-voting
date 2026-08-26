import type { Metadata } from 'next'
import { CreateElectionForm } from '@/components/elections/create-election-form'

export const metadata: Metadata = {
  title: 'Create New Election | NCAA Voting',
  description: 'Create a new election with positions, candidates, and voter categories',
}

export default function NewElectionPage() {
  return <CreateElectionForm />
}
