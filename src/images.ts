export type ImageMap = {
  [key: string]: HTMLImageElement;
};

export async function loadImages(): Promise<ImageMap> {
  const images = [
    ['car', 'data/graphics/car.png'],
    // Backgrounds
    ['bgDebug', 'data/graphics/bg-debug.png'],
    ['bgGreen', 'data/graphics/bg-green.png'],
    ['bgDesert', 'data/graphics/bg-desert.png'],
    ['bgForest', 'data/graphics/bg-forest.png'],
    ['bgBeach', 'data/graphics/bg-beach.png'],
    // Decor - green
    ['decorGreenBush', 'data/graphics/decor-green-bush.png'],
    ['decorGreenTree', 'data/graphics/decor-green-tree.png'],
    ['decorGreenRock', 'data/graphics/decor-green-rock.png'],
    // Decor - desert
    ['decorDesertCactus', 'data/graphics/decor-desert-cactus.png'],
    ['decorDesertSand', 'data/graphics/decor-desert-sand.png'],
    ['decorDesertBush', 'data/graphics/decor-desert-bush.png'],
    // Decor - forest
    ['decorForestTree', 'data/graphics/decor-forest-tree.png'],
    ['decorForestSpruce', 'data/graphics/decor-forest-spruce.png'],
    // Decor - beach
    ['decorBeachBuoy', 'data/graphics/decor-beach-buoy.png'],
    // Prop - green
    ['propGreenBike', 'data/graphics/prop-green-bike.png'],
    ['propGreenRoadwork', 'data/graphics/prop-green-roadwork.png'],
    ['propGreenSheep', 'data/graphics/prop-green-sheep.png'],
    ['propGreenCar', 'data/graphics/prop-green-car.png'],
    ['propGreenTurtle', 'data/graphics/prop-green-turtle.png'],
    // Prop - desert
    ['propDesertTumbleweed', 'data/graphics/prop-desert-tumbleweed.png'],
    ['propDesertBike', 'data/graphics/prop-desert-bike.png'],
    // Prop - beach
    ['propBeachBarrel', 'data/graphics/prop-beach-barrel.png'],
    ['propBeachBarrelStand', 'data/graphics/prop-beach-barrel-stand.png'],
    ['propBeachDolphin', 'data/graphics/prop-beach-dolphin.png'],
    ['propBeachDolphinHead', 'data/graphics/prop-beach-dolphin-head.png'],

    // Upgrades
    ['upgrades', 'data/graphics/upgrades.png'],
    ['upgradeParachute', 'data/graphics/upgrade-parachute.png'],
    ['upgradeNitro', 'data/graphics/upgrade-nitro.png'],
    // Poles
    ['poleRed', 'data/graphics/pole-red.png'],
    ['poleGreen', 'data/graphics/pole-green.png'],
    ['poleEnergy', 'data/graphics/pole-energy.png'],
    // Menu
    ['menuBullet', 'data/graphics/menu-bullet.png'],
    ['ui', 'data/graphics/ui.png'],
    // Ending
    ['ufoLight', 'data/graphics/ufo-light-Sheet.png'],
    ['ufo', 'data/graphics/ufo.png'],
    // Intro
    ['intro', 'data/graphics/intro-Sheet.png'],
  ];

  const promises = images.map(async ([id, path]) => {
    return { id, image: await loadImage(path) };
  });

  const results = await Promise.all(promises);

  const map: ImageMap = {};

  results.forEach(({ id, image }) => {
    map[id] = image;
  });

  return map;
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
