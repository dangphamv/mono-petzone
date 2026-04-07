import { cn } from '../utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg border border-gray-200 bg-white p-4 shadow-sm', className)}
      {...props}
    />
  )
}
