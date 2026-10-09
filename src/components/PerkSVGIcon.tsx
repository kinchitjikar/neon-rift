import React from "react";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";
import { PowerUpType } from "../types/game";

interface PerkSVGIconProps {
  type: PowerUpType;
  size?: number;
}

export const PerkSVGIcon: React.FC<PerkSVGIconProps> = ({
  type,
  size = 28,
}) => {
  switch (type) {
    case "wide_paddle":
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect
            x="2"
            y="12"
            width="28"
            height="8"
            rx="4"
            fill="#00F0FF"
            opacity={0.3}
          />
          <Rect x="4" y="14" width="24" height="4" rx="2" fill="#00F0FF" />
          <Path
            d="M2 16L7 11M2 16L7 21"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Path
            d="M30 16L25 11M30 16L25 21"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </Svg>
      );

    case "multi_ball":
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Circle cx="16" cy="11" r="5.5" fill="#FFE600" />
          <Circle cx="9" cy="21" r="4.5" fill="#FFBB00" />
          <Circle cx="23" cy="21" r="4.5" fill="#FFBB00" />
          <Circle cx="16" cy="11" r="2" fill="#FFFFFF" opacity={0.6} />
        </Svg>
      );

    case "shield":
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Path
            d="M16 3L5 8V16C5 22.5 10 27.5 16 29C22 27.5 27 22.5 27 16V8L16 3Z"
            fill="#00FF66"
            opacity={0.3}
          />
          <Path
            d="M16 5L7 9V16C7 21.2 11 25.2 16 26.5C21 25.2 25 21.2 25 16V9L16 5Z"
            stroke="#00FF66"
            strokeWidth="2.5"
            fill="none"
          />
          <Path
            d="M12 16L15 19L20 13"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </Svg>
      );

    // case 'slow_motion':
    //   return (
    //     <Svg width={size} height={size} viewBox="0 0 32 32">
    //       <Path d="M8 6H24M8 26H24" stroke="#B000FF" strokeWidth="3" strokeLinecap="round" />
    //       <Path d="M10 6L16 16L22 6" stroke="#B000FF" strokeWidth="2" fill="none" />
    //       <Path d="M10 26L16 16L22 26" stroke="#B000FF" strokeWidth="2" fill="none" />
    //       <Circle cx="16" cy="16" r="2.5" fill="#FFFFFF" />
    //     </Svg>
    //   );

    default:
      return null;
  }
};
