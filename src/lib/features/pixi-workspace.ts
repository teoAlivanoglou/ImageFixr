import {
    Application,
    BlurFilter,
    Container,
    Rectangle,
    Sprite,
    Texture,
    TextureStyle,
} from "pixi.js";

export type UploadTarget = "foreground" | "background";

export type SpriteNames = {
    foregroundName: string;
    backgroundName: string;
};

const LOGICAL_WIDTH = 1920;
const FALLBACK_BACKGROUND_NAME = "Using foreground";

export class PixiWorkspace {
    private app: Application | undefined;
    private scene: Container | undefined;
    private readonly blurFilter = new BlurFilter({ strength: 0 });
    private mySprite: Sprite | undefined;
    private backgroundSprite: Sprite | undefined;
    private foregroundBaseScale = 1;
    private foregroundName = "";
    private backgroundName = "";
    private aspectWidth = 16;
    private aspectHeight = 9;
    private scaleValue = 1;
    private resizeHandler: (() => void) | undefined;

    constructor(private readonly container: HTMLElement) { }

    async init(): Promise<void> {
        const app = new Application();

        await app.init({ resizeTo: this.container, backgroundColor: 0x1099bb });

        this.app = app;
        this.container.appendChild(app.canvas);

        this.scene = new Container();
        app.stage.addChild(this.scene);

        this.resizeHandler = () => this.resizeScene();
        window.addEventListener("resize", this.resizeHandler);

        this.resizeScene();
    }

    destroy(): void {
        if (this.resizeHandler) {
            window.removeEventListener("resize", this.resizeHandler);
            this.resizeHandler = undefined;
        }

        if (!this.app) return;

        this.app.destroy(true, {
            children: true,
            texture: true,
            textureSource: false,
            context: true,
            style: true,
        });

        this.app = undefined;
        this.scene = undefined;
        this.mySprite = undefined;
        this.backgroundSprite = undefined;
    }

    setBlurStrength(blurStrength: number): void {
        this.blurFilter.strength = blurStrength;
    }

    setScale(actualScale: number): void {
        this.scaleValue = actualScale;

        if (this.mySprite) {
            this.mySprite.scale.set(this.foregroundBaseScale * actualScale);
        }
    }

    setAspectRatio(aspectRatio: string): void {
        const [width, height] = aspectRatio.split(":").map(Number);

        if (!width || !height) return;

        this.aspectWidth = width;
        this.aspectHeight = height;

        this.resizeScene();
    }

    setFilteringMode(mode: "linear" | "nearest"): void {
        TextureStyle.defaultOptions.scaleMode = mode;
    }

    getNames(): SpriteNames {
        return {
            foregroundName: this.foregroundName,
            backgroundName: this.backgroundName,
        };
    }

