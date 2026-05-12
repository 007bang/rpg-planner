import { useState } from 'react';
import { db } from '../db/db';
import { useCharacter, useCoin } from '../hooks/useStudies';
import { useToast } from '../hooks/useToast';
import { FREE_AVATARS, SHOP_CATEGORIES, AVATAR_PRICE } from '../constants/avatars';
import { BG_THEMES, ACCENT_THEMES, THEME_PRICE } from '../constants/themes';

const TABS = [
  { id: 'avatar', label: '아바타' },
  { id: 'theme',  label: '테마'   },
  { id: 'board',  label: '칠판'   },
];

const BOARD_PRICE = 25;

export default function ShopPanel() {
  const characters = useCharacter();
  const earnedCoin = useCoin() ?? 0;
  const character  = characters?.[0] ?? null;
  const spentCoins = character?.spentCoins ?? 0;
  const availableCoins = earnedCoin - spentCoins;

  const { msg: toastMsg, show: showToast } = useToast();

  const [activeTab, setActiveTab]         = useState('avatar');
  const [pendingUnlock, setPendingUnlock] = useState(null);
  const [pendingTheme, setPendingTheme]   = useState(null);
  const [boardInput, setBoardInput]       = useState('');
  const [editBoard, setEditBoard]         = useState(false);

  if (!character) return null;

  const unlockedAvatarSet = new Set(JSON.parse(character.unlockedAvatars ?? '[]'));
  const unlockedThemesSet = new Set([
    ...BG_THEMES.filter(t => t.free).map(t => t.id),
    ...ACCENT_THEMES.filter(t => t.free).map(t => t.id),
    ...JSON.parse(character.unlockedThemes ?? '[]'),
  ]);

  function isAvatarUnlocked(em) {
    return FREE_AVATARS.includes(em) || unlockedAvatarSet.has(em);
  }
  function isThemeUnlocked(id) { return unlockedThemesSet.has(id); }

  /* ── 아바타 ── */
  async function handleAvatarClick(em) {
    if (isAvatarUnlocked(em)) {
      await db.characters.update(character.id, { avatar: em });
      showToast(`${em} 아바타로 변경했습니다!`);
    } else {
      setPendingUnlock(em);
    }
  }

  async function handleAvatarUnlockConfirm() {
    if (!pendingUnlock) return;
    if (availableCoins < AVATAR_PRICE) { showToast('코인이 부족해요'); setPendingUnlock(null); return; }
    const next = new Set(unlockedAvatarSet);
    next.add(pendingUnlock);
    await db.characters.update(character.id, {
      unlockedAvatars: JSON.stringify([...next]),
      spentCoins: spentCoins + AVATAR_PRICE,
      avatar: pendingUnlock,
    });
    showToast(`${pendingUnlock} 아바타를 해금했습니다!`);
    setPendingUnlock(null);
  }

  /* ── 테마 ── */
  async function handleThemeClick(type, theme) {
    if (isThemeUnlocked(theme.id)) {
      await db.characters.update(character.id, {
        [type === 'bg' ? 'themeBg' : 'themeAccent']: theme.id,
      });
    } else {
      setPendingTheme({ type, ...theme });
    }
  }

  async function handleThemeUnlockConfirm() {
    if (!pendingTheme) return;
    if (availableCoins < THEME_PRICE) { showToast('코인이 부족해요'); setPendingTheme(null); return; }
    const next = new Set(JSON.parse(character.unlockedThemes ?? '[]'));
    next.add(pendingTheme.id);
    await db.characters.update(character.id, {
      unlockedThemes: JSON.stringify([...next]),
      spentCoins: spentCoins + THEME_PRICE,
      [pendingTheme.type === 'bg' ? 'themeBg' : 'themeAccent']: pendingTheme.id,
    });
    showToast(`${pendingTheme.label} 테마를 해금했습니다!`);
    setPendingTheme(null);
  }

  /* ── 칠판 ── */
  function startEditBoard() {
    setBoardInput(character.boardMessage ?? '📚 열공 중!');
    setEditBoard(true);
  }

  async function saveBoard() {
    if (!boardInput.trim()) return;
    if (availableCoins < BOARD_PRICE) { showToast('코인이 부족해요'); return; }
    await db.characters.update(character.id, {
      boardMessage: boardInput.trim(),
      spentCoins: spentCoins + BOARD_PRICE,
    });
    setEditBoard(false);
    showToast('칠판 문구를 변경했습니다!');
  }

  return (
    <div className="mx-4 mb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-1 mb-3">
        <h2 className="text-lg font-bold text-rpg-text">🏪 상점</h2>
        <span className="text-sm font-bold text-rpg-gold">🪙 {availableCoins}</span>
      </div>

      {/* 탭 */}
      <div className="flex bg-rpg-border rounded-xl p-1 mb-4 gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-rpg-card text-rpg-text shadow-sm'
                : 'text-rpg-muted hover:text-rpg-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 아바타 탭 */}
      {activeTab === 'avatar' && (
        <div className="bg-rpg-card rounded-2xl border border-rpg-border shadow-lg p-4 space-y-4">
          <div>
            <p className="text-xs text-rpg-muted mb-2">무료</p>
            <div className="grid grid-cols-6 gap-1.5">
              {FREE_AVATARS.map(em => (
                <button
                  key={em}
                  onClick={() => handleAvatarClick(em)}
                  className={`rounded-xl py-1.5 text-xl transition-all border-2 ${
                    character.avatar === em
                      ? 'bg-rpg-border border-rpg-purple'
                      : 'border-transparent hover:bg-rpg-border/50'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
            {SHOP_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <p className="text-xs text-rpg-muted mb-1">{cat.label} · 각 {AVATAR_PRICE}🪙</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {cat.avatars.map(em => {
                    const unlocked = isAvatarUnlocked(em);
                    const selected = character.avatar === em;
                    return (
                      <button
                        key={em}
                        onClick={() => handleAvatarClick(em)}
                        className={`relative rounded-xl py-1.5 text-xl transition-all border-2 ${
                          selected
                            ? 'bg-rpg-border border-rpg-purple'
                            : unlocked
                              ? 'border-transparent hover:bg-rpg-border/50'
                              : 'border-transparent opacity-60 hover:opacity-80'
                        }`}
                      >
                        {em}
                        {!unlocked && (
                          <span className="absolute -top-1 -right-1 text-[9px] leading-none bg-rpg-gold text-gray-900 font-bold rounded-full px-1 py-0.5">
                            🔒
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 테마 탭 */}
      {activeTab === 'theme' && (
        <div className="bg-rpg-card rounded-2xl border border-rpg-border shadow-lg p-4 space-y-5">
          <div>
            <p className="text-xs font-medium text-rpg-muted mb-2">배경색 · 유료 {THEME_PRICE}🪙</p>
            <div className="grid grid-cols-5 gap-3">
              {BG_THEMES.map(t => {
                const unlocked = isThemeUnlocked(t.id);
                const selected = (character.themeBg ?? BG_THEMES[0].id) === t.id;
                return (
                  <button
                    key={t.id}
                    title={t.label}
                    onClick={() => handleThemeClick('bg', t)}
                    className="relative flex flex-col items-center gap-1"
                  >
                    <span
                      className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
                        selected ? 'ring-2 ring-offset-2 ring-rpg-purple border-white scale-110' : 'border-rpg-border hover:scale-105'
                      }`}
                      style={{ backgroundColor: t.id }}
                    >
                      {!unlocked && <span className="text-[11px]">🔒</span>}
                    </span>
                    <span className="text-[10px] text-rpg-muted">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-rpg-muted mb-2">포인트색 · 유료 {THEME_PRICE}🪙</p>
            <div className="grid grid-cols-5 gap-3">
              {ACCENT_THEMES.map(t => {
                const unlocked = isThemeUnlocked(t.id);
                const selected = (character.themeAccent ?? ACCENT_THEMES[0].id) === t.id;
                return (
                  <button
                    key={t.id}
                    title={t.label}
                    onClick={() => handleThemeClick('accent', t)}
                    className="relative flex flex-col items-center gap-1"
                  >
                    <span
                      className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
                        selected ? 'ring-2 ring-offset-2 ring-rpg-purple border-white scale-110' : 'border-rpg-border hover:scale-105'
                      }`}
                      style={{ backgroundColor: t.id }}
                    >
                      {!unlocked && <span className="text-[11px]">🔒</span>}
                    </span>
                    <span className="text-[10px] text-rpg-muted">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 칠판 탭 */}
      {activeTab === 'board' && (
        <div className="bg-rpg-card rounded-2xl border border-rpg-border shadow-lg p-4">
          {editBoard ? (
            <div className="space-y-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-rpg-muted">
                문구 (최대 10글자)
                <input
                  type="text"
                  value={boardInput}
                  onChange={e => setBoardInput(e.target.value.slice(0, 10))}
                  maxLength={10}
                  className="border border-rpg-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rpg-purple"
                />
                <span className="text-xs text-rpg-muted text-right">{boardInput.length}/10</span>
              </label>
              <div className="flex items-center gap-2 bg-rpg-border/50 border border-rpg-border rounded-lg px-3 py-2">
                <span className="text-sm text-rpg-muted">변경 비용</span>
                <span className="font-bold text-rpg-gold ml-auto">🪙 {BOARD_PRICE}</span>
                <span className="text-xs text-rpg-muted">(보유 {availableCoins})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditBoard(false)}
                  className="flex-1 min-h-[40px] rounded-xl border border-rpg-border text-rpg-text text-sm font-medium hover:bg-rpg-border transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={saveBoard}
                  disabled={!boardInput.trim() || availableCoins < BOARD_PRICE}
                  className="flex-1 min-h-[40px] rounded-xl bg-rpg-gold text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {availableCoins < BOARD_PRICE ? '코인 부족' : `저장 (-${BOARD_PRICE}🪙)`}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-rpg-muted mb-1">현재 문구</p>
                <p className="font-medium text-rpg-text text-lg">{character.boardMessage ?? '📚 열공 중!'}</p>
              </div>
              <button
                onClick={startEditBoard}
                className="min-h-[36px] px-4 rounded-xl bg-rpg-border text-rpg-text text-sm font-medium hover:bg-rpg-border/70 transition-colors"
              >
                수정 ({BOARD_PRICE}🪙)
              </button>
            </div>
          )}
        </div>
      )}

      {/* 아바타 해금 모달 */}
      {pendingUnlock && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setPendingUnlock(null)}>
          <div className="bg-rpg-card rounded-2xl p-6 w-full max-w-xs mx-4 shadow-2xl border border-rpg-border text-center" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">{pendingUnlock}</div>
            <p className="font-bold text-rpg-text mb-1">아바타 해금</p>
            <p className="text-sm text-rpg-muted mb-1">{AVATAR_PRICE}코인으로 해금할까요?</p>
            <p className="text-xs text-rpg-muted mb-5">보유 코인: <span className="font-bold text-rpg-gold">🪙 {availableCoins}</span></p>
            <div className="flex gap-2">
              <button onClick={() => setPendingUnlock(null)} className="flex-1 min-h-[44px] rounded-xl border border-rpg-border text-rpg-text font-medium hover:bg-rpg-border transition-colors">취소</button>
              <button onClick={handleAvatarUnlockConfirm} disabled={availableCoins < AVATAR_PRICE} className="flex-1 min-h-[44px] rounded-xl bg-rpg-gold text-gray-900 font-bold hover:opacity-90 transition-opacity disabled:opacity-40">
                {availableCoins < AVATAR_PRICE ? '코인 부족' : '해금!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 테마 해금 모달 */}
      {pendingTheme && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setPendingTheme(null)}>
          <div className="bg-rpg-card rounded-2xl p-6 w-full max-w-xs mx-4 shadow-2xl border border-rpg-border text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full mx-auto mb-3 border-2 border-rpg-border" style={{ backgroundColor: pendingTheme.id }} />
            <p className="font-bold text-rpg-text mb-1">{pendingTheme.label} 해금</p>
            <p className="text-sm text-rpg-muted mb-1">{THEME_PRICE}코인으로 해금할까요?</p>
            <p className="text-xs text-rpg-muted mb-5">보유 코인: <span className="font-bold text-rpg-gold">🪙 {availableCoins}</span></p>
            <div className="flex gap-2">
              <button onClick={() => setPendingTheme(null)} className="flex-1 min-h-[44px] rounded-xl border border-rpg-border text-rpg-text font-medium hover:bg-rpg-border transition-colors">취소</button>
              <button onClick={handleThemeUnlockConfirm} disabled={availableCoins < THEME_PRICE} className="flex-1 min-h-[44px] rounded-xl bg-rpg-gold text-gray-900 font-bold hover:opacity-90 transition-opacity disabled:opacity-40">
                {availableCoins < THEME_PRICE ? '코인 부족' : '해금!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-rpg-border text-rpg-text text-sm px-5 py-3 rounded-xl shadow-xl z-50 pointer-events-none whitespace-nowrap border border-rpg-border">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
