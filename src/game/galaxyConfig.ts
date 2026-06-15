import { NEBULA_COLORS, INNER_NEBULA_COLORS, SPIRAL_TWISTS } from "./constants";
import type { Rng } from "./types";

export class GalaxyConfig {
    numArms: number;
    galaxyEllipse: number;
    spiralTwist: number;
    numStars: number;
    innerNebulaColors: number[];
    nebulaColors: number[];
    baseAngleOffset: number;

    constructor(rng: Rng) {
        const randInt = (bound: number) => Math.floor(rng() * bound);
        this.numArms = randInt(4) + 2; // 2 to 5
        this.galaxyEllipse = rng() * 0.25 + 0.75 // 0.75 to 1
        this.spiralTwist = SPIRAL_TWISTS[this.numArms] ?? 2.0;
        this.numStars = randInt(300) + 400; // 300 to 700
        this.innerNebulaColors = INNER_NEBULA_COLORS[randInt(INNER_NEBULA_COLORS.length)];
        this.nebulaColors = NEBULA_COLORS[randInt(NEBULA_COLORS.length)];
        this.baseAngleOffset = 2 * Math.PI * rng();
    }
}
