import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCall } from '../context/CallContext'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MoreVertical, Users, MessageSquare,
  Hand, ScreenShare
} from 'lucide-react'

function VideoCallPage() {
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
  const [callDuration, setCallDuration] = useState(0)
  const localVideoRef = useRef(null)
  const remoteVideoRefs = useRef({})

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      setCallDuration(prev => prev + 1)
    }, 1000)
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
      const timer = setTimeout(() => {
        navigate('/app')
      }, 1000)
      return () => clearTimeout(timer)
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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Filter participants - remove duplicates and self
  const otherParticipants = participants.filter(p => p._id !== user?._id)

  // Calculate grid layout
  const getGridClass = () => {
    const count = otherParticipants.length + 1
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2'
    if (count <= 4) return 'grid-cols-2'
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3'
    if (count <= 9) return 'grid-cols-3'
    return 'grid-cols-3 md:grid-cols-4'
  }

  if (!currentCall && !inCall) {
    return (
      <div className="h-screen bg-[#202124] flex items-center justify-center" style={{ height: '100dvh' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to call...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#202124] flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Video Grid */}
      <div className="flex-1 p-2 md:p-4 overflow-hidden">
        <div className={`grid ${getGridClass()} gap-2 md:gap-3 h-full auto-rows-fr`}>
          {/* Local video (self) */}
          <div className="relative rounded-xl overflow-hidden bg-[#3c4043] group">
            {isVideoEnabled && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3c4043] to-[#313134]">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-indigo-600 flex items-center justify-center text-3xl md:text-4xl font-semibold text-white uppercase shadow-lg">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 text-sm text-white backdrop-blur-sm">
              {isMuted && <MicOff className="w-4 h-4 text-red-400" />}
              <span>You</span>
            </div>
            {isMuted && (
              <div className="absolute top-3 right-3 p-2 rounded-full bg-red-500/90">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Remote videos */}
          {otherParticipants.map(participant => (
            <div key={participant._id} className="relative rounded-xl overflow-hidden bg-[#3c4043] group">
              {participant.stream && participant.stream.getVideoTracks().length > 0 && participant.stream.getVideoTracks()[0].enabled ? (
                <video
                  ref={el => { remoteVideoRefs.current[participant._id] = el }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3c4043] to-[#313134]">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-emerald-600 flex items-center justify-center text-3xl md:text-4xl font-semibold text-white uppercase shadow-lg">
                    {participant.name?.charAt(0) || 'U'}
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 text-sm text-white backdrop-blur-sm">
                {participant.isMuted && <MicOff className="w-4 h-4 text-red-400" />}
                <span className="truncate max-w-[120px]">{participant.name?.split(' ')[0]}</span>
              </div>
              {participant.isMuted && (
                <div className="absolute top-3 right-3 p-2 rounded-full bg-red-500/90">
                  <MicOff className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Empty state for waiting */}
          {otherParticipants.length === 0 && (
            <div className="rounded-xl bg-[#3c4043]/50 border-2 border-dashed border-white/10 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-lg text-white mb-2">Waiting for others to join...</p>
                <p className="text-sm text-gray-500">Share the call link with participants</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls bar */}
      <div className="bg-[#202124] px-4 py-4 safe-area-inset-bottom">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left - Meeting info */}
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
            <span className="text-green-400 font-medium">{formatDuration(callDuration)}</span>
          </div>

          {/* Center - Main controls */}
          <div className="flex items-center justify-center gap-3 flex-1 md:flex-none">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all ${
                isMuted 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-[#3c4043] text-white hover:bg-[#4a4d51]'
              }`}
              title={isMuted ? 'Turn on microphone' : 'Turn off microphone'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                !isVideoEnabled 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-[#3c4043] text-white hover:bg-[#4a4d51]'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            <button
              className="p-4 rounded-full bg-[#3c4043] text-white hover:bg-[#4a4d51] transition-all hidden md:flex"
              title="Present screen"
            >
              <ScreenShare className="w-6 h-6" />
            </button>

            <button
              className="p-4 rounded-full bg-[#3c4043] text-white hover:bg-[#4a4d51] transition-all hidden md:flex"
              title="Raise hand"
            >
              <Hand className="w-6 h-6" />
            </button>

            <button
              onClick={handleLeaveCall}
              className="p-4 px-8 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
              title="Leave call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>

          {/* Right - Side panel toggles */}
          <div className="hidden md:flex items-center gap-2">
            <button
              className="p-3 rounded-full hover:bg-[#3c4043] text-gray-400 hover:text-white transition-all"
              title="Show chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`p-3 rounded-full transition-all relative ${
                showParticipants 
                  ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' 
                  : 'hover:bg-[#3c4043] text-gray-400 hover:text-white'
              }`}
              title="Show participants"
            >
              <Users className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#3c4043] text-xs flex items-center justify-center text-white border border-[#202124]">
                {otherParticipants.length + 1}
              </span>
            </button>

            <button
              className="p-3 rounded-full hover:bg-[#3c4043] text-gray-400 hover:text-white transition-all"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoCallPage
