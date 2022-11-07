import {
  createButton,
  createNumberInput,
  createLabel,
  createSection,
} from './core/debug';

export function installDebug({
  onMove,
  onSpeedChange,
  onAddTurn,
}: {
  onMove: (offset: number) => void;
  onSpeedChange: (speed: number) => void;
  onAddTurn: (args: { offset: number; size: number }) => void;
}) {
  const moveSection = createSection({ title: 'Move' });
  const moveButton = createButton({
    title: '+1',
    onClick: () => {
      onMove(1);
    },
  });
  const moveOffsetLabel = createLabel({ title: 'Offset' });
  const speedInput = createNumberInput({
    title: 'Speed',
    value: 3,
    onChange: onSpeedChange,
  });

  moveSection.addElement(moveButton.$element);
  moveSection.addElement(moveOffsetLabel.$element);
  moveSection.addElement(speedInput.$element);

  document.body.appendChild(moveSection.$element);

  const turnSection = createSection({ title: 'Turn' });

  const turnSizeInput = createNumberInput({
    title: 'Size',
    value: 1000,
    step: 100,
  });

  const turnAddButton = createButton({
    title: 'Add turn in 100',
    onClick: () => {
      onAddTurn({ offset: 100, size: turnSizeInput.getValue() });
    },
  });

  turnSection.addElement(turnSizeInput.$element);
  turnSection.addElement(turnAddButton.$element);

  document.body.appendChild(turnSection.$element);

  return {
    updateMoveOffsetLabel: moveOffsetLabel.update,
  };
}
