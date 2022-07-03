export function createRangeValue({
  initialValue = 0,
  min = 0,
  max = 100,
  step = 1,
  title = '',
  parent = document.body,
}: {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
  title?: string;
  parent?: HTMLElement;
}) {
  const container = document.createElement('div');

  const titleElement = document.createElement('span');
  titleElement.textContent = title;
  container.appendChild(titleElement);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = min.toString();
  input.max = max.toString();
  input.step = step.toString();
  input.value = initialValue.toString();

  container.appendChild(input);

  parent.appendChild(container);

  const rangeValue = {
    get() {
      return Number(input.value);
    },
    set(value: number) {
      input.value = value.toString();
    },
  };

  return rangeValue;
}
