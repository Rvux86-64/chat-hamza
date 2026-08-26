// Initialize Supabase Client
const SUPABASE_URL = "https://jziqxqpvgeiwbthdxbze.supabase.co";
const SUPABASE_ANON_KEY = 'sb_publishable_PcWA7YDARf8vmEDl9kjPaA_KYq01DIJ';
// Ensure 'supabase' is initialized correctly from the new script window object
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const chatBox = document.getElementById('chatBox');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const usernameInput = document.getElementById('username');

// 1. Fetch Existing History on Load
async function fetchMessages() {
    const { data, error } = await supabase
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
    const { error } = await supabase
        .from('messages')
        .insert([{ username, content }]);

    if (error) console.error('Error sending:', error);
    else messageInput.value = ''; // Clear text input
});

// 4. Listen to Realtime Insert Events
supabase
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        appendMessage(payload.new);
    })
    .subscribe();

// Start application
fetchMessages();
