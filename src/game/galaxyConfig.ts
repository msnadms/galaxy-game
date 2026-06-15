import { NEBULA_COLORS, SPIRAL_TWISTS } from "./constants";
import type { Rng } from "./types";

export class GalaxyConfig {
    numArms: number;
    galaxyEllipse: number;
    spiralTwist: number;
    numStars: number;
    nebulaColors: number[];
    baseAngleOffset: number;

    constructor(rng: Rng) {
        const randInt = (bound: number) => Math.floor(rng() * bound);
        this.numArms = randInt(2) + 2; // 2, 3, or 4
        this.galaxyEllipse = rng() * 0.5 + 0.5; // 0.5 to 1
        this.spiralTwist = SPIRAL_TWISTS[this.numArms];
        this.numStars = randInt(300) + 200; // 200 to 500
        this.nebulaColors = NEBULA_COLORS[randInt(NEBULA_COLORS.length)];
        this.baseAngleOffset = 2 * Math.PI * rng();
    }

}