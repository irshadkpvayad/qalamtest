const supabase = require('../services/supabase');

// This middleware is intended to be used on a specific API route
// called by the frontend (which uses sessionStorage to debounce).
const trackView = async (req, res, next) => {
  const postId = req.params.id;
  
  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Increment total views in posts table
    // Since Supabase doesn't have a direct "increment" function from the JS client without RPC,
    // we can use a raw RPC or fetch and update. 
    // A better approach in PostgreSQL is an RPC, but we'll fetch and update for simplicity,
    // or use the page_views table to aggregate later.
    
    // Actually, we can fetch current views and increment
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('views')
      .eq('id', postId)
      .single();

    if (!fetchError && post) {
      await supabase
        .from('posts')
        .update({ views: post.views + 1 })
        .eq('id', postId);
    }

    // 2. Track daily views in page_views table with upsert
    // We need to fetch current count for today to increment it, or rely on a DB function.
    // Since we don't have an RPC defined for incrementing, we fetch then upsert.
    const { data: pageView, error: pvFetchError } = await supabase
      .from('page_views')
      .select('count')
      .eq('post_id', postId)
      .eq('view_date', today)
      .maybeSingle();

    const currentCount = pageView ? pageView.count : 0;

    await supabase
      .from('page_views')
      .upsert({
        post_id: postId,
        view_date: today,
        count: currentCount + 1
      }, { onConflict: 'post_id, view_date' });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = trackView;
