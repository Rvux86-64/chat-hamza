// 1. Give your URL and Key unique names
const SB_URL = "https://jziqxqpvgeiwbthdxbze.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6aXF4cXB2Z2Vpd2J0aGR4YnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NjMwMTEsImV4cCI6MjEwMzMzOTAxMX0.opW1zH8ivEFbPTkn5r1EaINzvfH8fUflU8TPL9QVaw0";

// 2. Initialize the client only ONCE using those unique names
const supabase2 = window.supabase.createClient(SB_URL, SB_KEY);

// ... keep the rest of your chatBox, messageForm, and function code below unchanged ...
const chatBox = document.getElementById('chatBox');

const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const usernameInput = document.getElementById('username');

// 1. Fetch Existing History on Load
async function fetchMessages() {
    const { data, error } = await supabase2
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) console.error('Error loading history:', error);
    else data.forEach(msg => appendMessage(msg));
}

// 2. Append Message Element into UI
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
    chatBox.scrollTop = chatBox.scrollHeight; // Auto scroll to bottom
}

// 3. Send Message Handler
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    const username = usernameInput.value.trim() || 'Anonymous';

    if (!content) return;

    // Insert message into Supabase database
    const { error } = await supabase2
        .from('messages')
        .insert([{ username, content }]);

    if (error) console.error('Error sending:', error);
    else messageInput.value = ''; // Clear text input
});

// 4. Listen to Realtime Insert Events
supabase2
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        appendMessage(payload.new);
    })
    .subscribe();

// Start application
fetchMessages();
