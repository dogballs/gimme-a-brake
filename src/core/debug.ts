// type DebugRangeItemConfig = {
//   type: 'range';
//   box: DebugBox;
//   title?: string;
//   initial?: number;
//   min?: number;
//   max?: number;
//   step?: number;
// };

// export function createPanel({
//   sections = [],
//   parent = document.body,
// }: DebugConfig) {
//   const $container = document.createElement('div');

//   sections.forEach((sectionConfig) => {
//     const $section = createSection(sectionConfig);
//     $container.appendChild($section);
//   });

//   parent.appendChild($container);

//   const getValues = () => {};

//   return {
//     getValues,
//   };
// }

export function createSection({
  title = '(section)',
}: {
  title?: string;
} = {}) {
  const $section = document.createElement('fieldset');

  const $title = document.createElement('legend');
  $title.textContent = title;
  $section.appendChild($title);

  const addElement = ($element) => {
    $section.appendChild($element);
  };

  return {
    $element: $section,
    addElement,
  };
}

// function createRangeItem({
//   title = '(range)',
//   box,
//   initial = 0,
//   min = 0,
//   max = 100,
//   step = 1,
// }: DebugRangeItemConfig) {
//   const $container = document.createElement('div');

//   const $title = document.createElement('span');
//   $title.textContent = title;
//   $container.appendChild($title);

//   const $value = document.createElement('span');

//   const updateValueText = () => {
//     $value.textContent = $input.value;
//   };

//   const $input = document.createElement('input');
//   $input.type = 'range';
//   $input.min = min.toString();
//   $input.max = max.toString();
//   $input.step = step.toString();
//   // $input.addEventListener('input', updateValueText);

//   $container.appendChild($input);
//   $container.appendChild($value);

//   // box.attach($input, initial);
//   // updateValueText();

//   const getValue = () => {
//     return $input.value;
//   };

//   return {
//     $container,
//     getValue,
//   };
// }

export function createButton({
  title = '(button)',
  onClick = () => {},
}: {
  title?: string;
  onClick?: () => void;
}) {
  const $button = document.createElement('button');
  $button.style.marginRight = '5px';
  $button.textContent = title;
  $button.addEventListener('click', () => {
    onClick();
  });

  return {
    $element: $button,
  };
}

export function createNumberInput({
  title = '(input)',
  value = 0,
  step = 1,
}: {
  title?: string;
  value?: number;
  step?: number;
} = {}) {
  const $container = document.createElement('span');
  $container.style.marginRight = '10px';

  const $title = document.createElement('span');
  $title.textContent = title + ': ';
  $container.appendChild($title);

  const $input = document.createElement('input');
  $input.type = 'number';
  $input.value = value.toString();
  $input.step = step.toString();
  $input.size = 8;

  $container.appendChild($title);
  $container.appendChild($input);

  const getValue = () => {
    return Number($input.value);
  };

  const getNumber = () => {
    return $input.value;
  };

  return {
    $element: $container,
    getValue,
  };
}

export function createLabel({ title = '(text)' }: { title?: string } = {}) {
  const $container = document.createElement('span');
  $container.style.marginRight = '10px';

  const $title = document.createElement('span');
  $title.textContent = `${title}: `;
  $container.appendChild($title);

  const $text = document.createElement('span');
  $text.textContent = '(no value)';
  $container.appendChild($text);

  const update = (text: string) => {
    $text.textContent = text;
  };

  return {
    $element: $container,
    update,
  };
}
