import classNames from "classnames";
import { ColorCircle } from "./ColorCircle";
import { RED_COLOR, GREEN_COLOR, BLUE_COLOR, PINK_COLOR } from "./Colors";

const defaultColors = [RED_COLOR, GREEN_COLOR, BLUE_COLOR, PINK_COLOR];

export function ColorSelector({ className, colors, selectedColor, onColorSelected = () => {} }) {
  function sameColors(color1, color2) {
    return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
  }

  return (
    <div className={classNames(className, "d-flex justify-content-center")}>
      {(colors ?? defaultColors).map((c, index) => (
        <ColorCircle
          key={index}
          id={index}
          color={c}
          isSelected={sameColors(c, selectedColor)}
          onSelected={() => onColorSelected(c)}
        />
      ))}
    </div>
  );
}
