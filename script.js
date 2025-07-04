const SUPABASE_URL = 'https://hyysjujdyvbcuzbgaqxp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eXNqdWpkeXZiY3V6YmdhcXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyODc5ODQsImV4cCI6MjA2NDg2Mzk4NH0.m7s-KYb2CrsZXYrvAPGK8Z61GknH-5_UKULqj1n5jIk'; // Truncated for safety

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;

async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user || null;
  updateUI();
  if (currentUser) loadHistory();
}

function updateUI() {
  document.getElementById('auth-section').style.display = currentUser ? 'none' : 'block';
  document.getElementById('app-section').style.display = currentUser ? 'block' : 'none';
  if (currentUser) {
    document.getElementById('login-info').textContent = `Logged in as: ${currentUser.email}`;
  }
}

async function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signUp({ email, password });
  alert(error ? error.message : 'Signup successful. Check your email.');
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  error ? alert(error.message) : checkUser();
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  updateUI();
}

document.getElementById('expense-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = document.getElementById('type').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const note = document.getElementById('note').value;
  const date = document.getElementById('date').value;
  const editId = document.getElementById('edit-id').value;
  if (!type || isNaN(amount) || !date) return alert('Please fill in all fields.');

  if (editId) {
    await supabase.from('transactions').update({ type, amount, note, date }).eq('id', editId);
    document.getElementById('edit-id').value = '';
  } else {
    await supabase.from('transactions').insert([{ type, amount, note, date, user_id: currentUser.id }]);
  }

  document.getElementById('expense-form').reset();
  loadHistory();
});

async function loadHistory() {
  const { data } = await supabase.from('transactions').select('*').eq('user_id', currentUser.id).order('date', { ascending: false });
  const historyList = document.getElementById('history');
  historyList.innerHTML = '';
  let total = 0;

  if (data) {
    data.forEach(item => {
      const formattedDate = new Date(item.date).toLocaleDateString('en-GB');
      const li = document.createElement('li');
      li.innerHTML = `
        ${formattedDate} — ₹${item.amount} (${item.type}) ${item.note ? '- ' + item.note : ''}
        <span class="actions">
          <button onclick="editTransaction('${item.id}')">Edit</button>
          <button onclick="deleteTransaction('${item.id}')">Delete</button>
        </span>
      `;
      historyList.appendChild(li);
      total += item.type === 'add' ? item.amount : -item.amount;
    });
  }

  document.getElementById('balance').textContent = total.toFixed(2);
}

async function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  await supabase.from('transactions').delete().eq('id', id);
  loadHistory();
}

async function editTransaction(id) {
  const { data } = await supabase.from('transactions').select('*').eq('id', id).single();
  if (!data) return alert('Transaction not found');

  document.getElementById('type').value = data.type;
  document.getElementById('amount').value = data.amount;
  document.getElementById('note').value = data.note || '';
  document.getElementById('date').value = data.date;
  document.getElementById('edit-id').value = data.id;
}

// Dark mode toggle
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

document.getElementById('dark-toggle').addEventListener('click', toggleDarkMode);
if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');

checkUser();
