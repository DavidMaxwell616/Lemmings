import {
    W,
    H,
    SCALE,
    FIXED_DT,
    SPAWN_INTERVAL_MS,
} from "./config.js";

export class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    preload() {
        this.load.spritesheet("lemmings", "../assets/images/lemmings.png", {
            frameWidth: 64,
            frameHeight: 32
        });
        this.load.spritesheet("hatch", "../assets/images/hatch.png", {
            frameWidth: 41,
            frameHeight: 25
        });
        this.load.spritesheet("exit", "../assets/images/exit.png", {
            frameWidth: 41,
            frameHeight: 25
        });
        this.load.spritesheet("cursor", "../assets/images/crosshairs.png", {
            frameWidth: 15,
            frameHeight: 15
        });
        this.load.spritesheet("stat_numbers", "../assets/images/stat numbers.png", {
            frameWidth: 10,
            frameHeight: 10
        });
        this.load.spritesheet("lemmings_font", "../assets/images/Lemmings font.png", {
            frameWidth: 56,
            frameHeight: 60
        });

        this.load.json("levelData", "../assets/json/level_config.json");

        this.load.image("backgroundSource", "../assets/images/levels/level 01.png");
        this.load.image("dashboard", "../assets/images/dashboard.png");
    }

    create() {
        this.levelW = W;
        this.levelH = H * 0.7;
        this.level = 1;
        const src = this.textures.get("backgroundSource").getSourceImage();

        this.terrainCanvas = this.textures.createCanvas("terrain", this.levelW, this.levelH);
        this.terrainCtx = this.terrainCanvas.getContext();

        this.terrainCtx.drawImage(src, 0, 0, this.levelW, this.levelH);
        this.terrainCanvas.refresh();

        this.background = this.add.image(0, 0, "terrain").setOrigin(0);

        this.levelData = this.cache.json.get("levelData");
        this.currentLevel = this.levelData.level_1;

        this.hatchData = this.currentLevel.hatch_position;
        this.exitData = this.currentLevel.exit_position;
        this.lemmingTypes = this.currentLevel.lemming_types;

        this.totalLemmings = Object.values(this.lemmingTypes)
            .reduce((sum, count) => sum + count, 0);

        this.spawnedLemmings = 0;
        this.cursor = this.add.sprite(this.hatchData.x, this.hatchData.y, "cursor", 0);

        this.lemmings = [];
        this.levelStarted = false;
        this.hatchOpened = false;

        // --------------------------------------------------
        // Hatch sprite
        // --------------------------------------------------
        this.hatch = this.add.sprite(this.hatchData.x, this.hatchData.y, "hatch", 0);
        this.hatch.setOrigin(0.5, 0.5);
        this.hatch.setScale(1.5);

        this.anims.create({
            key: "hatch_open",
            frames: this.anims.generateFrameNumbers("hatch", {
                start: 0,
                end: 9
            }),
            frameRate: 10,
            repeat: 0
        });
        // --------------------------------------------------
        // Exit sprite
        // --------------------------------------------------
        this.exitData = this.levelData.level_1.exit_position;
        this.exit = this.add.sprite(this.exitData.x, this.exitData.y, "exit", 0);
        this.exit.setOrigin(0.5, 0.5);
        this.exit.setScale(2);

        this.anims.create({
            key: "exit_open",
            frames: this.anims.generateFrameNumbers("exit", {
                start: 0,
                end: 5
            }),
            frameRate: 10,
            repeat: -1
        });

        this.exit.play("exit_open");
        // --------------------------------------------------
        // Lemming walking animation
        // --------------------------------------------------
        this.anims.create({
            key: "lemming_walk",
            frames: this.anims.generateFrameNumbers("lemmings", {
                start: 0,
                end: 7
            }),
            frameRate: 8,
            repeat: -1
        });

        // --------------------------------------------------
        // Center title
        // --------------------------------------------------
        this.startText = this.add.text(W / 2, H / 2, "LEVEL 1", {
            fontFamily: "Arial",
            fontSize: "48px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 6
        });

        this.startText.setOrigin(0.5);
        this.startText.setInteractive({ useHandCursor: true });

        this.startText.on("pointerdown", () => {
            this.startLevel();
        });

        this.spaceKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        this.input.keyboard.on("keydown-SPACE", () => {
            if (!this.levelStarted) {
                this.startLevel();
            } else {
                for (const lemming of this.lemmings) {
                    if (lemming.isStopped) {
                        this.eraseTerrainUnder(lemming, 12);
                    }
                }
            }
        });

        this.input.on("pointerdown", pointer => {

            if (!this.levelStarted) {
                return;
            }

            for (const lemming of this.lemmings) {

                if (!lemming.active || lemming.isStopped) {
                    continue;
                }

                const bounds = lemming.getBounds();

                if (
                    Phaser.Geom.Rectangle.Contains(
                        bounds,
                        pointer.worldX,
                        pointer.worldY
                    )
                ) {

                    lemming.isStopped = true;

                    lemming.anims.stop();

                    // Optional: show blocker frame
                    // lemming.setFrame(BLOCKER_FRAME);

                    break;
                }
            }
        });
        this.dashboard = this.add.image(0, H * .7, "dashboard", 0);
        this.dashboard.setOrigin(0);
        this.dashboard.displayHeight = H * .2;
        this.dashboard.displayWidth = W;
    }

    createLemmingAnimations() {
        const mk = (key, sheet, frames, frameRate = 10, repeat = -1) => {
            if (this.anims.exists(key)) return;

            this.anims.create({
                key,
                frames: this.anims.generateFrameNumbers(sheet, {
                    frames
                }),
                frameRate,
                repeat
            });
        };
        mk("walker", "lemming", [0, 1, 2, 3, 4, 5, 6, 7], 8);
        mk("blocker", "lemming", [8, 9, 10, 11, 12, 13, 14, 15], 8);
        mk("builder", "lemming", [16, 17, 18, 19, 20, 21, 22, 23], 8);
        mk("digger", "lemming", [24, 25, 26, 27, 28, 29, 30, 31], 8);
        mk("basher", "lemming", [32, 33, 34, 35, 36, 37, 38, 39, 40], 8);
        mk("floater", "lemming", [49, 50, 51, 52, 53, 54, 55, 56], 8);
        mk("climber", "lemming", [57, 58, 59, 60, 61, 62, 63, 64], 8);

        mk("bomber", "lemming-bomber", [0, 1, 2, 3, 4, 5, 6, 7, 8], 8);
        mk("miner", "lemming-miner", [41, 42, 43, 44, 45, 46, 47, 48], 8);
    }


    checkExit(lemming) {

        const dx = lemming.x - this.exit.x;
        const dy = (lemming.y - 10) - this.exit.y;

        if (dx * dx + dy * dy < 18 * 18) {

            const index = this.lemmings.indexOf(lemming);

            if (index !== -1) {
                this.lemmings.splice(index, 1);
            }

            lemming.destroy();

            this.score += 100;

            return true;
        }

        return false;
    }
    startLevel() {
        if (this.levelStarted) return;

        this.levelStarted = true;
        this.startText.destroy();

        this.exit.setVisible(true);
        this.hatch.play("hatch_open");

        this.hatch.once("animationcomplete", () => {
            this.hatchOpened = true;
            this.startDroppingLemmings();
        });
    }

    startDroppingLemmings() {
        this.spawnLemming();

        this.spawnTimer = this.time.addEvent({
            delay: SPAWN_INTERVAL_MS,
            callback: () => {
                if (this.spawnedLemmings < this.totalLemmings) {
                    this.spawnLemming();
                }
            },
            loop: true
        });
    }
    getNextLemmingType() {
        for (const type in this.lemmingTypes) {
            if (this.lemmingTypes[type] > 0) {
                this.lemmingTypes[type]--;
                return type;
            }
        }

        return "walker";
    }
    spawnLemming() {
        if (this.spawnedLemmings >= this.totalLemmings) return;

        const lemming = this.add.sprite(
            this.hatchData.x,
            this.hatchData.y,
            "lemmings",
            0
        );

        lemming.setOrigin(0.5, 1);
        lemming.isStopped = false;
        lemming.type = this.getNextLemmingType();
        lemming.fallSpeed = 55;
        lemming.walkSpeed = 20;
        lemming.dir = 1;

        lemming.play("lemming_walk");

        this.lemmings.push(lemming);
        this.spawnedLemmings++;
    }

    update(time, delta) {
        const dt = delta / 1000;
        const pointer = this.input.activePointer;

        this.cursor.x = pointer.x;
        this.cursor.y = pointer.y;
        if (!this.levelStarted || !this.hatchOpened) return;

        for (const lemming of this.lemmings) {
            this.updateLemming(lemming, dt);
        }
    }
    updateLemming(lemming, dt) {

        if (!lemming.active) {
            return;
        }
        if (lemming.isStopped) {
            return;
        }
        if (this.checkExit(lemming)) {
            return;
        }
        if (this.checkExit(lemming)) {
            return;
        }
        const footX = Math.floor(lemming.x);
        const footY = Math.floor(lemming.y + 1);

        const groundBelow = this.hasTerrainPixelNear(footX, footY, 6);

        if (!groundBelow) {
            lemming.y += lemming.fallSpeed * dt;
            lemming.anims.pause();

            if (lemming.y > this.levelH + 80) {
                lemming.destroy();
            }

            return;
        }

        // Snap gently onto terrain
        // Snap down until feet are just touching terrain
        while (
            !this.hasTerrainPixelNear(
                Math.floor(lemming.x),
                Math.floor(lemming.y + 1),
                2
            )
        ) {
            lemming.y += 1;

            if (lemming.y > this.levelH + 80) {
                lemming.destroy();
                return;
            }
        }

        // If inside terrain, pop upward only until clear
        while (
            this.isTerrainPixel(
                Math.floor(lemming.x),
                Math.floor(lemming.y)
            )
        ) {
            lemming.y -= 1;
        }

        lemming.anims.resume();

        // --------------------------------------------------
        // Walking
        // --------------------------------------------------

        const step = lemming.dir > 0 ? 4 : -4;

        // check for wall at chest/head height
        const wallX = Math.floor(lemming.x + step);
        const wallY1 = Math.floor(lemming.y - 18);
        const wallY2 = Math.floor(lemming.y - 10);

        const hitWall =
            this.isTerrainPixel(wallX, wallY1) ||
            this.isTerrainPixel(wallX, wallY2);

        if (hitWall) {
            lemming.dir *= -1;
        } else {
            lemming.x += lemming.walkSpeed * lemming.dir * dt;
        }

        lemming.setFlipX(lemming.dir < 0);
    }

    isTerrainPixel(x, y) {

        if (
            x < 0 ||
            y < 0 ||
            x >= this.levelW ||
            y >= this.levelH
        ) {
            return false;
        }

        const pixel = this.terrainCtx.getImageData(
            x,
            y,
            1,
            1
        ).data;

        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const a = pixel[3];

        return a > 20 && (r + g + b) > 40;
    }
    hasTerrainPixelNear(x, y, radius = 4) {
        if (x < 0 || y < 0 || x >= this.levelW || y >= this.levelH) {
            return false;
        }

        const ctx = this.terrainCtx;

        for (let yy = y; yy < y + radius; yy++) {
            for (let xx = x - radius; xx <= x + radius; xx++) {
                if (xx < 0 || yy < 0 || xx >= this.levelW || yy >= this.levelH) {
                    continue;
                }

                const pixel = ctx.getImageData(xx, yy, 1, 1).data;

                const r = pixel[0];
                const g = pixel[1];
                const b = pixel[2];
                const a = pixel[3];

                // Black empty space is not terrain.
                // Colored/opaque pixels count as terrain.
                if (a > 20 && (r + g + b) > 40) {
                    return true;
                }
            }
        }

        return false;
    }

    eraseTerrainUnder(lemming, radius = 12) {
        const x = lemming.x;
        const y = lemming.y + 4;

        const ctx = this.terrainCtx;

        ctx.save();
        ctx.globalCompositeOperation = "destination-out";

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        this.terrainCanvas.refresh();
    }
}