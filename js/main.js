import { SplashScene } from "./SplashScene.js"
import { GameScene } from "./GameScene.js"

const config = {

    type: Phaser.AUTO,
    parent: "game",

    width: 960,
    height: 540,


    scene: [
        SplashScene,
        GameScene
    ],

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }

}

new Phaser.Game(config)