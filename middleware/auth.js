const supabase = require('../services/supabase');

const requireAdmin = async (req, res, next) => {
  if (!req.session || !req.session.user || !req.session.access_token) {
    req.flash('error_msg', 'Access denied. Please log in first.');
    return res.redirect('/login');
  }

  try {
    // Verify the session token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(req.session.access_token);
    
    if (error || !user) {
      return req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/login');
      });
    }
    
    // Check if the user has the 'admin' role in the profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profile && profile.role === 'admin') {
      return next();
    } else {
      return req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.status(403).render('403', { 
          title: '403 - Access Denied', 
          layout: 'layouts/main'
        });
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.redirect('/login');
  }
};

const forwardAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/');
    }
  }
  next();
};

module.exports = {
  requireAdmin,
  forwardAuthenticated
};
