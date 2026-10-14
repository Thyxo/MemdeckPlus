/** Indstillinger: sprog, tema, haptik, lyd, retning, mål, påmindelser, backup og nulstilling. */
import { Icon } from '../../components/Icon';
import { Page, Segmented, Stepper, Toggle, TopBar, confirmDialog } from '../../components/ui';
import { useT } from '../../i18n';
import { exportBackup, importBackup } from '../../lib/backup';
import { pickFile } from '../../lib/files';
import { clearPhotos } from '../../lib/idb';
import { notificationsSupported, requestNotificationPermission, showNotification } from '../../lib/reminders';
import { actions, defaultState, emit, replaceState, useApp } from '../../store/store';

export function SettingsScreen() {
  const t = useT();
  const state = useApp();
  const s = state.settings;
  const set = actions.setSettings;

  const toggleReminders = async (on: boolean) => {
    if (on) {
      const ok = await requestNotificationPermission();
      if (!ok) { emit('toast', 'notifDenied'); return; }
      showNotification('StackMaster', t('remindersOnTest'));
    }
    set({ reminders: { ...s.reminders, enabled: on } });
  };

  return (
    <>
      <TopBar title={t('settings')} backTo="/" />
      <Page>
        <div className="section-title">{t('general')}</div>
        <div className="card flat stack-v">
          <div className="field">{t('language')}
            <Segmented value={s.lang} onChange={(v) => set({ lang: v })} options={[{ value: 'da', label: '🇩🇰 Dansk' }, { value: 'en', label: '🇬🇧 English' }]} />
          </div>
          <div className="field">{t('theme')}
            <Segmented value={s.theme} onChange={(v) => set({ theme: v })} options={[{ value: 'dark', label: t('themeDark') }, { value: 'light', label: t('themeLight') }, { value: 'system', label: t('themeSystem') }]} />
          </div>
          <Toggle checked={s.haptics} onChange={(v) => set({ haptics: v })} label={t('haptics')} desc={'vibrate' in navigator ? t('hapticsDesc') : t('hapticsUnsupported')} />
          <Toggle checked={s.sound} onChange={(v) => set({ sound: v })} label={t('sound')} desc={t('soundDesc')} />
          <Toggle checked={s.danishRanks} onChange={(v) => set({ danishRanks: v })} label={t('danishRanks')} desc={t('danishRanksDesc')} />
        </div>

        <div className="section-title">{t('training')}</div>
        <div className="card flat stack-v">
          <div className="field">{t('defaultDirection')}
            <Segmented value={s.direction} onChange={(v) => set({ direction: v })} options={[{ value: 'c2p', label: t('dirC2PShort') }, { value: 'p2c', label: t('dirP2CShort') }, { value: 'both', label: t('dirBothShort') }]} />
          </div>
          <div className="row"><span className="row-text"><span>{t('dailyGoal')}</span><small>{t('dailyGoalDesc')}</small></span><Stepper value={s.dailyGoal} min={10} max={300} step={10} onChange={(v) => set({ dailyGoal: v })} /></div>
          <div className="row"><span>{t('sessionSize')}</span><Stepper value={s.sessionSize} min={5} max={104} step={5} onChange={(v) => set({ sessionSize: v })} /></div>
          <div className="row"><span className="row-text"><span>{t('newPerDay')}</span><small>{t('newPerDayDesc')}</small></span><Stepper value={s.newPerDay} min={0} max={52} onChange={(v) => set({ newPerDay: v })} /></div>
          <div className="field">{t('perQuestion')}
            <Segmented value={s.timePerQuestion} onChange={(v) => set({ timePerQuestion: v })} options={[{ value: 0, label: t('off') }, { value: 5, label: '5 s' }, { value: 10, label: '10 s' }, { value: 20, label: '20 s' }]} />
          </div>
          <div className="field">{t('method')}
            <Segmented value={s.method} onChange={(v) => set({ method: v })} options={[{ value: 'images', label: t('methodImages') }, { value: 'palace', label: t('methodPalace') }, { value: 'rote', label: t('methodRote') }]} />
          </div>
        </div>

        <div className="section-title">{t('reminders')}</div>
        <div className="card flat stack-v">
          {notificationsSupported ? (
            <>
              <Toggle checked={s.reminders.enabled} onChange={toggleReminders} label={t('dailyReminder')} desc={t('reminderDesc')} />
              {s.reminders.enabled && (
                <label className="row"><span>{t('reminderTime')}</span>
                  <input type="time" className="input" style={{ width: 130 }} value={s.reminders.time} onChange={(e) => set({ reminders: { ...s.reminders, time: e.target.value || '19:00' } })} />
                </label>
              )}
            </>
          ) : <small className="muted">{t('notifUnsupported')}</small>}
        </div>

        <div className="section-title">{t('data')}</div>
        <div className="card flat stack-v">
          <small className="muted">{t('dataDesc')}</small>
          <button className="btn" onClick={() => exportBackup().then(() => emit('toast', 'backupSaved'))}><Icon name="download" size={18} /> {t('exportData')}</button>
          <button className="btn" onClick={async () => {
            const f = await pickFile('.json,application/json');
            if (!f) return;
            if (!(await confirmDialog({ title: t('importDataQ'), body: t('importDataBody'), ok: t('import') }))) return;
            try { await importBackup(await f.text()); emit('toast', 'backupRestored'); } catch { emit('toast', 'importFailed'); }
          }}><Icon name="upload" size={18} /> {t('importData')}</button>
          <button className="btn ghost" onClick={async () => {
            if (await confirmDialog({ title: t('resetProgressQ'), body: t('resetProgressBody'), danger: true, ok: t('reset') })) { actions.resetProgress(); emit('toast', 'progressReset'); }
          }}>{t('resetProgress')}</button>
          <button className="btn danger" onClick={async () => {
            if (await confirmDialog({ title: t('resetAllQ'), body: t('resetAllBody'), danger: true, ok: t('resetAll') })) {
              await clearPhotos().catch(() => undefined);
              replaceState(defaultState());
            }
          }}><Icon name="trash" size={18} /> {t('resetAll')}</button>
        </div>

        <div className="section-title">{t('about')}</div>
        <div className="card flat stack-v">
          <small className="muted">{t('aboutText')}</small>
          <button className="btn ghost" onClick={() => set({ onboarded: false })}>{t('showOnboarding')}</button>
          <small className="muted center">StackMaster v1.0 · {t('offlineReadyShort')}</small>
        </div>
      </Page>
    </>
  );
}
