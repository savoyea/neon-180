export default function AtwBoard({ game, mode }) {
  const d = mode.boardData(game)
  return (
    <div className="atw-target">
      <div className="big">{d.big}</div>
      <small>{d.label}</small>
    </div>
  )
}
