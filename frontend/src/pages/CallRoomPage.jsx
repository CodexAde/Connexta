import { useCall } from '../context/CallContext'

function CallRoomPage() {
  const { currentCall, participants, inCall } = useCall()

  if (!inCall || !currentCall) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Active Calls</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Start a call from a channel or direct message to connect with your team.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          {currentCall.type === 'channel' ? 'Channel Call' : 'Direct Call'}
        </h2>
        <p className="text-gray-400 text-sm">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {participants.map(participant => (
          <div
            key={participant._id}
            className="aspect-video rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-4 relative"
          >
            {participant.stream ? (
              <video
                autoPlay
                playsInline
                muted={participant._id === currentCall.startedBy?._id}
                ref={el => {
                  if (el && participant.stream) {
                    el.srcObject = participant.stream
                  }
                }}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                {participant.name?.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-sm font-medium text-white bg-black/50 px-2 py-1 rounded-lg">
                {participant.name}
              </span>
              
              {participant.isMuted && (
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CallRoomPage
