import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCall } from '../context/CallContext'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MoreVertical, Users, MessageSquare,
  Hand, ScreenShare, Minimize2, Maximize2
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
  const [isMinimized, setIsMinimized] = useState(false)
  const localVideoRef = useRef(null)
  const remoteVideoRefs = useRef({})

  // Determine if this is a video call based on local stream having video tracks
  const isVideoCall = localStream?.getVideoTracks()?.length > 0

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

  // Colors for avatars
  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6']
  const getAvatarColor = (name) => {
    const index = (name?.charCodeAt(0) || 0) % avatarColors.length
    return avatarColors[index]
  }

  if (!currentCall && !inCall) {
    return (
      <div className="h-screen bg-black flex items-center justify-center" style={{ height: '100dvh' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Connecting...</p>
        </div>
      </div>
    )
  }

  // Minimized voice call view
  if (isMinimized && !isVideoCall) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
        <div className="bg-black border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-white text-sm font-medium">{formatDuration(callDuration)}</span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            {otherParticipants.slice(0, 3).map(p => (
              <div key={p._id} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white">
                {p.name?.charAt(0)}
              </div>
            ))}
            {otherParticipants.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-gray-500">
                +{otherParticipants.length - 3}
              </div>
            )}
            {otherParticipants.length === 0 && (
              <span className="text-gray-500 text-sm">Waiting...</span>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={toggleMute}
              className={`p-2.5 rounded-full transition-all ${
                isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLeaveCall}
              className="p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Always render the main grid layout (it handles audio-only participants effectively too)
  // This satisfies the requirement to see others' videos even if I am in voice mode.
  // The 'isVideoCall' check is removed to unify the experience.

  const getGridClass = () => {
    const count = otherParticipants.length + 1
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2'
    if (count <= 4) return 'grid-cols-2'
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3'
    return 'grid-cols-3'
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Video Grid */}
      <div className="flex-1 p-2 md:p-4 overflow-hidden">
        {otherParticipants.length === 0 ? (
          // Waiting for others - improved UI
          <div className="h-full flex">
            {/* Your video - large */}
            <div className="flex-1 relative rounded-2xl overflow-hidden bg-neutral-900 m-2">
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
                <div className="w-full h-full flex items-center justify-center relative">
                  <div 
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-5xl md:text-6xl font-semibold text-white"
                    style={{ backgroundColor: getAvatarColor(user?.name) }}
                  >
                    {user?.name?.charAt(0)}
                  </div>
                  <p className="absolute bottom-32 text-white/50 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                    Video Closed
                  </p>
                </div>
              )}
              
              {/* Overlay with waiting message */}
              <div className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-white/80 text-sm">{formatDuration(callDuration)}</span>
                  </div>
                  <p className="text-white font-medium mb-1">Waiting for others to join...</p>
                  <p className="text-white/50 text-sm">Share the meeting link with participants</p>
                </div>
              </div>
              
              {/* Your name badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
                <span className="text-white text-sm">You</span>
              </div>
              
              {isMuted && (
                <div className="absolute top-4 right-4 p-2 rounded-full bg-red-500">
                  <MicOff className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>
        ) : (
          // Connected - grid view
          <div className={`grid ${getGridClass()} gap-2 md:gap-3 h-full auto-rows-fr`}>
            {/* Local video */}
            <div className="relative rounded-xl overflow-hidden bg-neutral-900">
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
                <div className="w-full h-full flex items-center justify-center">
                  <div 
                    className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-3xl md:text-4xl font-semibold text-white"
                    style={{ backgroundColor: getAvatarColor(user?.name) }}
                  >
                    {user?.name?.charAt(0)}
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 text-sm text-white backdrop-blur-sm">
                {isMuted && <MicOff className="w-4 h-4 text-red-400" />}
                <span>You</span>
              </div>
            </div>

            {/* Remote videos */}
            {otherParticipants.map(participant => {
              const hasVideo = participant.isVideoEnabled && participant.stream?.getVideoTracks()?.some(t => t.enabled)
              
              return (
                <div key={participant._id} className="relative rounded-xl overflow-hidden bg-neutral-900">
                  {hasVideo ? (
                    <video
                      ref={el => { remoteVideoRefs.current[participant._id] = el }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                      <div 
                        className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-3xl md:text-4xl font-semibold text-white"
                        style={{ backgroundColor: getAvatarColor(participant.name) }}
                      >
                        {participant.name?.charAt(0)}
                      </div>
                      <p className="absolute bottom-24 md:bottom-32 text-white/50 text-xs md:text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                        Video Closed
                      </p>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 text-sm text-white backdrop-blur-sm">
                    {participant.isMuted && <MicOff className="w-4 h-4 text-red-400" />}
                    <span className="truncate max-w-[120px]">{participant.name?.split(' ')[0]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom controls bar - Black/White theme */}
      <div className="bg-black border-t border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left - Meeting info */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            <span className="text-white/60">{formatTime(currentTime)}</span>
            <span className="w-1 h-1 rounded-full bg-white/30"></span>
            <span className="text-white font-medium">{formatDuration(callDuration)}</span>
          </div>

          {/* Center - Main controls */}
          <div className="flex items-center justify-center gap-3 flex-1 md:flex-none">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all ${
                isMuted 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                !isVideoEnabled 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            <button
              className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hidden md:flex"
              title="Share screen"
            >
              <ScreenShare className="w-6 h-6" />
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
              className="p-3 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
              title="Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`p-3 rounded-full transition-all relative ${
                showParticipants ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/60 hover:text-white'
              }`}
              title="Participants"
            >
              <Users className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center text-white">
                {otherParticipants.length + 1}
              </span>
            </button>

            <button
              className="p-3 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
              title="More"
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
