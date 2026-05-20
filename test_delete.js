require('dotenv').config();
const supabase = require('./services/supabase');

async function testDelete() {
  // Get a post
  const { data: posts } = await supabase.from('posts').select('id').limit(1);
  if (!posts || posts.length === 0) {
    console.log('No posts found to test delete.');
    return;
  }
  const postId = posts[0].id;
  console.log(`Testing delete for post ${postId}...`);
  
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) {
    console.error('DELETE ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('Delete successful!');
  }
}

testDelete().then(() => process.exit(0));
