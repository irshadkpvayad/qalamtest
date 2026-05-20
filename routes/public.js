const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const categoryController = require('../controllers/categoryController');
const tagController = require('../controllers/tagController');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');
const checkMaintenance = require('../middleware/maintenance');
const trackView = require('../middleware/viewTracker');
const { generateSitemap } = require('../services/sitemap');
const supabase = require('../services/supabase');

// Apply maintenance mode check to all public routes
router.use(checkMaintenance);

// Pages
router.get('/', postController.getPosts);
router.get('/post/:slug', postController.getPostBySlug);
router.get('/category/:slug', categoryController.getCategory);
router.get('/tag/:slug', tagController.getTag);
router.get('/search', postController.searchPosts);

// Tracking views via AJAX
router.post('/api/track-view/:id', trackView);

// Auth
router.get('/login', authController.renderLogin);
router.post('/login', authController.login);
router.get('/signup', authController.renderSignup);
router.post('/signup', authController.signup);
router.get('/logout', authController.logout);

// User Profile
router.get('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.session.user.id)
    .single();
    
  if (error) {
    console.error(error);
    return res.status(500).render('500', { title: 'Error', layout: 'layouts/main' });
  }
  
  res.render('profile', { title: 'My Profile', profile, layout: 'layouts/main' });
});

// Profile Update
router.post('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  
  const { display_name, bio } = req.body;
  await supabase.from('profiles').update({ display_name, bio }).eq('id', req.session.user.id);
  
  req.session.user.name = display_name; // update session
  req.flash('success_msg', 'Profile updated successfully!');
  res.redirect('/profile');
});

// Likes
router.post('/like/:id', postController.toggleLike);

// Comments
router.post('/comment', commentController.addComment);

// Newsletter Subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();

    const { error } = await supabase.from('subscribers').insert([{
      email,
      unsubscribe_token: token
    }]);

    if (error && error.code === '23505') {
      if (req.xhr) return res.json({ success: true, message: 'നിങ്ങൾ ഇതിനകം സബ്സ്ക്രൈബ് ചെയ്തിട്ടുണ്ട്.' });
      req.flash('success_msg', 'Already subscribed');
      return res.redirect('back');
    }

    if (error) throw error;

    if (req.xhr) return res.json({ success: true, message: 'വിജയകരമായി സബ്സ്ക്രൈബ് ചെയ്തു!' });
    req.flash('success_msg', 'Successfully subscribed!');
    res.redirect('back');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ error: 'Error subscribing' });
    req.flash('error_msg', 'Error subscribing');
    res.redirect('back');
  }
});

router.get('/unsubscribe', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect('/');
  
  await supabase.from('subscribers').update({ is_active: false }).eq('unsubscribe_token', token);
  res.send('<h1>Unsubscribed Successfully</h1><p>You have been removed from the mailing list.</p>');
});

// Contact form
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await supabase.from('messages').insert([{ name, email, message }]);
    
    if (req.xhr) return res.json({ success: true, message: 'Message sent successfully.' });
    req.flash('success_msg', 'Message sent successfully.');
    res.redirect('/contact');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ error: 'Error sending message' });
    req.flash('error_msg', 'Error sending message');
    res.redirect('/contact');
  }
});

// Static Pages
router.get('/about', (req, res) => res.render('about', { title: 'About Us', layout: 'layouts/main' }));
router.get('/contact', (req, res) => res.render('contact', { title: 'Contact Us', layout: 'layouts/main' }));
router.get('/privacy', (req, res) => res.render('privacy', { title: 'Privacy Policy', layout: 'layouts/main' }));
router.get('/terms', (req, res) => res.render('terms', { title: 'Terms & Conditions', layout: 'layouts/main' }));
router.get('/archive', (req, res) => res.render('archive', { title: 'Archive', layout: 'layouts/main' }));

// SEO 
router.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await generateSitemap(req);
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

router.get('/robots.txt', async (req, res) => {
  try {
    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'robots_txt').single();
    res.type('text/plain');
    res.send(setting ? setting.value : `User-agent: *\nAllow: /\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`);
  } catch (err) {
    res.type('text/plain').send('User-agent: *\nAllow: /');
  }
});

module.exports = router;
