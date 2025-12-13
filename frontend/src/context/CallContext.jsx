import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
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

  const startCall = useCallback(async (type, channelId, recipientId, withVideo = false) => {
  console.log('📞 startCall triggered')
  console.log('➡️ Params:', { type, channelId, recipientId, withVideo })

  try {
    console.log('🎥 Requesting media permissions...')

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: withVideo
    })

    console.log('✅ Media stream received:', stream)
    console.log('🎧 Audio tracks:', stream.getAudioTracks())
    console.log('📹 Video tracks:', stream.getVideoTracks())

    setLocalStream(stream)
    console.log('🧠 localStream state set')

    localStreamRef.current = stream
    console.log('📦 localStreamRef updated')

    setIsVideoEnabled(withVideo)
    console.log('🎬 Video enabled:', withVideo)

    console.log('📡 Creating call on backend...')
    const data = await callService.createCall({ type, channelId, recipientId })

    console.log('✅ Call created:', data.call)

    setCurrentCall(data.call)
    currentCallRef.current = data.call

    console.log('📞 Current call stored in state & ref')

    setParticipants([
      { ...user, isMuted: false, isVideoEnabled: withVideo }
    ])

    console.log('👥 Initial participant added:', user)

    setInCall(true)
    console.log('🚦 inCall set to TRUE')

    if (socket) {
      console.log('🔌 Socket available, joining room...')
      socket.emit('call:join', {
        roomId: channelId || recipientId,
        roomType: type
      })
      console.log('📨 call:join event emitted')
    } else {
      console.log('⚠️ Socket not available')
    }

    console.log('🎉 Call started successfully')
    return data.call

  } catch (error) {
    console.error('❌ Failed to start call:', error)

    if (withVideo) {
      console.log('🔁 Video failed, trying audio-only call...')

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        })

        console.log('🎧 Audio-only stream received:', audioStream)

        setLocalStream(audioStream)
        localStreamRef.current = audioStream
        setIsVideoEnabled(false)

        console.log('🔇 Switched to audio-only mode')

        const data = await callService.createCall({ type, channelId, recipientId })

        console.log('✅ Audio call created:', data.call)

        setCurrentCall(data.call)
        currentCallRef.current = data.call

        setParticipants([
          { ...user, isMuted: false, isVideoEnabled: false }
        ])

        setInCall(true)
        console.log('📞 Audio call active')

        if (socket) {
          socket.emit('call:join', {
            roomId: channelId || recipientId,
            roomType: type
          })
          console.log('📨 call:join emitted (audio)')
        }

        return data.call

      } catch (audioError) {
        console.error('❌ Failed to start audio call:', audioError)
        throw audioError
      }
    }

    throw error
  }
}, [socket, user])

  const joinCall = useCallback(async (call, withVideo = true) => { // Default to video true per request
    console.log('📞 joinCall triggered')
    console.log('➡️ Params:', { callId: call._id, withVideo })

    try {
      console.log('🎥 Requesting media permissions...')
      // Respect withVideo preference
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: withVideo 
      })
      
      console.log('✅ Media stream received:', stream)
      console.log('🎧 Audio tracks:', stream.getAudioTracks())
      console.log('📹 Video tracks:', stream.getVideoTracks())

      setLocalStream(stream)
      console.log('🧠 localStream state set')

      localStreamRef.current = stream
      console.log('📦 localStreamRef updated')

      // Check if we actually got video
      const hasVideo = stream.getVideoTracks().length > 0
      setIsVideoEnabled(hasVideo)
      console.log('🎬 Video enabled:', hasVideo)

      await callService.joinCall(call._id)
      console.log('✅ Joined call on backend')

      setCurrentCall(call)
      currentCallRef.current = call
      console.log('📞 Current call stored')

      // Ensure we set ourselves in participants correctly
      setParticipants(prev => {
        // We might already be in list via socket, but ensure local state is correct
        const others = call.participants?.filter(p => p._id !== user?._id) || []
        return [
          ...others,
          { ...user, isMuted: false, isVideoEnabled: hasVideo }
        ]
      })
      console.log('👥 Participants updated')

      setInCall(true)
      console.log('🚦 inCall set to TRUE')

      setIncomingCall(null)

      if (socket) {
        console.log('🔌 Emitting call:join...')
        socket.emit('call:join', {
          roomId: call.channel || call.dmRoomId,
          roomType: call.type
        })
      }
    } catch (error) {
      console.error('❌ Failed to join call:', error)
      
      if (withVideo) {
         console.log('🔁 Video join failed, trying audio-only...')
         try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ 
              audio: true, 
              video: false 
            })
            console.log('🎧 Audio-only stream received:', audioStream)
            
            setLocalStream(audioStream)
            localStreamRef.current = audioStream
            setIsVideoEnabled(false)
            console.log('🔇 Switched to audio-only mode')

            await callService.joinCall(call._id)
            setCurrentCall(call)
            currentCallRef.current = call
            
            setParticipants(prev => {
                const others = call.participants?.filter(p => p._id !== user?._id) || []
                return [
                  ...others,
                  { ...user, isMuted: false, isVideoEnabled: false }
                ]
            })

            setInCall(true)
            setIncomingCall(null)

            if (socket) {
                socket.emit('call:join', {
                  roomId: call.channel || call.dmRoomId,
                  roomType: call.type
                })
            }
            return
         } catch (audioError) {
             console.error('❌ Audio fallback failed:', audioError)
             throw audioError
         }
      }
      throw error
    }
  }, [socket, user])

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

  const leaveCall = useCallback(async () => {
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
  }, [currentCall, socket, cleanup])

  const endCall = useCallback(async () => {
    if (currentCall) {
      const roomKey = currentCall.channel || currentCall.dmRoomId
      
      // Optimistically remove from ongoingCalls
      if (roomKey) {
        setOngoingCalls(prev => {
          const updated = { ...prev }
          delete updated[roomKey]
          return updated
        })
      }

      try {
        await callService.endCall(currentCall._id)
      } catch (error) {
        console.error('Failed to end call:', error)
      }
    }
    cleanup()
  }, [currentCall, cleanup])

  const toggleMute = useCallback(() => {
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
  }, [localStream, socket, currentCall])

