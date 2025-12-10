import { useNavigate } from 'react-router-dom'
import { useCall } from '../context/CallContext'
import Avatar from './Avatar'
import { Phone, X, Video } from 'lucide-react'

function IncomingCallModal() {
  const navigate = useNavigate()
  const { incomingCall, joinCall, declineCall } = useCall()

  const handleAccept = async () => {
    await joinCall(incomingCall)
    navigate('/call')
  }

  if (!incomingCall) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass rounded-3xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Video className="w-10 h-10 text-white" />
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
            title="Decline"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={handleAccept}
            className="w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center"
            title="Accept"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallModal
