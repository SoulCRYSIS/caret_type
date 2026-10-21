import { GameHost } from './GameHost'
import * as css from './play.css'

export default function PlayPage() {
  return (
    <div className={css.page}>
      <GameHost />
    </div>
  )
}
