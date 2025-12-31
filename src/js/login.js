// src/js/login.js
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const voterId = document.getElementById('voter-id').value.trim();
  const password = document.getElementById('password').value;

  if (!voterId || !password) {
    alert('Please enter both Voter ID and Password');
    return;
  }

  try {
    const response = await fetch('http://127.0.0.1:8000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ voter_id: voterId, password: password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    
    // save token and role in localStorage
    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('userRole', data.role);

    // jump to appropriate page
    if (data.role === 'admin') {
      window.location.href = '/admin.html';
    } else {
      window.location.href = '/index.html';
    }

  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed: ' + error.message);
  }
});