# User Feedback 0006

This review simulates five human user perspectives requested for the no-scroll iteration: new Chinese player, host/DM, mobile player, heavy TRPG rules user, and usability/accessibility reviewer. The five agents produced 121 concrete issues. The product decision is to make the room a fixed one-viewport table: stage, current status, latest log, and action composer stay visible; party setup, GM state, full transcript, assets, replay, diagnostics, and advanced audio live in drawers or dialogs.

## Product Priorities

| Priority | Decision | Why |
| --- | --- | --- |
| P0 | Core table must fit one viewport after a room opens | Users repeatedly found `Join table`, current turn, and action input below the fold. |
| P0 | Secondary information moves to drawers | Party setup, continuity, encounter details, replay, assets, and diagnostics were inflating the page height. |
| P0 | Mobile is not a stacked desktop layout | The old mobile room measured thousands of pixels high, making active play impossible. |
| P1 | Latest log is compact; full log is explicit | Long transcript history should be searchable later without blocking current action. |
| P1 | Drawers need accessibility mechanics | Closed drawers must be inert, Escape must close, and focus must move predictably. |
| P1 | Audio and voice controls should become compact | They are valuable, but they should not displace action and scene context. |
| P2 | Bilingual labels need deeper content coverage | Static UI is bilingual; species, class, archetype, and system messages need the next localization pass. |

## Issue Backlog

