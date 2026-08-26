'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { PositionCard } from './position-card'
import {
  createPosition,
  deletePosition,
  reorderPositions,
} from '@/app/actions/positions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface PositionsManagerProps {
  electionId: string
  initialPositions: any[]
}

export function PositionsManager({ electionId, initialPositions }: PositionsManagerProps) {
  const [positions, setPositions] = useState(initialPositions)
  const [isLoading, setIsLoading] = useState(false)
  const [newPositionName, setNewPositionName] = useState('')
  const [newPositionMaxVotes, setNewPositionMaxVotes] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = positions.findIndex((pos) => pos.id === active.id)
    const newIndex = positions.findIndex((pos) => pos.id === over.id)

    const newPositions = arrayMove(positions, oldIndex, newIndex)
    setPositions(newPositions)

    // Update display_order on server
    const reorderedData = newPositions.map((pos, index) => ({
      id: pos.id,
      display_order: index,
    }))

    const result = await reorderPositions({ positions: reorderedData })

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to reorder positions',
        variant: 'destructive',
      })
      setPositions(initialPositions)
    } else {
      toast({
        title: 'Success',
        description: 'Positions reordered',
      })
    }
  }

  const handleCreatePosition = async () => {
    if (!newPositionName.trim()) {
      toast({
        title: 'Error',
        description: 'Position name is required',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    const result = await createPosition({
      election_id: electionId,
      title: newPositionName,
      max_votes: newPositionMaxVotes,
      display_order: positions.length,
    })

    setIsLoading(false)

    if (result.success) {
      setNewPositionName('')
      setNewPositionMaxVotes(1)
      setIsDialogOpen(false)
      toast({
        title: 'Success',
        description: 'Position created',
      })
      router.refresh()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create position',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm('Are you sure you want to delete this position?')) {
      return
    }

    setIsLoading(true)
    const result = await deletePosition({ id: positionId })
    setIsLoading(false)

    if (result.success) {
      setPositions(positions.filter((pos) => pos.id !== positionId))
      toast({
        title: 'Success',
        description: 'Position deleted',
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete position',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Positions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Drag to reorder, or add new positions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Position</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Position</DialogTitle>
              <DialogDescription>
                Add a position voters will choose candidates for, like President or Vice President.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="position-name">Position Name</Label>
                <Input
                  id="position-name"
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  placeholder="e.g., President, Vice President"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="max-votes">Max Votes per Voter</Label>
                <Input
                  id="max-votes"
                  type="number"
                  min="1"
                  max="100"
                  value={newPositionMaxVotes}
                  onChange={(e) => setNewPositionMaxVotes(parseInt(e.target.value))}
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleCreatePosition}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Position'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No positions yet. Create one to get started.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={positions.map((pos) => pos.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {positions.map((position) => (
                <PositionCard
                  key={position.id}
                  id={position.id}
                  name={position.title}
                  maxVotes={position.max_votes}
                  candidatesCount={position.candidates_count}
                  onDelete={handleDeletePosition}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
