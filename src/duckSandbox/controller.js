class Controller {
    #xOffset = 0;
    #zOffset = 0;
    #yOffset = 0; 

    #speed = 0.2
    #rotSpeed = 2.0;
    #rotation = 0;
    falling = false;


    #keysPressed = [];

    constructor() {
        document.addEventListener('keydown', this.#handleKeyDown.bind(this));
        document.addEventListener('keyup', this.#handleKeyUp.bind(this));
    }

    //add to keyspressed
    #handleKeyDown(event) {
        if (this.#keysPressed.indexOf(event.key.toLowerCase()) == -1) {
            this.#keysPressed.push(event.key.toLowerCase());
        }
    }

    //remove from keypressed
    #handleKeyUp(event) {
        var idx = this.#keysPressed.indexOf(event.key.toLowerCase());
        this.#keysPressed.splice(idx, 1);
    }


    //called from main loop
    update() {
        var rad = radians(this.#rotation);

        if (this.#keysPressed.indexOf('w') > -1) {
            this.#xOffset += this.#speed * Math.cos(rad);
            this.#zOffset -= this.#speed * Math.sin(rad);
        }

        if (this.#keysPressed.indexOf('s') > -1) {
            this.#xOffset -= this.#speed * Math.cos(rad);
            this.#zOffset += this.#speed * Math.sin(rad);
        }

        if (this.#keysPressed.indexOf('a') > -1) {
            this.#rotation -= this.#rotSpeed;
        }

        if (this.#keysPressed.indexOf('d') > -1) {
            this.#rotation += this.#rotSpeed;
        }
    }


    //getters
    getXOffset() {
        return this.#xOffset;
    }
    getZOffset() {
        return this.#zOffset;
    }
    getYOffset() {
        return this.#yOffset;
    }
    getRotation() {
        return this.#rotation; 
    }

    //setter
    offsetY(val) {
        this.#yOffset += val;
    }

    respawn() {
        this.#xOffset = 0;
        this.#zOffset = 0;
        this.#yOffset = 20;

        this.falling = false;
    }
}

var controller = new Controller();