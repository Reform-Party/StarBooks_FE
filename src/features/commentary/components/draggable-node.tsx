import { type GestureResponderEvent, StyleSheet } from 'react-native';

import type { GameNode } from '@/features/commentary/api/types';
import StarNode from '@/features/commentary/components/star-node';
import type { Point } from '@/features/commentary/constants/layout';
import { CATEGORY_COLOR } from '@/features/commentary/utils/game-logic';

export type LineDrag = {
  blocked: boolean;
  tap: (id: number) => void;
  start: (id: number, pageX: number, pageY: number) => void;
  move: (pageX: number, pageY: number) => void;
  end: (pageX: number, pageY: number) => void;
  cancel: () => void;
};

type Props = { node: GameNode; at: Point; selected: boolean; drag: LineDrag };

const page = (e: GestureResponderEvent) => [e.nativeEvent.pageX, e.nativeEvent.pageY] as const;

// 관계 잇기 단계의 별. 별에서 손가락으로 선을 긋거나, 두 별을 차례로 톡 · 톡 눌러 이어요.
export default function DraggableNode({ node, at, selected, drag }: Props) {
  return (
    <StarNode
      color={CATEGORY_COLOR[node.category]}
      name={node.word}
      cx={at.x}
      cy={at.y}
      selected={selected}
      panHandlers={{
        onStartShouldSetResponder: () => !drag.blocked,
        onMoveShouldSetResponder: () => !drag.blocked,
        onResponderGrant: (e) => drag.start(node.id, ...page(e)),
        onResponderMove: (e) => drag.move(...page(e)),
        onResponderRelease: (e) => drag.end(...page(e)),
        onResponderTerminate: () => drag.cancel(),
        onResponderTerminationRequest: () => false,
      }}
      style={styles.node}
      accessibilityLabel={`${node.word} 별. 두 별을 차례로 눌러 이어요`}
      onAccessibilityTap={() => drag.tap(node.id)}
    />
  );
}

const styles = StyleSheet.create({ node: { zIndex: 3 } });
