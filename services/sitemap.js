const supabase = require('./supabase');

const generateSitemap = async (req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  // Fetch all published posts
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Home page
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  
  // Categories
  if (categories) {
    for (const cat of categories) {
      xml += `  <url>\n    <loc>${baseUrl}/category/${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }
  }

  // Posts
  if (posts) {
    for (const post of posts) {
      const lastMod = new Date(post.updated_at).toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/post/${post.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }
  }

  // Static pages
  const staticPages = ['about', 'contact', 'privacy', 'terms'];
  for (const page of staticPages) {
    xml += `  <url>\n    <loc>${baseUrl}/${page}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
  }

  xml += '</urlset>';
  return xml;
};

module.exports = { generateSitemap };