    async loadImage(file: File, target: UploadTarget): Promise<SpriteNames> {
        if (!this.scene) return this.getNames();

        const objectUrl = URL.createObjectURL(file);

        try {
            const image = new Image();

            image.src = objectUrl;
            await image.decode();

            const texture = Texture.from(image);

            texture.source.scaleMode = "linear";

            if (target === "foreground") {
                const usingForegroundFallback =
                    this.backgroundName === "" ||
                    this.backgroundName === FALLBACK_BACKGROUND_NAME;

                if (this.mySprite) this.scene.removeChild(this.mySprite).destroy();

                if (usingForegroundFallback && this.backgroundSprite) {
                    this.scene.removeChild(this.backgroundSprite).destroy();
                    this.backgroundSprite = undefined;
                }

                this.mySprite = new Sprite(texture);
                this.mySprite.anchor.set(0.5);
                this.mySprite.filters = [this.blurFilter];

                if (usingForegroundFallback) {
                    this.backgroundSprite = new Sprite(texture);
                    this.backgroundSprite.anchor.set(0.5);
                    this.scene.addChildAt(this.backgroundSprite, 0);
                }

                this.scene.addChild(this.mySprite);
                this.foregroundName = file.name;
                this.backgroundName = usingForegroundFallback
                    ? FALLBACK_BACKGROUND_NAME
                    : this.backgroundName;
            } else {
                if (this.backgroundSprite) this.scene.removeChild(this.backgroundSprite).destroy();

                this.backgroundSprite = new Sprite(texture);
                this.backgroundSprite.anchor.set(0.5);
                this.scene.addChildAt(this.backgroundSprite, 0);
                this.backgroundName = file.name;
            }

            this.updateImageLayout();
            return this.getNames();
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    }

    removeImage(target: UploadTarget): SpriteNames {
        if (!this.scene) return this.getNames();

        if (target === "foreground") {
            const usingForegroundFallback =
                this.backgroundName === "" || this.backgroundName === FALLBACK_BACKGROUND_NAME;

            if (this.mySprite) {
                this.scene.removeChild(this.mySprite).destroy();
                this.mySprite = undefined;
            }

            if (usingForegroundFallback && this.backgroundSprite) {
                this.scene.removeChild(this.backgroundSprite).destroy();
                this.backgroundSprite = undefined;
                this.backgroundName = "";
            }

            this.foregroundName = "";
            this.foregroundBaseScale = 1;
        } else if (
            this.backgroundSprite &&
            this.backgroundName !== FALLBACK_BACKGROUND_NAME
        ) {
            this.scene.removeChild(this.backgroundSprite).destroy();
            this.backgroundSprite = undefined;
            this.backgroundName = "";

            if (this.mySprite) {
                this.backgroundSprite = new Sprite(this.mySprite.texture);
                this.backgroundSprite.anchor.set(0.5);
                this.scene.addChildAt(this.backgroundSprite, 0);
                this.backgroundName = FALLBACK_BACKGROUND_NAME;
            }
        }

        this.updateImageLayout();
        return this.getNames();
    }

    async renderAndSave(): Promise<void> {
        if (!this.app?.canvas || !this.mySprite) return;

        const exportCanvas = document.createElement("canvas");

        exportCanvas.width = 1920;
        exportCanvas.height = 1080;

        const context = exportCanvas.getContext("2d");

        if (!context) return;

        const extractedCanvas = this.app.renderer.extract.canvas({
            target: this.app.stage,
            frame: new Rectangle(0, 0, this.app.screen.width, this.app.screen.height),
        });

        context.fillStyle = "#1099bb";
        context.fillRect(0, 0, 1920, 1080);
        context.drawImage(extractedCanvas as unknown as CanvasImageSource, 0, 0, 1920, 1080);

        const imageBlob = await new Promise<Blob | null>((resolve) =>
            exportCanvas.toBlob(resolve, "image/png"),
        );

        if (!imageBlob) return;

        const saveFilePicker = (
            window as unknown as {
                showSaveFilePicker?: (options: {
                    suggestedName: string;
                    types: Array<{
                        description: string;
                        accept: Record<string, string[]>;
                    }>;
                }) => Promise<{
                    createWritable: () => Promise<{
                        write: (data: Blob) => Promise<void>;
                        close: () => Promise<void>;
                    }>;
                }>;
            }
        ).showSaveFilePicker;

        if (saveFilePicker) {
            const fileHandle = await saveFilePicker({
                suggestedName: "image-fixr-render.png",
                types: [{ description: "PNG image", accept: { "image/png": [".png"] } }],
            });

            const writable = await fileHandle.createWritable();

            await writable.write(imageBlob);
            await writable.close();

            return;
        }

        const downloadUrl = URL.createObjectURL(imageBlob);
        const downloadLink = document.createElement("a");

        downloadLink.href = downloadUrl;
        downloadLink.download = "image-fixr-render.png";
        downloadLink.click();
        URL.revokeObjectURL(downloadUrl);
    }

    getApplication(): Application | undefined {
        return this.app;
    }

    private getLogicalHeight(): number {
        return (LOGICAL_WIDTH * this.aspectHeight) / this.aspectWidth;
    }

    private updateImageLayout(): void {
        if (!this.scene) return;

        const logicalHeight = this.getLogicalHeight();

        if (this.backgroundSprite) {
            const backgroundScale = Math.max(
                LOGICAL_WIDTH / this.backgroundSprite.texture.width,
                logicalHeight / this.backgroundSprite.texture.height,
            );

            this.backgroundSprite.scale.set(backgroundScale);
            this.backgroundSprite.position.set(LOGICAL_WIDTH / 2, logicalHeight / 2);
        }

        if (this.mySprite) {
            this.foregroundBaseScale = Math.min(
                (LOGICAL_WIDTH * 0.8) / this.mySprite.texture.width,
                (logicalHeight * 0.8) / this.mySprite.texture.height,
            );
            this.mySprite.scale.set(this.foregroundBaseScale * this.scaleValue);
            this.mySprite.position.set(LOGICAL_WIDTH / 2, logicalHeight / 2);
        }
    }

    private resizeScene(): void {
        if (!this.app || !this.scene) return;

        this.app.renderer.resize(this.container.clientWidth, this.container.clientHeight);

        const logicalHeight = this.getLogicalHeight();
        const scale = Math.min(
            this.app.screen.width / LOGICAL_WIDTH,
            this.app.screen.height / logicalHeight,
        );

        this.scene.scale.set(scale);
        this.scene.x = (this.app.screen.width - LOGICAL_WIDTH * scale) / 2;
        this.scene.y = (this.app.screen.height - logicalHeight * scale) / 2;
        this.updateImageLayout();
    }
}
