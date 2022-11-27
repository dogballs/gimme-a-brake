export type ImageMap = {
  [key: string]: HTMLImageElement;
};

export async function loadImages(): Promise<ImageMap> {
  return {
    car: await loadImage('data/graphics/car.png'),
    // Backgrounds
    bgDebug: await loadImage('data/graphics/bg-debug.png'),
    bgGreen: await loadImage('data/graphics/bg-green.png'),
    bgDesert: await loadImage('data/graphics/bg-desert.png'),
    bgForest: await loadImage('data/graphics/bg-forest.png'),
    bgBeach: await loadImage('data/graphics/bg-beach.png'),
    // Decor - green
    decorGreenBush: await loadImage('data/graphics/decor-green-bush.png'),
    decorGreenTree: await loadImage('data/graphics/decor-green-tree.png'),
    decorGreenRock: await loadImage('data/graphics/decor-green-rock.png'),
    // Decor - desert
    decorDesertCactus: await loadImage('data/graphics/decor-desert-cactus.png'),
    decorDesertSand: await loadImage('data/graphics/decor-desert-sand.png'),
    decorDesertBush: await loadImage('data/graphics/decor-desert-bush.png'),
    // Decor - forest
    decorForestTree: await loadImage('data/graphics/decor-forest-tree.png'),
    decorForestSpruce: await loadImage('data/graphics/decor-forest-spruce.png'),
    // Decor - beach
    decorBeachBuoy: await loadImage('data/graphics/decor-beach-buoy.png'),
    // Prop - green
    propGreenBike: await loadImage('data/graphics/prop-green-bike.png'),
    propGreenRoadwork: await loadImage('data/graphics/prop-green-roadwork.png'),
    propGreenSheep: await loadImage('data/graphics/prop-green-sheep.png'),
    propGreenCar: await loadImage('data/graphics/prop-green-car.png'),
    propGreenTurtle: await loadImage('data/graphics/prop-green-turtle.png'),

    // Upgrades
    upgrades: await loadImage('data/graphics/upgrades.png'),
    // Poles
    poleRed: await loadImage('data/graphics/pole-red.png'),
    poleGreen: await loadImage('data/graphics/pole-green.png'),
    poleEnergy: await loadImage('data/graphics/pole-energy.png'),
    // Menu
    menuBullet: await loadImage('data/graphics/menu-bullet.png'),
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
