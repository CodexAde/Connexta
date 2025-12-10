import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
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
  
  const peerConnections = useRef({})
  const remoteStreams = useRef({})

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  useEffect(() => {
    if (!socket) return

    socket.on('call:started', handleCallStarted)
    socket.on('call:user-joined', handleUserJoined)
    socket.on('call:user-left', handleUserLeft)
    socket.on('call:signal', handleSignal)
    socket.on('call:user-muted', handleUserMuted)
    socket.on('call:ended', handleCallEnded)

    return () => {
      socket.off('call:started', handleCallStarted)
      socket.off('call:user-joined', handleUserJoined)
      socket.off('call:user-left', handleUserLeft)
      socket.off('call:signal', handleSignal)
      socket.off('call:user-muted', handleUserMuted)
      socket.off('call:ended', handleCallEnded)
    }
  }, [socket])

  const handleCallStarted = (call) => {
    if (call.startedBy._id !== user?._id) {
      setIncomingCall(call)
    }
  }

  const handleUserJoined = async (data) => {
    if (currentCall && data.user._id !== user?._id) {
      setParticipants(prev => {
        if (prev.find(p => p._id === data.user._id)) return prev
        return [...prev, data.user]
      })
      await createPeerConnection(data.user._id, true)
    }
  }

  const handleUserLeft = (data) => {
    setParticipants(prev => prev.filter(p => p._id !== data.userId))
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
    
    if (!peerConnections.current[fromUserId]) {
      await createPeerConnection(fromUserId, false)
    }
    
    const pc = peerConnections.current[fromUserId]
    
    if (signalData.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signalData))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('call:signal', {
        roomId: currentCall?.channel || currentCall?.dmRoomId,
        roomType: currentCall?.type,
        signalData: answer,
        targetUserId: fromUserId
      })
    } else if (signalData.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signalData))
    } else if (signalData.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(signalData))
    }
  }

  const handleUserMuted = (data) => {
    setParticipants(prev => 
      prev.map(p => p._id === data.userId ? { ...p, isMuted: data.isMuted } : p)
    )
  }

  const handleCallEnded = () => {
    cleanup()
  }

  const createPeerConnection = async (userId, initiator) => {
    const pc = new RTCPeerConnection(iceServers)
    peerConnections.current[userId] = pc

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream)
      })
    }

    pc.ontrack = (event) => {
      remoteStreams.current[userId] = event.streams[0]
      setParticipants(prev => 
        prev.map(p => p._id === userId ? { ...p, stream: event.streams[0] } : p)
      )
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:signal', {
          roomId: currentCall?.channel || currentCall?.dmRoomId,
          roomType: currentCall?.type,
          signalData: event.candidate,
          targetUserId: userId
        })
      }
    }

    if (initiator) {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('call:signal', {
        roomId: currentCall?.channel || currentCall?.dmRoomId,
        roomType: currentCall?.type,
        signalData: offer,
        targetUserId: userId
      })
    }

    return pc
  }

  const startCall = async (type, channelId, recipientId, withVideo = false) => {
    try {
      // Request media based on options
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: withVideo 
      })
      setLocalStream(stream)
      setIsVideoEnabled(withVideo)

      const data = await callService.createCall({ type, channelId, recipientId })
      setCurrentCall(data.call)
      setParticipants([{ ...user, isMuted: false }])
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
          setIsVideoEnabled(false)
          
          const data = await callService.createCall({ type, channelId, recipientId })
          setCurrentCall(data.call)
          setParticipants([{ ...user, isMuted: false }])
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

  const joinCall = async (call) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      setLocalStream(stream)

      await callService.joinCall(call._id)
      setCurrentCall(call)
      setParticipants(call.participants.map(p => ({ ...p, isMuted: false })))
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
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled
        setIsVideoEnabled(videoTracks[0].enabled)
      } else {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
          const videoTrack = videoStream.getVideoTracks()[0]
          localStream.addTrack(videoTrack)
          setIsVideoEnabled(true)
          
          Object.values(peerConnections.current).forEach(pc => {
            pc.addTrack(videoTrack, localStream)
          })
        } catch (error) {
          console.error('Failed to enable video:', error)
        }
      }
    }
  }

  const declineCall = () => {
    setIncomingCall(null)
  }

  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    
    Object.values(peerConnections.current).forEach(pc => pc.close())
    peerConnections.current = {}
    remoteStreams.current = {}
    
    setLocalStream(null)
    setCurrentCall(null)
    setParticipants([])
    setInCall(false)
    setIsMuted(false)
    setIsVideoEnabled(false)
  }, [localStream])

  const value = {
    currentCall,
    participants,
    localStream,
    isMuted,
    isVideoEnabled,
    inCall,
    incomingCall,
    remoteStreams: remoteStreams.current,
    startCall,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    declineCall
  }

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  )
}
