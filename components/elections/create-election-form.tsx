'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createElection, updateElection } from '@/app/actions/elections'
import {
  createElectionSchema,
  editElectionFieldsSchema,
  type CreateElectionInput,
  type UpdateElectionInput,
} from '@/lib/validations/election'
import { AlertCircle, Loader2 } from 'lucide-react'
import { fromWatDatetimeLocal } from '@/lib/utils'

const ELECTION_TYPES = [
  { value: 'general', label: 'General Election' },
  { value: 'special', label: 'Special Election' },
  { value: 'runoff', label: 'Runoff' },
  { value: 'zonal', label: 'Zonal Election' },
  { value: 'committee', label: 'Committee Election' },
  { value: 'referendum', label: 'Referendum' },
  { value: 'poll', label: 'Poll' },
]

// These must match real values on profiles: zone (North/South/East/West/
// Central/FCT) and arbiter_level (National/International/FIDE/Candidate).
// eligible_voter_categories is matched directly against those columns
// (see checkVotingEligibility / getElectionsForVoter) -- anything else
// silently makes the election invisible to every member.
const VOTER_CATEGORIES = [
  { id: 'North', label: 'North Zone' },
  { id: 'South', label: 'South Zone' },
  { id: 'East', label: 'East Zone' },
  { id: 'West', label: 'West Zone' },
  { id: 'Central', label: 'Central Zone' },
  { id: 'FCT', label: 'FCT' },
  { id: 'National', label: 'National Arbiters' },
  { id: 'International', label: 'International Arbiters' },
  { id: 'FIDE', label: 'FIDE Arbiters' },
  { id: 'Candidate', label: 'Candidate Arbiters' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
]

interface ElectionFormProps {
  mode?: 'create' | 'edit'
  electionId?: string
  defaultValues?: Partial<CreateElectionInput>
}

export function CreateElectionForm({ mode = 'create', electionId, defaultValues }: ElectionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    defaultValues?.eligible_voter_categories || []
  )
  const router = useRouter()
  const isEdit = mode === 'edit'

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateElectionInput>({
    resolver: zodResolver(isEdit ? editElectionFieldsSchema : createElectionSchema) as any,
    defaultValues: {
      status: 'draft',
      eligible_voter_categories: [],
      ...defaultValues,
    },
  })

  const handleCategoryToggle = (categoryId: string) => {
    const updated = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId]

    setSelectedCategories(updated)
    setValue('eligible_voter_categories', updated)
  }

  const onSubmit = async (data: CreateElectionInput) => {
    setIsLoading(true)
    try {
      // The datetime-local inputs hold WAT wall-clock time (e.g. "2:00 PM"
      // meant as Lagos time) -- convert to a real UTC instant before this
      // goes anywhere near storage, instead of letting Postgres assume the
      // naive string is already UTC.
      const payload = {
        ...data,
        start_time: fromWatDatetimeLocal(data.start_time),
        end_time: fromWatDatetimeLocal(data.end_time),
      }

      const result = isEdit
        ? await updateElection({ ...(payload as UpdateElectionInput), id: electionId! })
        : await createElection(payload)

      if (result.success && result.data) {
        toast.success(`Election "${result.data.title}" ${isEdit ? 'updated' : 'created'} successfully`)
        router.push(`/admin/elections/${result.data.id}`)
      } else {
        toast.error(result.error || `Failed to ${isEdit ? 'update' : 'create'} election`)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('[v0] Error saving election:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {isEdit ? 'Edit Election' : 'Create New Election'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEdit
            ? 'Update this election\'s details, voter categories, or status.'
            : 'Set up a new election with positions, candidates, and voter categories.'}
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Election Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Annual Board Election 2024"
              {...register('title')}
              disabled={isLoading}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <div className="flex gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{errors.title.message}</span>
              </div>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Election Type *</Label>
            <Select
              defaultValue={defaultValues?.type || ''}
              onValueChange={(value) => setValue('type', value as any)}
            >
              <SelectTrigger id="type" className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select election type" />
              </SelectTrigger>
              <SelectContent>
                {ELECTION_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <div className="flex gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{errors.type.message}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose and context of this election..."
              {...register('description')}
              disabled={isLoading}
              className={`min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <div className="flex gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{errors.description.message}</span>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                {...register('start_time')}
                disabled={isLoading}
                className={errors.start_time ? 'border-red-500' : ''}
              />
              {errors.start_time && (
                <div className="flex gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{errors.start_time.message}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                {...register('end_time')}
                disabled={isLoading}
                className={errors.end_time ? 'border-red-500' : ''}
              />
              {errors.end_time && (
                <div className="flex gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{errors.end_time.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Eligible Voter Categories */}
          <div className="space-y-3">
            <Label>Eligible Voter Categories *</Label>
            <p className="text-xs text-muted-foreground">
              Select zones and/or arbiter levels. A member is eligible if they match any one selected category.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {VOTER_CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={category.id}
                    className="cursor-pointer font-normal"
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.eligible_voter_categories && (
              <div className="flex gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{errors.eligible_voter_categories.message}</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">{isEdit ? 'Status' : 'Initial Status'}</Label>
            <Select
              defaultValue={defaultValues?.status || 'draft'}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save Changes' : 'Create Election'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