| ID | Perspective | Severity | Issue | Product Response |
| --- | --- | --- | --- | --- |
| B001 | New Chinese player | P0 | After room creation, `Join table` sits below the first viewport. | Move party setup into Party drawer; expose Party button in topbar. |
| B002 | New Chinese player | P0 | Action input was around 2481px down the page. | Fixed one-viewport table and compact latest log. |
| B003 | New Chinese player | P0 | After joining, the page remains low and `Begin scene` disappears. | Keep room controls in persistent topbar. |
| B004 | New Chinese player | P0 | After starting, first action still requires scrolling. | Keep action composer in the visible log panel. |
| B005 | New Chinese player | P0 | Mobile room is several thousand pixels tall. | Replace mobile stack with fixed table rows and drawers. |
| B006 | New Chinese player | P1 | Empty roster wastes visible space. | Party drawer can own empty state and setup. |
| B007 | New Chinese player | P1 | Log creates large blank areas. | Render latest five messages in main panel. |
| B008 | New Chinese player | P1 | Continuity, director, encounter, replay are inline. | Move to GM drawer. |
| B009 | New Chinese player | P1 | Audio and voice controls crowd the log. | Compact mobile controls; future pass moves advanced controls to drawer. |
| B010 | New Chinese player | P1 | Asset library renders many assets inline. | Move asset library inside GM drawer. |
| B011 | New Chinese player | P2 | Asset detail primary action can require scrolling. | Keep for next sticky action-bar pass. |
| B012 | New Chinese player | P2 | Guide is still a long scroll drawer. | Keep guide; add state-aware checklist later. |
| B013 | New Chinese player | P2 | Guide close affordances share the same label. | Track in accessibility follow-up. |
| B014 | New Chinese player | P2 | Dialogs need focus traps. | Add inert drawer behavior now; full dialog manager later. |
| B015 | New Chinese player | P1 | Mobile existing-room form is close to below fold. | Homepage mobile compression remains follow-up. |
| B016 | New Chinese player | P1 | Disabled start button lacks reason. | Add reason text in later host-console pass. |
| B017 | New Chinese player | P1 | Join form remains after joining. | Party drawer will make it less intrusive; collapse follow-up. |
| B018 | New Chinese player | P1 | Species/class/archetype remain English in Chinese UI. | Add content localization backlog. |
| B019 | New Chinese player | P1 | Join success messages mix Chinese and English. | Add localized content templates backlog. |
| B020 | New Chinese player | P1 | Director/enemy/intent text is English-heavy. | Add localized encounter content backlog. |
| B021 | New Chinese player | P2 | `Threat / Clues` labels are not localized. | Add meter label localization backlog. |
| B022 | New Chinese player | P1 | Point budget text is unclear in Chinese. | Add localized point-budget wording backlog. |
| B023 | New Chinese player | P1 | Attribute input range differs from backend rules. | Add rules/UI consistency task. |
| B024 | New Chinese player | P1 | Form API failures lack uniform inline errors. | Add form error handling task. |
| B025 | New Chinese player | P1 | Invite link is not obvious. | Add invite button backlog. |
| S001 | Host/DM | P0 | 5-player desktop table was around 2594px tall. | One-viewport shell. |
| S002 | Host/DM | P0 | Action form is pushed below audio, voice, and log. | Main log panel keeps composer visible. |
| S003 | Host/DM | P1 | Character creation is permanently in the left rail. | Party drawer. |
| S004 | Host/DM | P1 | 5-player roster is too verbose for scanning. | Roster stays in drawer; compact cards later. |
| S005 | Host/DM | P0 | Missing host command bar: pause, skip, end scene, adjust clocks. | Host-console feature backlog. |
| S006 | Host/DM | P0 | No skip/reorder active-player control. | State-machine host controls backlog. |
| S007 | Host/DM | P0 | Asset library inflates the right rail. | Asset library moves to GM drawer. |
| S008 | Host/DM | P1 | Asset cards have nested interactions. | Remove inline scene action later; detail drawer remains. |
| S009 | Host/DM | P1 | Scene rail hides names and scrollbars. | Keep rail compact; richer scene picker backlog. |
| S010 | Host/DM | P1 | Continuity lacks search, pinning, and categories. | Full memory library backlog. |
| S011 | Host/DM | P1 | Director suggestions are long and English. | Localized, role-aware director backlog. |
| S012 | Host/DM | P0 | Encounter lacks initiative, targets, and status controls. | Combat tracker backlog. |
| S013 | Host/DM | P1 | Threat/clue meters are not directly adjustable. | Host clock controls backlog. |
| S014 | Host/DM | P1 | Audio and voice occupy too much vertical space. | Compact mobile controls now; advanced drawer later. |
| S015 | Host/DM | P1 | Long log lacks unread jump affordance. | Full log drawer now; unread marker later. |
| S016 | Host/DM | P1 | Stale-action errors can appear off-screen. | Composer visible; toast/backlog for error recovery. |
| S017 | Host/DM | P1 | Room ID is buried in diagnostics. | Invite control backlog. |
| S018 | Host/DM | P2 | Diagnostics are visible to players. | Diagnostics stays in GM drawer; role split backlog. |
| S019 | Host/DM | P0 | Host-only information is visible to everyone. | Role-based UI backlog. |
| S020 | Host/DM | P0 | Narrow screens stack all panels vertically. | Mobile fixed table with drawers. |
| S021 | Host/DM | P2 | Guide is not state-aware. | Guided checklist backlog. |
| S022 | Host/DM | P1 | Asset detail body scroll is not locked. | Add body `asset-open` lock. |
| S023 | Host/DM | P0 | No host narration endpoint. | Host narration API backlog. |
| S024 | Host/DM | P2 | Chinese content catalog is incomplete. | Content localization backlog. |
| M001 | Mobile player | P1 | Mobile homepage join form barely fits. | Homepage mobile pass later. |
| M002 | Mobile player | P1 | Mobile hero copy displaces core entry form. | Homepage mobile pass later. |
| M003 | Mobile player | P0 | Mobile room page was over 9000px high. | Fixed mobile table. |
| M004 | Mobile player | P0 | `Join table` was more than 2000px down. | Party drawer entry. |
| M005 | Mobile player | P0 | Action form was around 2500-3000px down. | Composer in visible panel. |
| M006 | Mobile player | P0 | Logs start after audio controls. | Compact latest log flow. |
| M007 | Mobile player | P1 | Stage minimum height consumes too much mobile screen. | Mobile stage reduced to viewport-relative row. |
| M008 | Mobile player | P1 | Topbar wraps to a tall stack. | Mobile topbar grid compression. |
| M009 | Mobile player | P1 | `Begin scene` appears to non-host or scene stage. | Role visibility backlog. |
| M010 | Mobile player | P1 | Disabled start lacks explanation. | Disabled reason backlog. |
| M011 | Mobile player | P1 | Scene rail hides extra choices. | Scene picker backlog. |
| M012 | Mobile player | P2 | Scene buttons are image-only. | Labels/aria state backlog. |
| M013 | Mobile player | P1 | Audio console occupies 251-331px. | Hide advanced audio details on small screens. |
| M014 | Mobile player | P1 | Voice toolbar occupies another large block. | Hide advanced voice details on small screens. |
| M015 | Mobile player | P1 | Attribute grid becomes too long. | Compact builder backlog. |
| M016 | Mobile player | P1 | Roster appears after transcript. | Roster is now drawer. |
| M017 | Mobile player | P1 | Memory/director/encounter appears far below. | GM drawer. |
| M018 | Mobile player | P1 | Inline asset library contributes thousands of pixels. | GM drawer. |
| M019 | Mobile player | P2 | Asset filters are too tall on mobile. | Drawer filter refinement backlog. |
| M020 | Mobile player | P1 | Asset detail does not lock body scroll. | Add `asset-open` lock. |
| M021 | Mobile player | P1 | Drawer overscroll can bleed to background. | Set `overscroll-behavior: contain`. |
| M022 | Mobile player | P2 | Guide tabs are tall on mobile. | Guide compact tabs backlog. |
| M023 | Mobile player | P1 | No quick navigation for action/log/party/memory. | Topbar drawer buttons now. |
| M024 | Mobile player | P2 | Safe-area insets are not handled. | Safe-area polish backlog. |
| G001 | Heavy TRPG | P0 | Active actor is easy to miss. | Add state strip with turn. |
| G002 | Heavy TRPG | P0 | Initiative data is not rendered. | Combat tracker backlog. |
| G003 | Heavy TRPG | P0 | Encounter state lacks strong status badge. | Add state strip encounter value. |
| G004 | Heavy TRPG | P0 | Player cards lack conditions and danger warnings. | Roster detail backlog. |
| G005 | Heavy TRPG | P0 | Enemies lack status, resistance, distance, morale. | Encounter detail backlog. |
| G006 | Heavy TRPG | P0 | Host lacks critical control buttons. | Host console backlog. |
| G007 | Heavy TRPG | P1 | Quest progress is not visible. | Quest summary backlog. |
| G008 | Heavy TRPG | P1 | Deadline clock is not displayed. | Clock system backlog. |
| G009 | Heavy TRPG | P1 | Continuity is raw last-eight facts. | Memory library backlog. |
| G010 | Heavy TRPG | P1 | Facts are not typed by entity/source. | Typed memory backlog. |
| G011 | Heavy TRPG | P1 | Transcript lacks search and filters. | Full log drawer now; search later. |
| G012 | Heavy TRPG | P1 | Dice audit is not highlighted. | Roll audit card backlog. |
| G013 | Heavy TRPG | P1 | Action legality is not suggested. | Action suggestion backlog. |
| G014 | Heavy TRPG | P1 | Character inventory/resources lack UI. | Character detail backlog. |
| G015 | Heavy TRPG | P1 | Join form wastes space after setup. | Party drawer now; collapse later. |
| G016 | Heavy TRPG | P1 | Right rail mixes too many concerns. | GM drawer groups secondary concerns. |
| G017 | Heavy TRPG | P1 | Asset browser interferes with combat. | GM drawer. |
| G018 | Heavy TRPG | P1 | Scene selection is local and unclear. | Scene publication backlog. |
| G019 | Heavy TRPG | P1 | Director info can leak to players. | Role-based UI backlog. |
| G020 | Heavy TRPG | P2 | Audio controls have wrong hierarchy. | Compact controls backlog. |
| G021 | Heavy TRPG | P0 | Mobile must use tabs/drawers, not stacked panels. | Mobile drawers. |
| G022 | Heavy TRPG | P1 | Replay is too shallow. | Replay viewer backlog. |
| G023 | Heavy TRPG | P1 | Sync conflicts are understated. | Conflict UX backlog. |
| G024 | Heavy TRPG | P2 | Diagnostics occupy player space. | GM drawer and diagnostics backlog. |
| P001 | Accessibility | P0 | Small screens can lock core action outside viewport if composer is not visible. | Mobile fixed table rows and compact controls. |
| P002 | Accessibility | P1 | Desktop action composer can be clipped at 720px. | Compact table shell; verify with browser. |
| P003 | Accessibility | P1 | Drawer focus should move into the drawer. | Focus close button on open. |
| P004 | Accessibility | P1 | Closed drawers can remain tabbable. | Add `inert` to closed drawers. |
| P005 | Accessibility | P1 | Raw i18n keys can leak in nav. | Add bilingual keys. |
| P006 | Accessibility | P1 | Raw i18n keys can leak in state strip. | Add state-strip keys. |
| P007 | Accessibility | P0 | Mobile ordering must keep scene/action together. | Mobile grid keeps scene and transcript/action in first viewport. |
| P008 | Accessibility | P1 | Guide lacks focus trap. | Dialog manager backlog. |
| P009 | Accessibility | P1 | Asset detail lacks focus restoration. | Add body lock now; restoration backlog. |
| P010 | Accessibility | P1 | Drawer backdrop does not restrict focus. | Add inert closed drawers; broader focus trap later. |
| P011 | Accessibility | P1 | Player and character fields use placeholder-only labels. | Visible labels backlog. |
| P012 | Accessibility | P1 | Archetype select lacks label. | Builder accessibility backlog. |
| P013 | Accessibility | P1 | Submit label does not change for chat intent. | Dynamic composer label backlog. |
| P014 | Accessibility | P2 | Replay `Build` label is vague. | Rename in next copy pass. |
| P015 | Accessibility | P2 | Scene buttons need labels/current state. | Scene picker backlog. |
| P016 | Accessibility | P1 | Asset card has nested interactive controls. | Asset interaction cleanup backlog. |
| P017 | Accessibility | P1 | Audio/voice crowd core action. | Compact mobile controls; advanced drawer later. |
| P018 | Accessibility | P1 | Connection, log updates, errors need `aria-live`. | Accessibility backlog. |
| P019 | Accessibility | P1 | Submit flows need inline errors. | Form error backlog. |
| P020 | Accessibility | P2 | Disabled start button needs reason. | Start reason backlog. |
| P021 | Accessibility | P2 | Meters need individual labels. | Meter label backlog. |
| P022 | Accessibility | P2 | Motion should respect reduced-motion. | Reduced-motion backlog. |
| P023 | Accessibility | P2 | Topbar has too many peer controls. | Future command-menu grouping. |
| P024 | Accessibility | P2 | Content localization remains incomplete. | Content i18n backlog. |

## Implemented In 0006

- Added a persistent table state strip for turn, round, encounter state, and sync state.
- Added Party, GM, and Full Log drawers with scrim, close buttons, Escape handling, focus movement, and inert closed state.
- Changed the open-room shell to a fixed `100dvh` workspace so the page itself does not become a long scroll surface.
- Limited the main transcript to the latest five entries and moved the complete transcript to a drawer.
- Moved roster/join and continuity/director/encounter/replay/assets/metrics out of the main grid flow.
- Added mobile-specific viewport rows, compressed topbar actions, compact audio/voice controls, and bottom-sheet style drawers.
- Added bilingual copy for new navigation, drawers, state strip, and full-log count.
