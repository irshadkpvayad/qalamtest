const supabase = require('../services/supabase');
const slugify = require('slugify');

// === PUBLIC ===
exports.getCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Get category
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (catError || !category) return res.status(404).render('404', { title: 'Not Found', layout: 'layouts/main' });

    // Get posts in category
    const { data: postCats } = await supabase
      .from('post_categories')
      .select('post_id')
      .eq('category_id', category.id);
      
    const postIds = postCats ? postCats.map(pc => pc.post_id) : [];

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

    res.render('category', {
      title: category.name,
      category,
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
exports.getCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.render('admin/categories', {
      title: 'Categories',
      categories,
      layout: 'layouts/admin'
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load categories');
    res.redirect('/admin/dashboard');
  }
};

exports.createCategory = async (req, res) => {
  try {
    let { name, slug, description, accent_color, cover_image, parent_id } = req.body;
    if (!slug) slug = slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

    const { error } = await supabase.from('categories').insert([{
      name, slug, description, accent_color, cover_image, parent_id: parent_id || null
    }]);

    if (error) throw error;

    req.flash('success_msg', 'Category created');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error(err);
    if (err.message && err.message.includes('fetch failed')) {
      req.flash('error_msg', 'Network error connecting to database. Please check your internet or .env settings.');
    } else {
      req.flash('error_msg', 'Error creating category: ' + (err.message || ''));
    }
    res.redirect('/admin/categories');
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, accent_color, cover_image, parent_id } = req.body;

    const { error } = await supabase.from('categories').update({
      name, slug, description, accent_color, cover_image, parent_id: parent_id || null
    }).eq('id', id);

    if (error) throw error;

    req.flash('success_msg', 'Category updated');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error(err);
    if (err.message && err.message.includes('fetch failed')) {
      req.flash('error_msg', 'Network error connecting to database.');
    } else {
      req.flash('error_msg', 'Error updating category');
    }
    res.redirect('/admin/categories');
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('categories').delete().eq('id', id);
    req.flash('success_msg', 'Category deleted');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting category');
    res.redirect('/admin/categories');
  }
};
