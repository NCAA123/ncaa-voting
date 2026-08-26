'use client'

import { CheckCircle2, Circle } from 'lucide-react'

interface BallotProgressProps {
  currentStep: number
  totalSteps: number
  positionNames: string[]
}

export function BallotProgress({ currentStep, totalSteps, positionNames }: BallotProgressProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2">
          {positionNames.map((name, index) => {
            const step = index + 1
            const isCompleted = step < currentStep
            const isCurrent = step === currentStep

            return (
              <div key={index} className="flex-1">
                <div className="flex flex-col items-center gap-2">
                  {/* Step indicator circle */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      isCompleted
                        ? 'bg-green-100 text-green-700'
                        : isCurrent
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <span>{step}</span>
                    )}
                  </div>

                  {/* Step label */}
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600">Position {step}</p>
                    <p className="truncate text-xs text-gray-500">{name}</p>
                  </div>
                </div>

                {/* Connector line */}
                {index < positionNames.length - 1 && (
                  <div
                    className={`absolute mt-5 h-1 w-[calc(100%-2.5rem)] transition-colors ${
                      isCompleted ? 'bg-green-200' : 'bg-gray-200'
                    }`}
                    style={{
                      left: `calc(${(index * 100) / (positionNames.length - 1)}% + 1.25rem)`,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step counter */}
      <div className="flex items-center justify-between border-t pt-3 text-sm text-gray-600">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <span>
          {currentStep === totalSteps ? 'Review & Submit' : 'Select your choices'}
        </span>
      </div>
    </div>
  )
}
