export type ImageMap = {
  [key: string]: HTMLImageElement;
};

export async function loadImages(): Promise<ImageMap> {
  return {
    car: await loadImage('data/graphics/car.png'),
    bgDebug: await loadImage('data/graphics/bg-debug.png'),
    bgGreen: await loadImage('data/graphics/bg-green.png'),
    bgDesert: await loadImage('data/graphics/bg-desert.png'),
    // Decor - green
    decorBush: await loadImage('data/graphics/decor-bush.png'),
    decorTree: await loadImage('data/graphics/decor-tree.png'),
    decorRock: await loadImage('data/graphics/decor-rock.png'),
    // Decor - desert
    decorCactus: await loadImage('data/graphics/decor-cactus.png'),
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
