import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'
import * as callService from '../services/callService'

const CallContext = createContext(null)

export const useCall = () => {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}

export const CallProvider = ({ children }) => {
  const { user, socket } = useAuth()
  const [currentCall, setCurrentCall] = useState(null)
  const [participants, setParticipants] = useState([])
  const [localStream, setLocalStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [ongoingCalls, setOngoingCalls] = useState({}) // Track ongoing calls in channels
  
  const peerConnections = useRef({})
  const remoteStreams = useRef({})
  const localStreamRef = useRef(null)
  const currentCallRef = useRef(null)

  // Keep refs in sync with state
  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  useEffect(() => {
    currentCallRef.current = currentCall
  }, [currentCall])

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  }

  useEffect(() => {
    if (!socket) return

    const handleCallStarted = (call) => {
      // Track ongoing call for this channel/dm
      const roomKey = call.channel || call.dmRoomId
      setOngoingCalls(prev => ({ ...prev, [roomKey]: call }))
      
      if (call.startedBy._id !== user?._id) {
        setIncomingCall(call)
      }
    }

    const handleUserJoined = async (data) => {
      console.log('User joined:', data)
      if (currentCallRef.current && data.user._id !== user?._id) {
        // Only show toast if user is not already in the list
        setParticipants(prev => {
          if (prev.find(p => p._id === data.user._id)) return prev
          
          toast.success(`${data.user.name} joined the call`, {
            icon: '👋',
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          })
          
          return [...prev, { ...data.user, isMuted: false }]
        })

        // Create peer connection as initiator (we were here first)
        setTimeout(async () => {
          await createPeerConnection(data.user._id, true)
        }, 500)
      }
    }

    const handleUserLeft = (data) => {
      setParticipants(prev => {
        const userLeaving = prev.find(p => p._id === data.userId)
        if (userLeaving) {
             toast(`${userLeaving.name} left the call`, {
                icon: '👋',
                style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
                },
             })
        }
        return prev.filter(p => p._id !== data.userId)
      })

      if (peerConnections.current[data.userId]) {
        peerConnections.current[data.userId].close()
        delete peerConnections.current[data.userId]
      }
      if (remoteStreams.current[data.userId]) {
        delete remoteStreams.current[data.userId]
      }
    }

    const handleSignal = async (data) => {
      const { signalData, fromUserId } = data
      console.log('Received signal from:', fromUserId, signalData.type || 'ICE')
      
      try {
        if (!peerConnections.current[fromUserId]) {
          await createPeerConnection(fromUserId, false)
        }
        
        const pc = peerConnections.current[fromUserId]
        if (!pc) return
        
        if (signalData.type === 'offer') {
          // Avoid handling offer if we are already in stable state or have distinct role issues?
          // But usually we just accept. 
          // Check for glare: if we are signalingState 'have-local-offer', we have a collision.
          if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-remote-offer') {
             console.warn('Glare detected or invalid state for offer:', pc.signalingState)
             // In a perfect world we handle polite/impolite. For now, we proceed but log.
             // If we are initiator (impolite), we might ignore? 
             // Let's just try to process.
          }
          
          await pc.setRemoteDescription(new RTCSessionDescription(signalData))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          
          const call = currentCallRef.current
          socket.emit('call:signal', {
            roomId: call?.channel || call?.dmRoomId,
            roomType: call?.type,
            signalData: answer,
            targetUserId: fromUserId
          })
        } else if (signalData.type === 'answer') {
          if (pc.signalingState === 'stable') {
             console.warn('Received answer in stable state - ignoring')
             return
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signalData))
        } else if (signalData.candidate) {
          try {
             // Only add candidate if remote description is set or pending?
             // Actually allow buffering if needed, but simple add works for now
            if (pc.remoteDescription) {
               await pc.addIceCandidate(new RTCIceCandidate(signalData))
            } else {
               // Buffer candidates? For simplicity, we just log and skip or rely on trickling later
               console.log('Skipping ICE candidate - no remote description')
            }
          } catch (e) {
            console.log('ICE candidate error (may be normal):', e)
          }
        }
      } catch (error) {
        console.error('Signal handling error:', error)
      }
    }

    const handleUserMuted = (data) => {
      setParticipants(prev => 
        prev.map(p => p._id === data.userId ? { ...p, isMuted: data.isMuted } : p)
      )
    }

    const handleVideoToggled = (data) => {
      // In a real WebRTC app, track stream events usually handle this, but
      // having an explicit state helps for UI (e.g. showing avatar when remote disabled video)
      setParticipants(prev => 
        prev.map(p => p._id === data.userId ? { ...p, isVideoEnabled: data.isVideoEnabled } : p)
      )
    }

    const handleCallEnded = (data) => {
      const roomKey = data?.roomId
      if (roomKey) {
        setOngoingCalls(prev => {
          const updated = { ...prev }
          delete updated[roomKey]
          return updated
        })
      }
      cleanup()
    }

    socket.on('call:started', handleCallStarted)
    socket.on('call:user-joined', handleUserJoined)
    socket.on('call:user-left', handleUserLeft)
    socket.on('call:signal', handleSignal)
    socket.on('call:user-muted', handleUserMuted)
    socket.on('call:toggle-video', handleVideoToggled)
    socket.on('call:ended', handleCallEnded)

    return () => {
      socket.off('call:started', handleCallStarted)
      socket.off('call:user-joined', handleUserJoined)
      socket.off('call:user-left', handleUserLeft)
      socket.off('call:signal', handleSignal)
      socket.off('call:user-muted', handleUserMuted)
      socket.off('call:toggle-video', handleVideoToggled)
      socket.off('call:ended', handleCallEnded)
    }
  }, [socket, user?._id])

  // Handle negotiation needed event (crucial for adding tracks mid-call)
  const handleNegotiationNeeded = async (pc, userId) => {
    try {
      // Only the initiator should effectively restart negotiation to avoid glare, 
      // but simpler is to just let the side adding the track create an offer.
      // In this app context, if we add a track, we create an offer.
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      const call = currentCallRef.current
      socket.emit('call:signal', {
        roomId: call?.channel || call?.dmRoomId,
        roomType: call?.type,
        signalData: offer,
        targetUserId: userId
      })
    } catch (error) {
      console.error('Negotiation error:', error)
    }
  }

  const createPeerConnection = async (userId, initiator) => {
    console.log('Creating peer connection for:', userId, 'initiator:', initiator)
    
    // Close existing connection if any
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close()
    }
    
    const pc = new RTCPeerConnection(iceServers)
    peerConnections.current[userId] = pc

    const stream = localStreamRef.current
    
    // Use Transceivers to ensure consistent m-line order (Audio first, then Video)
    // Audio
    const audioTrack = stream?.getAudioTracks()[0]
    pc.addTransceiver(audioTrack || 'audio', { 
      direction: 'sendrecv', 
      streams: stream ? [stream] : [] 
    })

    // Video
    const videoTrack = stream?.getVideoTracks()[0]
    pc.addTransceiver(videoTrack || 'video', { 
      direction: 'sendrecv', 
      streams: stream ? [stream] : [] 
    })

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind)
      remoteStreams.current[userId] = event.streams[0]
      setParticipants(prev => 
        prev.map(p => p._id === userId ? { ...p, stream: event.streams[0] } : p)
      )
    }

    // Handle negotiation needed - debounced or checked?
    pc.onnegotiationneeded = async () => {
        // Only trigger manual negotiation if we are stable? 
        // With static transceivers, negotiation needed might happen less often.
        if (pc.signalingState !== 'stable') return
        await handleNegotiationNeeded(pc, userId)
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const call = currentCallRef.current
        socket.emit('call:signal', {
          roomId: call?.channel || call?.dmRoomId,
          roomType: call?.type,
          signalData: event.candidate,
          targetUserId: userId
        })
      }
    }

    // If initiator, create and send offer
    if (initiator) {
      try {
        const offer = await pc.createOffer() // transceivers ensure audio/video are offered
        await pc.setLocalDescription(offer)
        
        const call = currentCallRef.current
        socket.emit('call:signal', {
          roomId: call?.channel || call?.dmRoomId,
          roomType: call?.type,
          signalData: offer,
          targetUserId: userId
        })
      } catch (error) {
        console.error('Error creating offer:', error)
      }
    }

    return pc
  }

  const startCall = async (type, channelId, recipientId, withVideo = false) => {
    try {
      // Request media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: withVideo 
      })
      setLocalStream(stream)
      localStreamRef.current = stream
      setIsVideoEnabled(withVideo)

      const data = await callService.createCall({ type, channelId, recipientId })
      setCurrentCall(data.call)
      currentCallRef.current = data.call
      setParticipants([{ ...user, isMuted: false, isVideoEnabled: withVideo }])
      setInCall(true)

      if (socket) {
        socket.emit('call:join', {
          roomId: channelId || recipientId,
          roomType: type
        })
      }

      return data.call
    } catch (error) {
      console.error('Failed to start call:', error)
      // Try audio-only if video fails
      if (withVideo) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          setLocalStream(audioStream)
          localStreamRef.current = audioStream
          setIsVideoEnabled(false)
          
          const data = await callService.createCall({ type, channelId, recipientId })
          setCurrentCall(data.call)
          currentCallRef.current = data.call
          setParticipants([{ ...user, isMuted: false, isVideoEnabled: false }])
          setInCall(true)

          if (socket) {
            socket.emit('call:join', {
              roomId: channelId || recipientId,
              roomType: type
            })
          }

          return data.call
        } catch (audioError) {
          console.error('Failed to start audio call:', audioError)
          throw audioError
        }
      }
      throw error
    }
  }

  const joinCall = async (call, withVideo = false) => {
    try {
      // Respect withVideo preference
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: withVideo 
      })
      
      setLocalStream(stream)
      localStreamRef.current = stream
      // Check if we actually got video
      const hasVideo = stream.getVideoTracks().length > 0
      setIsVideoEnabled(hasVideo)

      await callService.joinCall(call._id)
      setCurrentCall(call)
      currentCallRef.current = call
      setParticipants(call.participants?.map(p => ({ ...p, isMuted: false })) || [])
      setInCall(true)
      setIncomingCall(null)

      if (socket) {
        socket.emit('call:join', {
          roomId: call.channel || call.dmRoomId,
          roomType: call.type
        })
      }
    } catch (error) {
      console.error('Failed to join call:', error)
      throw error
    }
  }

  const leaveCall = async () => {
    if (currentCall) {
      try {
        await callService.leaveCall(currentCall._id)
        if (socket) {
          socket.emit('call:leave', {
            roomId: currentCall.channel || currentCall.dmRoomId,
            roomType: currentCall.type
          })
        }
      } catch (error) {
        console.error('Failed to leave call:', error)
      }
    }
    cleanup()
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
        
        if (socket && currentCall) {
          socket.emit('call:toggle-mute', {
            roomId: currentCall.channel || currentCall.dmRoomId,
            roomType: currentCall.type,
            isMuted: !audioTrack.enabled
          })
        }
      }
    }
  }

  const toggleVideo = async () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()
      let newEnabledState = false
      let newTrack = null

      if (videoTracks.length > 0) {
        const track = videoTracks[0]
        if (track.readyState === 'ended') {
          // Restart video
          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
            newTrack = videoStream.getVideoTracks()[0]
            localStream.removeTrack(track)
            localStream.addTrack(newTrack)
            newEnabledState = true
          } catch (error) {
            console.error('Failed to restart video:', error)
            return
          }
        } else {
            // Normal toggle - but if we want to "stop" sending effectively, we stop the track?
            // Or just enabled = false?
            // If we want to replaceTrack(null), then we shouldn't just toggle .enabled
            // But toggling .enabled is faster and simpler for "Mute Video" logic.
            // Requirement: "simple call" vs "video call". 
            // If we use replaceTrack(null), the remote sees black/frozen.
            // Let's stick with enabled=false for soft mute.
            // BUT if user wants strict "Audio Call", maybe we should stop it?
            
            // For stability with transceivers, let's try just toggling enabled first.
            // IF the user reported error "order of m-lines", it implies we were adding/removing tracks.
            // My previous code DID remove/add tracks in some cases.
            // With transceivers, we should REPLACE track.
            
            track.enabled = !track.enabled
            newEnabledState = track.enabled
            // No need to replace track if we just toggled enabled.
        }
      } else {
         // Upgrade audio only -> video
         try {
           const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
           newTrack = videoStream.getVideoTracks()[0]
           localStream.addTrack(newTrack)
           newEnabledState = true
         } catch (error) {
           console.error('Failed to enable video:', error)
           return
         }
      }

      // If we have a NEW track (upgrade or restart), replace it safely
      if (newTrack) {
        Object.values(peerConnections.current).forEach(pc => {
             const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video')
             if (videoTransceiver) {
                 videoTransceiver.sender.replaceTrack(newTrack)
             }
        })
      }

      setIsVideoEnabled(newEnabledState)

      if (socket && currentCall) {
        socket.emit('call:toggle-video', {
          roomId: currentCall.channel || currentCall.dmRoomId,
          roomType: currentCall.type,
          isVideoEnabled: newEnabledState,
          userId: user._id
        })
      }
    }
  }

  const declineCall = () => {
    setIncomingCall(null)
  }

  const getOngoingCall = (roomId) => {
    return ongoingCalls[roomId] || null
  }

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    Object.values(peerConnections.current).forEach(pc => pc.close())
    peerConnections.current = {}
    remoteStreams.current = {}
    
    setLocalStream(null)
    localStreamRef.current = null
    setCurrentCall(null)
    currentCallRef.current = null
    setParticipants([])
    setInCall(false)
    setIsMuted(false)
    setIsVideoEnabled(false)
  }, [])

  const value = {
    currentCall,
    participants,
    localStream,
    isMuted,
    isVideoEnabled,
    inCall,
    incomingCall,
    ongoingCalls,
    remoteStreams: remoteStreams.current,
    startCall,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    declineCall,
    getOngoingCall
  }

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  )
}
