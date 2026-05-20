const supabase = require('../services/supabase');
const { sendEmail } = require('../services/email');

// PUBLIC
exports.addComment = async (req, res) => {
  try {
    if (!req.session.user) {
      if (req.xhr) return res.status(401).json({ error: 'Please login to comment' });
      req.flash('error_msg', 'Please login to comment');
      return res.redirect('back');
    }

    const { post_id, content, parent_id } = req.body;
    const name = req.session.user.name;
    const email = req.session.user.email;
    const user_id = req.session.user.id;
    
    // Basic spam check: reject if content has unapproved URLs (simplified)
    const hasUrls = /(http|https):\/\/[^\s]+/g.test(content);
    let status = 'pending';
    if (hasUrls) {
       status = 'spam';
    }

    const { error } = await supabase.from('comments').insert([{
      post_id,
      parent_id: parent_id || null,
      user_id,
      name,
      email,
      content,
      status
    }]);

    if (error) throw error;

    // Send email alert to admin if it's pending (fails silently if email is unconfigured)
    if (status === 'pending') {
      try {
        const emailHtml = `
          <p>New comment from <strong>${name}</strong> (${email})</p>
          <p>${content}</p>
          <a href="${process.env.SUPABASE_URL.replace('api', '')}/admin/comments">Moderate Comments</a>
        `;
        await sendEmail('irshadvayad01@gmail.com', 'New Comment Pending Approval', '', emailHtml);
      } catch (emailErr) {
        console.error('Failed to send comment admin alert email:', emailErr);
      }
    }

    if (req.xhr) {
      return res.json({ success: true, message: 'Comment submitted. Pending approval.' });
    }

    req.flash('success_msg', 'Comment submitted and is pending approval.');
    res.redirect('back');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ error: 'Error submitting comment' });
    req.flash('error_msg', 'Failed to submit comment');
    res.redirect('back');
  }
};

// ADMIN
exports.getAdminComments = async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, posts(title)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.render('admin/comments', {
      title: 'Comments',
      comments,
      layout: 'layouts/admin'
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load comments');
    res.redirect('/admin/dashboard');
  }
};

exports.updateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // pending, approved, spam

    const { error } = await supabase.from('comments').update({ status }).eq('id', id);
    
    if (error) throw error;

    if (req.xhr) return res.json({ success: true });
    
    req.flash('success_msg', `Comment marked as ${status}`);
    res.redirect('/admin/comments');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ error: 'Failed to update' });
    req.flash('error_msg', 'Failed to update comment');
    res.redirect('/admin/comments');
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('comments').delete().eq('id', id);
    
    if (req.xhr) return res.json({ success: true });

    req.flash('success_msg', 'Comment deleted');
    res.redirect('/admin/comments');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to delete comment');
    res.redirect('/admin/comments');
  }
};
