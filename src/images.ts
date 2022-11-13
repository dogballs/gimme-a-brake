export type ImageMap = {
  [key: string]: HTMLImageElement;
};

export async function loadImages(): Promise<ImageMap> {
  return {
    car: await loadImage('data/graphics/car.png'),
    bg1: await loadImage('data/graphics/bg1.png'),
    bg2: await loadImage('data/graphics/bg2.png'),
    bush: await loadImage('data/graphics/bush.png'),
    tree: await loadImage('data/graphics/tree.png'),
    rock: await loadImage('data/graphics/rock.png'),
  };
}

async function loadImage(imagePath: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.src = imagePath;
    image.addEventListener('load', () => {
      resolve(image);
    });
  });
}
