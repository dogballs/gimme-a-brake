type DebugRangeItemConfig = {
  type: 'range';
  box: DebugBox;
  title?: string;
  initial?: number;
  min?: number;
  max?: number;
  step?: number;
};

type DebugButtonItemConfig = {
  type: 'button';
  title?: string;
  onClick?: () => void;
};

type DebugItemConfig = DebugRangeItemConfig | DebugButtonItemConfig;

type DebugSectionConfig = {
  title?: string;
  items?: DebugItemConfig[];
};

type DebugConfig = {
  sections?: DebugSectionConfig[];
  parent?: HTMLElement;
};

class DebugBox {
  value: number;
  $input: HTMLInputElement;

  constructor(initialValue = 0) {
    this.value = initialValue;
  }

  attach($input, initial) {
    this.$input = $input;
    this.value = initial;
    this.$input.value = this.value.toString();
  }

  set(value: number) {
    this.value = value;
    this.$input.value = value.toString();
  }

  get() {
    if (!this.$input) {
      return this.value;
    }
    return Number(this.$input.value);
  }
}

export function createDebugBox(initial: number = 0) {
  return new DebugBox(initial);
}

export function createDebugPanel({
  sections = [],
  parent = document.body,
}: DebugConfig) {
  const $container = document.createElement('div');

  sections.forEach((sectionConfig) => {
    const $section = createSection(sectionConfig);
    $container.appendChild($section);
  });

  parent.appendChild($container);
}

function createSection({
  items = [],
  title = '(section)',
}: DebugSectionConfig) {
  const $section = document.createElement('fieldset');

  const $title = document.createElement('legend');
  $title.textContent = title;
  $section.appendChild($title);

  if (items.length > 0) {
    items.forEach((itemConfig) => {
      let $item;
      switch (itemConfig.type) {
        case 'range':
          $item = createRangeItem(itemConfig);
          break;
        case 'button':
          $item = createButtonItem(itemConfig);
          break;
        default:
          throw new Error(`Not supported debug item type "${itemConfig}"`);
      }
      $section.appendChild($item);
    });
  }

  return $section;
}

function createRangeItem({
  title = '(range)',
  box,
  initial = 0,
  min = 0,
  max = 100,
  step = 1,
}: DebugRangeItemConfig) {
  const $container = document.createElement('div');

  const $title = document.createElement('span');
  $title.textContent = title;
  $container.appendChild($title);

  const $input = document.createElement('input');
  $input.type = 'range';
  $input.min = min.toString();
  $input.max = max.toString();
  $input.step = step.toString();

  $container.appendChild($input);

  box.attach($input, initial);

  return $container;
}

function createButtonItem({
  title = '(button)',
  onClick = () => {},
}: DebugButtonItemConfig) {
  const $button = document.createElement('button');
  $button.textContent = title;
  $button.addEventListener('click', () => {
    onClick();
  });
  return $button;
}
