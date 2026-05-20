const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const categoryController = require('../controllers/categoryController');
const tagController = require('../controllers/tagController');
const commentController = require('../controllers/commentController');
const mediaController = require('../controllers/mediaController');
const settingsController = require('../controllers/settingsController');
const { requireAdmin } = require('../middleware/auth');
const supabase = require('../services/supabase');

// Protect all following routes
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [{ count: postsCount }, { count: pendingComments }, { count: views }] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('page_views').select('*', { count: 'exact', head: true })
    ]);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      stats: {
        posts: postsCount || 0,
        pendingComments: pendingComments || 0,
        views: views || 0
      },
      layout: 'layouts/admin'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Posts
router.get('/posts', postController.getAdminPosts);
router.get('/posts/new', postController.renderCreatePost);
router.post('/posts/new', postController.savePost);
router.get('/posts/edit/:id', postController.renderEditPost);
router.post('/posts/edit/:id', postController.savePost);
router.post('/posts/delete/:id', postController.deletePost);

// Categories
router.get('/categories', categoryController.getCategories);
router.post('/categories/new', categoryController.createCategory);
router.post('/categories/edit/:id', categoryController.updateCategory);
router.post('/categories/delete/:id', categoryController.deleteCategory);

// Tags
router.get('/tags', tagController.getTags);
router.post('/tags/new', tagController.createTag);
router.post('/tags/delete/:id', tagController.deleteTag);

// Comments
router.get('/comments', commentController.getAdminComments);
router.post('/comments/update/:id', commentController.updateCommentStatus);
router.post('/comments/delete/:id', commentController.deleteComment);

// Media
router.get('/media', mediaController.getMedia);
router.post('/media/upload', mediaController.uploadMedia);
router.post('/media/delete/:id', mediaController.deleteMedia);

// Settings
router.get('/settings', settingsController.getSettings);
router.post('/settings', settingsController.updateSettings);

// Profile
router.get('/profile', async (req, res) => {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', req.session.user.id).single();
  res.render('admin/profile', { title: 'Profile', profile, layout: 'layouts/admin' });
});

router.post('/profile', async (req, res) => {
  const { display_name, bio } = req.body;
  await supabase.from('profiles').update({ display_name, bio }).eq('id', req.session.user.id);
  req.flash('success_msg', 'Profile updated');
  res.redirect('/admin/profile');
});

// Subscribers
router.get('/subscribers', async (req, res) => {
  const { data: subscribers } = await supabase.from('subscribers').select('*').order('subscribed_at', { ascending: false });
  res.render('admin/subscribers', { title: 'Subscribers', subscribers, layout: 'layouts/admin' });
});

router.post('/subscribers/broadcast', async (req, res) => {
  const { subject, message } = req.body;
  const { data: subscribers } = await supabase.from('subscribers').select('*').eq('is_active', true);
  
  // Basic implementation. In production, use a queue
  const { sendEmail } = require('../services/email');
  for (const sub of subscribers) {
    const html = `${message}<br><br><a href="${process.env.SUPABASE_URL.replace('api', '')}/unsubscribe?token=${sub.unsubscribe_token}">Unsubscribe</a>`;
    await sendEmail(sub.email, subject, '', html);
  }
  
  req.flash('success_msg', 'Broadcast sent');
  res.redirect('/admin/subscribers');
});

// Messages
router.get('/messages', async (req, res) => {
  const { data: messages } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
  res.render('admin/messages', { title: 'Messages', messages, layout: 'layouts/admin' });
});

module.exports = router;
