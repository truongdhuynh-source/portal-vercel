import "./ColorCircle.scss";

export function ColorCircle({ isSelected, color, onSelected = () => {}, id }) {
  const circleId = `circle-id-${id}`;

  return (
    <div className="color-circle" data-testid={`color-circle-${color.name}`}>
      <input
        type="radio"
        name="color"
        id={circleId}
        checked={isSelected}
        onChange={(e) => {
          if (e.target.checked) {
            onSelected();
          }
        }}
      />
      <label htmlFor={circleId}>
        <span className="circle" style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }} />
      </label>
    </div>
  );
}
