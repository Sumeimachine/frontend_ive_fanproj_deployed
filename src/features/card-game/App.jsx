import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPlayerMatchOutcome, shouldRecordQuitLoss } from './game-engine.js';
import { ACTION_ART, GROUPS, RULES, getActionVisual, getGroup, getMemberArt } from './gameData.js';
import { generateRoomCode, loadActiveSession, usePeerRoom } from './usePeerRoom.js';
import {
  getTurnPingPreference,
  installTurnAudioUnlock,
  playTurnPing,
  saveTurnPingPreference,
  shouldPlayTurnPing,
} from './turnSound.js';
import './styles.css';

function themeStyle(group) {
  return {
    '--pink': group.accent,
    '--cyan': group.secondary,
    '--acid': group.acid,
  };
}

function Sparkle({ small = false }) {
  return <span className={small ? 'sparkle sparkle--small' : 'sparkle'} aria-hidden="true">✦</span>;
}

function ArtworkImage({ photo }) {
  const [failed, setFailed] = useState(false);

  if (!photo?.image || failed) {
    return <span className="action-art__image-fallback">{photo?.name?.slice(0, 1) || '✦'}</span>;
  }

  return (
    <img
      src={photo.image}
      alt=""
      decoding="async"
      draggable="false"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function ActionArtwork({ visual, icon }) {
  if (!visual?.layers?.length) {
    return <span className="game-card__photo-fallback game-card__photo-fallback--action" aria-hidden="true">{icon}</span>;
  }

  return (
    <span
      className={`action-art action-art--${visual.template}`}
      data-visual-signature={visual.visualId}
      aria-hidden="true"
    >
      <span className="action-art__layers">
        {visual.layers.map((photo, index) => (
          <span
            className={`action-art__layer action-art__layer--${index + 1}`}
            style={{ '--art-position': photo.position || '50% 24%' }}
            key={`${photo.id || photo.name}-${index}`}
          >
            <ArtworkImage photo={photo} />
          </span>
        ))}
      </span>
      <span className="action-art__effect-mark">{icon}</span>
      <span className="action-art__cue">{visual.cue}</span>
    </span>
  );
}

function Logo() {
  return (
    <div className="logo-lockup" aria-label="IVE Night">
      <span className="logo-mark"><Sparkle small /></span>
      <span>
        <strong>IVE NIGHT</strong>
        <small>BACKSTAGE PANIC</small>
      </span>
    </div>
  );
}

function TurnSoundIcon({ muted = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M16 9.2c1.8 1.5 1.8 4.1 0 5.6m2.4-8.2c3.3 3 3.3 7.8 0 10.8" />}
    </svg>
  );
}

function PortraitStack({ group }) {
  return (
    <div className="portrait-stage" aria-label={`${group.name} member cards`}>
      <div className="orbit orbit--one" />
      <div className="orbit orbit--two" />
      {group.members.slice(0, 6).map((member, index) => {
        const art = getMemberArt(group.id, member.id);
        return (
          <article
            className={`portrait-card portrait-card--${index + 1} ${art.hasIndividualPhoto ? '' : 'portrait-card--fallback'}`}
            style={{ '--member-tone': member.tone, '--photo-position': art.position }}
            key={member.id}
          >
            {art.image ? (
              <img src={art.image} alt={art.alt} decoding="async" referrerPolicy="no-referrer" />
            ) : (
              <span className="portrait-card__fallback" aria-hidden="true">{member.name.slice(0, 1)}</span>
            )}
            <span className="portrait-card__foil" />
            <span className="portrait-card__group">{group.shortName} · PORTRAIT EDIT</span>
            <span className="portrait-card__initial" aria-hidden="true">{member.name.slice(0, 1)}</span>
            <span className="portrait-card__name">{member.name}</span>
            <span className="portrait-card__vibe">{member.flavor}</span>
          </article>
        );
      })}
      <div className="hero-medallion">
        <Sparkle />
        <strong>{group.members.length}</strong>
        <span>MEMBER<br />CARDS</span>
      </div>
    </div>
  );
}

function Modal({ title, eyebrow, children, onClose, wide = false, className = '' }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal ${wide ? 'modal--wide' : ''} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">×</button>
        </header>
        {children}
      </section>
    </div>
  );
}

const HOW_TO_SECTIONS = [
  {
    id: 'lobby',
    number: '01',
    tab: 'Lobby & code',
    eyebrow: 'ROOM SETUP',
    title: 'Get everyone backstage.',
    lede: 'One person creates the room. Friends join with the invite link or the same six-character code.',
    signal: 'ABC123',
    signalLabel: 'SIX-CHARACTER INVITE',
    steps: [
      {
        title: 'Create the room',
        text: 'Choose “Create room,” enter your stage name, then press “Open backstage room.” Every match uses the IVE DIVE edition deck.',
      },
      {
        title: 'Share the code or link',
        text: 'In the room, press the ROOM code in the top bar to copy the full invite link. You can also send only the six-character code shown beside the lineup.',
      },
      {
        title: 'Join a friend',
        text: 'Choose “Join room,” enter a stage name and the Backstage code, then press “Enter the room.” Opening an invite link fills the code for you.',
      },
      {
        title: 'Host starts the show',
        text: 'The host manages seats and presses “Start the show” once at least two players are ready. A room holds up to six total players.',
      },
    ],
    noteLabel: 'Keep the connection live',
    note: 'The host is the game server, so their tab must stay open. Rooms use encrypted browser-to-browser play; locked school or office networks can sometimes block that connection.',
  },
  {
    id: 'ai',
    number: '02',
    tab: 'AI rivals',
    eyebrow: 'SOLO OR MIXED PLAY',
    title: 'Add bots. Keep the drama.',
    lede: 'One human plus one AI is a complete two-player game. Friends and bots can share the same room.',
    signal: '+ AI',
    signalLabel: 'NO API OR ACCOUNT NEEDED',
    steps: [
      {
        title: 'Start solo immediately',
        text: 'While creating a room, switch on “Add an AI rival.” You will arrive in the lobby with a bot already seated, so “Start the show” is available.',
      },
      {
        title: 'Add more in the lobby',
        text: 'The host can press “+ ADD AI” until all six seats are filled. Add friends first, bots first, or any mix you want.',
      },
      {
        title: 'Remove a bot',
        text: 'Before the match begins, the host can press × on an AI seat to remove it. Only the room host controls the lineup.',
      },
      {
        title: 'Let the host browser think',
        text: 'AI turns run automatically in the host browser. Bots use their own cards and public table information; they do not inspect a human player’s private hand.',
      },
    ],
    noteLabel: 'Free-hosting friendly',
    note: 'The AI is local game logic—not ChatGPT and not a paid service. It needs no API key, database, environment variable, or extra Vercel backend.',
  },
  {
    id: 'turn',
    number: '03',
    tab: 'Your turn',
    eyebrow: 'THE TURN LOOP',
    title: 'Play first. Draw last.',
    lede: 'Most turns are simple: use any useful cards, then draw once to settle the turn you owe.',
    signal: 'PING!',
    signalLabel: 'ONLY WHEN YOU ARE UP',
    steps: [
      {
        title: 'Wait for “Your move”',
        text: 'Your player badge lights up and your browser plays a short ping. “Ping on” in the top bar mutes or restores only your own turn alert.',
      },
      {
        title: 'Inspect or select',
        text: 'Press the magnifier for a readable close-up. Tap the card itself to select it; the valid action button appears directly underneath that card.',
      },
      {
        title: 'Play before drawing',
        text: 'You may play action cards or matching member pairs one at a time before you draw. Shuffle, peeks, and steals let your turn continue.',
      },
      {
        title: 'Draw to settle one turn',
        text: 'Press the Stage Deck to draw. Normally that passes play to the next active player. If Double Take left you owing extra turns, keep going until the counter reaches zero.',
      },
    ],
    noteLabel: 'One draw is not always the end',
    note: 'The sidebar says exactly how many turns you still owe. Soundcheck Skip or a resolved Stage Crash clears one owed turn; it does not erase the whole stack.',
  },
  {
    id: 'cards',
    number: '04',
    tab: 'Card moves',
    eyebrow: 'ACTION CHEAT SHEET',
    title: 'Know what every move does.',
    lede: 'The card face gives the short rule. Its magnifier opens the full explanation, photo story, and combo guidance.',
    signal: 'PLAY ↓',
    signalLabel: 'CONTROL APPEARS BELOW CARD',
    compact: true,
    steps: [
      {
        title: 'Spotlight Pass · automatic',
        text: 'Keep it in your hand. It is spent automatically when you draw a Stage Crash; you never play it manually.',
      },
      {
        title: 'Soundcheck Skip · skip one',
        text: 'Clear one owed turn without drawing. If more turns remain, you are still up.',
      },
      {
        title: 'Double Take · pressure next',
        text: 'End your turn without drawing. The next player owes your remaining turns plus one more.',
      },
      {
        title: 'Setlist Shuffle · remix',
        text: 'Randomize the cards still in the draw deck. Then continue your turn.',
      },
      {
        title: 'Crystal Ball · peek three',
        text: 'Privately reveal the next three cards in order. Their order does not change, and your turn continues.',
      },
      {
        title: 'Fan Request · random steal',
        text: 'Choose an active opponent in the popup and take one random card. Their hand remains private.',
      },
      {
        title: 'Matching member pair · steal',
        text: 'Select two cards of the exact same member. The target popup opens; choose a player and steal one random card.',
      },
    ],
    noteLabel: 'Targeting is explicit',
    note: 'Fan Request and a completed member pair open the player picker automatically. Pick a valid opponent, then confirm “Steal from…”—no distant dropdown hunting.',
  },
  {
    id: 'survive',
    number: '05',
    tab: 'Survive & win',
    eyebrow: 'THE ELIMINATION RULE',
    title: 'Last star standing wins.',
    lede: 'Your hand size does not decide the winner. You win by being the final player who has not been eliminated.',
    signal: '! + PASS',
    signalLabel: 'SURVIVE THE STAGE CRASH',
    steps: [
      {
        title: 'Draw a Stage Crash',
        text: 'The danger resolves immediately. Without a Spotlight Pass, you leave the stage—even if you still have ten other cards.',
      },
      {
        title: 'A pass saves you automatically',
        text: 'One Spotlight Pass is discarded, then only you choose where to hide the Stage Crash back in the deck. That resolves one owed turn.',
      },
      {
        title: 'Extra turns still matter',
        text: 'If you were attacked and still owe another turn after reinserting the crash, you continue playing. Watch the turn counter in the sidebar.',
      },
      {
        title: 'Outlast everyone',
        text: 'As soon as only one active player remains, the game ends and that player owns the final spotlight. Card count is irrelevant.',
      },
    ],
    noteLabel: 'Fair danger count',
    note: 'Every match adds one fewer Stage Crash than the number of players: two players get one crash, four players get three, and six players get five.',
  },
];

function HowToPlay({ onClose }) {
  const [activeId, setActiveId] = useState(HOW_TO_SECTIONS[0].id);
  const activeIndex = HOW_TO_SECTIONS.findIndex((section) => section.id === activeId);
  const active = HOW_TO_SECTIONS[activeIndex];
  const previous = HOW_TO_SECTIONS[activeIndex - 1];
  const next = HOW_TO_SECTIONS[activeIndex + 1];

  return (
    <Modal
      title="Your show manual"
      eyebrow="How to play · 2–6 total players"
      onClose={onClose}
      wide
      className="modal--how-to"
    >
      <div className="guide-summary" aria-label="Game summary">
        <span><b>2–6</b><small>TOTAL PLAYERS</small></span>
        <span><b>FRIENDS + AI</b><small>MIX EITHER OR BOTH</small></span>
        <span><b>LAST SURVIVOR</b><small>HAND SIZE DOES NOT WIN</small></span>
      </div>

      <nav className="guide-tabs" aria-label="How to play sections">
        {HOW_TO_SECTIONS.map((section, index) => {
          const isActive = section.id === active.id;
          return (
            <button
              type="button"
              className={isActive ? 'is-active' : ''}
              aria-current={isActive ? 'step' : undefined}
              onClick={() => setActiveId(section.id)}
              autoFocus={index === 0}
              key={section.id}
            >
              <span>{section.number}</span>
              <strong>{section.tab}</strong>
            </button>
          );
        })}
      </nav>

      <section className="guide-panel" aria-labelledby={`guide-title-${active.id}`} aria-live="polite">
        <div className="guide-panel__poster">
          <span>{active.eyebrow}</span>
          <div className="guide-panel__signal" aria-hidden="true">
            <strong>{active.signal}</strong>
            <small>{active.signalLabel}</small>
          </div>
          <div>
            <h3 id={`guide-title-${active.id}`}>{active.title}</h3>
            <p>{active.lede}</p>
          </div>
        </div>

        <div className="guide-panel__body">
          <ol className={`guide-steps ${active.compact ? 'guide-steps--compact' : ''}`}>
            {active.steps.map((step, index) => (
              <li key={step.title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{step.title}</strong><p>{step.text}</p></div>
              </li>
            ))}
          </ol>
          <div className="guide-note">
            <Sparkle small />
            <p><strong>{active.noteLabel}</strong>{active.note}</p>
          </div>
        </div>
      </section>

      <footer className="guide-footer">
        <button type="button" className="guide-footer__back" disabled={!previous} onClick={() => previous && setActiveId(previous.id)}>
          <span>←</span> {previous ? previous.tab : 'Back'}
        </button>
        <span className="guide-footer__progress">{active.number} / {String(HOW_TO_SECTIONS.length).padStart(2, '0')}</span>
        <button type="button" className="guide-footer__next" onClick={() => next ? setActiveId(next.id) : onClose()}>
          {next ? `Next: ${next.tab}` : 'Got it — play'} <span>↗</span>
        </button>
      </footer>
    </Modal>
  );
}

function Credits({ onClose }) {
  return (
    <Modal title="Photo credits" eyebrow="Fan project" onClose={onClose} wide>
      <p className="modal-intro">
        IVE member photography comes from Wikimedia Commons and is reframed as original card
        designs in this non-commercial fan project. Each of the six member cards uses a locally
        cached, individually credited portrait. Follow each link for source and license details.
      </p>
      <h3 className="credit-section-title">Pack photography</h3>
      <div className="credits-list">
        {GROUPS.map((group) => (
          <a href={group.source} target="_blank" rel="noreferrer" key={group.id}>
            <img src={group.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            <span><strong>{group.name}</strong><small>{group.credit}</small></span>
            <b aria-hidden="true">↗</b>
          </a>
        ))}
      </div>
      <h3 className="credit-section-title">Individual member portraits</h3>
      <div className="member-credit-groups">
        {GROUPS.map((group) => (
          <section className="member-credit-group" key={group.id}>
            <header><strong>{group.name}</strong><small>{group.members.length} portraits</small></header>
            <div>
              {group.members.map((member) => {
                const art = getMemberArt(group.id, member.id);
                return art.source ? (
                  <a href={art.source} target="_blank" rel="noreferrer" key={member.id}>
                    <img src={art.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ objectPosition: art.position }} />
                    <span><strong>{member.name}</strong><small>{art.credit}</small></span>
                    <b aria-hidden="true">↗</b>
                  </a>
                ) : (
                  <div className="member-credit-missing" key={member.id}>
                    <span aria-hidden="true">{member.name.slice(0, 1)}</span>
                    <p><strong>{member.name}</strong><small>Portrait pending verification</small></p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <p className="legal-copy">
        IVE and member names belong to their respective rights holders. This is an unofficial,
        non-commercial fan project and is not affiliated with or endorsed by IVE, Starship
        Entertainment, the artists, labels, or management companies shown.
      </p>
    </Modal>
  );
}

function ArtistPackPicker({ selectedId, onSelect, compact = false }) {
  const selected = getGroup(selectedId);

  if (compact) {
    return (
      <div className="pack-compact">
        <img src={selected.image} alt="" decoding="async" referrerPolicy="no-referrer" />
        <span><small>ARTIST PACK · {selected.credit}</small><strong>{selected.name}</strong><em title={selected.vibe}>{selected.vibe}</em></span>
        {onSelect ? (
          <label>
            <span className="sr-only">Choose artist pack</span>
            <select value={selected.id} onChange={(event) => onSelect(event.target.value)}>
              {GROUPS.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}
            </select>
          </label>
        ) : <b>LOCKED BY HOST</b>}
      </div>
    );
  }

  return (
    <fieldset className="pack-picker">
      <legend>Choose artist pack</legend>
      <div className="pack-rail" role="radiogroup" aria-label="Artist pack">
        {GROUPS.map((group) => (
          <button
            type="button"
            role="radio"
            aria-checked={group.id === selected.id}
            className={group.id === selected.id ? 'is-selected' : ''}
            style={{ '--pack-accent': group.accent }}
            onClick={() => onSelect(group.id)}
            key={group.id}
          >
            <i />
            <span>{group.shortName}</span>
            <small>{group.members.length}</small>
          </button>
        ))}
      </div>
      <p className="pack-picker__story">
        <strong>{selected.name}</strong>
        <span>{selected.vibe}</span>
        <small>{selected.fandom} edition · {selected.members.length} members · Photo: {selected.credit}</small>
      </p>
    </fieldset>
  );
}

function LobbyForm({ initialCode, previous, selectedGroupId, onGroupChange, onConnect, onRules, defaultPlayerName }) {
  const [mode, setMode] = useState(initialCode ? 'join' : 'create');
  const [name, setName] = useState(() => String(previous?.name ?? defaultPlayerName ?? '').slice(0, 18));
  const [code, setCode] = useState(initialCode ?? '');
  const [error, setError] = useState('');
  const [withBot, setWithBot] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Use a name with at least two characters.');
    const roomCode = mode === 'create' ? generateRoomCode() : code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (roomCode.length !== 6) return setError('Enter the six-character room code.');
    try {
      onConnect({ code: roomCode, name: name.trim(), isHost: mode === 'create', groupId: selectedGroupId, withBot });
    } catch (caught) {
      setError(caught.message);
    }
  };

  return (
    <section className="lobby-card" id="play">
      <div className="lobby-card__top">
        <span className="live-dot" />
        <span>LIVE MULTIPLAYER</span>
        <small>2–6 TOTAL</small>
      </div>
      <div className="segmented" aria-label="Room type">
        <button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')} type="button">Create room</button>
        <button className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')} type="button">Join room</button>
      </div>
      <form onSubmit={submit}>
        {mode === 'create' && (
          <>
            <ArtistPackPicker selectedId={selectedGroupId} onSelect={onGroupChange} />
            <button
              className={`ai-toggle ${withBot ? 'is-selected' : ''}`}
              type="button"
              aria-pressed={withBot}
              onClick={() => setWithBot((selected) => !selected)}
            >
              <span aria-hidden="true">AI</span>
              <strong>Add an AI rival<small>Start solo or mix bots with friends</small></strong>
              <b aria-hidden="true">{withBot ? '✓' : '+'}</b>
            </button>
          </>
        )}
        <label>
          <span>Your stage name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. StageAce"
            maxLength={18}
            autoComplete="nickname"
          />
        </label>
        {mode === 'join' && (
          <label>
            <span>Backstage code</span>
            <input
              className="room-input"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
            />
          </label>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button primary-button--full" type="submit">
          <span>{mode === 'create' ? 'Open backstage room' : 'Enter the room'}</span>
          <b aria-hidden="true">↗</b>
        </button>
      </form>
      {previous && (
        <button
          className="resume-button"
          type="button"
          onClick={() => onConnect({ ...previous, restore: previous.isHost })}
        >
          <span><small>LAST ROOM</small><strong>{previous.code}</strong></span>
          <span>Resume as {previous.name} →</span>
        </button>
      )}
      <p className="p2p-note"><span>◌</span> Encrypted browser-to-browser play. AI decisions stay in the host browser.</p>
      <button className="lobby-guide-link" type="button" onClick={onRules}>
        <span>FIRST SHOW?</span><strong>Lobby, room codes, AI & every card—explained</strong><b aria-hidden="true">↗</b>
      </button>
    </section>
  );
}

function Landing({ onConnect, onRules, onCredits, defaultPlayerName, stats }) {
  const params = new URLSearchParams(window.location.search);
  const initialCode = params.get('room')?.toUpperCase().slice(0, 6) ?? '';
  const previous = loadActiveSession();
  const [groupId, setGroupId] = useState(previous?.groupId ?? 'ive');
  const group = getGroup(groupId);

  return (
    <div className="landing-shell" style={themeStyle(group)}>
      <div className="grain" />
      <header className="site-header">
        <div className="site-branding">
          <Logo />
          <p className="creator-credit">created by <strong>Sumimachines</strong> from <b>X</b></p>
        </div>
        <nav aria-label="Game information">
          <button onClick={onRules}>How to play</button>
          <button onClick={onCredits}>Credits</button>
          <a href="#play" className="nav-play">Play now <span>↘</span></a>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-kicker"><span>{group.name} · {group.fandom} EDITION</span><i /></div>
            <h2>
              BACKSTAGE
              <span><em>PANIC</em><Sparkle /></span>
            </h2>
            <p>
              {group.vibe} Read the room, protect your hand, and keep your spotlight when the stage goes sideways.
            </p>
            <div className="hero-meta">
              <span><b>02–06</b> Total seats</span>
              <span><b>15–25</b> Minutes</span>
              <span><b>{String(group.members.length).padStart(2, '0')}</b> Members</span>
            </div>
            {stats && (
              <aside className="personal-record" aria-label="Your IVE Night record">
                <span>YOUR RECORD</span>
                <strong>{stats.wins}<small>W</small> · {stats.losses}<small>L</small></strong>
                <em>{stats.played ?? stats.wins + stats.losses} played</em>
              </aside>
            )}
          </div>
          <PortraitStack group={group} />
          <LobbyForm
            initialCode={initialCode}
            previous={previous}
            selectedGroupId={group.id}
            onGroupChange={setGroupId}
            onConnect={onConnect}
            onRules={onRules}
            defaultPlayerName={defaultPlayerName}
          />
        </section>
        <section className="marquee" aria-hidden="true">
          <div>
            <span>KEEP THE SPOTLIGHT</span><Sparkle small /><span>TRUST NO DRAW</span><Sparkle small />
            <span>KEEP THE SPOTLIGHT</span><Sparkle small /><span>TRUST NO DRAW</span><Sparkle small />
          </div>
        </section>
        <section className="rules-preview">
          <div>
            <span className="eyebrow">THE SETLIST</span>
            <h2>Easy to learn.<br /><i>Deliciously tense.</i></h2>
          </div>
          <div className="rules-preview__rail">
            {RULES.map(([title, description], index) => (
              <article key={title}>
                <span>0{index + 1}</span><h3>{title}</h3><p>{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <Logo />
        <p>IVE DIVE edition. Unofficial, non-commercial fan-support project.</p>
      </footer>
    </div>
  );
}

function RoomBar({ state, status, onLeave, onRules, turnPingEnabled, onToggleTurnPing }) {
  const [copied, setCopied] = useState(false);
  const copyRoom = async () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${state.code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <header className="room-bar">
      <Logo />
      <div className="room-bar__controls">
        <button className="room-code" onClick={copyRoom}>
          <span>ROOM</span><strong>{state.code}</strong><small>{copied ? 'COPIED!' : 'COPY LINK'}</small>
        </button>
        <span className={`network-pill network-pill--${status}`}><i />{status === 'connected' ? 'LIVE' : status.toUpperCase()}</span>
        <button className="text-button" onClick={onRules}>Rules</button>
        {typeof turnPingEnabled === 'boolean' && (
          <button
            type="button"
            className={`turn-sound-toggle ${turnPingEnabled ? 'is-on' : 'is-muted'}`}
            onClick={onToggleTurnPing}
            aria-pressed={turnPingEnabled}
            aria-label={turnPingEnabled ? 'Turn ping is on. Click to mute it.' : 'Turn ping is off. Click to enable it.'}
            title={turnPingEnabled ? 'Mute your-turn ping' : 'Enable your-turn ping'}
          >
            <TurnSoundIcon muted={!turnPingEnabled} />
            <span>{turnPingEnabled ? 'Ping on' : 'Ping off'}</span>
          </button>
        )}
        <button className="icon-button" onClick={onLeave} aria-label="Leave room">×</button>
      </div>
    </header>
  );
}

function PlayerBadge({ player, isHost, isCurrent, isYou, onRemove, compact = false }) {
  return (
    <article className={`player-badge ${isCurrent ? 'is-current' : ''} ${player.eliminated ? 'is-out' : ''} ${player.isBot ? 'is-bot' : ''} ${compact ? 'player-badge--compact' : ''}`}>
      <div className="player-avatar">{player.name.slice(0, 1).toUpperCase()}</div>
      <div className="player-copy">
        <strong>{player.name}{player.isBot && <small>AI</small>}{isYou && <small>YOU</small>}</strong>
        <span>{player.eliminated ? 'OFF STAGE' : `${player.isBot ? 'BOT · ' : ''}${player.handCount} CARDS`}</span>
      </div>
      {isHost && <span className="host-crown" title="Room host">♛</span>}
      <i className={player.connected ? 'online' : 'offline'} title={player.connected ? 'Connected' : 'Disconnected'} />
      {onRemove && !isYou && (
        <button className="remove-player" onClick={() => onRemove(player.id)} aria-label={`Remove ${player.name}`}>×</button>
      )}
    </article>
  );
}

function WaitingRoom({ state, status, message, onCommand, onLeave, onRules }) {
  const isHost = state.yourId === state.hostId;
  const openSeats = Array.from({ length: state.maxPlayers - state.players.length });
  const group = getGroup(state.groupId);
  return (
    <div className="room-shell waiting-shell" style={themeStyle(group)}>
      <div className="grain" />
      <RoomBar state={state} status={status} onLeave={onLeave} onRules={onRules} />
      <main className="waiting-room">
        <section className="waiting-copy">
          <span className="eyebrow">{group.shortName} BACKSTAGE · {state.players.length}/{state.maxPlayers}</span>
          <h2>Build your<br /><i>lineup.</i></h2>
          <p>Play solo against AI, invite friends, or mix both. The show begins with at least two ready players.</p>
          <div className="share-strip">
            <span>ROOM CODE</span><strong>{state.code}</strong><small>Friends can join from any modern browser.</small>
          </div>
          <ArtistPackPicker
            selectedId={group.id}
            compact
            onSelect={isHost ? (groupId) => onCommand('set-group', { groupId }) : null}
          />
          {message && <p className="status-message" role="status"><span>●</span>{message}</p>}
        </section>
        <section className="lineup-panel">
          <header>
            <div><span className="eyebrow">Tonight's lineup</span><h2>Players</h2></div>
            <div className="lineup-tools">
              <span>{state.players.filter((player) => player.connected).length} READY</span>
              {isHost && state.players.length < state.maxPlayers && (
                <button type="button" onClick={() => onCommand('add-bot')}>+ ADD AI</button>
              )}
            </div>
          </header>
          <div className="lineup-grid">
            {state.players.map((player) => (
              <PlayerBadge
                key={player.id}
                player={player}
                isHost={player.id === state.hostId}
                isYou={player.id === state.yourId}
                onRemove={isHost ? (playerId) => onCommand('remove', { playerId }) : null}
              />
            ))}
            {openSeats.map((_, index) => (
              <div className="open-seat" key={index}><span>+</span><small>OPEN SEAT</small></div>
            ))}
          </div>
          <div className="lineup-action">
            {isHost ? (
              <button
                className="primary-button"
                disabled={state.players.filter((player) => player.connected).length < 2}
                onClick={() => onCommand('start')}
              >Start the show <b>↗</b></button>
            ) : (
              <div className="waiting-pulse"><span /><p><strong>Host has the cue</strong>Waiting for the performance to begin.</p></div>
            )}
            <small>{isHost ? 'You are the room host. Keep this tab open during play.' : 'Keep this tab open. You will enter automatically.'}</small>
          </div>
        </section>
      </main>
    </div>
  );
}

const CARD_EFFECTS = {
  spotlight_pass: 'Keep it in your hand. If you draw a Stage Crash, this pass is spent automatically. You then secretly put that crash anywhere back in the deck.',
  soundcheck_skip: 'End one owed turn immediately without drawing. If you owe extra turns, it removes only one of them.',
  double_take: 'End your turn without drawing. The next player inherits your remaining pressure and owes one extra turn.',
  setlist_shuffle: 'Randomize every card still in the draw deck. Your turn continues, so you still need to play or draw.',
  crystal_ball: 'Privately see the next three cards in order. Nothing moves, and your turn continues.',
  fan_request: 'Choose an active opponent and steal one random card from their hand. Your turn continues.',
  stage_crash: 'Draw this without a Spotlight Pass and you are eliminated. With a pass, secretly reinsert the crash anywhere in the deck.',
};

function getCardEffect(card, groupId) {
  const member = card?.kind ? getMemberArt(groupId, card.kind) : null;
  if (member) {
    return `A single ${member.name} stays in your hand. Play two matching ${member.name} cards to choose an opponent and steal one random card.`;
  }
  return CARD_EFFECTS[card?.kind] || card?.description || 'No effect details are available for this older preview.';
}

function GameCard({
  card,
  groupId,
  selected = false,
  onClick,
  onInspect,
  disabled = false,
  compact = false,
  featured = false,
  reservePlaySpace = false,
  inlinePlay = null,
}) {
  const group = getGroup(groupId);
  const member = getMemberArt(group.id, card.kind);
  const action = ACTION_ART[card.kind] || ACTION_ART.stage_crash;
  const actionVisual = member ? null : getActionVisual(group.id, card.kind);
  const label = member?.name || card.label;
  const className = `game-card ${member ? 'game-card--member' : 'game-card--action has-photo'} ${selected ? 'is-selected' : ''} ${disabled && !featured ? 'is-disabled' : ''} ${compact ? 'game-card--compact' : ''} ${featured ? 'game-card--featured' : ''}`;
  const CardRoot = featured ? 'div' : 'button';
  const accessibleRule = member
    ? `Match two ${member.name} cards to steal one random card.`
    : action.rule;

  return (
    <div className={`game-card-shell ${compact ? 'game-card-shell--compact' : ''} ${featured ? 'game-card-shell--featured' : ''} ${reservePlaySpace ? 'game-card-shell--with-play-slot' : ''}`}>
      <CardRoot
        type={featured ? undefined : 'button'}
        className={className}
        style={{ '--card-tone': member?.tone || action.color, '--photo-position': member?.position || '50% 24%' }}
        onClick={featured ? undefined : onClick}
        disabled={featured ? undefined : disabled}
        aria-pressed={featured ? undefined : selected}
        aria-label={`${label}. ${accessibleRule} ${card.description || ''}${selected ? ' Selected.' : ''}`.trim()}
        role={featured ? 'img' : undefined}
        title={featured ? undefined : card.description}
      >
        {member ? (
          <>
            {member.image ? (
              <img className="game-card__member-photo" src={member.image} alt="" decoding="async" draggable="false" referrerPolicy="no-referrer" />
            ) : (
              <span className="game-card__photo-fallback" aria-hidden="true">{member.name.slice(0, 1)}</span>
            )}
            <span className="game-card__wash" />
            <span className="game-card__series">{group.shortName} · MEMBER {String(group.members.findIndex((candidate) => candidate.id === card.kind) + 1).padStart(2, '0')}</span>
            <span className="game-card__photo-mark">{member.isGroupCrop ? 'PORTRAIT CROP' : member.hasIndividualPhoto ? 'PORTRAIT' : 'TYPE EDIT'}</span>
            <span className="game-card__initial" aria-hidden="true">{member.name.slice(0, 1)}</span>
            <span className="game-card__member-name">{member.name}</span>
            <span className="game-card__member-flavor">{member.flavor}</span>
            <span className="game-card__combo">PAIR TO STEAL</span>
          </>
        ) : (
          <>
            <ActionArtwork visual={actionVisual} icon={action.icon} />
            <span className="game-card__action-wash" />
            <span className="game-card__constellation" />
            <span className="game-card__eyebrow">{action.eyebrow}</span>
            <span className="game-card__photo-mark">PHOTO STORY · {action.eyebrow}</span>
            <span className="game-card__icon">{action.icon}</span>
            <span className="game-card__label">{card.label}</span>
            <span className="game-card__rule">{action.rule}</span>
          </>
        )}
        <span className="game-card__shine" />
      </CardRoot>
      {onInspect && !featured && (
        <button
          type="button"
          className="card-inspect-button"
          onClick={(event) => {
            event.stopPropagation();
            onInspect(card);
          }}
          aria-label={`Open a close-up of ${label}`}
          title={`View ${label} close-up`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="5.5" />
            <path d="m15 15 5 5" />
          </svg>
        </button>
      )}
      {reservePlaySpace && <div className="card-inline-play-slot" aria-live={inlinePlay ? 'polite' : undefined}>{inlinePlay}</div>}
    </div>
  );
}

function CardDetailModal({ card, groupId, onClose }) {
  const group = getGroup(groupId);
  const member = getMemberArt(group.id, card.kind);
  const actionVisual = member ? null : getActionVisual(group.id, card.kind);
  const photoCredits = member ? [member] : actionVisual?.photos || [];
  const effect = getCardEffect(card, group.id);

  return (
    <Modal
      title={member?.name || card.label}
      eyebrow={`${group.shortName} · ${member ? 'Member card' : 'Action card'} close-up`}
      onClose={onClose}
      wide
      className="modal--card-detail"
    >
      <div className="card-detail">
        <div className="card-detail__preview">
          <GameCard card={card} groupId={group.id} featured />
          <span>FULL CARD VIEW</span>
        </div>
        <div className="card-detail__copy">
          <span className="card-detail__badge">{member ? 'MATCH TWO' : ACTION_ART[card.kind]?.eyebrow || 'SPECIAL'}</span>
          <p className="card-detail__flavor">“{member?.flavor || card.description}”</p>
          <section>
            <span className="eyebrow">WHAT IT DOES</span>
            <p>{effect}</p>
          </section>
          {actionVisual && (
            <section className="card-detail__art-note">
              <span className="eyebrow">WHY THIS ART FITS</span>
              <p>{actionVisual.story}</p>
            </section>
          )}
          {member && (
            <section>
              <span className="eyebrow">COMBO TIP</span>
              <p>One copy is pure collectible energy. Two matching copies unlock the steal—select both, choose your victim, then play the combo.</p>
            </section>
          )}
          {photoCredits.length > 0 && (
            <div className="card-detail__credits" aria-label="Photo credits">
              {photoCredits.map((photo, index) => (
                <a className="card-detail__credit" href={photo.source} target="_blank" rel="noreferrer" key={photo.source}>
                  <span>{member ? 'PHOTO' : `PHOTO ${index + 1} · ${photo.name}`}</span>
                  <strong>{photo.credit || 'Wikimedia Commons contributor'}</strong>
                  <b aria-hidden="true">↗</b>
                </a>
              ))}
            </div>
          )}
          <button type="button" className="card-detail__done" onClick={onClose}>Got it <span>×</span></button>
        </div>
      </div>
    </Modal>
  );
}

function CardBack({ count, group, onDraw, disabled }) {
  return (
    <button className="card-back" onClick={onDraw} disabled={disabled} aria-label={`Draw from deck, ${count} cards remaining`}>
      <span className="card-back__frame" />
      <span className="card-back__stars">✦ · ✦ · ✦</span>
      <strong>IVE</strong>
      <small>{group.shortName} DECK</small>
      <b>{count}</b>
    </button>
  );
}

function DefuseDialog({ deckLength, onSubmit }) {
  const [position, setPosition] = useState(Math.floor(deckLength / 2));
  const label = position === 0 ? 'Right on top' : position === deckLength ? 'At the bottom' : `${position} card${position === 1 ? '' : 's'} from the top`;
  return (
    <Modal title="You kept the spotlight" eyebrow="Stage Crash defused" onClose={() => {}}>
      <div className="defuse-visual"><span>!</span><Sparkle /></div>
      <p className="modal-intro">Secretly place the Stage Crash back anywhere in the deck.</p>
      <div className="position-control">
        <strong>{label}</strong>
        <input type="range" min="0" max={deckLength} value={position} onChange={(event) => setPosition(Number(event.target.value))} />
        <div><span>TOP</span><span>BOTTOM</span></div>
      </div>
      <div className="position-presets">
        <button onClick={() => setPosition(0)}>Top</button>
        <button onClick={() => setPosition(Math.floor(Math.random() * (deckLength + 1)))}>Random</button>
        <button onClick={() => setPosition(deckLength)}>Bottom</button>
      </div>
      <button className="primary-button primary-button--full" onClick={() => onSubmit(position)}>Hide it in the setlist <b>↗</b></button>
    </Modal>
  );
}

function PeekDialog({ cards, groupId, onClose }) {
  return (
    <Modal title="The next three, decoded" eyebrow="Crystal Ball" onClose={onClose} wide className="modal--peek">
      <p className="peek-intro">The top card comes first. Here is exactly what each reveal will do—no memorizing required.</p>
      <div className="peek-stack">
        {cards.map((rawCard, index) => {
          const card = typeof rawCard === 'string' ? { label: rawCard, type: 'unknown' } : rawCard;
          const member = card.kind ? getMemberArt(groupId, card.kind) : null;
          const action = card.kind ? ACTION_ART[card.kind] : null;
          const actionVisual = !member && card.kind ? getActionVisual(groupId, card.kind) : null;
          const typeLabel = card.type === 'danger'
            ? 'DANGER · RESOLVES WHEN DRAWN'
            : card.type === 'defuse'
              ? 'RESCUE · KEEP IN HAND'
              : card.type === 'member'
                ? 'MEMBER · MATCH TWO'
                : card.type === 'action'
                  ? 'ACTION · PLAY BEFORE DRAW'
                  : 'CARD PREVIEW';
          return (
            <article
              className={`peek-card peek-card--${card.type || 'unknown'}`}
              style={{ '--peek-tone': member?.tone || action?.color || '#8e6bc8', '--peek-position': member?.position || '50% 24%' }}
              key={`${card.kind || card.label}-${index}`}
            >
              <div className="peek-card__art" aria-hidden="true">
                {member?.image
                  ? <img src={member.image} alt="" decoding="async" draggable="false" />
                  : actionVisual
                    ? <ActionArtwork visual={actionVisual} icon={action?.icon || '?'} />
                    : <span>{action?.icon || card.label?.slice(0, 1)}</span>}
                <i>{action?.icon || member?.name?.slice(0, 1) || '?'}</i>
              </div>
              <span className="peek-card__order">0{index + 1}<small>{index === 0 ? 'FIRST' : index === 1 ? 'SECOND' : 'THIRD'}</small></span>
              <div className="peek-card__copy">
                <span>{typeLabel}</span>
                <strong>{card.label}</strong>
                <p>{getCardEffect(card, groupId)}</p>
              </div>
            </article>
          );
        })}
      </div>
      <p className="legal-copy">Private preview · Only you can see this · The deck order has not changed</p>
    </Modal>
  );
}

function WinnerDialog({ winner, isYou, onLeave }) {
  return (
    <Modal title={isYou ? 'You own the final spotlight' : `${winner.name} owns the final spotlight`} eyebrow="Performance complete" onClose={() => {}}>
      <div className="winner-burst"><Sparkle /><span>{winner.name.slice(0, 1).toUpperCase()}</span><Sparkle /></div>
      <p className="modal-intro">One flawless survivor. One very chaotic setlist.</p>
      <button className="primary-button primary-button--full" onClick={onLeave}>Return to lobby <b>↗</b></button>
    </Modal>
  );
}

function TargetPickerDialog({ cards, opponents, selectedTargetId, onSelect, onConfirm, onClose }) {
  const isPair = cards.length === 2;
  const selectedTarget = opponents.find((player) => player.id === selectedTargetId);
  const playName = isPair ? `${cards[0]?.label ?? 'Member'} duo` : cards[0]?.label ?? 'Steal card';

  return (
    <Modal title="Choose your target" eyebrow={isPair ? 'Matching pair · random steal' : 'Fan Request · random steal'} onClose={onClose} className="modal--target-picker">
      <div className="target-picker">
        <div className="target-picker__source">
          <span>YOU ARE PLAYING</span>
          <strong>{playName}</strong>
          <p>Pick an active player. You will take one mystery card from their hand.</p>
        </div>

        {opponents.length > 0 ? (
          <div className="target-picker__grid" role="radiogroup" aria-label="Players you can target">
            {opponents.map((player, index) => {
              const isSelected = player.id === selectedTargetId;
              return (
                <button
                  type="button"
                  className={`target-option ${isSelected ? 'is-selected' : ''}`}
                  key={player.id}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(player.id)}
                  autoFocus={index === 0}
                >
                  <span className="target-option__avatar">{player.name.slice(0, 1).toUpperCase()}</span>
                  <span className="target-option__copy">
                    <strong>{player.name}{player.isBot && <small>AI</small>}</strong>
                    <span>{player.connected ? 'READY TO TARGET' : 'CONNECTION LOST'}</span>
                  </span>
                  <span className="target-option__count"><b>{player.handCount}</b> CARDS</span>
                  <i aria-hidden="true">{isSelected ? '✓' : '↗'}</i>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="target-picker__empty" role="status">
            <strong>No cards to steal.</strong>
            <span>Every active opponent currently has an empty hand.</span>
          </div>
        )}

        <div className="target-picker__actions">
          <button type="button" className="target-picker__cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="primary-button" disabled={!selectedTarget} onClick={onConfirm}>
            {selectedTarget ? `Steal from ${selectedTarget.name}` : 'Choose a player'} <b>↗</b>
          </button>
        </div>
        <small className="target-picker__note">The stolen card is random. Their hand stays private.</small>
      </div>
    </Modal>
  );
}

function GameTable({ state, status, message, peek, setPeek, onCommand, onLeave, onRules }) {
  const [selected, setSelected] = useState([]);
  const [targetId, setTargetId] = useState('');
  const [targetPickerOpen, setTargetPickerOpen] = useState(false);
  const [inspectedCard, setInspectedCard] = useState(null);
  const [turnPingEnabled, setTurnPingEnabled] = useState(getTurnPingPreference);
  const previousPlayerId = useRef(null);
  const me = state.players.find((player) => player.id === state.yourId);
  const current = state.players.find((player) => player.id === state.currentPlayerId);
  const winner = state.players.find((player) => player.id === state.winnerId);
  const isMyTurn = state.currentPlayerId === state.yourId && !me?.eliminated;
  const isHost = state.yourId === state.hostId;
  const selectedCards = state.yourHand.filter((card) => selected.includes(card.id));
  const opponents = state.players.filter((player) => player.id !== state.yourId && !player.eliminated && player.handCount > 0);
  const selectedTarget = opponents.find((player) => player.id === targetId);
  const matchingPairSelected = selectedCards.length === 2
    && selectedCards.every((card) => card.type === 'member' && card.kind === selectedCards[0].kind);
  const targetRequired = selectedCards[0]?.kind === 'fan_request' || selectedCards.length === 2;
  const targetChoiceReady = selectedCards[0]?.kind === 'fan_request' || matchingPairSelected;
  const validPlay = selectedCards.length === 1
    ? selectedCards[0].type === 'action' && (!targetRequired || Boolean(selectedTarget))
    : matchingPairSelected && Boolean(selectedTarget);
  const inlinePlayCardId = selected.at(-1) ?? null;
  const inlinePlayLabel = targetChoiceReady
    ? selectedTarget ? `Target: ${selectedTarget.name}` : 'Choose player'
    : validPlay
      ? selectedCards.length === 2 ? 'Play pair' : 'Play card'
      : selectedCards[0]?.type === 'member'
        ? 'Pick matching card'
        : 'Play card';
  const group = getGroup(state.groupId);

  useEffect(() => {
    const previous = previousPlayerId.current;
    previousPlayerId.current = state.currentPlayerId;
    if (shouldPlayTurnPing({
      enabled: turnPingEnabled,
      status: state.status,
      eliminated: me?.eliminated,
      previousPlayerId: previous,
      currentPlayerId: state.currentPlayerId,
      yourPlayerId: state.yourId,
    })) {
      void playTurnPing('turn');
    }
  }, [me?.eliminated, state.currentPlayerId, state.status, state.yourId, turnPingEnabled]);

  const toggleTurnPing = () => {
    const next = !turnPingEnabled;
    setTurnPingEnabled(next);
    saveTurnPingPreference(next);
    if (next) void playTurnPing('preview');
  };

  useEffect(() => {
    setSelected([]);
    setTargetId('');
    setTargetPickerOpen(false);
  }, [state.currentPlayerId, state.yourHand.length]);

  useEffect(() => {
    if (!inspectedCard) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setInspectedCard(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [inspectedCard]);

  const toggleCard = (card) => {
    if (!isMyTurn || !['action', 'member'].includes(card.type)) return;
    if (selected.includes(card.id)) {
      setSelected(selected.filter((id) => id !== card.id));
      setTargetId('');
      setTargetPickerOpen(false);
      return;
    }
    if (card.type === 'action') {
      setSelected([card.id]);
      setTargetId('');
      setTargetPickerOpen(card.kind === 'fan_request');
      return;
    }
    const already = selectedCards.filter((held) => held.type === 'member' && held.kind === card.kind);
    const nextSelection = already.length === 1 ? [already[0].id, card.id] : [card.id];
    setSelected(nextSelection);
    setTargetId('');
    setTargetPickerOpen(nextSelection.length === 2);
  };

  const play = () => {
    if (!validPlay) return;
    onCommand('play', { cardIds: selected, targetId: targetRequired ? targetId : undefined });
    setSelected([]);
    setTargetId('');
    setTargetPickerOpen(false);
  };

  const closeTargetPicker = () => {
    setTargetPickerOpen(false);
    setTargetId('');
  };

  const currentDisconnected = current && !current.connected;

  return (
    <div className="room-shell game-shell" style={themeStyle(group)}>
      <div className="grain" />
      <RoomBar
        state={state}
        status={status}
        onLeave={onLeave}
        onRules={onRules}
        turnPingEnabled={turnPingEnabled}
        onToggleTurnPing={toggleTurnPing}
      />
      <main className="game-layout">
        <aside className="game-sidebar">
          <div className="turn-callout">
            <span className="eyebrow">{group.shortName} · CURRENT CUE</span>
            <h2>{isMyTurn ? 'Your move.' : `${current?.name ?? '—'} is up.`}</h2>
            <p>{isMyTurn ? `${state.turnsLeft} turn${state.turnsLeft === 1 ? '' : 's'} owed. Play cards or draw.` : current?.isBot ? 'AI is reading the table…' : 'Watch the setlist and plan your next move.'}</p>
          </div>
          <div className="event-feed">
            <header><span>LIVE FEED</span><i /></header>
            {state.log.slice(0, 7).map((entry, index) => <p key={`${entry}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{entry}</p>)}
          </div>
          {message && <p className="status-message" role="status"><span>●</span>{message}</p>}
        </aside>

        <section className="table-zone" aria-label="Game table">
          <div className="table-glow" />
          <div className="players-ring">
            {state.players.map((player, index) => (
              <div className={`seat seat--${index + 1}`} key={player.id}>
                <PlayerBadge
                  player={player}
                  isHost={player.id === state.hostId}
                  isCurrent={player.id === state.currentPlayerId}
                  isYou={player.id === state.yourId}
                  compact
                />
              </div>
            ))}
          </div>
          <div className="table-center">
            <div className="discard-pile">
              {state.discardTop ? (
                <GameCard card={state.discardTop} groupId={group.id} compact disabled onInspect={setInspectedCard} />
              ) : (
                <div className="empty-discard"><span>DISCARD</span></div>
              )}
            </div>
            <div className="deck-wrap">
              <CardBack count={state.deckCount} group={group} onDraw={() => onCommand('draw')} disabled={!isMyTurn || Boolean(state.pendingDefuse)} />
              <span className="draw-hint">{isMyTurn ? 'DRAW TO END TURN' : 'STAGE DECK'}</span>
            </div>
          </div>
          {isHost && currentDisconnected && state.status === 'playing' && (
            <button className="disconnect-action" onClick={() => onCommand('drop-disconnected')}>Remove disconnected current player</button>
          )}
        </section>

        <section className="hand-dock">
          <header className="hand-dock__header">
            <div className="hand-title">
              <div><span className="eyebrow">YOUR HAND</span><strong>{state.yourHand.length} CARDS</strong></div>
              <small>Tap a card to select · its play control appears <b>underneath</b></small>
            </div>
          </header>
          <div className="hand-scroll">
            {state.yourHand.map((card) => (
              <GameCard
                card={card}
                groupId={group.id}
                key={card.id}
                selected={selected.includes(card.id)}
                disabled={!isMyTurn || !['action', 'member'].includes(card.type)}
                onClick={() => toggleCard(card)}
                onInspect={setInspectedCard}
                reservePlaySpace
                inlinePlay={card.id === inlinePlayCardId ? (
                  <button
                    type="button"
                    className="card-inline-play"
                    disabled={!isMyTurn || (targetChoiceReady ? opponents.length === 0 : !validPlay)}
                    onClick={targetChoiceReady ? () => setTargetPickerOpen(true) : play}
                    aria-label={targetChoiceReady ? `${inlinePlayLabel} for ${selectedCards.map((selectedCard) => selectedCard.label).join(' and ')}` : validPlay ? `${inlinePlayLabel}: ${selectedCards.map((selectedCard) => selectedCard.label).join(' and ')}` : inlinePlayLabel}
                  >
                    <span>{inlinePlayLabel}</span><b aria-hidden="true">↗</b>
                  </button>
                ) : null}
              />
            ))}
          </div>
        </section>
      </main>
      {state.pendingDefuse && <DefuseDialog deckLength={state.pendingDefuse.deckLength} onSubmit={(position) => onCommand('reinsert', { position })} />}
      {targetPickerOpen && targetChoiceReady && (
        <TargetPickerDialog
          cards={selectedCards}
          opponents={opponents}
          selectedTargetId={targetId}
          onSelect={setTargetId}
          onConfirm={play}
          onClose={closeTargetPicker}
        />
      )}
      {peek && <PeekDialog cards={peek} groupId={group.id} onClose={() => setPeek(null)} />}
      {inspectedCard && <CardDetailModal card={inspectedCard} groupId={group.id} onClose={() => setInspectedCard(null)} />}
      {winner && <WinnerDialog winner={winner} isYou={winner.id === state.yourId} onLeave={onLeave} />}
    </div>
  );
}

function Connecting({ message, onLeave }) {
  return (
    <div className="connecting-screen">
      <div className="grain" />
      <Logo />
      <div className="connecting-orbit"><span /><span /><Sparkle /></div>
      <h2>Finding the<br /><i>backstage.</i></h2>
      <p>{message}</p>
      <button className="text-button" onClick={onLeave}>Cancel and go back</button>
    </div>
  );
}

function notifyCallback(callback, payload) {
  try {
    void Promise.resolve(callback(payload)).catch(() => undefined);
  } catch {
    // Stat persistence is optional and must never interrupt the live room.
  }
}

export default function App({ defaultPlayerName = '', onMatchStarted, onMatchFinished, stats = null }) {
  const peer = usePeerRoom();
  const [showRules, setShowRules] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const startedMatches = useRef(new Set());
  const finishedMatches = useRef(new Set());

  useEffect(() => installTurnAudioUnlock(), []);

  useEffect(() => {
    const state = peer.roomState;
    if (!state?.matchId || !['playing', 'finished'].includes(state.status)) return;
    const localPlayer = state.players.find((player) => player.id === state.yourId);
    if (!localPlayer) return;

    const event = { matchId: state.matchId, playerCount: state.players.length };
    if (onMatchStarted && !startedMatches.current.has(state.matchId)) {
      startedMatches.current.add(state.matchId);
      notifyCallback(onMatchStarted, event);
    }

    const outcome = getPlayerMatchOutcome(state, state.yourId);

    if (outcome && onMatchFinished && !finishedMatches.current.has(state.matchId)) {
      finishedMatches.current.add(state.matchId);
      notifyCallback(onMatchFinished, {
        ...event,
        outcome,
      });
    }
  }, [onMatchFinished, onMatchStarted, peer.roomState]);

  const handleLeave = useCallback(() => {
    const state = peer.roomState;

    if (shouldRecordQuitLoss(state, state?.yourId)) {
      const event = { matchId: state.matchId, playerCount: state.players.length };

      if (onMatchStarted && !startedMatches.current.has(state.matchId)) {
        startedMatches.current.add(state.matchId);
        notifyCallback(onMatchStarted, event);
      }

      if (onMatchFinished && !finishedMatches.current.has(state.matchId)) {
        finishedMatches.current.add(state.matchId);
        notifyCallback(onMatchFinished, { ...event, outcome: 'loss' });
      }
    }

    peer.leave();
  }, [onMatchFinished, onMatchStarted, peer]);

  const content = useMemo(() => {
    if (!peer.roomState && peer.networkStatus !== 'idle') return <Connecting message={peer.message} onLeave={handleLeave} />;
    if (!peer.roomState) {
      return (
        <Landing
          onConnect={peer.connect}
          onRules={() => setShowRules(true)}
          onCredits={() => setShowCredits(true)}
          defaultPlayerName={defaultPlayerName}
          stats={stats}
        />
      );
    }
    if (peer.roomState.status === 'lobby') {
      return <WaitingRoom state={peer.roomState} status={peer.networkStatus} message={peer.message} onCommand={peer.sendCommand} onLeave={handleLeave} onRules={() => setShowRules(true)} />;
    }
    return <GameTable state={peer.roomState} status={peer.networkStatus} message={peer.message} peek={peer.peek} setPeek={peer.setPeek} onCommand={peer.sendCommand} onLeave={handleLeave} onRules={() => setShowRules(true)} />;
  }, [defaultPlayerName, handleLeave, peer, stats]);

  return (
    <div className="card-game-page">
      {content}
      {showRules && <HowToPlay onClose={() => setShowRules(false)} />}
      {showCredits && <Credits onClose={() => setShowCredits(false)} />}
    </div>
  );
}
