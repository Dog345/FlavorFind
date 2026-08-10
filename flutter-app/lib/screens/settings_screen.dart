import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/theme.dart';
import '../services/api_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  // ── State ────────────────────────────────────────────────────────────────
  bool _notifications = true;
  bool _autoSave = true;
  bool _showNutrition = true;
  bool _vegetarian = false;
  bool _vegan = false;
  bool _glutenFree = false;
  bool _dairyFree = false;
  int _defaultServings = 2;
  String _apiUrl = kApiBase;
  final _apiUrlCtrl = TextEditingController();

  int _recipesViewed = 0;
  int _savedCount = 0;
  int _searchesDone = 0;

  Map<String, dynamic>? _healthData;
  bool _healthLoading = false;
  bool _comingSoonVisible = false;
  String _comingSoonFeature = '';

  // ── Lifecycle ────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _loadSettings();
    _loadStats();
    _fetchHealth();
  }

  @override
  void dispose() {
    _apiUrlCtrl.dispose();
    super.dispose();
  }

  // ── Persistence ───────────────────────────────────────────────────────────
  Future<void> _loadSettings() async {
    final p = await SharedPreferences.getInstance();
    setState(() {
      _notifications   = p.getBool('s_notifications')  ?? true;
      _autoSave        = p.getBool('s_autoSave')        ?? true;
      _showNutrition   = p.getBool('s_showNutrition')   ?? true;
      _vegetarian      = p.getBool('s_vegetarian')      ?? false;
      _vegan           = p.getBool('s_vegan')           ?? false;
      _glutenFree      = p.getBool('s_glutenFree')      ?? false;
      _dairyFree       = p.getBool('s_dairyFree')       ?? false;
      _defaultServings = p.getInt('s_defaultServings')  ?? 2;
      _apiUrl          = p.getString('s_apiUrl')        ?? kApiBase;
      _apiUrlCtrl.text = _apiUrl;
    });
  }

  Future<void> _loadStats() async {
    final p = await SharedPreferences.getInstance();
    final saved = p.getStringList('saved_recipe_ids') ?? [];
    setState(() {
      _recipesViewed = p.getInt('stat_recipesViewed') ?? 0;
      _savedCount    = saved.length;
      _searchesDone  = p.getInt('stat_searchesDone')  ?? 0;
    });
  }

  Future<void> _saveSettings() async {
    final p = await SharedPreferences.getInstance();
    await p.setBool('s_notifications',  _notifications);
    await p.setBool('s_autoSave',       _autoSave);
    await p.setBool('s_showNutrition',  _showNutrition);
    await p.setBool('s_vegetarian',     _vegetarian);
    await p.setBool('s_vegan',          _vegan);
    await p.setBool('s_glutenFree',     _glutenFree);
    await p.setBool('s_dairyFree',      _dairyFree);
    await p.setInt('s_defaultServings', _defaultServings);
    final url = _apiUrlCtrl.text.trim();
    if (url.isNotEmpty) {
      await p.setString('s_apiUrl', url);
      setState(() => _apiUrl = url);
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('✅ Settings saved!'),
        backgroundColor: Color(0xFF1a4731),
        duration: Duration(seconds: 2),
      ));
    }
  }

  Future<void> _fetchHealth() async {
    setState(() => _healthLoading = true);
    try {
      final r = await ApiService.health();
      if (mounted) setState(() => _healthData = r);
    } catch (_) {
      if (mounted) setState(() => _healthData = null);
    } finally {
      if (mounted) setState(() => _healthLoading = false);
    }
  }

  Future<void> _clearCache() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: kCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Clear Cache',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text('Removes saved recipes and stats.',
            style: TextStyle(color: kTextSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel', style: TextStyle(color: kTextSecondary))),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Clear', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (ok == true) {
      final p = await SharedPreferences.getInstance();
      await p.remove('saved_recipe_ids');
      await p.remove('stat_recipesViewed');
      await p.remove('stat_searchesDone');
      await _loadStats();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('🗑️ Cache cleared'), backgroundColor: kCard));
      }
    }
  }

  void _showComingSoon(String feature) =>
      setState(() { _comingSoonFeature = feature; _comingSoonVisible = true; });

  // ── Coming Soon Modal ─────────────────────────────────────────────────────
  Widget _comingSoonModal() {
    return GestureDetector(
      onTap: () => setState(() => _comingSoonVisible = false),
      child: Container(
        color: Colors.black.withValues(alpha: 0.75),
        child: Center(
          child: GestureDetector(
            onTap: () {},
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 32),
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [kPrimary, Color(0xFFb55d2f)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(28),
              ),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Text('👨‍🍳', style: TextStyle(fontSize: 56)),
                const SizedBox(height: 12),
                const Text('Coming Soon!',
                    style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(_comingSoonFeature,
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                    textAlign: TextAlign.center),
                const SizedBox(height: 16),
                const Text("We're working hard to bring you this feature. Stay tuned!",
                    style: TextStyle(color: Colors.white60, fontSize: 13),
                    textAlign: TextAlign.center),
                const SizedBox(height: 20),
                GestureDetector(
                  onTap: () => setState(() => _comingSoonVisible = false),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                    decoration: BoxDecoration(
                        color: Colors.white, borderRadius: BorderRadius.circular(30)),
                    child: const Text('Got it!',
                        style: TextStyle(color: kPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  // ── Reusable section wrapper ───────────────────────────────────────────────
  Widget _section(String title, List<Widget> children) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
        child: Text(title.toUpperCase(),
            style: const TextStyle(
                color: kTextSecondary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2)),
      ),
      Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(16)),
        child: Column(children: children),
      ),
    ]);
  }

  // ── Single row item ────────────────────────────────────────────────────────
  Widget _item({
    required String icon,
    required String label,
    String? subtitle,
    Widget? trailing,
    VoidCallback? onTap,
    bool isLast = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: isLast
              ? null
              : const Border(bottom: BorderSide(color: kBorder, width: 0.5)),
        ),
        child: Row(children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label,
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
              if (subtitle != null)
                Text(subtitle, style: const TextStyle(color: kTextSecondary, fontSize: 11)),
            ]),
          ),
          if (trailing != null) trailing,
        ]),
      ),
    );
  }

  // ── Toggle item shortcut ──────────────────────────────────────────────────
  Widget _toggle({
    required String icon,
    required String label,
    String? subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    bool isLast = false,
  }) {
    return _item(
      icon: icon,
      label: label,
      subtitle: subtitle,
      isLast: isLast,
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: kPrimary,
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }

  // ── Stat card ─────────────────────────────────────────────────────────────
  Widget _statCard(String icon, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(14)),
        child: Column(children: [
          Text(icon, style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 6),
          Text(value,
              style: const TextStyle(
                  color: kPrimary, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(color: kTextSecondary, fontSize: 11),
              textAlign: TextAlign.center),
        ]),
      ),
    );
  }

  // ── API URL section ───────────────────────────────────────────────────────
  Widget _apiSection() {
    return _section('API Server', [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Server URL',
              style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(12)),
            child: TextField(
              controller: _apiUrlCtrl,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: const InputDecoration(
                hintText: 'https://api.example.com',
                hintStyle: TextStyle(color: kTextSecondary),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(
              child: GestureDetector(
                onTap: () { _apiUrlCtrl.text = 'http://localhost:8000'; },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(10)),
                  child: const Center(
                    child: Text('Local', style: TextStyle(color: kTextSecondary, fontSize: 12)),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: GestureDetector(
                onTap: () { _apiUrlCtrl.text = kApiBase; },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(10)),
                  child: const Center(
                    child: Text('Production', style: TextStyle(color: kTextSecondary, fontSize: 12)),
                  ),
                ),
              ),
            ),
          ]),
          const SizedBox(height: 12),
        ]),
      ),
    ]);
  }

  // ── Health status card ────────────────────────────────────────────────────
  Widget _healthSection() {
    return _section('API Status', [
      Padding(
        padding: const EdgeInsets.all(16),
        child: _healthLoading
            ? const Center(child: CircularProgressIndicator(color: kPrimary))
            : _healthData == null
                ? Row(children: [
                    const Icon(Icons.wifi_off, color: Colors.red, size: 18),
                    const SizedBox(width: 8),
                    const Text('Unable to reach server',
                        style: TextStyle(color: kTextSecondary, fontSize: 13)),
                    const Spacer(),
                    GestureDetector(
                      onTap: _fetchHealth,
                      child: const Text('Retry',
                          style: TextStyle(color: kPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                    ),
                  ])
                : Row(children: [
                    Container(
                      width: 10, height: 10,
                      decoration: const BoxDecoration(
                          color: Color(0xFF4ade80), shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 8),
                    const Text('Server online',
                        style: TextStyle(color: Color(0xFF4ade80), fontSize: 13, fontWeight: FontWeight.w500)),
                    const Spacer(),
                    if (_healthData!['remaining'] != null)
                      Text('${_healthData!['remaining']} requests left',
                          style: const TextStyle(color: kTextSecondary, fontSize: 11)),
                  ]),
      ),
    ]);
  }

  // ── Preferences section ───────────────────────────────────────────────────
  Widget _prefsSection() {
    return _section('Preferences', [
      _toggle(
        icon: '🔔', label: 'Notifications',
        subtitle: 'Recipe tips and updates',
        value: _notifications,
        onChanged: (v) => setState(() => _notifications = v),
      ),
      _toggle(
        icon: '💾', label: 'Auto-save viewed recipes',
        value: _autoSave,
        onChanged: (v) => setState(() => _autoSave = v),
      ),
      _toggle(
        icon: '🥗', label: 'Show nutrition info',
        value: _showNutrition,
        onChanged: (v) => setState(() => _showNutrition = v),
        isLast: true,
      ),
    ]);
  }

  // ── Default servings section ───────────────────────────────────────────────
  Widget _servingsSection() {
    return _section('Default Servings', [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(children: [
          const Text('👥', style: TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          const Expanded(
            child: Text('Servings per recipe',
                style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
          ),
          GestureDetector(
            onTap: () { if (_defaultServings > 1) setState(() => _defaultServings--); },
            child: Container(
              width: 32, height: 32,
              decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.remove, color: Colors.white, size: 16),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text('$_defaultServings',
                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          GestureDetector(
            onTap: () { if (_defaultServings < 12) setState(() => _defaultServings++); },
            child: Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [kPrimary, Color(0xFFc45e1e)]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 16),
            ),
          ),
        ]),
      ),
    ]);
  }

  // ── Dietary prefs section ──────────────────────────────────────────────────
  Widget _dietSection() {
    return _section('Dietary Preferences', [
      _toggle(icon: '🥗', label: 'Vegetarian',
          value: _vegetarian, onChanged: (v) => setState(() => _vegetarian = v)),
      _toggle(icon: '🌱', label: 'Vegan',
          value: _vegan, onChanged: (v) => setState(() => _vegan = v)),
      _toggle(icon: '🌾', label: 'Gluten Free',
          value: _glutenFree, onChanged: (v) => setState(() => _glutenFree = v)),
      _toggle(icon: '🥛', label: 'Dairy Free',
          value: _dairyFree, onChanged: (v) => setState(() => _dairyFree = v), isLast: true),
    ]);
  }

  // ── Stats section ──────────────────────────────────────────────────────────
  Widget _statsSection() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Padding(
        padding: EdgeInsets.fromLTRB(16, 20, 16, 8),
        child: Text('YOUR STATS',
            style: TextStyle(color: kTextSecondary, fontSize: 11,
                fontWeight: FontWeight.w700, letterSpacing: 1.2)),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(children: [
          _statCard('👁️', 'Viewed', '$_recipesViewed'),
          const SizedBox(width: 10),
          _statCard('❤️', 'Saved', '$_savedCount'),
          const SizedBox(width: 10),
          _statCard('🔍', 'Searches', '$_searchesDone'),
        ]),
      ),
    ]);
  }

  // ── Data section ──────────────────────────────────────────────────────────
  Widget _dataSection() {
    return _section('Data', [
      _item(
        icon: '🗑️', label: 'Clear cache',
        subtitle: 'Remove saved recipes and stats',
        trailing: const Icon(Icons.chevron_right, color: kTextSecondary, size: 18),
        onTap: _clearCache,
      ),
      _item(
        icon: '📤', label: 'Export saved recipes',
        subtitle: 'Coming soon',
        trailing: const Icon(Icons.chevron_right, color: kTextSecondary, size: 18),
        onTap: () => _showComingSoon('Export Saved Recipes'),
        isLast: true,
      ),
    ]);
  }

  // ── Contact section ───────────────────────────────────────────────────────
  Widget _contactSection() {
    return _section('Contact & Support', [
      _item(
        icon: '✉️', label: 'Email us',
        subtitle: 'dallaherick0@gmail.com',
        trailing: const Icon(Icons.chevron_right, color: kTextSecondary, size: 18),
        onTap: () => _showComingSoon('Email Support'),
      ),
      _item(
        icon: '💬', label: 'WhatsApp',
        subtitle: 'Chat with us',
        trailing: const Icon(Icons.chevron_right, color: kTextSecondary, size: 18),
        onTap: () => _showComingSoon('WhatsApp Support'),
      ),
      _item(
        icon: '🐦', label: 'Twitter / X',
        subtitle: '@flavorfind',
        trailing: const Icon(Icons.chevron_right, color: kTextSecondary, size: 18),
        onTap: () => _showComingSoon('Twitter'),
        isLast: true,
      ),
    ]);
  }

  // ── About section ─────────────────────────────────────────────────────────
  Widget _aboutSection() {
    return _section('About', [
      _item(
        icon: '📱', label: 'Version',
        trailing: const Text('1.0.0', style: TextStyle(color: kTextSecondary, fontSize: 13)),
      ),
      _item(
        icon: '📄', label: 'Privacy Policy',
        trailing: const Icon(Icons.chevron_right, color: kTextSecondary, size: 18),
        onTap: () => _showComingSoon('Privacy Policy'),
      ),
      _item(
        icon: '📋', label: 'Terms of Service',
        trailing: const Icon(Icons.chevron_right, color: kTextSecondary, size: 18),
        onTap: () => _showComingSoon('Terms of Service'),
        isLast: true,
      ),
    ]);
  }

  // ── Save button ───────────────────────────────────────────────────────────
  Widget _saveButton() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: GestureDetector(
        onTap: _saveSettings,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [kPrimary, Color(0xFFc45e1e)]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Center(
            child: Text('Save Settings',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
    );
  }

  // ── build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackground,
      body: SafeArea(
        child: Stack(children: [
          CustomScrollView(slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('⚙️ Settings',
                      style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Customize your FlavorFind experience',
                      style: TextStyle(color: kTextSecondary, fontSize: 13)),
                ]),
              ),
            ),
            SliverToBoxAdapter(child: _apiSection()),
            SliverToBoxAdapter(child: _healthSection()),
            SliverToBoxAdapter(child: _prefsSection()),
            SliverToBoxAdapter(child: _servingsSection()),
            SliverToBoxAdapter(child: _dietSection()),
            SliverToBoxAdapter(child: _statsSection()),
            SliverToBoxAdapter(child: _dataSection()),
            SliverToBoxAdapter(child: _contactSection()),
            SliverToBoxAdapter(child: _aboutSection()),
            SliverToBoxAdapter(child: _saveButton()),
            const SliverToBoxAdapter(child: SizedBox(height: 32)),
          ]),
          if (_comingSoonVisible) _comingSoonModal(),
        ]),
      ),
    );
  }
}
