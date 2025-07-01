const socket = io();
const video = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
let peer;
let localStream;
let isMuted = false;
let isCameraOn = true;

const urlParams = new URLSearchParams(window.location.search);
const meetId = typeof MEET_ID !== 'undefined' ? MEET_ID : urlParams.get('meetId');
socket.emit('joinRoom', meetId);

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        video.srcObject = stream;

        peer = new SimplePeer({
            initiator: location.hash === '#1',
            trickle: false,
            stream: stream,
            config: TURN_CONFIG
        });

        peer.on('signal', data => {
            socket.emit('signal', { meetId, data });
        });

        peer.on('stream', remoteStream => {
            remoteVideo.srcObject = remoteStream;
        });

        socket.on('signal', data => {
            peer.signal(data);
        });
    });

// Chatting
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', { meetId, msg: input.value });
        input.value = '';
    }
});

socket.on('chat message', function(msg) {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// Controls
const muteBtn = document.getElementById('muteBtn');
const cameraBtn = document.getElementById('cameraBtn');
const leaveBtn = document.getElementById('leaveBtn');
const muteIcon = document.getElementById('muteIcon');
const cameraIcon = document.getElementById('cameraIcon');

if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        if (!localStream) return;
        isMuted = !isMuted;
        localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
        muteIcon.innerHTML = isMuted
            ? '<path stroke-linecap="round" stroke-linejoin="round" d="M9 9v6h4l5 5V4l-5 5H9z" />' // muted icon
            : '<path stroke-linecap="round" stroke-linejoin="round" d="M9 9v6h4l5 5V4l-5 5H9z" />'; // unmuted icon (can use different icon)
        muteBtn.classList.toggle('bg-red-200', isMuted);
    });
}
if (cameraBtn) {
    cameraBtn.addEventListener('click', () => {
        if (!localStream) return;
        isCameraOn = !isCameraOn;
        localStream.getVideoTracks().forEach(track => track.enabled = isCameraOn);
        cameraIcon.innerHTML = isCameraOn
            ? '<path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6.75A2.25 2.25 0 016.25 4.5h7.5A2.25 2.25 0 0116 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-7.5A2.25 2.25 0 014 17.25V6.75z" />'
            : '<path stroke-linecap="round" stroke-linejoin="round" d="M4 6.75A2.25 2.25 0 016.25 4.5h7.5A2.25 2.25 0 0116 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-7.5A2.25 2.25 0 014 17.25V6.75zm11 3.25l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" />';
        cameraBtn.classList.toggle('bg-red-200', !isCameraOn);
    });
}
if (leaveBtn) {
    leaveBtn.addEventListener('click', () => {
        if (peer) peer.destroy();
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        window.location.href = '/';
    });
}