const toggleVideo = useCallback(() => {
  console.log('🎬 toggleVideo CALLED')

  const stream = localStreamRef.current
  console.log('📦 localStreamRef:', stream)

  if (!stream) {
    console.error('❌ No localStream found')
    return
  }

  const videoTracks = stream.getVideoTracks()
  console.log('📹 Video Tracks:', videoTracks)

  if (videoTracks.length === 0) {
    console.error('❌ No video track in localStream')
    return
  }

  const videoTrack = videoTracks[0]
  console.log('🎥 Current videoTrack:', videoTrack)
  console.log('➡️ enabled:', videoTrack.enabled)
  console.log('➡️ readyState:', videoTrack.readyState)

  // TOGGLE
  videoTrack.enabled = !videoTrack.enabled
  console.log('🔁 Toggled videoTrack.enabled →', videoTrack.enabled)

  setIsVideoEnabled(videoTrack.enabled)
  console.log('🧠 isVideoEnabled state updated')

  // 🔌 PEER CONNECTION CHECK
  const pcs = peerConnections.current
  console.log('🔗 peerConnections:', pcs)

  if (!pcs || Object.keys(pcs).length === 0) {
    console.warn('⚠️ No peerConnections found')
  } else {
    Object.entries(pcs).forEach(([id, pc]) => {
      console.log(`🧩 PC [${id}]`, pc)

      const senders = pc.getSenders()
      console.log('📤 Senders:', senders)

      const videoSender = senders.find(s => s.track?.kind === 'video')
      console.log('🎯 videoSender:', videoSender)

      if (!videoSender) {
        console.error('❌ No video sender found in PC')
      } else {
        console.log(
          '📡 Sender track enabled:',
          videoSender.track?.enabled
        )
      }
    })
  }

  // 📡 SOCKET EVENT
  if (socket && currentCall) {
    const payload = {
      roomId: currentCall.channel || currentCall.dmRoomId,
      roomType: currentCall.type,
      isVideoEnabled: videoTrack.enabled,
      userId: user._id
    }

    console.log('📨 Emitting call:toggle-video', payload)
    socket.emit('call:toggle-video', payload)
  } else {
    console.warn('⚠️ Socket or currentCall missing')
  }

  console.log('✅ toggleVideo END')
}, [socket, currentCall, user])


  const declineCall = useCallback(() => {
    setIncomingCall(null)
  }, [])

  const getOngoingCall = useCallback((roomId) => {
    return ongoingCalls[roomId] || null
  }, [ongoingCalls])

  const value = useMemo(() => ({
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
    getOngoingCall,
    endCall
  }), [
    currentCall,
    participants,
    localStream,
    isMuted,
    isVideoEnabled,
    inCall,
    incomingCall,
    ongoingCalls,
    startCall,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    declineCall,
    getOngoingCall,
    endCall
  ])

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  )
}
