const supabase = require('../services/supabase');
const slugify = require('slugify');

// === PUBLIC ===
exports.getTag = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('*')
      .eq('slug', slug)
      .single();

    if (tagError || !tag) return res.status(404).render('404', { title: 'Not Found', layout: 'layouts/main' });

    const { data: postTags } = await supabase
      .from('post_tags')
      .select('post_id')
      .eq('tag_id', tag.id);
      
    const postIds = postTags ? postTags.map(pt => pt.post_id) : [];

    let posts = [];
    let count = 0;
    
    if (postIds.length > 0) {
      const { data, count: c } = await supabase
        .from('posts')
        .select('*, profiles(display_name)', { count: 'exact' })
        .in('id', postIds)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(start, end);
      
      posts = data || [];
      count = c || 0;
    }

    res.render('tag', {
      title: tag.name,
      tag,
      posts,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      layout: 'layouts/main'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { layout: 'layouts/main' });
  }
};

// === ADMIN ===
exports.getTags = async (req, res) => {
  try {
    const { data: tags, error } = await supabase.from('tags').select('*').order('name');
    if (error) throw error;

    res.render('admin/tags', {
      title: 'Tags',
      tags,
      layout: 'layouts/admin'
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load tags');
    res.redirect('/admin/dashboard');
  }
};

exports.createTag = async (req, res) => {
  try {
    let { name, slug } = req.body;
    if (!slug) slug = slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

    const { error } = await supabase.from('tags').insert([{ name, slug }]);
    if (error) throw error;

    req.flash('success_msg', 'Tag created');
    res.redirect('/admin/tags');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating tag');
    res.redirect('/admin/tags');
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('tags').delete().eq('id', id);
    req.flash('success_msg', 'Tag deleted');
    res.redirect('/admin/tags');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting tag');
    res.redirect('/admin/tags');
  }
};
