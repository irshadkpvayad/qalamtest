const supabase = require('../services/supabase');

exports.renderLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/');
  }
  res.render('login', { title: 'Log In', layout: 'layouts/main' });
};

exports.renderSignup = (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/');
  }
  res.render('signup', { title: 'Sign Up', layout: 'layouts/main' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) throw error;
    
    const { data: profile } = await supabase.from('profiles').select('role, display_name').eq('id', data.user.id).single();
    
    req.session.user = {
      id: data.user.id,
      email: data.user.email,
      role: profile ? profile.role : 'user',
      name: profile ? profile.display_name : 'User'
    };
    req.session.access_token = data.session.access_token;
    
    req.flash('success_msg', 'Successfully logged in');
    
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/');
    }
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error_msg', err.message || 'Invalid email or password');
    res.redirect('/login');
  }
};

exports.signup = async (req, res) => {
  try {
    const { email, password, confirm_password } = req.body;
    
    if (password !== confirm_password) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('/signup');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    req.flash('success_msg', 'Account created successfully! You can now log in.');
    res.redirect('/login');
  } catch (err) {
    console.error('Signup error:', err);
    req.flash('error_msg', err.message || 'Error creating account');
    res.redirect('/signup');
  }
};

exports.logout = async (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/');
  });
};
