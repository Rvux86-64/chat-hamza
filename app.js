// 1. Core Supabase App API Credentials Verification 
const SB_URL = "https://jziqxqpvgeiwbthdxbze.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6aXF4cXB2Z2Vpd2J0aGR4YnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NjMwMTEsImV4cCI6MjEwMzMzOTAxMX0.opW1zH8ivEFbPTkn5r1EaINzvfH8fUflU8TPL9QVaw0";

const supabase2 = window.supabase.createClient(SB_URL, SB_KEY);

// 2. DOM Node Element Maps
const chatBox = document.getElementById('chatBox');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const usernameInput = document.getElementById('username');
const channelsList = document.getElementById('channelsList');
const currentChannelName = document.getElementById('currentChannelName');

// 3. Dynamic Application State Variables
let activeRoomId = null;

// 4. Fetch and Render Group Chat Rooms Sidebar list
async function fetchRooms() {
    const { data: rooms, error } = await supabase2
        .from('rooms')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error loading chat groups:', error);
        return;
    }

    channelsList.innerHTML = ''; // Clear skeleton UI loading logs
    
    if (rooms && rooms.length > 0) {
        rooms.forEach((room, index) => {
            const roomEl = document.createElement('div');
            roomEl.classList.add('channel-item');
            roomEl.setAttribute('data-id', room.id);
            roomEl.innerHTML = `<i class="fa-solid fa-hashtag"></i> ${room.name}`;
            
            roomEl.addEventListener('click', () => switchRoom(room.id, room.name));
            channelsList.appendChild(roomEl);

            // Default route context initial fallback selection 
            if (index === 0) {
                switchRoom(room.id, room.name);
            }
        });
    }
}

// 5. Context Switch Router function for changing chat rooms
async function switchRoom(roomId, roomName) {
    if (activeRoomId === roomId) return;
    activeRoomId = roomId;
    
    // Update Channel Name Display
    currentChannelName.textContent = `# ${roomName}`;
    
    // Toggle active classes on visual elements
    document.querySelectorAll('.channel-item').forEach(el => {
        if (el.getAttribute('data-id') === roomId) el.classList.add('active');
        else el.classList.remove('active');
    });

    // Clear output window canvas and request new contextual scope
    chatBox.innerHTML = '';
    await fetchMessages();
}

// 6. Fetch Existing Isolated Chat Stream History by Room ID
async function fetchMessages() {
    const { data, error } = await supabase2
        .from('messages')
        .select('*')
        .eq('room_id', activeRoomId)
        .order('created_at', { ascending: true });

    if (error) console.error('Error loading history:', error);
    else data.forEach(msg => appendMessage(msg));
}

// 7. Inject Raw Message elements into Output Viewport
function appendMessage(msg) {
    const currentUsername = usernameInput.value.trim() || 'Anonymous';
    const isSelf = msg.username === currentUsername;
    const msgElement = document.createElement('div');
    msgElement.classList.add('message');
    if (isSelf) msgElement.classList.add('self');

    msgElement.innerHTML = `
        <span class="msg-user">${isSelf ? 'You' : msg.username}</span>
        <span class="msg-text">${msg.content}</span>
    `;
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 8. Intercept Outbound Forms Submission & Bind Active Room ID Scope
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    const username = usernameInput.value.trim() || 'Anonymous';

    if (!content || !activeRoomId) return;

    // Send payload safely contextualized to the group room being viewed
    const { error } = await supabase2
        .from('messages')
        .insert([{ username, content, room_id: activeRoomId }]);

    if (error) console.error('Error sending message payload:', error);
    else messageInput.value = '';
});

// 9. Realtime Channel Multi-Tenant Listener Event Handling Filter
supabase2
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        // Only append live database updates if the message belongs to the current room
        if (payload.new.room_id === activeRoomId) {
            appendMessage(payload.new);
        }
    })
    .subscribe();

// Fire application launch cycle sequence
fetchRooms();
