// Module by closure pattern bookend. 
const utilities_and_reference = ur = (
    function utilities_and_reference_module_loader () {

const exports = {};

exports.get_empty_board = (function () {
    const arr_of_8 = ["", "", "", "", "", "", "", ""];
    return function (space_value="") {
        return arr_of_8.map(function (row) {
            return arr_of_8.map(function (space) {
                return space_value;
            });
        });
    }; 
}());

// Data Constants and references. 
exports.piece_abbreviation_map = {
    "p": "pawn", "k": "king", "r": "rook", 
    "n": "knight", "b": "bishop", "q": "queen"
};

exports.direction_list = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
exports.get_opposite_direction = (function () {
    const opposites = { 
        "N": "S", "S": "N", "E": "W", "W": "E",
    // Yeah, technically you could derive the following from the above. 
        "NE": "SW", "SW": "NE", "NW": "SE", "SE": "NW"
    };
    return function (direction) {
        return opposites[direction];
    };
}());

exports.is_moving_off_the_strand = function (
    threat_web_val, from_r, from_c, to_r, to_c
) {
    let move_direction_set;
    if (Math.abs(to_r - from_r) - Math.abs(to_c - from_c) === 0) {
        move_direction_set = (
            (to_r - from_r) - (to_c - from_c) === 0
            ? ["NW", "SE"]
            : ["SW", "NE"]
        );
    // Rank or file movement straight up and down or sideways
    } else if (
        (from_r - to_r) === 0 
        || (from_c - to_c) === 0
    ) {
        move_direction_set = (
            from_r === to_r
            ? ["E", "W"]
            : ["N", "S"]
        );
    // Else you are a knight, return true, you are always moving off the strand
    } else {
        return true;
    }
    return !(move_direction_set.includes(threat_web_val))
}

exports.get_orientation = (function () {
    const map = {"w": -1, "b": 1};
    return function (id_or_color) {
        // "wp1" --> "w", "white" --> "w", "w" --> w, "q" --> undefined
        return map[id_or_color[0]];
    };
}());

exports.opposite_color_char = (function () {
    const map = {"w": "b", "b":"w"};
    return function (id_or_color) {
        // "wp1" --> "w", "white" --> "w", "w" --> w, "q" --> undefined
        return map[id_or_color[0]];
    };
}());

exports.king_movement_additives = [
    [-1,  0], [-1,  1], [0,  1],  [1,   1], 
    [1,  0],  [1,  -1], [0, -1],  [-1, -1]
];

exports.knight_movement_additives = [
    [1, 2], [2, 1], [-1, 2], [-2, 1], 
    [1, -2], [2, -1], [-1, -2], [-2, -1]
];

// Functions. 
// f :: (int: row, int: column) --> boolean
exports.is_in_bounds = function (r, c) {
    return (r >= 0 && r < 8 && c >= 0 && c < 8);
};

// f :: (int: row, int: column) --> string: chess a1 notation
exports.in_a1 = (function () {
    const space_alpha = ["A", "B", "C", "D", "E", "F", "G", "H"];
    return function (r, c) {
        return space_alpha[c] + String(parseInt(8 - r));
    }
}());

// f :: (string: chess a1 notation) --> array: [int: row, int: column]
exports.in_r_c = (function () {
    space_alpha_to_column_int = {
        "A":0, "B":1, "C":2, "D":3, "E":4, "F":5, "G":6, "H":7
    };
    return function (a1_str) {
        return [
            Number(8 - a1_str[1]), 
            space_alpha_to_column_int[a1_str[0]]
        ];
    }
}());

// f :: (string, string) --> boolean
exports.is_enemy = function (own_id, other_board_value) {
    return (
        // Can't just compare IDs because sometimes blank squares are searched. 
        other_board_value !== ""
        && own_id[0] !== other_board_value[0]
    );
};
exports.is_enemy_king = function (own_id, other_board_value) {
    return other_board_value === exports.opposite_color_char(own_id[0]) + "k_";
}

// f :: (string, string) --> boolean
exports.is_ally = function (own_id, other_board_value) {
    return (
        other_board_value !== ""
        && own_id[0] === other_board_value[0]
    );
};

// f :: (int, int) --> object { "r": int, "c": int }
exports.make_compass_edits = (function () {
    const edits = {
        "N":  [-1, 0], "NE": [-1, 1], "E":  [0,  1], "SE": [1,  1], 
        "S":  [1,  0], "SW": [1, -1], "W":  [0, -1], "NW": [-1,-1] 
    };
    return function (r, c, direction) {
        return { 
            "r": r + edits[direction][0],
            "c": c + edits[direction][1]
        }
    };
}());

exports.remove_from_array = function (array, element_to_remove) {
    array = array.filter(function (item) {
        return !(item === element_to_remove);
    });
};

exports.log_execution_time = function (
    mills_integer, blue_under=4, yellow_under=7, description="Execution"
) {
    console.log(
        `%c${description} took ${mills_integer} ms.`, 
        "color: " + (
            mills_integer < blue_under
            ? "#417794"
            : (
                mills_integer < yellow_under
                ? "#e0a500"
                : "red"
            )
        )
    );
}

exports.board_is_stardard = function (board_object) {
    return board_object.reduce(function (acc, row) {
        acc.push(row.map(function (item) {
            return (
                // Convert empty spaces to "E"
                item === ""
                ? "E"
                : item
            )
        }).join("/"));
        return acc;
    }, []).join("") === (
          "br1/bn1/bb1/bq1/bk_/bb2/bn2/br2"
        + "bp1/bp2/bp3/bp4/bp5/bp6/bp7/bp8"
        + "E/E/E/E/E/E/E/E" + "E/E/E/E/E/E/E/E"
        + "E/E/E/E/E/E/E/E" + "E/E/E/E/E/E/E/E"
        + "wp1/wp2/wp3/wp4/wp5/wp6/wp7/wp8"
        + "wr1/wn1/wb1/wq1/wk_/wb2/wn2/wr2"
    );
}

// Will try to go without a "safely add to array" possibility. 

return exports;
}()); // Module by closure pattern bookend. 
