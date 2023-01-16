
// Module by closure pattern bookend. 
const movement_options_functions = move_ops = (
    function movement_options_functions_module_loader () {

const exports = {};

// Assumes these closures occured already. 
// const ur = require("./utilities_and_reference.js");
// const kt = require("./king_threat_functions.js");
// 
// const blocking = require("./blocking_functions.js");

const movement_options_in_compass_direction = function (
    r, c, direction, m, top_call=false
) {
    const own_id = m.board[r][c];
    const sub_possibles = [];
    let look_space = ur.make_compass_edits(r, c, direction);
    // Return [] if the first space in that direction is out of bounds.
    if (!ur.is_in_bounds(look_space.r, look_space.c)) {
        return sub_possibles; 
    }
    let look_space_val = m.board[look_space.r][look_space.c];
    // Check exactly once if moving in this direction would leave your 
    // king exposed.
    if (kt.would_check_your_king(r, c, look_space.r, look_space.c, m)) {
        return sub_possibles;
    }
    // Continue to look for possible move-to spaces in this direction. 
    while (look_space_val === "") {
        // Add the looked-at-space to the arary of possible moves. 
        // Also add it to the spaces that you are threatening. 
        sub_possibles.push(ur.in_a1(look_space.r, look_space.c));
        kt.threaten_space(own_id, look_space.r, look_space.c, m);
        // Update the look space to look another space out. 
        look_space = ur.make_compass_edits(
            look_space.r, look_space.c, direction
        );
        if (!ur.is_in_bounds(look_space.r, look_space.c)) {
            return sub_possibles;
        }
        // Update the board value to go with it. 
        look_space_val = m.board[look_space.r][look_space.c];
    }
    // You have encountered a piece. Add it to the list of spaces you are 
    // threatening no matter what.
    kt.threaten_space(own_id, look_space.r, look_space.c, m);
    // If it is an enemy, add them to the possible moves array. 
    if (ur.is_enemy(m.board[r][c], look_space_val)) {
        sub_possibles.push(ur.in_a1(look_space.r, look_space.c));
        if (look_space_val.substring(1) === "k_") {
            kt.check_opposite_king(own_id, m);
        }
    }
    // If it's a top call, whether it is an enemy or an ally, make sure
    // they establish a blocking relationship with you.
    if (top_call) {
        m.pieces_blocking_moved_piece.push(
            m.board[look_space.r][look_space.c]
        );
    // Otherwise establish the relation directly. 
    } else {
        blocking.relate(
            "blocking", 
            m.board[look_space.r][look_space.c], 
            m.board[r][c], 
            m
        );
    }
    return sub_possibles;
};

const get_castling_options = function (color_char, m) {
     // Don't run if you can't castle anymore, or are in check. 
    const castling_options = [];
    if (
    // This function should be placed inside the king's movement options. 
        m.meta_data.can_castle[color_char] === undefined
        || m.meta_data.check_state === color_char
    ) {
        return castling_options;
    }
    const opp_color = ur.opposite_color_char(color_char);
    ["O-O-O", "O-O"].forEach(function (side) {
        const c_add = 4 - side.length; // Oh, so janky. 
        const row = {"w": 7, "b": 0}[color_char];
        // If you haven't lost the ability to castle on that side 
        // (because the rook has moved or been captured) ...
        if (
            // If all the spaces between the king and rook are blank ...
            m.meta_data.can_castle[color_char][side] !== undefined
            && m.board[row][4+c_add] === ""
            && m.board[row][4+(2*c_add)] === ""
            && (side === "O-O" || m.board[row][4+(3*c_add)] === "")
            // and the two spaces the king will move through are not 
            // under active threat ...
            && kt.all_threats_maps[opp_color][row][4+c_add] === 0
            && kt.all_threats_maps[opp_color][row][4+(2*c_add)] === 0
        ) {
            // Add that second space as a move option. 
            castling_options.push(
                ur.in_a1(row, 4+(2*c_add))
            );
        }
    });
    return castling_options;
};

exports.manage_castling_options = function (just_moved_id, from_r, from_c, m) {
    let castle_obj = m.meta_data.can_castle[just_moved_id[0]];
    if (castle_obj === undefined) {
        return [undefined, undefined];
    }
    // If the king just moved, make their object undefined. Also works on 
    // the turn that the king castles. Also shourt circuit and return. 
    if (just_moved_id.substring(1) === "k_") {
        m.meta_data.can_castle[just_moved_id[0]] = undefined;
// If you just castled, return the rook id you castled with, 
// otherwise return undrefined. Do this by simply checking whether 
// the king ended up in row 2 or 6, given what we have already established. 
        const moved_to_col = m.roster[just_moved_id].c;
        if (moved_to_col === 6 || moved_to_col === 2) {
            return [
                // The rooks id (6 becomes "2", 2 becomes "1")
                just_moved_id[0] + "r" + String(parseInt(
                    (moved_to_col + 2) / 4 // (Sorry). 
                )),
                // Where the rook needs to move to (6 --> 5, 2 --> 3)
                ur.in_a1(from_r, (moved_to_col+4) / 2)
            ];
        }
        return [undefined, undefined];
    }
    // If a rook just moved
    if (just_moved_id[1] === "r") {
        const king_row = (
            just_moved_id[0] === "b"
            ? 0
            : 7
        );
        // Dercement the correct side, if they moved off of the correct 
        // square. Perhaps this is happening idempotently. And wastefully. 
        if (
            m.meta_data.can_castle[just_moved_id[0]]["O-O-O"] 
            && from_c === 0 
            && from_r === king_row
        ) {
            m.meta_data.can_castle[just_moved_id[0]]["O-O-O"] = undefined;
        } else if (
            m.meta_data.can_castle[just_moved_id[0]]["O-O"] 
            && from_c === 7 
            && from_r === king_row
        ) {
            m.meta_data.can_castle[just_moved_id[0]]["O-O"] = undefined;
        }
    }
    return [undefined, undefined];
    // Assumes the check state object was updated on the line before this 
    // was run. 
}

// Movement options core, by piece. 
const get_move_options_by_piece = {}; 

get_move_options_by_piece.pawn = function (r, c, m, top_call) {
    const own_id = m.board[r][c]; 
// Deletion of possible moves off of the threat map does not occur here because
// pawns are a special case where many of their possible moves do not 
// constitute threats. So it is handled at piece move. 
    let possibles = [];
    const orientation = o = ur.get_orientation(own_id);
//    if (own_id === "bp1") {
//        console.log("will bp1 check the king?");
//        console.log(kt.would_check_your_king(r, c, r + orientation, c, m));
//    }
    // Yes, technically this should never occur. 
    if (!ur.is_in_bounds(r + orientation, c)) {
        return possibles;
    }
    if (
        m.board[r + orientation][c] === ""
        && !kt.would_check_your_king(r, c, r + orientation, c, m)
    ) {
        possibles.push(ur.in_a1(r + orientation, c));
        // Only check for that next space if the first space was open. 
        if (
            // If you are on your starting row ... 
            // ( The following is true when r===6 and orientation===1, 
            // and when r===1 and orientation ===-1, and at no other time. )
            r === Math.floor(3.5 - (orientation * 2.5) + 0.001)
        ) {
            // And the space two spaces out is open ...
            if (m.board[r + (orientation * 2)][c] === "") {
                possibles.push(ur.in_a1(r + (orientation * 2), c));
            // If you encountered a piece, establish a blocking relationship. 
            } else if (top_call) {
                // Maybe the need for this is partially logically not there. 
                // Not sure though. 
                m.pieces_blocking_moved_piece.push(
                    m.board[r + (orientation * 2)][c]
                );
            } else {
                blocking.relate(
                    "blocking", m.board[r + (orientation * 2)][c], own_id, m
                );
            }
        }
    } else if (m.board[r + orientation][c] !== "") {
        if (top_call) {
            m.pieces_blocking_moved_piece.push(m.board[r + orientation][c]);
        } else {
            blocking.relate("blocking", m.board[r + orientation][c], own_id, m);
        }
    }
// Deletion of threat spaces for pawns happen at piece move. It's a special
// case applying only to pawns, since they are the only piece whose possible
// moves are not identical to the spaces they threaten. 
    [-1, 1].forEach(function (c_add) {
        const [look_r, look_c] = [r + o, c + c_add];
        if (ur.is_in_bounds(look_r, look_c)) {
            // Always threaten the space. 
            kt.threaten_space(own_id, look_r, look_c, m);
            // See if you can currently move to it. 
            if (
                ur.is_enemy(own_id, m.board[look_r][look_c])
                && !kt.would_check_your_king(r, c, look_r, look_c, m)
            ) {
                const a1_space = ur.in_a1(look_r, look_c);
                possibles.push(a1_space);
                if (top_call) {
                    // Yes, misnomer because it is enabling in this case. 
                    m.pieces_blocking_moved_piece.push(
                        m.board[look_r][look_c]
                    );
                }
                if (ur.is_enemy_king(own_id, m.board[look_r][look_c])) {
                    kt.check_opposite_king(own_id, m);
                }
            }
        }
    });
    return possibles;
};

get_move_options_by_piece.rook = function (r, c, m, top_call) {
    return Array.prototype.concat(
        movement_options_in_compass_direction(r, c, "N", m, top_call),
        movement_options_in_compass_direction(r, c, "S", m, top_call),
        movement_options_in_compass_direction(r, c, "E", m, top_call),
        movement_options_in_compass_direction(r, c, "W", m, top_call)
    );
};

get_move_options_by_piece.bishop = function (r, c, m, top_call) {
    return Array.prototype.concat(
        movement_options_in_compass_direction(r, c, "NE", m, top_call),
        movement_options_in_compass_direction(r, c, "SE", m, top_call),
        movement_options_in_compass_direction(r, c, "NW", m, top_call),
        movement_options_in_compass_direction(r, c, "SW", m, top_call)
    );
};

get_move_options_by_piece.queen = function (r, c, m, top_call) {
    return Array.prototype.concat(
        get_move_options_by_piece.rook(r, c, m, top_call),
        get_move_options_by_piece.bishop(r, c, m, top_call)
    );
};

get_move_options_by_piece.knight = function (r, c, m, top_call) {
    const own_id = m.board[r][c];
    let possibles = [];
    // If you are on your king's threat web strand ...  
    const own_king_threat_web_value = kt.kings[own_id[0]].threat_web[r][c];
    const is_pinned = (
        own_king_threat_web_value !== ""
// Don't allow movement at all if you would uncover a threat. This is possible
// only because of the strange logical facts surrounding a knights unique 
// movement: knights can never move along any single threat strand. 
        // TODO should use "would check your king".
        && (kt.is_threatened_in_direction(
                r, c, own_id[0], own_king_threat_web_value, m
            )
        )
    );
    ur.knight_movement_additives.forEach(function (coord_set) {
        const [look_r, look_c] = [r + coord_set[0], c + coord_set[1]];
        // Check if the look space is out of bounds of the board, 
        // and quietly do nothing if it is. 
        if (!ur.is_in_bounds(look_r, look_c)) {
            return undefined; // .forEach "continue" statement. 
        }
        // Threaten the space no matter what. 
        kt.threaten_space(own_id, look_r, look_c, m);
        // If you have an ally blocking, that is the only reason you 
        // wouldn't be able to move into that space, barring king coverage.
        if (ur.is_ally(own_id, m.board[look_r][look_c])) {
            // In that case, create a blocking relation. 
            if (top_call) {
                m.pieces_blocking_moved_piece.push(m.board[look_r][look_c]);
            } else {
                blocking.relate("blocking", m.board[look_r][look_c], own_id, m);
            }
        // Otherwise add it to your possible move options unless you are pinned
        // to your king.
        } else if (!is_pinned) {
            possibles.push(ur.in_a1(look_r, look_c));
        }
        // Knights are the only piece that theatens the enemy king outside of 
        // the act of stepping on a threat web strand. 
        if (ur.is_enemy_king(own_id, m.board[look_r][look_c])) {
            kt.check_opposite_king(own_id, m);
        }
    });
    return possibles;
};

get_move_options_by_piece.king = function (r, c, m) {
    const own_id = m.board[r][c];
    let possibles = [];
    // This runs after every move for both kings. Seems poor, but, might just
    // be the weakest point of a generally good system. 
    ur.king_movement_additives.forEach(function (set) {
        const [look_r, look_c] = [r + set[0], c + set[1]];
        // If the potential move-to space is in bounds ... 
        if (!ur.is_in_bounds(look_r, look_c)) {
            return undefined; // forEach "continue" statement
        }
        // Always threaten the space. 
        kt.threaten_space(own_id, look_r, look_c, m);
        // See if you can move to it. 
        const look_board_value = m.board[look_r][look_c];
        if (
            // If that space is not actively threatened ... 
            kt.all_threats_maps[
                ur.opposite_color_char(own_id)
            ][look_r][look_c] === 0
            // And there is not an ally piece in the space ... 
            && !ur.is_ally(own_id, look_board_value)
        ) {
            possibles.push(ur.in_a1(look_r, look_c));
        }
    });
    return possibles.concat(get_castling_options(own_id[0], m));
};

exports.update_movement_options = function (id, m, top_call=false) {
    kt.remove_whole_piece_from_all_threats_map(id, m);

    const piece_type = ur.piece_abbreviation_map[id[1]];
    const new_move_options =  get_move_options_by_piece[
        piece_type
    ](m.roster[id].r, m.roster[id].c, m, top_call);

    // Redeclare the new movement options on top of the old set. 
    m.roster[id].movement_options = new_move_options; 
    
};

// Intermediary module function wrapper. Hoist! 
exports.update_blocking_list_by_id = function (id, m, top_call) {
    return blocking.update_own_blocking_list(id, m, top_call);
};

exports.initialize_threat_webs = function (m) {
    kt.fully_update_threat_web("w", m);
    kt.fully_update_threat_web("b", m);
};

// Function to update all movement options accross the whole board. 
// Is called immediately. 
exports.update_all_movement_options_and_blocking_lists = function (m) {
    Object.keys(m.roster).forEach(function (id) {
// IMPORTANT: Blocking updates must come before movement updates here. If they
// do not, then it will unrelate all
        blocking.update_own_blocking_list(id, m);
        exports.update_movement_options(id, m, top_call=false);
    });
};

exports.update_threat_webs = function (from_r, from_c, to_r, to_c, m, ignore) {
    ["b", "w"].filter(function (item) {
        return item !== ignore;
    }).forEach(function (color) {
        const from_web_value = kt.kings[color].threat_web[from_r][from_c];
        const to_web_value = kt.kings[color].threat_web[to_r][to_c];
        // Update the move-from strand. 
        if (from_web_value !== "") {
            kt.update_threat_web_on_strand(color, from_web_value, m);
        }
        // Update the move-to strand, so long as it isn't the same strand.
        if (
            to_web_value !== ""
            && to_web_value !== from_web_value
        ) {
            kt.update_threat_web_on_strand(color, to_web_value, m);
        } 
    });
}
 
exports.check_for_stalemate = function (m) {
    const just_moved_char = m.turns.get_active_player_string()[0];
    const up_next_char = ur.opposite_color_char(just_moved_char);
    // If the other side has no legal moves 
    if (
        // If the next-up side is not in check ... 
        m.meta_data.check_state !== up_next_char
        // and every piece on the roster is either on the side that just moved,
        // or else has no movement options ...
        && m.roster.every(function (piece) {
            return (
                piece[0] === just_moved_char
                || m.roster[piece].movement_options.length === 0
            )
        })
    ) {
        console.warn("The game should end as a draw, in stalemate.");
    };
};

exports.clear_en_passant = function (id, a1_move_to_space, m) {
    m.pieces_blocking_moved_piece.push(
        ...m.meta_data.possible_en_passanting_pawns
    );
    m.meta_data.possible_en_passanting_pawns = [];
    // If you are a pawn that just moved diagonally into an empty space ...
    const from_r = m.roster[id].r;
    const [to_r, to_c] = ur.in_r_c(a1_move_to_space);
    if (
        id[1] === "p" 
        && to_c !== m.roster[id].c
        && m.board[to_r][to_c] === ""
    ) {
        // We can be sure that en passant took place. 
        const r_add = (            
            id[0] === "w" 
            ? 1
            : -1
        );
        // Perform
        const captured_id = m.board[from_r][to_c];
        m.board[from_r][to_c] = "";
        m.pieces_blocking_moved_piece = m.pieces_blocking_moved_piece.concat(
            m.roster[captured_id].is_blocking, m.roster[captured_id].is_enabling
        );
        kt.remove_whole_piece_from_all_threats_map(captured_id, m);
        blocking.unrelate_all_relations_min(captured_id, m);
        // to do: also needs to give a heads up to all allies it was 
        // blocking to re-asses. 
        delete m.roster[captured_id];
        return captured_id;
    }
    return undefined;
}

exports.account_for_en_passant = function (id, a1_move_to_space, m) {
    // We already know that it is a pawn that moved two spaces in one move. 
    const opp_color = ur.opposite_color_char(id);
    const [to_r, to_c] = ur.in_r_c(a1_move_to_space);
    const r_add = (
        id[0] === "w" 
        ? 1
        : -1
    );
    const jumped_space = ur.in_a1(to_r + r_add, to_c);
    if (
        to_c !== 0 
        && m.board[to_r][to_c-1].substring(0, 2) === (opp_color + "p")
    ) {
        m.roster[m.board[to_r][to_c-1]].movement_options.push(jumped_space);
        m.meta_data.possible_en_passanting_pawns.push(m.board[to_r][to_c-1]);
    }
    if (
        to_c !== 7 
        && m.board[to_r][to_c+1].substring(0, 2) === (opp_color + "p")
    ) {
        m.roster[m.board[to_r][to_c+1]].movement_options.push(jumped_space);
        m.meta_data.possible_en_passanting_pawns.push(m.board[to_r][to_c+1]);
    }
    // Look for enemy pawns to the right and to the left. 
    
}

// For testing only. 
exports.raise_threat_objects = function () {
    return kt;
};


return exports;
}()); // Module by closure pattern bookend. 
