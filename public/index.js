const {
    Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body,
    Events
} = Matter;

const width = window.innerWidth;
const height = window.innerHeight;
const cellsHorizontal = 25;
const cellsVertical = 15;
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

// Matter.js boilerplate
const engine = Engine.create();
engine.world.gravity.y = 0;

const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: width,
        height: height - 4,
        wireframes: false
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Boundaries
const boundaries = [
    Bodies.rectangle(width / 2, 0, width, 5, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 5, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 5, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 5, height, { isStatic: true })
];
World.add(world, boundaries);

// Maze data
const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

// Logic
const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }

    return arr;
}

const buildMaze = (row, column) => {
    if (grid[row][column]) {
        return;
    }

    grid[row][column] = true;

    const neighbors = shuffle([
        [row - 1, column, "up"],
        [row, column + 1, "right"],
        [row + 1, column, "down"],
        [row, column - 1, "left"]
    ]);

    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;

        if (
            nextRow < 0 ||
            nextRow >= cellsVertical ||
            nextColumn < 0 ||
            nextColumn >= cellsHorizontal
        ) {
            continue;
        }

        if (grid[nextRow][nextColumn]) {
            continue;
        }

        if (direction === "left") {
            verticals[row][column - 1] = true;
        } else if (direction === "right") {
            verticals[row][column] = true;
        } else if (direction === "up") {
            horizontals[row - 1][column] = true;
        } else if (direction === "down") {
            horizontals[row][column] = true;
        }

        buildMaze(nextRow, nextColumn);
    }
}

const drawWalls = (verticals, horizontals) => {
    horizontals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if (open) {
                return;
            }

            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX / 2,
                rowIndex * unitLengthY + unitLengthY,
                unitLengthX,
                5,
                {
                    isStatic: true,
                    label: "wall",
                    render: {
                        fillStyle: "red"
                    }
                }
            );

            World.add(world, wall);
        })
    });

    verticals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if (open) {
                return;
            }

            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX,
                rowIndex * unitLengthY + unitLengthY / 2,
                5,
                unitLengthY,
                {
                    isStatic: true,
                    label: "wall",
                    render: {
                        fillStyle: "red"
                    }
                }
            );

            World.add(world, wall);
        });
    });
}

buildMaze(startRow, startColumn);
drawWalls(verticals, horizontals);

const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {
        isStatic: true,
        label: "goal",
        render: {
            fillStyle: "green"
        }
    }
);
World.add(world, goal);

const playerRadius = Math.min(unitLengthX, unitLengthY) / 4
const player = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    playerRadius,
    {
        label: "player",
        render: {
            fillStyle: "cyan"
        }
    }
);
World.add(world, player);

document.addEventListener("keydown", (event) => {
    const { x, y } = player.velocity;

    if (event.keyCode === 87) {
        Body.setVelocity(player, { x, y: y - 2 });
    }
    if (event.keyCode === 68) {
        Body.setVelocity(player, { x: x + 2, y });
    }
    if (event.keyCode === 83) {
        Body.setVelocity(player, { x, y: y + 2 });
    }
    if (event.keyCode === 65) {
        Body.setVelocity(player, { x: x - 2, y });
    }
});

Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((collision) => {
        const labels = ["player", "goal"];

        if (
            labels.includes(collision.bodyA.label) &&
            labels.includes(collision.bodyB.label)
        ) {
            document.querySelector(".winner").classList.remove("hidden");
            world.gravity.y = 1;
            world.bodies.forEach((body) => {
                if (body.label === "wall") {
                    Body.setStatic(body, false);
                }
            });
        }
    });
});