import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ExportData {
  electionTitle: string
  electionType: string
  releasedAt: string
  turnoutPercentage: number
  totalVotes: number
  eligibleVoters: number
  positions: Array<{
    title: string
    candidates: Array<{
      name: string
      voteCount: number
      percentage: string
    }>
    totalVotes: number
  }>
}

export async function exportResultsAsPDF(data: ExportData, filename: string) {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.text(data.electionTitle, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Metadata
    doc.setFontSize(10)
    doc.text(`Election Type: ${data.electionType}`, 20, yPosition)
    yPosition += 7
    doc.text(`Released: ${new Date(data.releasedAt).toLocaleDateString()}`, 20, yPosition)
    yPosition += 15

    // Turnout Summary
    doc.setFontSize(12)
    doc.text('Voter Turnout Summary', 20, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.text(`Total Votes: ${data.totalVotes}`, 25, yPosition)
    yPosition += 6
    doc.text(`Eligible Voters: ${data.eligibleVoters}`, 25, yPosition)
    yPosition += 6
    doc.text(`Turnout: ${data.turnoutPercentage.toFixed(2)}%`, 25, yPosition)
    yPosition += 15

    // Position Results
    doc.setFontSize(12)
    doc.text('Position Results', 20, yPosition)
    yPosition += 10

    for (const position of data.positions) {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(11)
      doc.text(position.title, 20, yPosition)
      yPosition += 8

      doc.setFontSize(9)
      for (const candidate of position.candidates) {
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = 20
        }

        const candidateText = `${candidate.name}: ${candidate.voteCount} votes (${candidate.percentage}%)`
        doc.text(candidateText, 25, yPosition)
        yPosition += 6
      }

      yPosition += 8
    }

    doc.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    throw error
  }
}

export function exportResultsAsCSV(data: ExportData, filename: string) {
  try {
    const csvData: any[] = []

    // Header
    csvData.push(['Election Results'])
    csvData.push([`Election: ${data.electionTitle}`])
    csvData.push([`Type: ${data.electionType}`])
    csvData.push([`Released: ${new Date(data.releasedAt).toLocaleDateString()}`])
    csvData.push([])

    // Turnout
    csvData.push(['Voter Turnout'])
    csvData.push(['Total Votes', data.totalVotes])
    csvData.push(['Eligible Voters', data.eligibleVoters])
    csvData.push(['Turnout %', data.turnoutPercentage.toFixed(2)])
    csvData.push([])

    // Results by position
    for (const position of data.positions) {
      csvData.push([position.title])
      csvData.push(['Candidate', 'Votes', 'Percentage'])

      for (const candidate of position.candidates) {
        csvData.push([candidate.name, candidate.voteCount, candidate.percentage])
      }

      csvData.push([])
    }

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('CSV export error:', error)
    throw error
  }
}

export function exportResultsAsExcel(data: ExportData, filename: string) {
  try {
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryData = [
      ['Election Results'],
      ['Election', data.electionTitle],
      ['Type', data.electionType],
      ['Released', new Date(data.releasedAt).toLocaleDateString()],
      [],
      ['Voter Turnout'],
      ['Total Votes', data.totalVotes],
      ['Eligible Voters', data.eligibleVoters],
      ['Turnout %', data.turnoutPercentage.toFixed(2)],
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

    // Position sheets
    for (const position of data.positions) {
      const positionData = [
        [position.title],
        ['Candidate', 'Votes', 'Percentage'],
        ...position.candidates.map((c) => [c.name, c.voteCount, c.percentage]),
      ]
      const positionSheet = XLSX.utils.aoa_to_sheet(positionData)
      XLSX.utils.book_append_sheet(wb, positionSheet, position.title.substring(0, 31))
    }

    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    throw error
  }
}
