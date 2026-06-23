import { H, W } from "./config.js";
export class SplashScene extends Phaser.Scene {
    constructor() {
        super("SplashScene");
    }

    preload() {
        this.load.image("splash", "assets/images/splash.png");
    }

    create() {
        this.splash = this.add.image(this.scale.width / 2, this.scale.height / 2, "splash");
        this.splash.displayHeight = H;
        this.splash.displayWidth = W;
        this.input.keyboard.once("keydown-SPACE", () => {
            this.scene.start("GameScene");
        });
    }
}