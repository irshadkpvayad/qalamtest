const cron = require('node-cron');
const supabase = require('./supabase');

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date().toISOString();
    
    // Find scheduled posts that are due
    const { data: duePosts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);
      
    if (fetchError) throw fetchError;
    
    if (duePosts && duePosts.length > 0) {
      console.log(`Found ${duePosts.length} posts to publish.`);
      
      for (const post of duePosts) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({ status: 'published', updated_at: now })
          .eq('id', post.id);
          
        if (updateError) {
          console.error(`Error publishing post ${post.id}:`, updateError);
        } else {
          console.log(`Published scheduled post: ${post.title}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in scheduled publishing job:', error);
  }
});

console.log('Scheduler initialized: checking for scheduled posts every minute.');
