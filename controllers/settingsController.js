const supabase = require('../services/supabase');

exports.getSettings = async (req, res) => {
  try {
    const { data: settingsData, error } = await supabase.from('settings').select('*');
    if (error) throw error;

    // Convert array of {key, value} to object
    const settings = settingsData.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    res.render('admin/settings', {
      title: 'Site Settings',
      settings,
      layout: 'layouts/admin'
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load settings');
    res.redirect('/admin/dashboard');
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const newSettings = req.body;
    
    // Convert body object to array of inserts
    const updates = Object.keys(newSettings).map(key => ({
      key,
      value: newSettings[key]
    }));

    // Upsert settings
    const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
    if (error) throw error;

    req.flash('success_msg', 'Settings updated successfully');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to update settings');
    res.redirect('/admin/settings');
  }
};
