const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const load = p => JSON.parse(fs.readFileSync(path.join(__dirname, p), 'utf-8'));
const save = (p,d) => fs.writeFileSync(path.join(__dirname, p), JSON.stringify(d, null, 2));

let books = fs.existsSync('data/books.json') ? load('data/books.json') : [];
let users = fs.existsSync('data/users.json') ? load('data/users.json') : [];
let memberships = fs.existsSync('data/memberships.json') ? load('data/memberships.json') : [];
let transactions = fs.existsSync('data/transactions.json') ? load('data/transactions.json') : [];

// seed default users if none
if(users.length === 0){
  users = [{id:1, username:'adm', name:'Administrator', role:'admin'}, {id:2, username:'user', name:'Standard User', role:'user'}];
  save('data/users.json', users);
}

// login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if(!username || !password) return res.status(400).json({ message: 'username and password required' });
  if(username === 'adm' && password === 'adm') return res.json({ role: 'admin' });
  if(username === 'user' && password === 'user') return res.json({ role: 'user' });
  return res.status(401).json({ message: 'Invalid credentials' });
});

const requireRole = (roles) => (req, res, next) => {
  const role = (req.headers['x-role'] || '').toLowerCase();
  if(!role) return res.status(401).json({ message: 'Role header missing (x-role)' });
  if(Array.isArray(roles)) {
    if(!roles.includes(role)) return res.status(403).json({ message: 'Forbidden: insufficient role' });
  } else {
    if(role !== roles) return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  req.userRole = role; next();
};

app.get('/api/books', (req, res) => res.json(books));
app.get('/api/books/:id', (req, res) => {
  const id = parseInt(req.params.id); const b = books.find(x=>x.id===id);
  if(!b) return res.status(404).json({ message: 'Book not found' }); res.json(b);
});
app.post('/api/books', requireRole('admin'), (req, res) => {
  const { title, author, category, serial_no, available } = req.body || {};
  if(!title || !author || !serial_no || !category) return res.status(400).json({ message: 'Missing required fields' });
  const id = books.length ? Math.max(...books.map(b=>b.id))+1 : 1;
  const book = { id, title, author, category, serial_no, available: available === true };
  books.push(book); save('data/books.json', books);
  res.json({ message: 'Book added', book });
});
app.put('/api/books/:id', requireRole('admin'), (req, res) => {
  const id = parseInt(req.params.id); const idx = books.findIndex(b=>b.id===id);
  if(idx === -1) return res.status(404).json({ message: 'Book not found' });
  const { title, author, category, serial_no, available } = req.body || {};
  if(!title || !author || !serial_no || !category) return res.status(400).json({ message: 'Missing required fields' });
  books[idx] = { id, title, author, category, serial_no, available: !!available };
  save('data/books.json', books); res.json({ message: 'Book updated', book: books[idx] });
});

app.post('/api/books/search', requireRole(['admin','user']), (req, res) => {
  const { title, author, category } = req.body || {};
  if(!title && !author && !category) return res.status(400).json({ message: 'At least one search field required' });
  const q = s => s ? s.toString().toLowerCase() : '';
  const results = books.filter(b => {
    return (title && q(b.title).includes(q(title))) || (author && q(b.author).includes(q(author))) || (category && q(b.category).includes(q(category)));
  });
  res.json(results);
});

app.post('/api/issue', requireRole(['admin','user']), (req, res) => {
  const { book_id, member_name, issue_date, return_date, remarks } = req.body || {};
  if(!book_id || !member_name) return res.status(400).json({ message: 'book_id and member_name required' });
  const book = books.find(b => b.id === parseInt(book_id));
  if(!book) return res.status(404).json({ message: 'Book not found' });
  if(!book.available) return res.status(400).json({ message: 'Book not available' });
  const today = new Date().toISOString().slice(0,10);
  if(issue_date < today) return res.status(400).json({ message: 'Issue date cannot be before today' });
  const issueDt = new Date(issue_date); const maxReturn = new Date(issueDt); maxReturn.setDate(issueDt.getDate()+15);
  const retDt = new Date(return_date);
  if(retDt > maxReturn) return res.status(400).json({ message: 'Return date cannot be greater than 15 days from issue' });
  const id = transactions.length ? Math.max(...transactions.map(t=>t.id))+1 : 1;
  const tr = { id, book_id: book.id, member_name, issue_date, return_date, remarks: remarks || '', returned: false, fine: 0 };
  transactions.push(tr); book.available = false; save('data/transactions.json', transactions); save('data/books.json', books);
  res.json({ message: 'Book issued', transaction: tr });
});

app.post('/api/return', requireRole(['admin','user']), (req, res) => {
  const { transaction_id, serial_no, return_date } = req.body || {};
  if(!transaction_id || !serial_no) return res.status(400).json({ message: 'transaction_id and serial_no required' });
  const tr = transactions.find(t => t.id === parseInt(transaction_id));
  if(!tr) return res.status(404).json({ message: 'Transaction not found' });
  if(tr.returned) return res.status(400).json({ message: 'Book already returned' });
  const scheduled = new Date(tr.return_date); const actual = new Date(return_date);
  let fine = 0; if(actual > scheduled){ const diffDays = Math.ceil((actual - scheduled)/(1000*60*60*24)); fine = diffDays * 10; }
  tr.returned = true; tr.actual_return_date = return_date; tr.fine = fine; tr.serial_no = serial_no;
  save('data/transactions.json', transactions);
  const book = books.find(b => b.id === tr.book_id); if(book){ book.available = true; save('data/books.json', books); }
  res.json({ message: 'Return recorded', transaction: tr });
});

app.post('/api/payfine', requireRole(['admin','user']), (req, res) => {
  const { transaction_id, fine_paid, remarks } = req.body || {};
  if(!transaction_id) return res.status(400).json({ message: 'transaction_id required' });
  const tr = transactions.find(t => t.id === parseInt(transaction_id));
  if(!tr) return res.status(404).json({ message: 'Transaction not found' });
  if(tr.fine && !fine_paid) return res.status(400).json({ message: 'Fine must be paid to complete return' });
  tr.fine_paid = fine_paid ? true : false; tr.fine_paid_amount = tr.fine || 0; tr.fine_remarks = remarks || '';
  save('data/transactions.json', transactions); res.json({ message: 'Fine processed', transaction: tr });
});

app.post('/api/memberships', requireRole('admin'), (req, res) => {
  const { membership_no, user_id, name, duration_months } = req.body || {};
  if(!membership_no || !user_id || !name || !duration_months) return res.status(400).json({ message: 'Missing fields' });
  const start = new Date().toISOString().slice(0,10); const expiry = new Date(); expiry.setMonth(expiry.getMonth()+parseInt(duration_months));
  const obj = { membership_no, user_id, name, start_date: start, duration_months: parseInt(duration_months), expiry_date: expiry.toISOString().slice(0,10), active: true };
  memberships.push(obj); save('data/memberships.json', memberships); res.json({ message: 'Membership added', membership: obj });
});
app.put('/api/memberships/:membership_no', requireRole('admin'), (req, res) => {
  const m = memberships.find(x => x.membership_no === req.params.membership_no);
  if(!m) return res.status(404).json({ message: 'Membership not found' }); const { action, extend_months } = req.body || {};
  if(action === 'cancel'){ m.active = false; save('data/memberships.json', memberships); return res.json({ message: 'Membership canceled', membership: m }); }
  if(action === 'extend'){ const ext = parseInt(extend_months) || 6; const exp = new Date(m.expiry_date); exp.setMonth(exp.getMonth() + ext); m.expiry_date = exp.toISOString().slice(0,10); save('data/memberships.json', memberships); return res.json({ message: 'Membership extended', membership: m }); }
  res.status(400).json({ message: 'Invalid action' });
});

app.post('/api/users', requireRole('admin'), (req, res) => {
  const { username, name, role } = req.body || {};
  if(!username || !name || !role) return res.status(400).json({ message: 'Missing fields' });
  const id = users.length ? Math.max(...users.map(u=>u.id)) + 1 : 1; const u = { id, username, name, role };
  users.push(u); save('data/users.json', users); res.json({ message: 'User created', user: u });
});

app.get('/api/reports/active', requireRole(['admin','user']), (req, res) => res.json(transactions.filter(t => !t.returned)));
app.get('/api/reports/overdue', requireRole(['admin','user']), (req, res) => { const today = new Date(); res.json(transactions.filter(t => !t.returned && new Date(t.return_date) < today)); });

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
