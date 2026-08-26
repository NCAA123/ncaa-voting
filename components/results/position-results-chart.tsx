'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CandidateResult {
  id: string
  name: string
  photoUrl?: string
  voteCount: number
  percentage: string
}

interface PositionResultsChartProps {
  position: {
    id: string
    title: string
    candidates: CandidateResult[]
    totalVotes: number
  }
}

export function PositionResultsChart({ position }: PositionResultsChartProps) {
  // Find winner (highest vote count)
  const winner = position.candidates.reduce((prev, current) =>
    prev.voteCount > current.voteCount ? prev : current
  )

  const chartData = position.candidates.map((candidate) => ({
    name: candidate.name,
    votes: candidate.voteCount,
    percentage: parseFloat(candidate.percentage),
  }))

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">{position.title}</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Total votes: {position.totalVotes}</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip
              formatter={(value: any) => `${value} votes`}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="votes" fill="#3b82f6" name="Votes" radius={[8, 8, 0, 0]}>
              {position.candidates.map((candidate, index) => (
                <Cell
                  key={`cell-${candidate.id}`}
                  fill={candidate.id === winner.id ? '#10b981' : colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Winner Highlight */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-900">Position Winner</p>
          <p className="text-lg font-bold text-green-700 mt-1">{winner.name}</p>
          <p className="text-sm text-green-600 mt-1">
            {winner.voteCount} votes ({winner.percentage}%)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
