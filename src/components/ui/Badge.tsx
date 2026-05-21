interface BadgeProps {
  label: string
  color?: 'green' | 'red' | 'blue' | 'gray'
}

const colorClasses: Record<NonNullable<BadgeProps['color']>, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-slate-100 text-slate-600',
}

export function Badge({ label, color = 'gray' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
        ${colorClasses[color]}
      `}
    >
      {label}
    </span>
  )
}
