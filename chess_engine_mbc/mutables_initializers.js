// Module by closure pattern bookend. 
const mutables_initializers = mi = (
    function mutables_initializers_module_loader () {

const exports = {};

exports.get_standard_starting_board = function () {
    return [
        ["br1", "bn1", "bb1", "bq1", "bk_", "bb2", "bn2", "br2"],
        ["bp1", "bp2", "bp3", "bp4", "bp5", "bp6", "bp7", "bp8"],
        ["",    "",    "",    "",    "",    "",    "",    ""   ],
        ["",    "",    "",    "",    "",    "",    "",    ""   ],
        ["",    "",    "",    "",    "",    "",    "",    ""   ],
        ["",    "",    "",    "",    "",    "",    "",    ""   ],
        ["wp1", "wp2", "wp3", "wp4", "wp5", "wp6", "wp7", "wp8"],
        ["wr1", "wn1", "wb1", "wq1", "wk_", "wb2", "wn2", "wr2"] 
    ];
};

const compress_board_state = function (m) {
    return (
        m.turns.get_active_player_string() + "_to_mov_"
        + "WCC_" 
        + (
            m.meta_data.can_castle["w"] && m.meta_data.can_castle["w"]["O-O-O"]
            ? "O-O-O" 
            : "X"
        ) + "_&_" + (
            m.meta_data.can_castle["w"] && m.meta_data.can_castle["w"]["O-O"]
            ? "O-O"
            : "X"
        ) 
        + "_BCC_" 
        + (
            m.meta_data.can_castle["b"] && m.meta_data.can_castle["b"]["O-O-O"]
            ? "O-O-O" 
            : "X"
        ) + "_&_" + (
            m.meta_data.can_castle["b"] && m.meta_data.can_castle["b"]["O-O"]
            ? "O-O"
            : "X"
        ) 
        + "_EPO_"
        + m.meta_data.possible_en_passanting_pawns.sort().join("+")
        + "_" 
        + m.board.reduce(function (acc, row) {
            acc.push(row.map(function (item) {
                return (
                    // Convert empty spaces to "E"
                    item === ""
                    ? "E"
                    : item.substring(0, 2)
                )
            }).join("/"));
            return acc;
        }, []).join("") 
    
    );
}

exports.get_turns_object = function () {
    return (function () {
        const opposite_color = {
            "white": "black",
            "black": "white"
        };
        let color_to_move = "white";
        let turn_number = 1;
        let moves_without_capture_or_pawn_move = 0;
        let draw_watch_hash = {};
        // exported object.
        return {   
            get_active_player_string: function () {
                return color_to_move;
            }, 
            get_turn_number: function () {
                return turn_number;
            }, 
            register_a_move: function (reset_d_w_h, m) {
                if (reset_d_w_h) {
                    draw_watch_hash = {};
                    moves_without_capture_or_pawn_move = 0;
                }
                color_to_move = opposite_color[color_to_move];
                // Increment the turn count every 
                // time it switches back to white. 
                if (color_to_move === "white") {
                    turn_number += 1;
                }
                const board_state_string = compress_board_state(m)
                if (draw_watch_hash.hasOwnProperty(board_state_string)) {
                    draw_watch_hash[board_state_string] += 1;
                    if (draw_watch_hash[board_state_string] === 3) {
                        console.warn(
                            "The game could be claimed a draw via 'threefold."
                            + " repetition'."
                        );
                    } 
                    if (moves_without_capture_or_pawn_move === 100) {
                        console.warn(
                            "The game could be declared a draw via the 50-"
                            + " move rule'."
                        );
                    }
                } else {
                    draw_watch_hash[board_state_string] = 1;
                }
                moves_without_capture_or_pawn_move += 1;
            }
        };
    }());
};

// Roster
// Roster initialization is not compressed to the starting rows anymore 
// so that it can bootstrap movement options and piece relationships 
// from any board that is given to it. 
exports.get_roster_object = function (board) {
    return board.reduce(function (acc, curr, r) {
        curr.forEach(function (space_value, c) {
            // Move on if you encounter an empty space. 
            if (space_value !== "") {
                acc[space_value] = {
                    "r": r, 
                    "c": c,
                    
                    "movement_options": [], //A1 spaces: ["C4", "D5", ...]
                    "movement_options_cache": [],
        
                    "is_blocking": [],   // Piece ids: "wp1", "bb1"
                    "is_blocked_by": [], // Piece ids: "wp1", "bb1"
                    // Only pawns have their movement enabled.
                    "is_enabled_by": [], // Piece ids: "wp1", "bb1"
                    "is_enabling": [],   // Piece ids: "wp1", "bb1"
                    
                    "is_threatening_spaces": []
                }
            }
        });
        return acc;
    }, {});
};

exports.get_game_meta_data_object = function () {
    let exp = {
        check_state: undefined, // Gets set to "w" or "b"
        can_castle: {
            "w": { "O-O-O": true, "O-O": true },
            "b": { "O-O-O": true, "O-O": true }
        },
        possible_en_passanting_pawns: []
    };
    exp.promotion_selection_active = false;
    return exp;
};

return exports;
}()); // Module by closure pattern bookend. 