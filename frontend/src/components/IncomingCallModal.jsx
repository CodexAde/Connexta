import { useCall } from '../context/CallContext'
import Avatar from './Avatar'

function IncomingCallModal() {
  const { incomingCall, joinCall, declineCall } = useCall()

  if (!incomingCall) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass rounded-3xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Incoming Call</h2>
          <p className="text-gray-400">
            {incomingCall.startedBy?.name || 'Someone'} is calling...
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          {incomingCall.participants?.slice(0, 3).map(participant => (
            <Avatar key={participant._id} user={participant} size="sm" />
          ))}
          {incomingCall.participants?.length > 3 && (
            <div className="avatar-sm bg-white/10 text-gray-400">
              +{incomingCall.participants.length - 3}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={declineCall}
            className="w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={() => joinCall(incomingCall)}
            className="w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallModal
