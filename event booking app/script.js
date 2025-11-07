// Keys for localStorage
const EVENTS_KEY = 'ce_events_v3';
const USERS_KEY = 'ce_users_v3';
const BOOK_KEY  = 'ce_bookings_v3';

// UI refs
const authView = document.getElementById('authView');
const loginBox = document.getElementById('loginBox');
const signupBox = document.getElementById('signupBox');
const appEl = document.getElementById('app');
const modal = document.getElementById('modal');
const modalCard = document.getElementById('modalCard');

const topUserName = document.getElementById('topUserName');
const topUserPic = document.getElementById('topUserPic');
const sidePic = document.getElementById('sidePic');
const sideName = document.getElementById('sideName');
const sideEmail = document.getElementById('sideEmail');
const sideRoll = document.getElementById('sideRoll');

let currentUser = null;

// Helpers
function genId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function read(key){ return JSON.parse(localStorage.getItem(key) || '[]'); }
function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

// seed admin + events + bookings
function seed(){
  if(!localStorage.getItem(USERS_KEY)){
    const admin = { id: genId(), name:'College Admin', email:'admin@college.edu', password:'admin123', photo:'', roll:'', isAdmin:true };
    write(USERS_KEY, [admin]);
  }
  if(!localStorage.getItem(EVENTS_KEY)){
    const sample = [
      { id: genId(), title:'AI & Robotics Workshop', date:'2025-11-25', place:'Main Auditorium', price:199, description:'Hands-on robotics and AI workshop for beginners. Materials and certificate included.', img:'https://images.unsplash.com/photo-1581091870627-3b1a0c8b5f57?auto=format&fit=crop&w=800&q=60', host:'Robotics Club' },
      { id: genId(), title:'Cultural Night', date:'2025-12-05', place:'Open Grounds', price:0, description:'An evening of vibrant performances: music, dance, drama, and fine arts.', img:'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=60', host:'Cultural Committee' },
      { id: genId(), title:'Career Fair & Internships', date:'2025-11-30', place:'Expo Hall', price:49, description:'Meet companies, hand over resumes, and attend mini-interviews. Carry multiple copies of your resume.', img:'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=800&q=60', host:'Training & Placement' }
    ];
    write(EVENTS_KEY, sample);
  }
  if(!localStorage.getItem(BOOK_KEY)) write(BOOK_KEY, []);
}
seed();

// Auth UI behavior
document.getElementById('btnToSignup').addEventListener('click', ()=>{ loginBox.classList.add('hidden'); signupBox.classList.remove('hidden'); });
document.getElementById('btnToLogin').addEventListener('click', ()=>{ signupBox.classList.add('hidden'); loginBox.classList.remove('hidden'); });

// Signup
document.getElementById('btnSignup').addEventListener('click', async ()=>{
  const name = document.getElementById('suName').value.trim();
  const email = document.getElementById('suEmail').value.trim().toLowerCase();
  const password = document.getElementById('suPassword').value;
  const roll = document.getElementById('suRoll').value.trim();
  const photoFile = document.getElementById('suPhoto').files[0];
  if(!name || !email || !password) return alert('Please fill name, email and password.');

  const users = read(USERS_KEY);
  if(users.find(u=>u.email===email)) return alert('Email already registered.');

  let photoData = '';
  if(photoFile) photoData = await fileToDataURL(photoFile);

  users.push({ id: genId(), name, email, password, photo: photoData, roll: roll, isAdmin: false });
  write(USERS_KEY, users);
  alert('Account created. Please login.');
  signupBox.classList.add('hidden'); loginBox.classList.remove('hidden');
});

// file input -> data URL
function fileToDataURL(file){ return new Promise(res => { const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.readAsDataURL(file); }); }

// Login
document.getElementById('btnLogin').addEventListener('click', ()=>{
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const users = read(USERS_KEY);
  const match = users.find(u => u.email === email && u.password === password);
  if(!match) return alert('Invalid credentials.');
  currentUser = match;
  showAppForUser();
});

// Logout
document.getElementById('btnLogout').addEventListener('click', ()=>{
  currentUser = null;
  appEl.classList.add('hidden'); authView.classList.remove('hidden');
  document.getElementById('loginEmail').value=''; document.getElementById('loginPassword').value='';
});

// Show app / render
function showAppForUser(){
  authView.classList.add('hidden'); appEl.classList.remove('hidden');
  topUserName.textContent = currentUser.name;
  topUserPic.src = currentUser.photo || `https://avatars.dicebear.com/api/initials/${encodeURIComponent(currentUser.name)}.svg`;
  sidePic.src = topUserPic.src;
  sideName.textContent = currentUser.name;
  sideEmail.textContent = currentUser.email;
  sideRoll.textContent = currentUser.roll ? ('Roll: ' + currentUser.roll) : '';
  if(currentUser.isAdmin) document.getElementById('adminNav').classList.remove('hidden');
  else document.getElementById('adminNav').classList.add('hidden');
  showView('studentDashboard');
  renderAll();
}

// Navigation
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click', ()=>{ document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); showView(btn.dataset.view); });
});
function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  const el = document.getElementById(id);
  if(el) el.classList.remove('hidden');
}

// Renderers
function renderAll(){
  renderEventsGrid();
  renderEventsList();
  renderStats();
  renderTickets();
  renderAdminEvents();
  renderAdminUsers();
}

// Student dashboard event cards (short)
function renderEventsGrid(){
  const events = read(EVENTS_KEY);
  const grid = document.getElementById('eventsGrid'); grid.innerHTML = '';
  events.forEach(ev=>{
    const card = document.createElement('div'); card.className = 'event';
    card.innerHTML = `
      <img src="${ev.img}" alt="">
      <h4>${ev.title}</h4>
      <div class="muted">${ev.date} • ${ev.place}</div>
      <p class="muted small">${(ev.description||'').slice(0,100)}${(ev.description && ev.description.length>100)?'...':''}</p>
      <div style="margin-top:8px;display:flex;gap:8px">
        <button class="btn tiny" onclick="openEventModal('${ev.id}')">View & Register</button>
        <button class="btn ghost tiny" onclick="openEventModal('${ev.id}',true)">Details</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Events listing view (full)
function renderEventsList(){
  const events = read(EVENTS_KEY);
  const list = document.getElementById('eventsList'); list.innerHTML = '';
  events.forEach(ev=>{
    const d = document.createElement('div'); d.className = 'event';
    d.innerHTML = `<div style="display:flex;gap:12px"><img src="${ev.img}" style="width:120px;height:78px;border-radius:6px;object-fit:cover"><div><h4>${ev.title}</h4><div class="muted">${ev.date} • ${ev.place} • Host: ${ev.host||'—'}</div><p class="muted small">${(ev.description||'').slice(0,140)}${ev.description && ev.description.length>140?'...':''}</p><div style="margin-top:6px"><button class="btn tiny" onclick="openEventModal('${ev.id}')">Open</button></div></div></div>`;
    list.appendChild(d);
  });
}

// Event modal: show full details; if register flow requested, show registration form -> then payment
window.openEventModal = function(id, viewOnly=false){
  const ev = read(EVENTS_KEY).find(x=>x.id===id); if(!ev) return;
  modalCard.innerHTML = `
    <div style="display:flex;gap:12px">
      <img src="${ev.img}" style="width:320px;height:160px;border-radius:8px;object-fit:cover">
      <div style="flex:1">
        <h2>${ev.title}</h2>
        <div class="muted">${ev.date} • ${ev.place} • Host: ${ev.host||'—'}</div>
        <p style="margin-top:8px">${ev.description}</p>
        <div style="margin-top:8px;font-weight:700">Price: ${ev.price>0?('₹'+ev.price):'Free'}</div>
        <div style="margin-top:12px">
          ${!viewOnly ? `<button class="btn" id="startRegister">Register</button>` : ''}
          <button class="btn ghost" id="closeModalBtn">Close</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');

  document.getElementById('closeModalBtn').onclick = ()=>modal.classList.add('hidden');
  if(document.getElementById('startRegister')){
    document.getElementById('startRegister').onclick = ()=>{ modalRegistrationForm(ev); };
  }
};

// registration form (collect user details) -> then payment options
function modalRegistrationForm(ev){
  // prefill from currentUser if available
  const name = currentUser ? currentUser.name : '';
  const email = currentUser ? currentUser.email : '';
  const roll = currentUser ? (currentUser.roll || '') : '';
  modalCard.innerHTML = `
    <h3>Register: ${ev.title}</h3>
    <div class="muted">${ev.date} • ${ev.place}</div>
    <form id="regForm">
      <input id="reg_name" placeholder="Full name" value="${escapeHtml(name)}" required />
      <input id="reg_email" type="email" placeholder="Email" value="${escapeHtml(email)}" required />
      <input id="reg_roll" placeholder="Roll number" value="${escapeHtml(roll)}" />
      <input id="reg_phone" placeholder="Phone number" />
      <div class="row">
        <button class="btn" type="submit">Continue to Payment</button>
        <button class="btn ghost" type="button" id="regCancel">Cancel</button>
      </div>
    </form>
  `;
  document.getElementById('regCancel').onclick = ()=>modal.classList.add('hidden');
  document.getElementById('regForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const form = {
      name: document.getElementById('reg_name').value.trim(),
      email: document.getElementById('reg_email').value.trim(),
      roll: document.getElementById('reg_roll').value.trim(),
      phone: document.getElementById('reg_phone').value.trim()
    };
    modalPaymentOptions(ev, form);
  });
}

// payment options screen (simulated)
function modalPaymentOptions(ev, regData){
  modalCard.innerHTML = `
    <h3>Payment — ${ev.title}</h3>
    <div class="muted">Amount: <strong>${ev.price>0?('₹'+ev.price):'Free'}</strong></div>
    <div style="margin-top:12px">Choose payment method:</div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn" id="pay_upi">UPI</button>
      <button class="btn ghost" id="pay_card">Card</button>
      <button class="btn ghost" id="pay_net">NetBanking</button>
    </div>
    <div id="paymentArea" style="margin-top:12px"></div>
    <div style="margin-top:12px"><button class="btn ghost" id="cancelPayment">Cancel</button></div>
  `;
  document.getElementById('cancelPayment').onclick = ()=>modal.classList.add('hidden');

  document.getElementById('pay_upi').onclick = ()=>{
    document.getElementById('paymentArea').innerHTML = `
      <div class="card" style="padding:10px">
        <div class="muted">UPI ID: <strong>college@upi</strong></div>
        <div class="muted small">Open your UPI app, pay the amount, then click Confirm.</div>
        <div style="margin-top:8px"><button class="btn" id="confirm_upi">I've Paid</button></div>
      </div>
    `;
    document.getElementById('confirm_upi').onclick = ()=> finalizeBooking(ev, regData, 'UPI');
  };

  document.getElementById('pay_card').onclick = ()=>{
    document.getElementById('paymentArea').innerHTML = `
      <div><input placeholder="Card number" maxlength="19"></div>
      <div class="row"><input placeholder="MM/YY"><input placeholder="CVV"></div>
      <div style="margin-top:8px"><button class="btn" id="confirm_card">Pay</button></div>
    `;
    document.getElementById('confirm_card').onclick = ()=> finalizeBooking(ev, regData, 'Card');
  };

  document.getElementById('pay_net').onclick = ()=>{
    document.getElementById('paymentArea').innerHTML = `
      <div class="muted">NetBanking (demo). Choose bank in your real flow.</div>
      <div style="margin-top:8px"><button class="btn" id="confirm_net">Pay via NetBanking</button></div>
    `;
    document.getElementById('confirm_net').onclick = ()=> finalizeBooking(ev, regData, 'NetBanking');
  };
}

// finalize booking: save booking record and show success
function finalizeBooking(ev, regData, method){
  // if user signed in, attach userId; otherwise create a lightweight guest
  let userId = null;
  if(currentUser){
    userId = currentUser.id;
  } else {
    // create a temporary user record (guest)
    const users = read(USERS_KEY);
    const guest = { id: genId(), name: regData.name, email: regData.email, password:'', photo:'', roll: regData.roll || '', isAdmin:false };
    users.push(guest); write(USERS_KEY, users); userId = guest.id;
  }
  const bookings = read(BOOK_KEY);
  bookings.push({ id: genId(), eventId: ev.id, userId, method, data: regData, ts: Date.now() });
  write(BOOK_KEY, bookings);

  modalCard.innerHTML = `
    <h3>Registration successful</h3>
    <p class="muted">You are registered for <strong>${ev.title}</strong>. A ticket is available in <strong>My Tickets</strong>.</p>
    <div style="margin-top:12px"><button class="btn" id="closeSuccess">Close</button></div>
  `;
  document.getElementById('closeSuccess').onclick = ()=> { modal.classList.add('hidden'); renderAll(); showView('ticketsView'); document.getElementById('navTickets').click(); };
}

