import { useEffect, useRef, useState } from 'react'
import { useCall } from '../context/CallContext'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2 } from 'lucide-react'

function CallPanel() {
  const { user } = useAuth()
  const { 
    currentCall, 
    participants, 
    localStream,
    isMuted, 
    isVideoEnabled,
    toggleMute, 
    toggleVideo, 
    leaveCall 
  } = useCall()

  const [isExpanded, setIsExpanded] = useState(false)
  const localVideoRef = useRef(null)
  const remoteVideoRefs = useRef({})

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Attach remote streams to video elements
  useEffect(() => {
    participants.forEach(participant => {
      if (participant.stream && remoteVideoRefs.current[participant._id]) {
        remoteVideoRefs.current[participant._id].srcObject = participant.stream
      }
    })
  }, [participants])

  if (!currentCall) return null

  const otherParticipants = participants.filter(p => p._id !== user?._id)

  return (
    <div className={`fixed z-50 animate-slide-in transition-all duration-300 ${
      isExpanded 
        ? 'inset-4 md:inset-8' 
        : 'bottom-4 right-4 md:bottom-6 md:right-6 w-80 md:w-96'
    }`}>
      <div className={`glass rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden ${
        isExpanded ? '' : 'max-h-[500px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {currentCall.type === 'channel' ? 'Channel Call' : 'Direct Call'}
            </h3>
            <p className="text-xs text-gray-500">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className={`flex-1 p-3 overflow-hidden ${
          isExpanded ? 'grid grid-cols-2 gap-3' : 'space-y-3'
        }`}>
          {/* Local video */}
          <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-video">
            {isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Avatar user={user} size="lg" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-xs text-white">
              You {isMuted && '(muted)'}
            </div>
          </div>

          {/* Remote videos */}
          {otherParticipants.map(participant => (
            <div key={participant._id} className="relative rounded-xl overflow-hidden bg-black/50 aspect-video">
              {participant.stream && participant.stream.getVideoTracks().length > 0 ? (
                <video
                  ref={el => { remoteVideoRefs.current[participant._id] = el }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Avatar user={participant} size="lg" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-xs text-white flex items-center gap-1">
                {participant.name?.split(' ')[0]}
                {participant.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
              </div>
            </div>
          ))}

          {/* Empty state for waiting */}
          {otherParticipants.length === 0 && (
            <div className="rounded-xl bg-white/[0.02] border border-dashed border-white/10 aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-2">
                  <Video className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-xs text-gray-500">Waiting for others...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-white/[0.05]">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleMute}
              className={`p-3.5 rounded-full transition-all ${
                isMuted 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-full transition-all ${
                isVideoEnabled 
                  ? 'bg-white/[0.08] text-white hover:bg-white/[0.12]' 
                  : 'bg-white/[0.05] text-gray-500 hover:bg-white/[0.08]'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={leaveCall}
              className="p-3.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="End call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallPanel
