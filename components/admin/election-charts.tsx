'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface ElectionChartsProps {
  voteTrend: Array<{ hour: string; count: number }>
  zoneParticipation: Array<{ zone: string; votes: number }>
}

export function ElectionCharts({ voteTrend, zoneParticipation }: ElectionChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Vote Trend</CardTitle></CardHeader>
        <CardContent>
          {voteTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={voteTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Votes" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No voting data yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Zone Participation</CardTitle></CardHeader>
        <CardContent>
          {zoneParticipation.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneParticipation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="votes" fill="#8b5cf6" name="Votes" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No zone data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}