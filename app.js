
// Creating an instance of the PIXI application class. 
// First by bringing it into the code, like the way you would 

// import { Application, Loader } from 'pixi.js';

// var ss = SpreadsheetApp;
const Application = PIXI.Application;
// Then by creating a specific app intsance. 
const app = new Application({
    width: 256, // Gets overwritten immediately. 
    height: 256, // Gets overwritten immediately. 
    transparent: false, // Confused why this is needed. 
    antialias: true // I don't know what this is.
});

// Set properties like the background color. 
app.renderer.backgroundColor = 0x23395D;
// Resize the app to the size of the window. 
// app.renderer.resize(window.innerWidth, window.innerHeight);
app.renderer.view.style.position = "absolute";
// Curiously, all of that was not enough to get the window to resize as you
// drag it around. Bruno had us write a function that handled this on 
// resize. I wonder if I could find it. But, will abstain, for a minute, here. 

// Appending your app to the DOM like this is critical. 
document.body.appendChild(app.view);

// Build an "existential" game engine and state
// manager module called "exis.". 
const exis = (function create_engine_and_state_manager () {
    const to_chess_alpha = function (x_coord, y_coord) {
        return 
    }
    let exp = {};
    const board = [
        ["br1", "bn1", "bb1", "bq1", "bk",  "bb2", "bn2", "br2"],
        ["bp1", "bp2", "bp3", "bp4", "bp5", "bp6", "bp7", "bp8"],
        ["",    "",    "",    "",    "",    "",    "",    ""   ],
        ["",    "",    "",    "",    "",    "",    "",    ""   ],
        ["",    "",    "",    "",    "",    "",    "",    ""   ],
        ["",    "",    "",    "",    "",    "",    "",    ""   ],
        ["wp1", "wp2", "wp3", "wp4", "wp5", "wp6", "wp7", "wp8"],
        ["wr1", "wn1", "wb1", "wq1", "wk",  "wb2", "wn2", "wr2"] 
    ];

    let selected_piece = undefined;
    let selected_piece_coords = undefined;
    exp.is_selected_piece = function () {
        return (
            selected_piece
            ? true
            : false
        );
    }
    exp.get_selected_piece = function () {
        return selected_piece;
    }
    exp.get_selected_piece_coords = function () {
        return selected_piece_coords;
    }

    exp.select_piece = function (r, c) {
        if (board[r][c] !== "") {
            selected_piece = board[r][c];
            selected_piece_coords = {
                "r" : r,
                "c": c
            };
        }
        highlights[r + "_" + c].visible = true;
        console.log("Selected piece id: " + selected_piece);
    }; 
    exp.deselect_piece = function () {
        const selected_piece_store = selected_piece;
        highlights[
            selected_piece_coords.r + "_" + selected_piece_coords.c
        ].visible = false;
        selected_piece = undefined;
        selected_piece_coords = undefined;
        console.log("deselected piece : " + selected_piece_store);
    };
    
    exp.move_piece = function (piece, r, c) {
        board[selected_piece_coords.r][selected_piece_coords.c] = "";
        exp.deselect_piece()
        board[r][c] = piece;
        console.log()
    };

    exp.read_board = function (x, y) {
        return board[x][y];
    }
    // Possible states (also the names of the actions that follow them): 
    // "Select piece". 
    // "Move piece" / "Select open square."

    return exp;
}());

// Create some basic shapes. 

const Graphics = PIXI.Graphics;
/*
// Just instantiate a graphic.
const first_rectangle = new Graphics();
first_rectangle.beginFill(0xAA33BB)
    .lineStyle(4, 0xFFEA00, 1) // Thickness, color, opacity (0 to 1)
    // Here it finially understands what shape it is making. 
    .drawRect(
        200, 200, 100, 120 // width, height, x-offset, y-offset
    ).endFill();
// The rectangle is not drawn until it is staged. We are asked to imagine 
// 
app.stage.addChild(first_rectangle);

const first_polygon = new Graphics();
first_polygon.beginFill(0xFF66FF)
    .drawPolygon([
        600, 50, // x-, then y-coordinates for each point. 
        800, 150, 
        900, 300, 
        400, 400
    ]).endFill();
app.stage.addChild(first_polygon);

// Skipped the circle, line, torus, star, and text examples for now. 
// There are rectangles with rounded corners, which could be pretty useful. 
// Complex shapes can be added using the graphics extras module. 

// Okay, I have decided this is worthwhile. 

*/

// Chessboard Layer
const tile_size = 32;
const light_tile_color = 0xffffff; // 0xfbf236;
const dark_tile_color = 0x5fcde4;

const highlights = {};

for (let j=0; j<8; j++) {
    for (let i=0; i<8; i++) {
        app.stage.addChild(
            new Graphics()
                .beginFill(
                    (i+j) % 2 === 0
                    ? light_tile_color
                    : dark_tile_color
                )
                .drawRect(i*tile_size, j*tile_size, tile_size, tile_size)
                .endFill()
        );
        // Draw the highlight layer. 
        highlights[String(j) + "_" + String(i)] = new Graphics()
          .beginFill(
            0xfbf236, 0.75
          )
          .drawRect(i*tile_size, j*tile_size, tile_size, tile_size)
          .endFill();
        highlights[String(j) + "_" + String(i)].visible = false;
        app.stage.addChild(highlights[j + "_" + i]);
    }
}
//

// This should work, and I have spent 1.5 hours googling why it does not. 
// I think ... it might be time to try to work around this. 

// Chess piece layer. 

// app.stage.addChild(PIXI.Sprite.from("./images/chesspeople_spritesheet.png"));

