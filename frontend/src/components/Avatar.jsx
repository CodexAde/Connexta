function Avatar({ user, size = 'md' }) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl'
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const getColorClass = (name) => {
    if (!name) return 'bg-gray-500/20 text-gray-400'
    
    const colors = [
      'bg-indigo-500/20 text-indigo-400',
      'bg-purple-500/20 text-purple-400',
      'bg-pink-500/20 text-pink-400',
      'bg-blue-500/20 text-blue-400',
      'bg-cyan-500/20 text-cyan-400',
      'bg-teal-500/20 text-teal-400',
      'bg-green-500/20 text-green-400',
      'bg-yellow-500/20 text-yellow-400',
      'bg-orange-500/20 text-orange-400',
      'bg-red-500/20 text-red-400'
    ]
    
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name || 'User'}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0`}
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full ${getColorClass(user?.name)} flex items-center justify-center font-semibold shrink-0`}>
      {getInitials(user?.name)}
    </div>
  )
}

export default Avatar
