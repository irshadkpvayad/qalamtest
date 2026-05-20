const supabase = require('../services/supabase');

let maintenanceMode = false;
let maintenanceMessage = 'We are currently under maintenance.';
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

const checkMaintenance = async (req, res, next) => {
  // Allow admin routes even in maintenance mode
  if (req.path.startsWith('/admin')) {
    return next();
  }

  try {
    const now = Date.now();
    if (now - lastFetch > CACHE_DURATION) {
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_message']);

      if (settings) {
        settings.forEach(setting => {
          if (setting.key === 'maintenance_mode') {
            maintenanceMode = setting.value === 'true';
          }
          if (setting.key === 'maintenance_message') {
            maintenanceMessage = setting.value;
          }
        });
      }
      lastFetch = now;
    }

    if (maintenanceMode) {
      return res.status(503).render('maintenance', {
        title: 'Maintenance',
        layout: false,
        message: maintenanceMessage
      });
    }

    next();
  } catch (error) {
    console.error('Maintenance middleware error:', error);
    next();
  }
};

module.exports = checkMaintenance;
