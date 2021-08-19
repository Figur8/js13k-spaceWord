const canvasWidth = 750;
const canvasHeight = 400;
const restitution = 0.90;

let canvas;
let context;
let secondsPassed = 0;
let oldTimeStamp = 0;
let gameObjects;
let mouseX = 300
let mouseY = 300
let words = []
let word = ""

window.onload = init;

class GameObject {
    constructor (context, x, y, vx, vy) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isColliding = false;
    }
}

class MainCharacter extends GameObject {
    constructor(context, x, y, vx, vy) {
        super(context, x, y, vx, vy);
        this.width = 50;
        this.height = 0;
        this.radius = 30
        canvas.addEventListener("mousemove", this.setMousePosition, false);
    }
    draw() {
        this.context.fillStyle = this.isColliding?'#2C2C2C':'#C0C0C0';
        this.context.beginPath();
        this.context.arc(mouseX, mouseY, this.radius, 0, 2 * Math.PI, false);
        this.context.fill();
    }
    update() {
        //TODO - precisa calcular velocidade com o mouse
        this.x = mouseX;
        this.y = mouseY;
    }
    setMousePosition(e) {
        let canvasPos = getPosition(canvas)
        mouseX = e.clientX - canvasPos.x;
        mouseY = e.clientY - canvasPos.y;
    }
}

function getPosition(el) {
    let xPosition = 0;
    let yPosition = 0;

    while (el) {
        xPosition += (el.offsetLeft - el.scrollLeft + el.clientLeft);
        yPosition += (el.offsetTop - el.scrollTop + el.clientTop);
        el = el.offsetParent;
    }
    return {
            x: xPosition,
            y: yPosition
    };
}

class Circle extends GameObject {
    constructor(context, x, y, vx, vy) {
        super(context, x, y, vx, vy);
        this.width = 50;
        this.height = 0;
        this.radius = 30
    }
    draw() {
        this.context.fillStyle = this.isColliding?'#ff8080':'#0099b0';
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        this.context.fill();
    }
    update(secondsPassed) {
        this.x += this.vx * secondsPassed;
        this.y += this.vy * secondsPassed;
    }
}

function init() {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    createWorld();
    word = words[0]
    document.addEventListener('keydown', (event) => {
        if (event.key === word[0]) {
            word = word.split(''); // or newStr = [...str];
            word.shift();
            word = word.join('');
            if(word.length == 0) {
                words.splice(0,1)
                word = words[0]
                gameObjects.pop()
            }
        }
    }, false);
    window.requestAnimationFrame(gameLoop);
}

function createWorld() {
    gameObjects = [
        new MainCharacter(context, 300, 300, 50, -50),
    ];
    createAnEnemy();
    setInterval(createAnEnemy, 3000);
}

const characters ='abcdefghijklmnopqrstuvwxyz';

function generateString(length) {
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function createAnEnemy() {
    words.push(generateString(getRandomInt(4, 7)))
    console.log(word)
    gameObjects.push(new Circle(context, getRandomInt(0, 300), getRandomInt(0, 300), 0, 50))
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function detectCollisions() {
    let obj1;
    let obj2;

    for (let i = 0; i < gameObjects.length; i++) {
        gameObjects[i].isColliding = false;
    }

    for (let i = 0; i < gameObjects.length; i++) {
        obj1 = gameObjects[i];
        for (let j = i + 1; j < gameObjects.length; j++) {
            obj2 = gameObjects[j];
            if (rectIntersect(obj1.x, obj1.y, obj1.width, obj1.height, obj2.x, obj2.y, obj2.width, obj2.height) || circleIntersect(obj1.x, obj1.y, obj1.radius, obj2.x, obj2.y, obj2.radius)){
                console.log()
                obj1.isColliding = true;
                obj2.isColliding = true;

                let vCollision = {x: obj2.x - obj1.x, y: obj2.y - obj1.y};
                let distance = Math.sqrt((obj2.x-obj1.x)*(obj2.x-obj1.x) + (obj2.y-obj1.y)*(obj2.y-obj1.y));
                let vCollisionNorm = {x: vCollision.x / distance, y: vCollision.y / distance};
                let vRelativeVelocity = {x: obj1.vx - obj2.vx, y: obj1.vy - obj2.vy};
                let speed = vRelativeVelocity.x * vCollisionNorm.x + vRelativeVelocity.y * vCollisionNorm.y;
                if (speed < 0){
                    break;
                }
                obj1.vx -= (speed * vCollisionNorm.x);
                obj1.vy -= (speed * vCollisionNorm.y);
                obj2.vx += (speed * vCollisionNorm.x);
                obj2.vy += (speed * vCollisionNorm.y);

            }
        }
    }
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    if (x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2){
        return false;
    }
    return true;
}

//TODO - Isso precisará mesclar entre circulo e retangulo
function circleIntersect(x1, y1, r1, x2, y2, r2) {
    let squareDistance = (x1-x2) * (x1-x2) + (y1-y2) * (y1-y2);
    return squareDistance <= ((r1 + r2) * (r1 + r2))
}

//TODO - Manipular aqui para inserir nossos menus
function detectEdgeCollisions()
{
    let obj;
    for (let i = 0; i < gameObjects.length; i++)
    {
        obj = gameObjects[i];
        if (obj.x < obj.radius){
            obj.vx = Math.abs(obj.vx) * restitution;
            obj.x = obj.radius;
        }else if (obj.x > canvasWidth - obj.radius){
            obj.vx = -Math.abs(obj.vx) * restitution;
            obj.x = canvasWidth - obj.radius;
        }
        if (obj.y < obj.radius){
            obj.vy = Math.abs(obj.vy) * restitution;
            obj.y = obj.radius;
        } else if (obj.y > canvasHeight - obj.radius){
            obj.vy = -Math.abs(obj.vy) * restitution;
            obj.y = canvasHeight - obj.radius;
        }
    }
}

function gameLoop(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;
    for (let i = 0; i < gameObjects.length; i++) {
        gameObjects[i].update(secondsPassed);
    }


    detectCollisions();
    detectEdgeCollisions()
    clearCanvas();
    for (let i = 0; i < gameObjects.length; i++) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'green';

        ctx.font = '60px san-serif';
        ctx.fillText(word, 300, 300, 250);
        gameObjects[i].draw();
    }
    window.requestAnimationFrame(gameLoop);
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}
