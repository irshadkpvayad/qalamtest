-- Populate 20 random Malayalam posts with abstract/nature/tech images
DO $$
DECLARE
    cat_id uuid;
    author_id_val uuid;
    post_id_val uuid;
BEGIN
    -- 1. Ensure category 'വിജ്ഞാനം' (Knowledge) exists
    INSERT INTO categories (name, slug, description, accent_color, cover_image)
    VALUES ('വിജ്ഞാനം', 'knowledge', 'ശാസ്ത്രം, സാങ്കേതികവിദ്യ, പ്രകൃതി എന്നിവയെക്കുറിച്ചുള്ള ലേഖനങ്ങൾ.', '#7f56d9', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_id;

    -- Get first admin/author profile if it exists
    SELECT id INTO author_id_val FROM profiles LIMIT 1;

    -- 2. Insert 20 Malayalam posts and link them to the category

    -- Post 1
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'ആധുനിക സാങ്കേതികവിദ്യയുടെ വളർച്ച', 
        'growth-of-modern-technology', 
        '<p>സാങ്കേതികവിദ്യ നമ്മുടെ ജീവിതത്തെ അടിസ്ഥാനപരമായി മാറ്റിമറിച്ചിരിക്കുന്നു. ആശയവിനിമയം മുതൽ ഗതാഗതം വരെ എല്ലാ മേഖലകളിലും സാങ്കേതികവിദ്യ വലിയ സ്വാധീനം ചെലുത്തുന്നു.</p><p>ഭാവിയിൽ ആർട്ടിഫിഷ്യൽ ഇന്റലിജൻസ്, റോബോട്ടിക്സ് തുടങ്ങിയ മേഖലകൾ നമ്മുടെ ജീവിതരീതിയെ കൂടുതൽ മെച്ചപ്പെടുത്തുമെന്ന് പ്രതീക്ഷിക്കാം.</p>', 
        'ആധുനിക സാങ്കേതികവിദ്യ നമ്മുടെ ദൈനംദിന ജീവിതത്തിൽ വരുത്തിയ മാറ്റങ്ങളെക്കുറിച്ചുള്ള ഒരു അവലോകനം.', 
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', 
        author_id_val, 
        'published', 
        true, 
        342,
        NOW() - INTERVAL '1 day'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 2
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'പ്രകൃതി സംരക്ഷണത്തിന്റെ പ്രാധാന്യം', 
        'importance-of-nature-conservation', 
        '<p>നമ്മുടെ നിലനിൽപ്പ് പ്രകൃതിയുമായി അഭേദ്യമായി ബന്ധപ്പെട്ടിരിക്കുന്നു. വനങ്ങൾ സംരക്ഷിക്കാനും മലിനീകരണം കുറയ്ക്കാനും നാം ഓരോരുത്തരും മുൻകൈ എടുക്കേണ്ടതുണ്ട്.</p><p>ഭാവി തലമുറയ്ക്കായി പ്രകൃതിവിഭവങ്ങൾ സംരക്ഷിക്കുക എന്നത് നമ്മുടെ കടമയാണ്.</p>', 
        'ഭൂമിയുടെ നിലനിൽപ്പിനായി പ്രകൃതി സംരക്ഷണ പ്രവർത്തനങ്ങളിൽ പങ്കാളികളാകേണ്ടതിന്റെ ആവശ്യകത.', 
        'https://images.unsplash.com/photo-1444464666168-49b626f860d9?w=800', 
        author_id_val, 
        'published', 
        false, 
        210,
        NOW() - INTERVAL '2 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 3
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'ബഹിരാകാശ ഗവേഷണത്തിലെ പുതിയ കണ്ടുപിടുത്തങ്ങൾ', 
        'new-discoveries-in-space-research', 
        '<p>പ്രപഞ്ചത്തിന്റെ ഉത്ഭവത്തെക്കുറിച്ചും മറ്റ് ഗ്രഹങ്ങളിലെ ജീവന്റെ സാധ്യതകളെക്കുറിച്ചും അറിയാൻ ശാസ്ത്രജ്ഞർ നിരന്തരം ഗവേഷണം നടത്തുന്നു.</p><p>ജെയിംസ് വെബ് സ്പേസ് ടെലിസ്കോപ്പ് പോലെയുള്ള പുതിയ ഉപകരണങ്ങൾ ബഹിരാകാശ ഗവേഷണത്തിൽ വലിയ കുതിച്ചുചാട്ടമുണ്ടാക്കിയിട്ടുണ്ട്.</p>', 
        'പ്രപഞ്ചത്തിന്റെ രഹസ്യങ്ങൾ തേടിയുള്ള മനുഷ്യന്റെ യാത്രയും പുതിയ ബഹിരാകാശ കണ്ടുപിടുത്തങ്ങളും.', 
        'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800', 
        author_id_val, 
        'published', 
        false, 
        512,
        NOW() - INTERVAL '3 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 4
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'നിർമ്മിത ബുദ്ധിയുടെ ഭാവി', 
        'the-future-of-artificial-intelligence', 
        '<p>ആർട്ടിഫിഷ്യൽ ഇന്റലിജൻസ് (AI) എന്നത് യന്ത്രങ്ങൾക്ക് മനുഷ്യനെപ്പോലെ ചിന്തിക്കാനും പ്രവർത്തിക്കാനുമുള്ള കഴിവ് നൽകുന്ന സാങ്കേതികവിദ്യയാണ്.</p><p>ഭാവിയിൽ വൈദ്യശാസ്ത്രം, വിദ്യാഭ്യാസം തുടങ്ങിയ മേഖലകളിൽ AI വലിയ മാറ്റങ്ങൾ കൊണ്ടുവരും.</p>', 
        'നിർമ്മിത ബുദ്ധി എങ്ങനെയാണ് ലോകത്തെ മാറ്റിമറിക്കാൻ പോകുന്നതെന്ന് മനസ്സിലാക്കാം.', 
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', 
        author_id_val, 
        'published', 
        false, 
        189,
        NOW() - INTERVAL '4 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 5
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'കാലാവസ്ഥാ വ്യതിയാനം നേരിടാനുള്ള വഴികൾ', 
        'ways-to-tackle-climate-change', 
        '<p>ആഗോളതാപനവും കാലാവസ്ഥാ വ്യതിയാനവും ഇന്ന് ലോകം നേരിടുന്ന ഏറ്റവും വലിയ വെല്ലുവിളികളിൽ ഒന്നാണ്. കാർബൺ പുറന്തള്ളൽ കുറയ്ക്കുക എന്നതാണ് ഇതിനുള്ള പ്രധാന പരിഹാരം.</p><p>പുനരുപയോഗ ഊർജ്ജ സ്രോതസ്സുകളെ ആശ്രയിക്കുന്നത് ഒരു പരിധി വരെ ഈ പ്രശ്നം പരിഹരിക്കാൻ സഹായിക്കും.</p>', 
        'കാലാവസ്ഥാ വ്യതിയാനത്തിന്റെ ദോഷഫലങ്ങളും അവ പരിഹരിക്കാനുള്ള പ്രായോഗിക മാർഗ്ഗങ്ങളും.', 
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800', 
        author_id_val, 
        'published', 
        false, 
        234,
        NOW() - INTERVAL '5 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 6
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'സൗരോർജ്ജത്തിന്റെ അനന്ത സാധ്യതകൾ', 
        'possibilities-of-solar-energy', 
        '<p>സൂര്യനിൽ നിന്നുള്ള ഊർജ്ജം പരിസ്ഥിതി സൗഹൃദവും ഒരിക്കലും തീർന്നുപോകാത്തതുമാണ്. വീടുകളിലും വ്യവസായങ്ങളിലും സൗരോർജ്ജം ഉപയോഗിക്കുന്നത് വ്യാപകമായിക്കൊണ്ടിരിക്കുന്നു.</p>', 
        'ഭാവിയിലെ പ്രധാന ഊർജ്ജ സ്രോതസ്സായി മാറാൻ പോകുന്ന സൗരോർജ്ജത്തിന്റെ നേട്ടങ്ങൾ.', 
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800', 
        author_id_val, 
        'published', 
        false, 
        95,
        NOW() - INTERVAL '6 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 7
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'ഇന്റർനെറ്റ് ഓഫ് തിങ്സ് (IoT)', 
        'internet-of-things', 
        '<p>നമ്മുടെ ചുറ്റുമുള്ള ഉപകരണങ്ങളെ ഇന്റർനെറ്റുമായി ബന്ധിപ്പിക്കുന്ന സാങ്കേതികവിദ്യയാണ് ഇന്റർനെറ്റ് ഓഫ് തിങ്സ്. സ്മാർട്ട് ഹോമുകൾ ഇതിനൊരു മികച്ച ഉദാഹരണമാണ്.</p>', 
        'ഉപകരണങ്ങൾ തമ്മിൽ സംവദിക്കുന്ന ഐ.ഒ.ടി സാങ്കേതികവിദ്യയുടെ വികാസം.', 
        'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800', 
        author_id_val, 
        'published', 
        false, 
        412,
        NOW() - INTERVAL '7 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 8
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'വനനശീകരണവും പരിസ്ഥിതി പ്രശ്നങ്ങളും', 
        'deforestation-and-environmental-issues', 
        '<p>മരങ്ങൾ വെട്ടിനശിപ്പിക്കുന്നത് ഭൂമിയിലെ താപനില വർദ്ധിപ്പിക്കുകയും മൃഗങ്ങളുടെ ആവാസവ്യവസ്ഥ ഇല്ലാതാക്കുകയും ചെയ്യുന്നു. വനവൽക്കരണം അടിയന്തരമായി നടപ്പിലാക്കേണ്ടതുണ്ട്.</p>', 
        'വനങ്ങൾ നശിക്കുന്നതുവഴി ഉണ്ടാകുന്ന പാരിസ്ഥിതിക ആഘാതങ്ങൾ.', 
        'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800', 
        author_id_val, 
        'published', 
        false, 
        289,
        NOW() - INTERVAL '8 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 9
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'സൈബർ സുരക്ഷയുടെ പ്രാധാന്യം', 
        'importance-of-cyber-security', 
        '<p>ഡിജിറ്റൽ ലോകത്ത് നമ്മുടെ വ്യക്തിവിവരങ്ങൾ സുരക്ഷിതമായി സൂക്ഷിക്കേണ്ടത് അത്യാവശ്യമാണ്. ഹാക്കിംഗും സൈബർ തട്ടിപ്പുകളും വർദ്ധിച്ചുവരുന്ന സാഹചര്യത്തിൽ സൈബർ സുരക്ഷയ്ക്ക് വലിയ പ്രാധാന്യമുണ്ട്.</p>', 
        'ഇന്റർനെറ്റ് ഉപയോഗിക്കുമ്പോൾ ശ്രദ്ധിക്കേണ്ട സൈബർ സുരക്ഷാ മാനദണ്ഡങ്ങൾ.', 
        'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800', 
        author_id_val, 
        'published', 
        false, 
        156,
        NOW() - INTERVAL '9 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 10
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'ബ്ലോക്ക്ചെയിൻ സാങ്കേതികവിദ്യ', 
        'blockchain-technology-explained', 
        '<p>വിവരങ്ങൾ സുരക്ഷിതമായി സൂക്ഷിക്കാനും കൈമാറ്റം ചെയ്യാനും ഉപയോഗിക്കുന്ന ഒരു നൂതന സാങ്കേതികവിദ്യയാണ് ബ്ലോക്ക്ചെയിൻ. ക്രിപ്റ്റോകറൻസികൾ ഇതിന്റെ അടിസ്ഥാനത്തിലാണ് പ്രവർത്തിക്കുന്നത്.</p>', 
        'സാമ്പത്തിക ഇടപാടുകളെ മാറ്റിമറിച്ച ബ്ലോക്ക്ചെയിൻ സാങ്കേതികവിദ്യ എങ്ങനെ പ്രവർത്തിക്കുന്നു.', 
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', 
        author_id_val, 
        'published', 
        false, 
        187,
        NOW() - INTERVAL '10 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 11
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'സമുദ്ര സംരക്ഷണത്തിന്റെ ആവശ്യകത', 
        'need-for-marine-conservation', 
        '<p>കടലിലെ ജീവജാലങ്ങളെയും സമുദ്ര പരിസ്ഥിതിയെയും പ്ലാസ്റ്റിക് മാലിന്യങ്ങളിൽ നിന്നും മറ്റ് മലിനീകരണങ്ങളിൽ നിന്നും രക്ഷിക്കേണ്ടതുണ്ട്. സമുദ്രങ്ങൾ ഭൂമിയുടെ കാലാവസ്ഥ നിയന്ത്രിക്കുന്നതിൽ പ്രധാന പങ്ക് വഹിക്കുന്നു.</p>', 
        'സമുദ്ര മലിനീകരണം തടയാനും കടൽ ജീവികളെ സംരക്ഷിക്കാനുമുള്ള നടപടികൾ.', 
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 
        author_id_val, 
        'published', 
        false, 
        340,
        NOW() - INTERVAL '11 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 12
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        '5G സാങ്കേതികവിദ്യയും മാറ്റങ്ങളും', 
        '5g-technology-and-its-impact', 
        '<p>മൊബൈൽ നെറ്റ്‌വർക്കിംഗ് രംഗത്ത് വലിയൊരു വിപ്ലവമാണ് 5G. ഉയർന്ന ഇന്റർനെറ്റ് വേഗതയും കുറഞ്ഞ ലേറ്റൻസിയും ഇത് വാഗ്ദാനം ചെയ്യുന്നു.</p>', 
        '5G സാങ്കേതികവിദ്യ ആശയവിനിമയ രംഗത്ത് കൊണ്ടുവരുന്ന വലിയ മാറ്റങ്ങൾ.', 
        'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800', 
        author_id_val, 
        'published', 
        false, 
        122,
        NOW() - INTERVAL '12 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 13
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'ഹരിത ഊർജ്ജത്തിന്റെ പ്രാധാന്യം', 
        'importance-of-green-energy', 
        '<p>കാറ്റ്, ജലം, സൂര്യപ്രകാശം എന്നിവയിൽ നിന്നും ഉത്പാദിപ്പിക്കുന്ന ഊർജ്ജമാണ് ഹരിത ഊർജ്ജം. ഇത് പരിസ്ഥിതിക്ക് യാതൊരു ദോഷവും വരുത്തുന്നില്ല.</p>', 
        'ഫോസിൽ ഇന്ധനങ്ങൾക്ക് പകരമായി ഹരിത ഊർജ്ജം ഉപയോഗിക്കേണ്ടതിന്റെ ആവശ്യകത.', 
        'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?w=800', 
        author_id_val, 
        'published', 
        false, 
        299,
        NOW() - INTERVAL '13 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 14
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'ജലസംരക്ഷണം: ഇന്നത്തെ ആവശ്യം', 
        'water-conservation-need-of-the-hour', 
        '<p>ശുദ്ധജലം ഭൂമിയിൽ വളരെ കുറവാണ്. മഴവെള്ള സംഭരണത്തിലൂടെയും ജലം പാഴാക്കാതിരിക്കുന്നതിലൂടെയും നമുക്ക് ജലക്ഷാമം നേരിടാം.</p>', 
        'ഓരോ തുള്ളി ജലവും വിലപ്പെട്ടതാണ്: ജലസംരക്ഷണത്തിന്റെ പ്രാധാന്യം.', 
        'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800', 
        author_id_val, 
        'published', 
        false, 
        144,
        NOW() - INTERVAL '14 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 15
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'നാനോ ടെക്നോളജിയിലെ മുന്നേറ്റങ്ങൾ', 
        'advancements-in-nanotechnology', 
        '<p>വളരെ ചെറിയ പദാർത്ഥങ്ങളെ കൈകാര്യം ചെയ്യുന്ന ശാസ്ത്രശാഖയാണ് നാനോ ടെക്നോളജി. വൈദ്യശാസ്ത്രത്തിലും ഇലക്ട്രോണിക്സിലും ഇത് വലിയ മാറ്റങ്ങൾ കൊണ്ടുവരും.</p>', 
        'ഭാവിയിലെ സാങ്കേതികവിദ്യയായ നാനോ ടെക്നോളജിയുടെ വിസ്മയിപ്പിക്കുന്ന സാധ്യതകൾ.', 
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800', 
        author_id_val, 
        'published', 
        false, 
        530,
        NOW() - INTERVAL '15 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 16
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'ജൈവവൈവിധ്യ സംരക്ഷണം', 
        'biodiversity-conservation', 
        '<p>ഭൂമിയിലെ എല്ലാ ജീവജാലങ്ങളുടെയും വൈവിധ്യമാണ് ജൈവവൈവിധ്യം. ഒരു ആവാസവ്യവസ്ഥയുടെ സന്തുലിതാവസ്ഥ നിലനിർത്താൻ ഇത് അത്യാവശ്യമാണ്.</p>', 
        'ഭൂമിയിലെ ജീവജാലങ്ങളെയും അവയുടെ ആവാസവ്യവസ്ഥയെയും സംരക്ഷിക്കേണ്ടതിന്റെ പ്രാധാന്യം.', 
        'https://images.unsplash.com/photo-1511497584788-876760111969?w=800', 
        author_id_val, 
        'published', 
        false, 
        312,
        NOW() - INTERVAL '16 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 17
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'മെഷീൻ ലേണിംഗ് ലളിതമായി', 
        'machine-learning-simply-explained', 
        '<p>കമ്പ്യൂട്ടറുകൾക്ക് മനുഷ്യന്റെ സഹായമില്ലാതെ തന്നെ സ്വന്തമായി പഠിക്കാനും പ്രവർത്തിക്കാനും കഴിവ് നൽകുന്ന സാങ്കേതികവിദ്യയാണ് മെഷീൻ ലേണിംഗ്.</p>', 
        'ആർട്ടിഫിഷ്യൽ ഇന്റലിജൻസിന്റെ പ്രധാന ഭാഗമായ മെഷീൻ ലേണിംഗ് എങ്ങനെ പ്രവർത്തിക്കുന്നു.', 
        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800', 
        author_id_val, 
        'published', 
        false, 
        221,
        NOW() - INTERVAL '17 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 18
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'പ്ലാസ്റ്റിക് മലിനീകരണം തടയാം', 
        'preventing-plastic-pollution', 
        '<p>ഒറ്റത്തവണ ഉപയോഗിക്കുന്ന പ്ലാസ്റ്റിക് ഉൽപ്പന്നങ്ങൾ പരിസ്ഥിതിക്ക് വലിയ ഭീഷണിയാണ്. പ്ലാസ്റ്റിക് ഉപയോഗം കുറയ്ക്കുകയും പുനരുപയോഗം പ്രോത്സാഹിപ്പിക്കുകയും ചെയ്യുക.</p>', 
        'പരിസ്ഥിതിയെ നശിപ്പിക്കുന്ന പ്ലാസ്റ്റിക് മാലിന്യങ്ങൾക്കെതിരെയുള്ള പോരാട്ടം.', 
        'https://images.unsplash.com/photo-1501862700950-18382cd41497?w=800', 
        author_id_val, 
        'published', 
        false, 
        188,
        NOW() - INTERVAL '18 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 19
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'റോബോട്ടിക്സ്: ഭാവിയിലെ യന്ത്രമനുഷ്യർ', 
        'robotics-machines-of-the-future', 
        '<p>വ്യവസായ ശാലകൾ മുതൽ വീടുകൾ വരെ ഇന്ന് റോബോട്ടുകളുടെ സാന്നിധ്യമുണ്ട്. മനുഷ്യന് ചെയ്യാൻ ബുദ്ധിമുട്ടുള്ള കാര്യങ്ങൾ എളുപ്പത്തിൽ ചെയ്യാൻ ഇവ സഹായിക്കുന്നു.</p>', 
        'മനുഷ്യന്റെ ദൈനംദിന ജീവിതത്തിൽ റോബോട്ടുകൾ ചെലുത്തുന്ന സ്വാധീനം.', 
        'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800', 
        author_id_val, 
        'published', 
        false, 
        105,
        NOW() - INTERVAL '19 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Post 20
    INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, is_featured, views, created_at)
    VALUES (
        'ഡിജിറ്റൽ കറൻസികളുടെ വളർച്ച', 
        'growth-of-digital-currencies', 
        '<p>സാമ്പത്തിക ഇടപാടുകൾക്കായി ഇന്റർനെറ്റ് വഴി ഉപയോഗിക്കുന്ന വെർച്വൽ പണമാണ് ഡിജിറ്റൽ കറൻസി. ബിറ്റ്കോയിൻ ഇതിനൊരു പ്രധാന ഉദാഹരണമാണ്.</p>', 
        'സാമ്പത്തിക ലോകത്ത് മാറ്റങ്ങൾ കൊണ്ടുവരുന്ന ക്രിപ്റ്റോകറൻസികളെക്കുറിച്ചുള്ള വിവരങ്ങൾ.', 
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', 
        author_id_val, 
        'published', 
        false, 
        642,
        NOW() - INTERVAL '20 days'
    ) RETURNING id INTO post_id_val;
    INSERT INTO post_categories (post_id, category_id) VALUES (post_id_val, cat_id) ON CONFLICT DO NOTHING;

    -- Update category counter
    UPDATE categories SET post_count = (SELECT COUNT(*) FROM post_categories WHERE category_id = cat_id) WHERE id = cat_id;

END $$;