/*
const loader = PIXI.Assets.loader;
loader.load(
    "./images/chesspeople_spritesheet.png", 
    "./images/chesspeople_spritesheet.json"
);
*/


const piece_sprites = {};

async function load_sprites () {
    const expansions = {
        "p": "pawn", 
        "k": "king",
        "n": "knight",
        "r": "rook",
        "b": "bishop",
        "q": "queen"
    };
    const color_expansions = { "b": "black", "w": "white" };
    const additions = { "b": 0, "w": 4 }

    piece_sprites.spritesheet = await PIXI.Assets.load(
        'images/chesspeople_spritesheet.json'
    );
    // console.log(piece_sprites.spritesheet.textures);
    [
        "br1", "bn1", "bb1", "bq1", "bk",  "bb2", "bn2", "br2", 
        "bp1", "bp2", "bp3", "bp4", "bp5", "bp6", "bp7", "bp8",
        "wp1", "wp2", "wp3", "wp4", "wp5", "wp6", "wp7", "wp8",
        "wr1", "wn1", "wb1", "wq1", "wk",  "wb2", "wn2", "wr2" 
    ].forEach(function (piece, i) {
        const joint_name = color_expansions[piece[0]] 
            + "_" + expansions[piece[1]];
        piece_sprites[piece] = PIXI.Sprite.from(
            piece_sprites.spritesheet.textures[joint_name + ".png"]
        );
        piece_sprites[piece].y = 32 * (Math.floor(i / 8) + additions[piece[0]]);
        piece_sprites[piece].x = 32 * (i % 8);
        app.stage.addChild(piece_sprites[piece]);
    });
    
};

// I couldn't get this to work. 

/*
const load_sprites = function () {
    return new Promise (function (resolve, reject) {
        piece_sprites.spritesheet = PIXI.Assets.load(
            'images/chesspeople_spritesheet.json'
        ).then(function () {
            console.log("hey I loaded.");
            ["white", "black"].forEach(function (color) {
                ["king", "queen", "knight", "bishop", "rook", "pawn"].forEach(
                    function (piece) {
                        const joint_name = color + "_" + piece;
                        piece_sprites[joint_name] = PIXI.Sprite.from(
                            piece_sprites.spritesheet.textures[
                                joint_name + ".png"
                            ]
                        );
                    }
                );
            });
        });
    });
};
*/
                            
load_sprites();


// const white_pawn_texture = PIXI.Sprite.from("white_pawn.png");
// app.stage.addChild(PIXI.Sprite.from("white_pawn.png"));

/*
const chesspeople_spritesheet = new PIXI.Spritesheet(
    "./images/chesspeople_spritesheet.png", 
    "./images/chesspeople_spritesheet.json"
);*/

/*
console.log("Attempting to make the spritesheet ready to use...");
chesspeople_spritesheet.parse();
console.log("Spritesheet ready to use!");
*/

/*
const piece_sprites = {};
["k", "q", "b", "n", "r", "p"].forEach(function(piece_type, p) {
    all_pieces_texture.frame = new PIXI.Rectangle(0, p*32, 32, 32);
    piece_sprites["b_"+ piece_type] = PIXI.Sprite.from(all_pieces_texture);
});
*/  

/*
loader.add("chesspeople", "./images/chesspeople_spritesheet.png")

loader.load(setup);

const setup = function (loader, resources) {
    const all_pieces_texture = resources.chesspeople.texture;
    const piece_sprites = {};
    ["k", "q", "b", "n", "r", "p"].forEach(function(piece_type, p) {
        all_pieces_texture.frame = new PIXI.Rectangle(0, p*32, 32, 32);
        piece_sprites["b_"+ piece_type] = new PIXI.Sprite(all_pieces_texture);
    });
}
*/

const register_click_at = function (r, c) {
    // State manager. 
    if (exis.is_selected_piece()) {
        if (
            r === exis.get_selected_piece_coords().r
            && c === exis.get_selected_piece_coords().c
        ) {
            // deselect the peice. 
            exis.deselect_piece();
        } else {
            // move the piece.
            piece_sprites[exis.get_selected_piece()].x = 32 * c;
            piece_sprites[exis.get_selected_piece()].y = 32 * r;
            const move_to_value = exis.read_board(r, c);
            if (move_to_value !== "") {
                app.stage.removeChild(piece_sprites[move_to_value]);
            }
            exis.move_piece(exis.get_selected_piece(), r, c);
        }
    } 
    // Else if there is a piece where you are clicking, select it. 
    else if (exis.read_board(r, c) !== "") {
        exis.select_piece(r, c);
        // select it. 
    }
}



// Clickable layer. 
const visible_color = 0xf7766d; 
// Preferred is 0x65e6fc when it doesn't clash with the background color.

const visibility_alpha = 0.001;
const click_border = 2;
for (let j=0; j<8; j++) {
    for (let i=0; i<8; i++) {
        const chess_alpha = ["A", "B", "C", "D", "E", "F", "G", "H"];
        const clickable_square = new Graphics() 
            .beginFill(visible_color, visibility_alpha)
            .drawRect(
                j * tile_size + click_border, 
                i * tile_size + click_border, 
                tile_size - (click_border * 2), 
                tile_size - (click_border * 2)
            ).on("pointerdown", function () {
                console.log(
                    "Registered click at: " + String(i) + ", " + String(j)
                    + " (space " + chess_alpha[j] + String(8-i) + ")"
                );
                register_click_at(i, j);
            })
            .endFill();
        clickable_square.interactive = true;
        app.stage.addChild(clickable_square);
    }
}



// There it is. I have just finished my first ever custom clicable 
// interface sitting invisibly on top of a high-performance 2D rendering 
// library. We are officially out of CSS. 