// Bookings -> user tickets
function renderTickets(){
  const bookings = read(BOOK_KEY).filter(b => currentUser && b.userId === currentUser.id);
  const list = document.getElementById('ticketsList'); list.innerHTML = '';
  if(!bookings || bookings.length === 0){ document.getElementById('noTickets').style.display = 'block'; return; }
  document.getElementById('noTickets').style.display = 'none';
  bookings.forEach(b=>{
    const ev = read(EVENTS_KEY).find(e => e.id === b.eventId) || { title:'Deleted event' };
    const d = document.createElement('div'); d.className = 'card';
    d.innerHTML = `<strong>${ev.title}</strong><div class="muted">${ev.date} • ${ev.place}</div><div class="muted small">Paid via ${b.method} • ${new Date(b.ts).toLocaleString()}</div>`;
    list.appendChild(d);
  });
}

// Stats
function renderStats(){
  const events = read(EVENTS_KEY);
  const bookings = currentUser ? read(BOOK_KEY).filter(b => b.userId === currentUser.id) : [];
  document.getElementById('statTotalEvents').textContent = events.length;
  document.getElementById('statRegistered').textContent = bookings.length;
  document.getElementById('greet').textContent = `Hello, ${currentUser.name.split(' ')[0]}`;
  document.getElementById('greetSub').textContent = currentUser.isAdmin ? 'Admin dashboard' : 'Find and register for campus events';
}

// Profile editor
document.getElementById('editProfileBtn').addEventListener('click', ()=>{
  modalCard.innerHTML = `<h3>Edit profile</h3><input id="epName" value="${escapeHtml(currentUser.name)}" /><input id="epEmail" value="${escapeHtml(currentUser.email)}" /><input id="epRoll" value="${escapeHtml(currentUser.roll||'')}" /><input id="epPhoto" type="file" accept="image/*" /><div class="row"><button class="btn" id="epSave">Save</button><button class="btn ghost" id="epCancel">Cancel</button></div>`;
  modal.classList.remove('hidden');
  document.getElementById('epCancel').onclick = ()=> modal.classList.add('hidden');
  document.getElementById('epSave').onclick = async ()=>{
    const name = document.getElementById('epName').value.trim();
    const email = document.getElementById('epEmail').value.trim().toLowerCase();
    const roll = document.getElementById('epRoll').value.trim();
    const file = document.getElementById('epPhoto').files[0];
    const users = read(USERS_KEY);
    const me = users.find(u => u.id === currentUser.id);
    me.name = name; me.email = email; me.roll = roll;
    if(file) me.photo = await fileToDataURL(file);
    write(USERS_KEY, users);
    currentUser = me;
    topUserName.textContent = currentUser.name;
    topUserPic.src = currentUser.photo || topUserPic.src;
    sidePic.src = topUserPic.src;
    sideName.textContent = currentUser.name; sideEmail.textContent = currentUser.email; sideRoll.textContent = currentUser.roll ? ('Roll: ' + currentUser.roll) : '';
    modal.classList.add('hidden');
    renderAll();
  };
});

// Admin add/edit/delete
document.getElementById('aeAdd').addEventListener('click', ()=>{
  const title = document.getElementById('aeTitle').value.trim();
  const date = document.getElementById('aeDate').value.trim();
  const place = document.getElementById('aePlace').value.trim();
  const price = parseInt(document.getElementById('aePrice').value || 0);
  const img = document.getElementById('aeImg').value.trim() || 'https://picsum.photos/400/200?'+Math.random().toString(36).slice(2,6);
  const desc = document.getElementById('aeDesc').value.trim();
  if(!title) return alert('Enter title');
  const events = read(EVENTS_KEY);
  events.push({ id: genId(), title, date, place, price, description: desc, img, host: currentUser.name });
  write(EVENTS_KEY, events);
  clearAdminForm(); renderAll();
});
document.getElementById('aeClear').addEventListener('click', clearAdminForm);
function clearAdminForm(){ ['aeTitle','aeDate','aePlace','aePrice','aeImg','aeDesc'].forEach(id=>document.getElementById(id).value=''); }

