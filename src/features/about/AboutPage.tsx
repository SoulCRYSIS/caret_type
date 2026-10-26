import { heading, page, section, sectionTitle, sub } from '../settings/settings.css'
import * as css from './about.css'

const REPO = 'https://github.com/SoulCRYSIS/caret_type'
const RESUME = 'https://drive.google.com/file/d/1M8r5iPYXRMZb9moLSw3wwq1QxAmqUdVR/view?usp=drive_link'
const MAIL = 'ohm9411@gmail.com'

export default function AboutPage() {
  return (
    <div className={page}>
      <h1 className={heading}>about me</h1>
      <p className={sub}>The game, and the person who made it.</p>

      <section className={section}>
        <h2 className={sectionTitle}>the game</h2>
        <div className={css.prose}>
          <p>caret is a typing game for learning to type by playing. Words drift down the page like ink, and you type each one before it spills.</p>
          <p>It is inspired by Monkeytype. The same idea of sitting down to type, with a game built around the practice.</p>
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>me</h2>
        <div className={css.prose}>
          <p>I am a frontend programmer, and I like making games. caret is one of them.</p>
          <p>
            The source is on <a className={css.link} href={REPO} target="_blank" rel="noreferrer">GitHub</a>.
          </p>
          <p>
            I am open for a job. My <a className={css.link} href={RESUME} target="_blank" rel="noreferrer">resume</a> is here. For work, or a suggestion for the game, write to{' '}
            <a className={css.link} href={`mailto:${MAIL}`}>{MAIL}</a>.
          </p>
        </div>
      </section>
    </div>
  )
}
