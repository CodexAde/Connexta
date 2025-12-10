import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCall } from '../context/CallContext'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MoreVertical, Users, MessageSquare, Settings,
  Hand, ScreenShare, Grid3X3
} from 'lucide-react'

function VideoCallPage() {
  const { callId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { 
    currentCall, 
    participants, 
    localStream,
    isMuted, 
    isVideoEnabled,
    toggleMute, 
    toggleVideo, 
    leaveCall,
    inCall
  } = useCall()

  const [showParticipants, setShowParticipants] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const localVideoRef = useRef(null)
  const remoteVideoRefs = useRef({})

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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

  // Redirect if not in a call
  useEffect(() => {
    if (!inCall && !currentCall) {
      navigate('/app')
    }
  }, [inCall, currentCall, navigate])

  const handleLeaveCall = async () => {
    await leaveCall()
    navigate('/app')
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const allParticipants = [
    { ...user, isLocal: true, isMuted, stream: localStream },
    ...participants.filter(p => p._id !== user?._id).map(p => ({ ...p, isLocal: false }))
  ]

  // Calculate grid layout
  const getGridClass = () => {
    const count = allParticipants.length
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2'
    if (count <= 4) return 'grid-cols-2'
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3'
    if (count <= 9) return 'grid-cols-3'
    return 'grid-cols-3 md:grid-cols-4'
  }

  if (!currentCall) {
    return (
      <div className="h-screen bg-[#202124] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to call...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#202124] flex flex-col overflow-hidden">
      {/* Video Grid */}
      <div className="flex-1 p-2 md:p-4 overflow-hidden">
        <div className={`grid ${getGridClass()} gap-2 md:gap-3 h-full auto-rows-fr`}>
          {allParticipants.map((participant) => (
            <div 
              key={participant._id} 
              className="relative rounded-lg overflow-hidden bg-[#3c4043] group"
            >
              {/* Video or Avatar */}
              {(participant.isLocal ? isVideoEnabled : participant.stream?.getVideoTracks().length > 0) ? (
                <video
                  ref={participant.isLocal ? localVideoRef : (el => { remoteVideoRefs.current[participant._id] = el })}
                  autoPlay
                  muted={participant.isLocal}
                  playsInline
                  className={`w-full h-full object-cover ${participant.isLocal ? 'mirror' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#3c4043]">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-[#5f6368] flex items-center justify-center text-2xl md:text-4xl font-medium text-white uppercase">
                    {participant.name?.charAt(0) || participant.avatarUrl ? (
                      <Avatar user={participant} size="lg" />
                    ) : (
                      participant.name?.charAt(0)
                    )}
                  </div>
                </div>
              )}

              {/* Name label */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/60 text-sm text-white">
                  {participant.isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                  <span className="truncate max-w-[150px]">
                    {participant.isLocal ? 'You' : participant.name}
                  </span>
                </div>
              </div>

              {/* Active speaker indicator */}
              {!participant.isMuted && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls bar */}
      <div className="bg-[#202124] border-t border-white/[0.08] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left - Meeting info */}
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
            <span className="truncate max-w-[200px]">
              {currentCall.type === 'channel' ? 'Channel Call' : 'Direct Call'}
            </span>
          </div>

          {/* Center - Main controls */}
          <div className="flex items-center justify-center gap-2 md:gap-3 flex-1 md:flex-none">
            <button
              onClick={toggleMute}
              className={`p-3 md:p-3.5 rounded-full transition-all ${
                isMuted 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-[#3c4043] text-white hover:bg-[#4a4d51]'
              }`}
              title={isMuted ? 'Turn on microphone' : 'Turn off microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 md:p-3.5 rounded-full transition-all ${
                !isVideoEnabled 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-[#3c4043] text-white hover:bg-[#4a4d51]'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              className="p-3 md:p-3.5 rounded-full bg-[#3c4043] text-white hover:bg-[#4a4d51] transition-all hidden md:flex"
              title="Present screen"
            >
              <ScreenShare className="w-5 h-5" />
            </button>

            <button
              className="p-3 md:p-3.5 rounded-full bg-[#3c4043] text-white hover:bg-[#4a4d51] transition-all hidden md:flex"
              title="Raise hand"
            >
              <Hand className="w-5 h-5" />
            </button>

            <button
              className="p-3 md:p-3.5 rounded-full bg-[#3c4043] text-white hover:bg-[#4a4d51] transition-all hidden md:flex"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <button
              onClick={handleLeaveCall}
              className="p-3 md:p-3.5 px-6 md:px-8 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
              title="Leave call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          {/* Right - Side panel toggles */}
          <div className="hidden md:flex items-center gap-2">
            <button
              className="p-2.5 rounded-full hover:bg-[#3c4043] text-gray-400 hover:text-white transition-all"
              title="Show chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`p-2.5 rounded-full transition-all relative ${
                showParticipants 
                  ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' 
                  : 'hover:bg-[#3c4043] text-gray-400 hover:text-white'
              }`}
              title="Show participants"
            >
              <Users className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#3c4043] text-xs flex items-center justify-center text-white">
                {allParticipants.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* CSS for mirror effect */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  )
}

export default VideoCallPage