function renderAdminEvents(){
  const list = document.getElementById('adminEventsList'); list.innerHTML = '';
  const events = read(EVENTS_KEY);
  events.forEach(ev=>{
    const d = document.createElement('div'); d.className = 'card';
    d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${ev.title}</strong><div class="muted">${ev.date} • ${ev.place}</div></div><div><button class="btn tiny" onclick="editEvent('${ev.id}')">Edit</button> <button class="btn ghost tiny" onclick="removeEvent('${ev.id}')">Remove</button></div></div>`;
    list.appendChild(d);
  });
}
window.removeEvent = function(id){
  if(!confirm('Remove event?')) return;
  write(EVENTS_KEY, read(EVENTS_KEY).filter(e=>e.id !== id));
  renderAll();
};
window.editEvent = function(id){
  const ev = read(EVENTS_KEY).find(x => x.id === id);
  modalCard.innerHTML = `<h3>Edit event</h3><input id="eeTitle" value="${escapeHtml(ev.title)}" /><input id="eeDate" value="${escapeHtml(ev.date)}" /><input id="eePlace" value="${escapeHtml(ev.place)}" /><input id="eePrice" value="${escapeHtml(ev.price||0)}" /><input id="eeImg" value="${escapeHtml(ev.img)}" /><textarea id="eeDesc">${escapeHtml(ev.description||'')}</textarea><div class="row"><button class="btn" id="eeSave">Save</button><button class="btn ghost" id="eeCancel">Cancel</button></div>`;
  modal.classList.remove('hidden');
  document.getElementById('eeCancel').onclick = ()=> modal.classList.add('hidden');
  document.getElementById('eeSave').onclick = ()=>{
    const events = read(EVENTS_KEY);
    const me = events.find(x => x.id === id);
    me.title = document.getElementById('eeTitle').value.trim();
    me.date  = document.getElementById('eeDate').value.trim();
    me.place = document.getElementById('eePlace').value.trim();
    me.price = parseInt(document.getElementById('eePrice').value || 0);
    me.img   = document.getElementById('eeImg').value.trim();
    me.description = document.getElementById('eeDesc').value.trim();
    write(EVENTS_KEY, events); modal.classList.add('hidden'); renderAll();
  };
};

// Admin users / bookings view
function renderAdminUsers(){
  const list = document.getElementById('adminUsersList'); list.innerHTML = '';
  const users = read(USERS_KEY);
  const bookings = read(BOOK_KEY);
  if(bookings.length === 0){ list.innerHTML = '<div class="muted">No registrations yet</div>'; return; }
  bookings.forEach(b=>{
    const u = users.find(x=>x.id === b.userId) || { name:'Unknown', email:''};
    const ev = read(EVENTS_KEY).find(e=>e.id === b.eventId) || { title:'Deleted' };
    const d = document.createElement('div'); d.className = 'card';
    d.innerHTML = `<strong>${ev.title}</strong><div class="muted">${u.name} • ${u.email}</div><div class="muted small">Paid via ${b.method} • ${new Date(b.ts).toLocaleString()}</div>`;
    list.appendChild(d);
  });
}

// Quick actions
document.getElementById('quickRegister').addEventListener('click', ()=>{ showView('eventsView'); document.getElementById('navEvents').click(); });
document.getElementById('quickTickets').addEventListener('click', ()=>{ showView('ticketsView'); document.getElementById('navTickets').click(); });
document.getElementById('quickMessages').addEventListener('click', ()=>{ showView('messagesView'); document.getElementById('navMessages').click(); });

// Search
document.getElementById('searchInput').addEventListener('input', (e)=>{
  const q = e.target.value.toLowerCase();
  const filtered = read(EVENTS_KEY).filter(ev => (ev.title||'').toLowerCase().includes(q) || (ev.description||'').toLowerCase().includes(q));
  const list = document.getElementById('eventsList'); list.innerHTML = '';
  filtered.forEach(ev=>{
    const d = document.createElement('div'); d.className = 'event';
    d.innerHTML = `<div style="display:flex;gap:12px"><img src="${ev.img}" style="width:120px;height:78px;border-radius:6px;object-fit:cover"><div><h4>${ev.title}</h4><div class="muted">${ev.date} • ${ev.place}</div><p class="muted small">${(ev.description||'').slice(0,140)}${ev.description && ev.description.length>140?'...':''}</p><div style="margin-top:6px"><button class="btn tiny" onclick="openEventModal('${ev.id}')">Open</button></div></div></div>`;
    list.appendChild(d);
  });
});

// Demo: add event
document.getElementById('btnCreateDemo').addEventListener('click', ()=>{
  const evs = read(EVENTS_KEY);
  evs.push({ id: genId(), title:'Demo Event '+(evs.length+1), date:'2026-01-15', place:'Hall A', price:99, description:'Demo event for testing registration and payments.', img:'https://picsum.photos/400/200?'+Math.random().toString(36).slice(2,6), host:'Student Club' });
  write(EVENTS_KEY, evs); renderAll();
});

// Render after login: ensure currentUser exists for functions that refer to it
window.onload = ()=>{ /* nothing auto-logged */ };

// Utilities
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
window.openEventModal = window.openEventModal;
window.removeEvent = window.removeEvent;
window.editEvent = window.editEvent;
