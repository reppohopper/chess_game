// Module by closure pattern bookend. 
const king_threat_functions = kt = (
    function king_threat_functions_module_loader () {

const exports = {};
// Assumes this closure occured already. 
// const ur = require("./utilities_and_reference.js");

exports.all_threats_maps = {
// They are named for the color of the pieces threatening the spaces. They are
// filled with zeroes, to be incremented and decremented to represent the 
// number of pieces threatening the space.
    "w": ur.get_empty_board(0),
    "b": ur.get_empty_board(0) 
};

// Removal functions remain local because they only happen in bulk, by piece. 
const decrement_all_threats_map_space = function (color, a1_space) {
    const [r, c] = ur.in_r_c(a1_space);
    exports.all_threats_maps[color][r][c] -= 1;
};

const decrement_all_threats_map_space_by_r_c = function (color, r, c) {
    exports.all_threats_maps[color][r][c] -= 1;
};

// Exported options. 
exports.increment_threats_map_space_by_r_c = function (color, r, c) {
    exports.all_threats_maps[color][r][c] += 1;
};

/*
exports.update_threats_map_by_move_options = function (
    move_options, color, a1_space
) {
    move_options.forEach(function (option) {
        exports.increment_threats_map_space_by_r_c(color, ...ur.in_r_c(option));
    });
};*/

// Must occur before move options are cleared. 
exports.remove_whole_piece_from_all_threats_map = function (id, m) {
    m.roster[id].is_threatening_spaces.forEach(function (coord_set) {
        decrement_all_threats_map_space_by_r_c(
            id[0], Number(coord_set[0]), Number(coord_set[1])
        );
    });
    m.roster[id].is_threatening_spaces = [];
};

exports.kings = { "b": {}, "w": {} };
["b", "w"].forEach(function (color) {
    // Initialize similar properties for both kings. 
    exports.kings[color].threat_web = ur.get_empty_board("");
    // Id lists, ie, [bb1, br2];
    // Interestingly, this list is logically capped at 2. 
    exports.kings[color].direct_threats = []; 
    exports.kings[color].strand_register = ur.direction_list.reduce(
        function (acc, direction) {
            acc[direction] = undefined; 
            return acc;
        }, 
        {}
    ); 
});

exports.add_to_threat_web_register = function (color_char, id, direction, m) {
    if (
        // If it is an enemy piece ...
        color_char !== id[0]
        && (
            // ... and it's a queen, 
            id[1] === "q"
            // ... or a bishop on a diagonal, or a rook on a straight ...
            || (direction.length === 2 && id[1] === "b")
            || (direction.length === 1 && id[1] === "r")
        )
    ) {
        // Enter check state. 
        m.meta_data.check_state = color_char; // Idempotent. 
        // Add to the direct threats object, if it isn't there already
        if (!exports.kings[color_char].direct_threats.includes(id)) {
            exports.kings[color_char].direct_threats.push(id);
        }
    }
    // Add to the general register of pieces that will need a callback when 
    // the king-spider moves and thereby moves the whole web. 
    exports.kings[color_char].strand_register[direction] = id;
}

exports.mask_move_options_for_check_state = function (m) {
    
};


// Only happens when the web is stepped on or off of a strand
exports.update_threat_web_on_strand = function (color, direction, m) {
    // Pop the piece off of the register. 
    const register_value = exports.kings[color].strand_register[direction];
    if (register_value !== undefined) {
        // TODO : Uncomment the following line and look at the fact that
        // the code runs twice. 
        // console.log(`popping ${register_value} off of the register`);
        m.pieces_blocking_moved_piece.push(register_value);
        exports.kings[color].strand_register[direction] = undefined;
    }

    const king_id = color + "k_";
    const king_coords = [m.roster[king_id].r, m.roster[king_id].c];
    let look_space = ur.make_compass_edits(...king_coords, direction);
// There has to be a better way to write this whole block. Maybe just switching
// what is written on the first time a piece is encountered. TODO
// Or using the any / every to break out. 
    while (
        ur.is_in_bounds(look_space.r, look_space.c)
        && m.board[look_space.r][look_space.c] === ""
    ) {
        exports.kings[color].threat_web[look_space.r][look_space.c] = direction;
        look_space = ur.make_compass_edits(
            look_space.r, look_space.c, direction
        );
    }
    if (!ur.is_in_bounds(look_space.r, look_space.c)) {
        return undefined;
    } 
    // Here we can assume a piece was encountered. Can mark it at the last 
    // point in the threat web. 
    exports.kings[color].threat_web[look_space.r][look_space.c] = direction;
    // Add this piece to the register object, which handles enemies and allies. 
    kt.add_to_threat_web_register(
        color, m.board[look_space.r][look_space.c], direction, m
    );
    // Also make sure that it updates its movement options. 
    m.pieces_blocking_moved_piece.push(m.board[look_space.r][look_space.c]);
    // Overwrite the rest of the strand with "" 
    look_space = ur.make_compass_edits(look_space.r, look_space.c, direction);
    while (ur.is_in_bounds(look_space.r, look_space.c)) {
        exports.kings[color].threat_web[look_space.r][look_space.c] = "";
        look_space = ur.make_compass_edits(
            look_space.r, look_space.c, direction
        );
    }
};

// function :: (String, Int, Int, Object) --> void
// Both add a threat to the relevant all threats map, and add that value to 
// the piece's reference object for spaces it threatens. 
exports.threaten_space = function (id, threat_r, threat_c, m) {
    exports.increment_threats_map_space_by_r_c(id[0], threat_r, threat_c);
    m.roster[id].is_threatening_spaces.push(
        String(threat_r) + String(threat_c)
    );
};

exports.fully_update_threat_web = function (color, m) {
    ur.direction_list.forEach(function (direction) {
        const register_value = exports.kings[color].strand_register[direction];
        if (register_value !== undefined) {
            m.pieces_blocking_moved_piece.push(register_value);
            exports.kings[color].strand_register[direction] = undefined;
        }
    });
    // Blank it out completely, run it in all directions.
    exports.kings[color].threat_web = ur.get_empty_board("");
    // Set the king value on the space he is on. 
    const king_id = color + "k_";
    const [k_r, k_c] = [m.roster[king_id].r, m.roster[king_id].c]
    exports.kings[color].threat_web[k_r][k_c] = king_id;
    // Update every strand for that king.
    ur.direction_list.forEach(function (direction) {
        exports.update_threat_web_on_strand(color, direction, m);
    });
};

// Happens on every move. 

exports.is_threatened_in_direction = function (r, c, color, direction, m) {
    let threats = "q";
    if (direction.length === 2) { // True when direction is NE, SE, NW, or SW. 
        threats += "b"; // Look for bishops and queens. 
    } else {
        threats += "r"; // Look for rooks and queens. 
    }
    let look_space = ur.make_compass_edits(r, c, direction);
    while (
        ur.is_in_bounds(look_space.r, look_space.c)
    ) {
        if (m.board[look_space.r][look_space.c] !== "") {
            if (m.board[look_space.r][look_space.c][0] === color) {
                // Important to interrupt here to stop further looking.
                return false; // Threat check encounters own piece color.
            } // Else if it encounters an enemy, return right away either way:

            return threats.includes(m.board[look_space.r][look_space.c][1]);
        }
        look_space = ur.make_compass_edits(
            look_space.r, look_space.c, direction
        );
    }
    return false;
}; 


exports.would_check_your_king = function (from_r, from_c, to_r, to_c, m) {
    const own_id = m.board[from_r][from_c];
    const own_color = own_id[0];
    const threat_web_from = exports.kings[own_color].threat_web[from_r][from_c];
    if (
// If you are on your king's threat web strand ...  
        threat_web_from !== ""
// And you are not moving along the direction of that threat web strand ...
        && ur.is_moving_off_the_strand(
            threat_web_from, from_r, from_c, to_r, to_c
        )
    ) {
        return exports.is_threatened_in_direction(
            from_r, from_c, own_color, threat_web_from, m
        );
    }
    // Otherwise return false because no move you make can expose your king. 
    return false; 
};

// Function to allow a king of one color (the color that did not just move) 
// to filter any movement options that are now on threatened spaces. 
exports.extra_king_moves_update = function (color, m) {
    const opp = ur.opposite_color_char(color);
    // For every space, if the enemy now threatens that space, detract 
    // it from your possible moves. 
    m.roster[color + "k_"].movement_options = 
    m.roster[color + "k_"].movement_options.filter(function (space) {
        const [look_r, look_c] = ur.in_r_c(space);
        return exports.all_threats_maps[opp][look_r][look_c] === 0; // Boolean
    });
};


const restore_movement_options_from_cache = function (color, m) {
    Object.keys(m.roster).filter(function (id) {
        return id[0] === color;
    }).forEach(function (id) {
        [
            m.roster[id].movement_options, 
            m.roster[id].movement_options_cache
        ] = [
            // Copy the movement options back from the cache.
            m.roster[id].movement_options_cache.slice(), 
            // Clear the cache. 
            [] 
        ];
    });
}

// Note that this function has to happen right at the top of a piece move, 
// as the very first thing. This is because, the movement_options lists have
// to be restored from cache so that everything that happens to them in the 
// main move_piece function can operate and update itself normally. 
exports.manage_moved_out_of_check = function (just_moved_color, m) {
    // If the side whose turn it is just moved (out of check, as all 
    // moves will have been). 
    if (m.meta_data.check_state === just_moved_color) {
        m.meta_data.check_state = undefined;
        exports.kings[just_moved_color].direct_threats = [];
        // Restore all your own side's movement_options from cache. 
        restore_movement_options_from_cache(just_moved_color, m);
    }
}

// The legal moves in a checked state are the subset of moves that were already
// legal that meet the following criteria: 1 (conditional): if there is only 
// one piece threatening the king, they capture that piece. 2: it is a king's 
// move to a space that is not threatened and is not along a continuous line 
// that would be threatened. (Moving south is illegal if the threat comes 
// from the linear north. So is moving SE if the threat is from NW) 

// TODO: Is en pessant an obscure exception to the double-threat rule?

const subset_moves_for_check_state = function (color, m) {
    const king_id = (color + "k_");
    let is_mate = true;
    const is_single_threat = (kt.kings[color].direct_threats.length === 1);
    // Only initialize if there is a single threat. 
    const threat_id = (
        is_single_threat
        ? exports.kings[color].direct_threats[0]
        : undefined
    );
    // Only initialize if there is a single threat. 
    const block_or_capture_spaces = (
        is_single_threat
        ? [ur.in_a1(m.roster[threat_id].r, m.roster[threat_id].c)]
        : undefined
    );

    if (block_or_capture_spaces !== undefined) {
        // Add every space on that strand. 
        const [cap_r, cap_c] = ur.in_r_c(block_or_capture_spaces[0]);
        const opp_dir = ur.get_opposite_direction(
            exports.kings[color].threat_web[cap_r][cap_c]
        );
        // Only add the intermediary spaces if the piece that needs to be 
        // caputed is a linear piece. 
        if (/[np]/.test(m.board[cap_r][cap_c][1]) === false) {
            let look = ur.make_compass_edits(cap_r, cap_c, opp_dir);
            while (
                ur.is_in_bounds(look.r, look.c)
                && m.board[look.r][look.c] !== king_id
            ) {
                block_or_capture_spaces.push(ur.in_a1(look.r, look.c));
                look = ur.make_compass_edits(look.r, look.c, opp_dir);
            }
        }
    };
    Object.keys(m.roster).filter(function (id) {
        return (
            id[0] === color
            && id !== king_id
        );
    }).forEach(function (id) {
        // Copy the movement options into the cache. 
        m.roster[id].movement_options_cache = (
            m.roster[id].movement_options.slice()
        );
        if (is_single_threat) {
            m.roster[id].movement_options = (
                m.roster[id].movement_options_cache
            ).filter(function (space) {
                return (
                    // TODO: turn this into "capture or block" spaces. 
                    block_or_capture_spaces.includes(space)
                    ? (is_mate = false, true) 
                    : false
                );
            });
        } else {
            m.roster[id].movement_options = [];
        }
    });
    // The king just needs to look for unthreated spaces opposite to 
    // any linear theat lines. 
    m.roster[king_id].movement_options_cache = (
        m.roster[king_id].movement_options.slice()
    );
    const king_cant_move = [];
    Object.keys(exports.kings[color].strand_register).forEach(
        function (direction) {
            const insect_id = exports.kings[color].strand_register[direction];
            if (
                insect_id !== undefined
                // If it is an enemy linear piece...
                && insect_id[0] === ur.opposite_color_char(color)
                && /[qbr]/.test(insect_id[1])
            ) {
// ... look one space to the other side of the linear threat, so that a king 
// cannot backstep away from a linear threat even though the king himself 
// would be blocknig that threat from registering as being "threatened". 
// I guess this whole block could have been sidestepped by having linear
// threat generation ignore kings. 
                const look = ur.make_compass_edits(
                    m.roster[king_id].r, 
                    m.roster[king_id].c,
                    ur.get_opposite_direction(direction)
                );
                if (ur.is_in_bounds(look.r, look.c)) {
                    king_cant_move.push(ur.in_a1(look.r, look.c));
                }
            }
        }
    );
    m.roster[king_id].movement_options = (
        m.roster[king_id].movement_options.filter(function (space) {
            return !king_cant_move.includes(space);
        })
    );
    // Reduce king movement options. 
    if (m.roster[king_id].movement_options.length !== 0) {
        is_mate = false;
    }

    if (is_mate) {
        console.warn("Checkmate! The game should end now.");
    }
};

// This call happens at the very bottom of the main move_piece function, 
// because it subsets all of the moves after they have been fully calculated
// as if check did not exist. 
exports.manage_got_put_into_check = function (opponent_color, m) {
    // If the opposite side to whose turn it just was is now in check, subset
    // all the now-computed move options for that side. 
    if (m.meta_data.check_state === opponent_color) {
        // Restore all your own side's movement_options from cache. 
        subset_moves_for_check_state(opponent_color, m);
    }
};

exports.check_opposite_king = function (checking_piece_id, m) {
    const opp_color = ur.opposite_color_char(checking_piece_id);
    if (!kt.kings[opp_color].direct_threats.includes(checking_piece_id)) {
        kt.kings[opp_color].direct_threats.push(checking_piece_id);
    }
    m.meta_data.check_state = opp_color;
    // The king has to also loob for linear threats. 
}

return exports;
}()); // Module by closure pattern bookend.