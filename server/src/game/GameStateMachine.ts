import { GameState } from '@photoroulette/shared';

type TransitionEvent =
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'HOST_START'
  | 'COUNTDOWN_DONE'
  | 'ROUND_TIMER_EXPIRED'
  | 'ALL_GUESSED'
  | 'NEXT_ROUND'
  | 'LAST_ROUND'
  | 'VOTE_END'
  | 'PLAY_AGAIN';

interface Transition {
  from: GameState;
  to: GameState;
  event: TransitionEvent;
}

const transitions: Transition[] = [
  { from: GameState.WAITING_FOR_PLAYERS, to: GameState.LOBBY, event: 'PLAYER_JOINED' },
  { from: GameState.LOBBY, to: GameState.WAITING_FOR_PLAYERS, event: 'PLAYER_LEFT' },
  { from: GameState.LOBBY, to: GameState.STARTING, event: 'HOST_START' },
  { from: GameState.STARTING, to: GameState.ROUND_ACTIVE, event: 'COUNTDOWN_DONE' },
  { from: GameState.ROUND_ACTIVE, to: GameState.ROUND_RESULT, event: 'ROUND_TIMER_EXPIRED' },
  { from: GameState.ROUND_ACTIVE, to: GameState.ROUND_RESULT, event: 'ALL_GUESSED' },
  { from: GameState.ROUND_RESULT, to: GameState.STARTING, event: 'NEXT_ROUND' },
  { from: GameState.ROUND_RESULT, to: GameState.GAME_ENDED, event: 'LAST_ROUND' },
  { from: GameState.ROUND_RESULT, to: GameState.GAME_ENDED, event: 'VOTE_END' },
  { from: GameState.GAME_ENDED, to: GameState.LOBBY, event: 'PLAY_AGAIN' },
];

export class GameStateMachine {
  private _state: GameState;

  constructor(initialState: GameState = GameState.WAITING_FOR_PLAYERS) {
    this._state = initialState;
  }

  get state(): GameState {
    return this._state;
  }

  canTransition(event: TransitionEvent): boolean {
    return transitions.some((t) => t.from === this._state && t.event === event);
  }

  transition(event: TransitionEvent): GameState {
    const t = transitions.find((tr) => tr.from === this._state && tr.event === event);
    if (!t) {
      throw new Error(`Invalid transition: ${event} from state ${this._state}`);
    }
    this._state = t.to;
    return this._state;
  }

  reset() {
    this._state = GameState.WAITING_FOR_PLAYERS;
  }
}
