
const Application = PIXI.Application;
// Then by creating a specific app intsance. 
const app = new Application({
    width: 256,
    height: 256, 
    transparent: false,
    antialias: true 
});

// Set properties like the background color. 
app.renderer.backgroundColor = 0x23395D;
// Resize the app to the size of the window. 
// app.renderer.resize(window.innerWidth, window.innerHeight);
app.renderer.view.style.position = "absolute";

// Appending your app to the DOM like this is critical. 
document.body.appendChild(app.view);

const name_expansions = {
    "p": "pawn", 
    "k": "king",
    "n": "knight",
    "r": "rook",
    "b": "bishop",
    "q": "queen"
};
const color_expansions = { "b": "black", "w": "white" };

const gui = (function gui_engine_and_state_manager_creator () {
    let exp = {};
    
    // Make an identical copy of the board in the engine
    const board_object = engine.get_baord_object();
    const board = ["", "", "",  "", "", "", "", ""].map(function (row, r) {
        return board_object[r].map(function (space_value, c) {
            return space_value;
        });
    });

    let selected_piece = undefined;
    let selected_piece_coords = undefined;
    exp.selected_piece_possibles = [];

    const draw_movement_possibles = function (list) {
        list.forEach(function (alpha_coord) {
            const [r, c] = ur.in_r_c(alpha_coord);
            if (board[r][c] === "") {
                // Raise the dot
                move_dots[r + "_" + c].visible = true;
            } else {
                // Raise the circle;
                attack_circles[r + "_" + c].visible = true;
            }

        });
    }
    const erase_all_movement_possibles = function (list) {
        list.forEach(function (alpha_coord) {
            const [r, c] = ur.in_r_c(alpha_coord);
            if (board[r][c] === "") {
                // Erase the dot;
                move_dots[r + "_" + c].visible = false;
            } else {
                // Erase the circle;
                attack_circles[r + "_" + c].visible = false;
            }

        });
    }

    exp.a_piece_is_selected = function () {
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
        let id; 
        if (board[r][c] !== "") {
            selected_piece = board[r][c];
            id = board[r][c];
            selected_piece_coords = {
                "r" : r,
                "c": c
            };
        }
        highlights[r + "_" + c].visible = true;
        exp.selected_piece_possibles = engine.get_possible_moves_by_id(id);
        // For all the possible moves, if it is an enemy, give it a circle, 
        // and if it is an empty space, give it a little dot.
        draw_movement_possibles(exp.selected_piece_possibles);
    }; 
    exp.deselect_piece = function () {
        const selected_piece_store = selected_piece;
        highlights[
            selected_piece_coords.r + "_" + selected_piece_coords.c
        ].visible = false;
        selected_piece = undefined;
        selected_piece_coords = undefined;
        // DEBUG console.log("deselected piece : " + selected_piece_store);
        erase_all_movement_possibles(exp.selected_piece_possibles);
        exp.selected_piece_possibles = [];
    };
    
    const contiuation_listeners = {};
    contiuation_listeners.rook_move_from_castle = function (id, r, c) {
        board[r][c] = id;
        board[piece_sprites[id].y / 32][piece_sprites[id].x / 32] = "";
        piece_sprites[id].x = 32 * c;
        piece_sprites[id].y = 32 * r;
    };

    contiuation_listeners.en_passant = function (passanted_id) {
        app.stage.removeChild(piece_sprites[passanted_id]);
    };

    exp.move_piece = function (id, r, c) {
        board[selected_piece_coords.r][selected_piece_coords.c] = "";
        exp.deselect_piece()
        board[r][c] = id;
        // Move the piece in the engine as well. 
        // This will automatically update the turn object.
        let contiuation_sets = engine.move_piece(id, ur.in_a1(r, c));
        if (contiuation_sets !== undefined) {
            contiuation_sets.forEach(function (set) {
                contiuation_listeners[set[0]](...set[1]);
            });
        };
    };

    let pieces_promoted_count = { "w": 0, "b": 0 };
    contiuation_listeners.promotion_prompt = function (pawn_id, a1_space) {
        // Certainly room for improvement here, to actually prompt the user
        // for what they want to castle into TODO : add an interface to make actual choices.
        const [at_r, at_c] = ur.in_r_c(a1_space);
        const prompt_answer = "q";

        const new_id = pawn_id[0] + prompt_answer + String(
            parseInt(3 + pieces_promoted_count[pawn_id[0]])
        );
        // It's a game integrity risk to have this on the client side. TODO: address this. 
        pieces_promoted_count[pawn_id[0]] += 1;
        // Delete the piece at that square. 
        app.stage.removeChild(piece_sprites[pawn_id]);
        // Add a new sprite and place them into the square. 
        const texture_name = (
            color_expansions[new_id[0]] + "_" 
            + name_expansions[new_id[1]] + ".png"
        );
        piece_sprites[new_id] = PIXI.Sprite.from(
            piece_sprites.spritesheet.textures[texture_name]
        );
        piece_sprites[new_id].x = 32 * at_c;
        piece_sprites[new_id].y = 32 * at_r;
        app.stage.addChild(piece_sprites[new_id]);
        
        selected_piece_coords = { "r": at_r, "c": at_c };
        console.log(`new id is ${new_id}`);
        exp.move_piece(new_id, at_r, at_c);
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

// Chessboard Layer
const tile_size = 32;
const light_tile_color = 0xffffff; 
const dark_tile_color = 0x5fcde4;
const move_dots = {};
const attack_circles = {}; 
const highlights = {};
const move_ops_color = 0xfbf236; // 0xfbf236;
const move_ops_opacity = 1;
// 0-1 percentage of how much of the tile it should take up, 
// converted to whole pixels. 
const dot_size_percentage = 0.35;

const half_tile = Math.floor(tile_size / 2); // Should be even, though. 

const dot_radius = Math.floor((tile_size * dot_size_percentage) / 2);
const dot_offset = Math.floor(half_tile);

const attack_circle_line_width = 5;
// Shrink the radius to account for the border / edge width
const attack_circle_radius = half_tile - Math.floor(attack_circle_line_width/2);

for (let j=0; j<8; j++) {
    for (let i=0; i<8; i++) {
        // Draw the squares layer, alternating between light and dark
        // squares depending on maths. 
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
              move_ops_color, move_ops_opacity
            )
            .drawRect(i*tile_size, j*tile_size, tile_size, tile_size)
            .endFill();
        highlights[String(j) + "_" + String(i)].visible = false;
        app.stage.addChild(highlights[j + "_" + i]);

        // Draw the move dots layer. 
        move_dots[String(j) + "_" + String(i)] = new Graphics()
            .beginFill(
                move_ops_color, move_ops_opacity
            )
            .drawCircle(
                i*tile_size + dot_offset, 
                j*tile_size + dot_offset, 
                dot_radius
            ).endFill();
        move_dots[String(j) + "_" + String(i)].visible = false;
        app.stage.addChild(move_dots[j + "_" + i]);

        // Draw the attack circles layer.
        attack_circles[String(j) + "_" + String(i)] = new Graphics()
            .lineStyle(
                attack_circle_line_width, move_ops_color, move_ops_opacity
            ).drawCircle(
                i*tile_size + half_tile, 
                j*tile_size + half_tile, 
                attack_circle_radius
            ).endFill();
        attack_circles[String(j) + "_" + String(i)].visible = false;
        app.stage.addChild(attack_circles[j + "_" + i]);
    }
}

const piece_sprites = {};

async function load_sprites () {
    const additions = { "b": 0, "w": 4 }

    piece_sprites.spritesheet = await PIXI.Assets.load(
        'images/chesspeople_spritesheet.json'
    );

    const roster_pointer = engine.get_roster_object();
    Object.keys(roster_pointer).forEach(function (id) {
        const texture_name = (
            color_expansions[id[0]] + "_" + name_expansions[id[1]] + ".png"
        );
        piece_sprites[id] = PIXI.Sprite.from(
            piece_sprites.spritesheet.textures[texture_name]
        );
        piece_sprites[id].x = 32 * roster_pointer[id].c;
        piece_sprites[id].y = 32 * roster_pointer[id].r;
        app.stage.addChild(piece_sprites[id]);
    });
};

load_sprites();

const register_click_at = function (r, c) {
    // State manager. 

    // Should be called "is there a piece selected".
    if (gui.a_piece_is_selected()) {
        if (
            r === gui.get_selected_piece_coords().r
            && c === gui.get_selected_piece_coords().c
        ) {
            // deselect the peice. 
            gui.deselect_piece();
        // Else move the piece if you clicked on one of its possible moves.
        } else if (gui.selected_piece_possibles.includes(ur.in_a1(r, c))) {
            const move_piece_name = gui.get_selected_piece();
            piece_sprites[move_piece_name].x = 32 * c;
            piece_sprites[move_piece_name].y = 32 * r;
            const move_to_value = gui.read_board(r, c);
            if (move_to_value !== "") {
                app.stage.removeChild(piece_sprites[move_to_value]);
            }
            gui.move_piece(move_piece_name, r, c);

        }
    } 
    // Else if there is a piece where you are clicking, and it is of the
    // color whose turn it is...
    else if (
        // gui.read_board(r, c) !== "" (implied)
        engine.get_current_turn_color_char() === gui.read_board(r, c)[0]

    ) {
        // select it. 
        gui.select_piece(r, c);
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
                register_click_at(i, j);
            })
            .endFill();
        clickable_square.interactive = true;
        app.stage.addChild(clickable_square);
    }
}
