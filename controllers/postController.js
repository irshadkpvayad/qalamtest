const supabase = require('../services/supabase');
const slugify = require('slugify');

// === PUBLIC METHODS ===

exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Fetch everything in parallel to maximize speed
    const [postsRes, popularRes, categoriesRes, mediaRes] = await Promise.all([
      supabase
        .from('posts')
        .select('*, profiles(display_name)', { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(start, end),
      supabase
        .from('posts')
        .select('title, slug, featured_image, views')
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(5),
      supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true }),
      supabase
        .from('media')
        .select('url')
        .order('uploaded_at', { ascending: false })
        .limit(5)
    ]);

    if (postsRes.error) throw postsRes.error;

    res.render('index', {
      title: 'Home',
      posts: postsRes.data || [],
      popularPosts: popularRes.data || [],
      categories: categoriesRes.data || [],
      sliderImages: mediaRes.data || [],
      currentPage: page,
      totalPages: Math.ceil((postsRes.count || 0) / limit),
      layout: 'layouts/main'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: '500 Error', layout: 'layouts/main' });
  }
};

exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Support preview mode
    const isPreview = req.query.preview === 'true';
    const query = supabase.from('posts').select('*, profiles(display_name, bio, avatar_url)').eq('slug', slug);
    
    if (!isPreview) {
      query.eq('status', 'published');
    }

    const { data: post, error } = await query.single();

    if (error || !post) return res.status(404).render('404', { title: 'Not Found', layout: 'layouts/main' });

    // Parallelize all dependent queries to load the page instantly
    const [likesRes, tagsRes, commentsRes, popularRes, recentRes, categoriesRes] = await Promise.all([
      supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      supabase.from('post_tags').select('tags(name, slug)').eq('post_id', post.id),
      supabase.from('comments').select('*').eq('post_id', post.id).eq('status', 'approved').order('created_at', { ascending: true }),
      supabase.from('posts').select('title, slug, featured_image, views').eq('status', 'published').order('views', { ascending: false }).limit(5),
      supabase.from('posts').select('title, slug, featured_image, created_at').eq('status', 'published').order('created_at', { ascending: false }).limit(5),
      supabase.from('categories').select('*').order('post_count', { ascending: false }).limit(5)
    ]);
      
    // Check if current user liked it
    let isLiked = false;
    if (req.session.user) {
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', req.session.user.id)
        .maybeSingle();
      if (userLike) isLiked = true;
    }

    // Build nested comments structure (simple 1-level)
    const comments = commentsRes.data || [];
    const topLevelComments = comments.filter(c => !c.parent_id);
    const replies = comments.filter(c => c.parent_id);
    topLevelComments.forEach(c => {
      c.replies = replies.filter(r => r.parent_id === c.id);
    });

    res.render('post', {
      title: post.title,
      post,
      tags: tagsRes.data ? tagsRes.data.map(pt => pt.tags) : [],
      comments: topLevelComments,
      likesCount: likesRes.count || 0,
      isLiked,
      popularPosts: popularRes.data || [],
      recentPosts: recentRes.data || [],
      topCategories: categoriesRes.data || [],
      layout: 'layouts/main'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: '500 Error', layout: 'layouts/main' });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.redirect('/');

    const { data: posts } = await supabase
      .from('posts')
      .select('*, profiles(display_name)')
      .eq('status', 'published')
      .textSearch('search_vector', query, { type: 'websearch' })
      .order('created_at', { ascending: false });

    res.render('search', {
      title: 'തിരയൽ ഫലങ്ങൾ (Search Results)',
      query,
      posts: posts || [],
      layout: 'layouts/main'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: '500 Error', layout: 'layouts/main' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please login to like this post' });
    }
    
    const { id: post_id } = req.params;
    const user_id = req.session.user.id;
    
    // Check if like exists
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .maybeSingle();
      
    if (existing) {
      // Unlike
      await supabase.from('likes').delete().eq('id', existing.id);
      return res.json({ success: true, liked: false });
    } else {
      // Like
      await supabase.from('likes').insert([{ post_id, user_id }]);
      return res.json({ success: true, liked: true });
    }
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Failed to process like' });
  }
};

// === ADMIN METHODS ===

exports.getAdminPosts = async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, slug, status, views, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.render('admin/posts', {
      title: 'Posts',
      posts,
      layout: 'layouts/admin'
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load posts');
    res.redirect('/admin/dashboard');
  }
};

exports.renderCreatePost = async (req, res) => {
  try {
    const { data: categories } = await supabase.from('categories').select('*');
    res.render('admin/post-editor', {
      title: 'New Post',
      post: {},
      categories,
      postCategories: [],
      layout: 'layouts/admin'
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading editor');
    res.redirect('/admin/posts');
  }
};

exports.renderEditPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: post, error } = await supabase.from('posts').select('*').eq('id', id).single();
    if (error || !post) throw error;

    const { data: categories } = await supabase.from('categories').select('*');
    const { data: postCats } = await supabase.from('post_categories').select('category_id').eq('post_id', id);

    res.render('admin/post-editor', {
      title: 'Edit Post',
      post,
      categories,
      postCategories: postCats ? postCats.map(c => c.category_id) : [],
      layout: 'layouts/admin'
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading editor');
    res.redirect('/admin/posts');
  }
};

exports.savePost = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, slug, excerpt, content, featured_image, status, categories, allow_comments, is_featured, scheduled_at, seo_title, meta_description, focus_keyword, action } = req.body;

    if (!slug) slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    
    // Verify slug uniqueness
    const { data: existing } = await supabase.from('posts').select('id').eq('slug', slug).neq('id', id || '00000000-0000-0000-0000-000000000000').maybeSingle();
    if (existing) slug = `${slug}-${Date.now()}`;

    if (action === 'publish' && status === 'draft') status = 'published';

    const postData = {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      status: status || 'draft',
      allow_comments: allow_comments === 'on',
      is_featured: is_featured === 'on',
      scheduled_at: scheduled_at || null,
      seo_title,
      meta_description,
      focus_keyword,
      updated_at: new Date().toISOString()
    };

    let postId = id;

    if (id) {
      const { error } = await supabase.from('posts').update(postData).eq('id', id);
      if (error) throw error;
    } else {
      postData.author_id = req.session.user.id;
      const { data: newPost, error } = await supabase.from('posts').insert([postData]).select('id').single();
      if (error) throw error;
      postId = newPost.id;
    }

    // Handle categories
    await supabase.from('post_categories').delete().eq('post_id', postId);
    if (categories) {
      const catIds = Array.isArray(categories) ? categories : [categories];
      const catInserts = catIds.map(cId => ({ post_id: postId, category_id: cId }));
      await supabase.from('post_categories').insert(catInserts);
    }

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, id: postId });
    }

    req.flash('success_msg', 'Post saved successfully');
    res.redirect('/admin/posts');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ error: err.message });
    req.flash('error_msg', 'Error saving post');
    res.redirect('/admin/posts');
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
    
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
      return res.json({ success: true, message: 'Post deleted successfully' });
    }
    
    req.flash('success_msg', 'Post deleted');
    res.redirect('/admin/posts');
  } catch (err) {
    console.error('DELETE POST ERROR:', err);
    
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
      return res.status(500).json({ error: err.message || err.details || 'Failed to delete post' });
    }
    
    req.flash('error_msg', 'Error deleting post: ' + (err.message || err.details || ''));
    res.redirect('/admin/posts');
  }
};
