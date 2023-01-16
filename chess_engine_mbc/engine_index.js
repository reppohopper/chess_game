
// Module by closure pattern bookend. 
const engine = (function engine_module_loader () {

const exports = {};

// const mutables_initializers = require("./mutables_initializers.js");
// const move_ops = require("./movement_options_functions.js");
// const ur = require("./utilities_and_reference.js");


// Initialize all mutables inside an object labelled "m", for easy pointer 
// passage to modules to directly manipulate the object.
const m = {};
m.turns = mutables_initializers.get_turns_object();
// m.board = mutables_initializers.get_standard_starting_board();
m.board = 
// test_boards.two;
[
    ["br1", "bn1", "bb1", "bq1", "bk_", "bb2", "bn2", "br2"],
    ["bp1", "bp2", "bp3", "bp4", "bp5", "bp6", "bp7", "bp8"],
    ["",    "",    "",    "",    "",    "",    "",    ""   ],
    ["",    "",    "",    "",    "",    "",    "",    ""   ],
    ["",    "",    "",    "",    "",    "",    "",    ""   ],
    ["",    "",    "",    "",    "",    "",    "",    ""   ],
    ["wp1", "wp2", "wp3", "wp4", "wp5", "wp6", "wp7", "wp8"],
    ["wr1", "wn1", "wb1", "wq1", "wk_", "wb2", "wn2", "wr2"] 
];

m.roster = mutables_initializers.get_roster_object(m.board);
m.meta_data = mutables_initializers.get_game_meta_data_object();

if (ur.board_is_stardard(m.board) === false) {
    m.meta_data.can_castle = { "w": undefined, "b": undefined };
}

m.pieces_blocking_moved_piece = [];

// Takes 9-10 ms. Laughable. 
const initialization_start_time = new Date();
move_ops.initialize_threat_webs(m);
move_ops.update_all_movement_options_and_blocking_lists(m); 
ur.log_execution_time(
    new Date() - initialization_start_time, 5, 10, "Initialization"
);

exports.move_piece = function (id, a1_move_to_space) {
    // Variables to use in the subsequent updates. 
    const [to_r, to_c] = ur.in_r_c(a1_move_to_space); 
    // Handle the promotion case in as sloppy a manner as possible. 
    if (m.meta_data.promotion_selection_active === true) {
        // TODO : fix the potential for bad data injection here. 
        // m.board[to_r][to_c] = id;
        m.roster[id] = {
            "r": to_r, 
            "c": to_c,
            
            "movement_options": [], //A1 spaces: ["C4", "D5", ...]
            "movement_options_cache": [],
    
            "is_blocking": [],   // Piece ids: "wp1", "bb1"
            "is_blocked_by": [], // Piece ids: "wp1", "bb1"
            // Only pawns have their movement enabled.
            "is_enabled_by": [], // Piece ids: "wp1", "bb1"
            "is_enabling": [],   // Piece ids: "wp1", "bb1"
            
            "is_threatening_spaces": []
        }
        m.meta_data.promotion_selection_active = false;
    }
    const [from_r, from_c] = [m.roster[id].r, m.roster[id].c]

    // Perform operations in the case that you just moved to escape check. 
    // (Does nothing if you weren't in check.)
    const start_time = new Date();
    kt.manage_moved_out_of_check(id[0], m); 
    let reset_d_w_h = id[1] === "p";
    m.pieces_blocking_moved_piece = [];
    // Clear any en pessant that might have occured
    const passanted_pawn_id = move_ops.clear_en_passant(
        id, a1_move_to_space, m
    );

    // Delete your old presence on the threats map. This function also
    // correctly handles the correct removal of pawns from threat maps. 
    kt.remove_whole_piece_from_all_threats_map(id, m);
    // Properly and completely deactivate any piece captured in this move. 
    if (
        m.board[to_r][to_c] !== ""
        // Add a case for pawns to delete themselves opon pre-promotion.  
        || (
            id.substring(0, 2) === "wp" && to_r === 7
            || id.substring(0, 2) === "bp" && to_r === 0
        )
    ) {
        reset_d_w_h = true;
        // Allied Knights that the captured piece was blocking need to reasses. 
        const captured_id = m.board[to_r][to_c]; 
        if (
            captured_id[1] === "r"
            && m.meta_data.can_castle[captured_id[0]] !== undefined
        ) {
            m.meta_data.can_castle[captured_id[0]][
                "O" + "-O".repeat(Number((captured_id[2] * 2) % 3))
            ] = undefined;
        }
        m.pieces_blocking_moved_piece = m.pieces_blocking_moved_piece.concat(
            m.roster[captured_id].is_blocking, m.roster[captured_id].is_enabling
        );
        kt.remove_whole_piece_from_all_threats_map(captured_id, m);
        blocking.unrelate_all_relations_min(captured_id, m);
        // to do: also needs to give a heads up to all allies it was 
        // blocking to re-asses. 
        delete m.roster[captured_id];
    }
    // Move the piece logically to the new space, also on the roster object. 
    [m.board[from_r][from_c], m.board[to_r][to_c]] = ["", id];
    [m.roster[id].r, m.roster[id].c] = [to_r, to_c];
    // Reasses the moved piece's movement options and .is_blocking property
    move_ops.update_movement_options(id, m, top_call=true); 
    let also_update = move_ops.update_blocking_list_by_id(id, m, true); 
    // If you are a king, update your entire threat web, and only the 
    // opposite king's in the normal way. 
    if (id[1] === "k") {
// TODO: Something in here causes the moved piece to get added to 
// m.pieces_blocking_moved_piece.  
        kt.fully_update_threat_web(id[0], m);
        // Pass your own color to the "ignore" parameter (final parameter);
        move_ops.update_threat_webs(from_r, from_c, to_r, to_c, m, id[0]);
    } else {
        // Otherwise just update both kings' threat webs in the normal way. 
        move_ops.update_threat_webs(from_r, from_c, to_r, to_c, m); 
    }
    // Prepend only new items from pieces_blocking_moved_piece to the front.
    also_update = m.pieces_blocking_moved_piece.filter(function (item) {
        return (
            !(also_update.includes(item))
            && m.roster.hasOwnProperty(item) // Filter pieces just captured. 
        );
    // Remove duplitaces. 
    }).concat(also_update).sort().filter(function (id, i, arr) {
       return id !== arr[i+1]
    });
    console.log(
        `Cascading updates triggered for the following related pieces: `
        + `[${also_update.join(", ")}]`
        // ,"color: #e0a500"
    ); 
    // Cascading updates determined by original call to "update_blocking_list"
    also_update.forEach(function (affected_id) {
            move_ops.update_blocking_list_by_id(affected_id, m);
            move_ops.update_movement_options(affected_id, m);
    });
    // Non-updated kings now update any move-to spaces that became threatened. 
    ["w", "b"].forEach(function (color) {
        if (!id.concat(also_update).includes(color + "k_")) {
            move_ops.update_movement_options(color + "k_", m);
        }
    });   
    
    m.pieces_blocking_moved_piece = []; // Clear "blocking_moved_piece"
    kt.manage_got_put_into_check(ur.opposite_color_char(id[0]), m);
    const [rook_id, rook_to_space] = move_ops.manage_castling_options(
        id, from_r, from_c, m
    );
    if (rook_id !== undefined) {
        exports.move_piece(rook_id, rook_to_space);
    } else if (
        id.substring(0, 2) === "wp" && to_r === 0
        || id.substring(0, 2) === "bp" && to_r === 7
    ) {
        m.meta_data.promotion_selection_active = true;
        return [["promotion_prompt", [id, ur.in_a1(to_r, to_c)]]];
    } else {
        // Increment the turn counter and object that watches for draws. 
        m.turns.register_a_move(reset_d_w_h, m); 
        ur.log_execution_time(new Date() - start_time);
    }
    
    if (
        id[1] === "p"
        && Math.abs(from_r - to_r) === 2
    ) {
        move_ops.account_for_en_passant(id, a1_move_to_space, m);
    }
    if (passanted_pawn_id !== undefined) {
        return [ ["en_passant", [passanted_pawn_id]] ];
    }
    return (
        rook_id === undefined
        ? undefined
        : [
            ["rook_move_from_castle", [rook_id, ...ur.in_r_c(rook_to_space)]]
        ]
    );
    // DEBUG
    // exports.print_threat_webs();
    // console.log(m.roster);
    
    // exports.print_threats_maps();
    // console.log(m.roster);
    // console.log(m.turns);
    // console.log(m.meta_data);

    // console.log(`Threat objects, black then white:`);
    // console.log(move_ops.raise_threat_objects().kings["b"].strand_register);
    // console.log(move_ops.raise_threat_objects().kings["w"].strand_register);
};



// Functions that expose the minimum amount possible from which to build 
// a testing library. 
exports.get_baord_object = function () {
    return m.board;
};
exports.get_roster_object = function () {
    return m.roster;
};
exports.get_turns_object = function () {
    return m.turns;
};
exports.get_threat_objects = function () {
    return move_ops.raise_threat_objects();
};
exports.get_current_turn_color_char = function () {
    return m.turns.get_active_player_string()[0];
};
exports.get_possible_moves_by_id = function (id) {
    return m.roster[id].movement_options;
};
exports.get_m = function () {
    return m;
}


exports.print_threat_webs = function (color_char) {
    const kt = move_ops.raise_threat_objects();
    let colors = ["w", "b"];
    if (color_char !== undefined) {
        colors = [color_char];
    };
    colors.forEach(function (color) {
        debug.pretty_print_threat_web(
            color, 
            kt.kings[color].threat_web
        );
    });
};

exports.print_threats_maps = function (color_char) {
    const kt = move_ops.raise_threat_objects();
    let colors = ["w", "b"];
    if (color_char !== undefined) {
        colors = [color_char];
    };
    colors.forEach(function (color) {
        debug.pretty_print_threats_map(
            color, 
            kt.all_threats_maps[color]
        );
    });
};

// console.log(`Kings objects, black then white:`);
// console.log(move_ops.raise_threat_objects().kings["b"]);
// console.log(move_ops.raise_threat_objects().kings["w"]);


// exports.print_threats_maps();

// console.log(m.roster);
// console.log(m.turns);
// console.log(m.meta_data);
// exports.print_threats_maps();
// exports.print_threat_webs();

return exports;
}()); // Module by closure pattern bookend.