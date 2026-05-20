const supabase = require('../services/supabase');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
}).single('image');

exports.getMedia = async (req, res) => {
  try {
    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    res.render('admin/media', {
      title: 'Media Library',
      media,
      layout: 'layouts/admin'
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load media');
    res.redirect('/admin/dashboard');
  }
};

exports.uploadMedia = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (req.xhr) return res.status(400).json({ error: err.message });
      req.flash('error_msg', err.message);
      return res.redirect('/admin/media');
    }
    
    if (!req.file) {
      if (req.xhr) return res.status(400).json({ error: 'Please upload a file' });
      req.flash('error_msg', 'Please upload a file');
      return res.redirect('/admin/media');
    }

    try {
      const id = uuidv4();
      const baseFilename = `${id}.webp`;
      
      // Process images with sharp
      const fullBuffer = await sharp(req.file.buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
        
      const mediumBuffer = await sharp(req.file.buffer)
        .resize({ width: 800, height: 500, fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
        
      const thumbBuffer = await sharp(req.file.buffer)
        .resize({ width: 300, height: 200, fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      // Upload to Supabase Storage (bucket "media")
      const uploadFile = async (buffer, path) => {
        const { error } = await supabase.storage
          .from('media')
          .upload(path, buffer, { contentType: 'image/webp', upsert: true });
        if (error) throw error;
        
        const { data } = supabase.storage.from('media').getPublicUrl(path);
        return data.publicUrl;
      };

      const [fullUrl, mediumUrl, thumbUrl] = await Promise.all([
        uploadFile(fullBuffer, `full/${baseFilename}`),
        uploadFile(mediumBuffer, `medium/${baseFilename}`),
        uploadFile(thumbBuffer, `thumb/${baseFilename}`)
      ]);

      // Save to media table
      const { data: mediaRecord, error: dbError } = await supabase.from('media').insert([{
        filename: req.file.originalname,
        url: fullUrl,
        medium_url: mediumUrl,
        thumbnail_url: thumbUrl,
        size: fullBuffer.length,
        type: 'image/webp'
      }]).select().single();

      if (dbError) throw dbError;

      if (req.xhr) {
        return res.json({ success: true, url: fullUrl, media: mediaRecord });
      }

      req.flash('success_msg', 'Image uploaded successfully');
      res.redirect('/admin/media');
    } catch (error) {
      console.error(error);
      if (req.xhr) return res.status(500).json({ error: 'Error uploading to storage' });
      req.flash('error_msg', 'Error uploading image');
      res.redirect('/admin/media');
    }
  });
};

exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get media record
    const { data: media } = await supabase.from('media').select('*').eq('id', id).single();
    if (!media) throw new Error('Media not found');

    // Delete from storage
    const filename = media.url.split('/').pop();
    await supabase.storage.from('media').remove([
      `full/${filename}`,
      `medium/${filename}`,
      `thumb/${filename}`
    ]);

    // Delete from table
    await supabase.from('media').delete().eq('id', id);

    if (req.xhr) return res.json({ success: true });

    req.flash('success_msg', 'Media deleted');
    res.redirect('/admin/media');
  } catch (err) {
    console.error(err);
    if (req.xhr) return res.status(500).json({ error: 'Error deleting media' });
    req.flash('error_msg', 'Error deleting media');
    res.redirect('/admin/media');
  }
};
