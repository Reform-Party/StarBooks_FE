import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import JellyStar from '@/components/ui/jelly-star';
import { STAR } from '@/constants/colors';
import { SCREEN } from '@/constants/layout';

type Point = {
  x: number;
  y: number;
};

type Props = {
  firstPoint: Point;
  lastPoint: Point;
  hasPrevious: boolean;
  hasNext: boolean;
};

const PREVIEW_SIZE = 72.48;
const PREVIEW_HEIGHT = PREVIEW_SIZE * (34.2436 / 35.4151);
const EDGE_Y = 260;

export default function ConstellationEdgeHints({
  firstPoint,
  lastPoint,
  hasPrevious,
  hasNext,
}: Props) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.clip]}
    >
      <Svg width={SCREEN.width} height={SCREEN.height}>
        {hasPrevious ? (
          <Line
            x1={0}
            y1={EDGE_Y}
            x2={firstPoint.x}
            y2={firstPoint.y}
            stroke={STAR.yellow.rim}
            strokeWidth={2}
            strokeOpacity={0.3}
            strokeDasharray="5 7"
            strokeLinecap="round"
          />
        ) : null}

        {hasNext ? (
          <Line
            x1={lastPoint.x}
            y1={lastPoint.y}
            x2={SCREEN.width}
            y2={EDGE_Y}
            stroke={STAR.yellow.rim}
            strokeWidth={2}
            strokeOpacity={0.3}
            strokeDasharray="5 7"
            strokeLinecap="round"
          />
        ) : null}
      </Svg>

      {hasPrevious ? (
        <View style={[styles.preview, styles.leftPreview]}>
          <JellyStar size={PREVIEW_SIZE} color="yellow" />
        </View>
      ) : null}

      {hasNext ? (
        <View style={[styles.preview, styles.rightPreview]}>
          <JellyStar size={PREVIEW_SIZE} color="yellow" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  preview: {
    position: 'absolute',
    top: EDGE_Y - PREVIEW_HEIGHT / 2,
    width: PREVIEW_SIZE,
    height: PREVIEW_HEIGHT,
    opacity: 0.5,
  },
  leftPreview: {
    left: -PREVIEW_SIZE / 2,
  },
  rightPreview: {
    right: -PREVIEW_SIZE / 2,
  },
});
