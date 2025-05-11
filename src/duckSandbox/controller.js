class Controller {
    #xOffset = 0;
    #zOffset = 0;
    #yOffset = 0; 

    #speed = 0.2
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
        //elif so can't go multiple directions at once 

        if (this.#keysPressed.indexOf('w')>-1){
            this.#zOffset -= this.#speed;
            this.#rotation = 90;
        } 

        else if (this.#keysPressed.indexOf('s')>-1){ 
            this.#zOffset += this.#speed;
            this.#rotation = 270;
        }

        else if (this.#keysPressed.indexOf('a')>-1) {
            this.#xOffset -= this.#speed;
            this.#rotation = 180;
        }

        else if (this.#keysPressed.indexOf('d')>-1) {
            this.#xOffset += this.#speed;   
            this.#rotation =0;
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