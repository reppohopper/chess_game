// Module by closure pattern bookend. 
const blocking_functions = blocking = (
    function blocking_functions_module_loader () {

const exports = {};



exports.relate = function (relation_type, acting_id, receiving_id, m) {
    if (m.roster[acting_id]["is_" + relation_type].includes(receiving_id)) {
        return undefined;
    }
    // Blocking/enabling id gets its "is_blocking/enabling" array updated.
    m.roster[acting_id]["is_" + relation_type].push(receiving_id);
    // Blocked/enabled id gets its "is_blocked/enabled_by" array updated. 
    m.roster[receiving_id][
        "is_" + relation_type.substring(0, 5) + "ed_by"
    ].push(acting_id);
};

exports.unrelate = function (relation_type, acting_id, receiving_id, m) {
    // Blocking/enabling id gets its "is_blocking/enabling" array updated.
    m.roster[acting_id]["is_" + relation_type] = 
    m.roster[acting_id]["is_" + relation_type].filter(function (item) {
        return item !== receiving_id
    });
    // Blocked/enabled id gets its "is_blocked/enabled_by" array updated. 
    m.roster[receiving_id]["is_" + relation_type.substring(0, 5) + "ed_by"] = 
    m.roster[receiving_id]["is_" + relation_type.substring(0, 5) + "ed_by"]
        .filter(function (item) {
            return item !== acting_id
    });
};

const update_blocking_in_compass_direction = function (
    r, c, direction, m, top_call
) {
    let output = undefined;
    let look_space = ur.make_compass_edits(r, c, direction);
    // Read from the compass direction to tell whether we are looking for 
    // Rooks or bishops in addition to queens. 
    const can_move_here = "q" + (
        direction.length === 2
        ? "b"
        : "r"
    );
    // Push look space all the way to the edge, or to the first non empty space. 
    while (
        ur.is_in_bounds(look_space.r, look_space.c)
        && m.board[look_space.r][look_space.c] === ""
    ) {
        look_space = ur.make_compass_edits(
            look_space.r, look_space.c, direction
        );
    }
    if ( 
        // If it is in bounds and is is a bishop or a queen, collect it's id. 
        ur.is_in_bounds(look_space.r, look_space.c)
        && can_move_here.includes(m.board[look_space.r][look_space.c][1])
    ) {
        // This is for ... TODO what is this for?
        if (top_call) {
            output = m.board[look_space.r][look_space.c];
        }
        
        const id = m.board[r][c];
        exports.relate(
            "blocking", 
            m.board[r][c], // actively blocing peice
            m.board[look_space.r][look_space.c], // blocked piece
            m
        );
    } 
    return output;
};

// TODO Refactor and shorten. 
exports.unrelate_all_relations = function (id, m) {
    const was_blocking_or_enabling = {};
    // Unrelation uses a filter function for removal, so is repetition safe. 
    // No need to worry about if there are repeats on your is_blocking / 
    // is_blocked_by list for example.
    m.roster[id].is_blocking.slice().forEach(function (other_id) {
        was_blocking_or_enabling[other_id] = true;
        exports.unrelate("blocking", id, other_id, m);
    });

    m.roster[id].is_blocked_by.slice().forEach(function (other_id) {
        was_blocking_or_enabling[other_id] = true;
        exports.unrelate("blocking", other_id, id, m); // other_id is "active"
    }); 

    m.roster[id].is_enabling.slice().forEach(function (other_id) {
        was_blocking_or_enabling[other_id] = true;
        exports.unrelate("enabling", id, other_id, m);
    });

    if (id[1] === "p") {
        m.roster[id].is_enabled_by.slice().forEach(function (other_id) {
            was_blocking_or_enabling[other_id] = true;
            exports.unrelate("enabling", other_id, id, m); // other_id is "active"
        });
    }
    return was_blocking_or_enabling;
};
// TODO yeah definitely refactor so that all of this isn't just straight-up
// re-written. 
exports.unrelate_all_relations_min = function (id, m) {
    m.roster[id].is_blocking.slice().forEach(function (other_id) {
        exports.unrelate("blocking", id, other_id, m);
    });
    m.roster[id].is_blocked_by.slice().forEach(function (other_id) {
        exports.unrelate("blocking", other_id, id, m); // other_id is first.
    }); 
    m.roster[id].is_enabling.slice().forEach(function (other_id) {
        exports.unrelate("enabling", id, other_id, m);
    });
    if (id[1] === "p") {
        m.roster[id].is_enabled_by.forEach(function (other_id) {
            exports.unrelate("enabling", other_id, id, m); // other_id is first.
        });
    }
}

// Also handles and updates cases of enabling. 
exports.update_own_blocking_list = function (id, m, top_call=false) {
    // Clear your old blocking list and enabling list.
    // This is the source of the problem on initialization. 
    const also_update = (
        top_call
        ? exports.unrelate_all_relations(id, m)
        : exports.unrelate_all_relations_min(id, m)
    );
    const [r, c] = [m.roster[id].r, m.roster[id].c];
    // Check your straights for rooks and queens on either side. *
    // Check your diagonals for bishops and queens on either side.
    ur.direction_list.forEach(function (direction) {
        const maybe_add = update_blocking_in_compass_direction(
            r, c, direction, m, top_call
        ); 
        if (top_call && (maybe_add !== undefined)) {
            also_update[maybe_add] = true;
        }
    });
// * It's worth noting that technically you are not always blocking an enemy 
// bishop, rook or queen if you are on an edge. But you are blocking an allied
// bishop, rook or queen. The author has chosen to eat the performance cost.  
    // Check your 2+1s for allied knights. 
    ur.knight_movement_additives.forEach(function (pair) {
        const [look_r, look_c] = [r + pair[0], c + pair[1]];
        if (
            ur.is_in_bounds(look_r, look_c)
            && m.board[look_r][look_c].substring(0, 2) === (id[0] + "n") 
        ) {
            if (top_call) {
                also_update[m.board[look_r][look_c]] = true;
            }
            exports.relate("blocking", id, m.board[look_r][look_c], m);
        }
    });
    /* Don't think this is necessary while kings update after every turn. 

    // Check your adjacents for allied kings. 
    ur.king_movement_additives.forEach(function (pair) {
        const [look_r, look_c] = [r + pair[0], c + pair[1]];
        if (
            ur.is_in_bounds(look_r, look_c)
            && m.board[look_r][look_c].substring(0, 2) === (id[0] + "k") 
        ) {
            if (top_call) {
                also_update[m.board[look_r][look_c]] = true;
            }
            exports.relate("blocking", id, m.board[look_r][look_c], m);
        }
    });

    */
    // Check one space up for black pawns, one space down for white pawns. 
    [
        {"p_color": "w", "r_add": 1,  "start_reach_space": 4},
        {"p_color": "b", "r_add": -1, "start_reach_space": 3}
    ].forEach(function (set) {
        if (
            // With white as the example: 
            // unless you are at the bottom row ...
            ur.is_in_bounds(r + set.r_add, c)
            // ...and then only if there is the white color pawn in the space 
            // below you in the board ...
            && m.board[r + set.r_add][c].substring(0, 2) === (set.p_color + "p")
        ) {
            // Don't also update the pawn you just blocked. 
            if (top_call) {
                also_update[m.board[r + set.r_add][c]] = true;
            }
            exports.relate("blocking", id, m.board[r + set.r_add][c], m);
        }
// there is a white pawn in the start space, and there is not a different 
// piece between you and the pawn, then you are blocking that pawn.
        if (
            // Look an additional space if you are on white pawns' 
            // reach point from their start row.
            r === set.start_reach_space
            // If there is a white pawn in that start space ...
            && m.board[
                set.start_reach_space + (2 * set.r_add)
            ][c].substring(0, 2) === set.p_color + "p"
            // .... and no pieces in between you and that start space ...
            && m.board[set.start_reach_space + set.r_add][c] === ""
        ) {
            // ... then you are blocking that pawn. 
            if (top_call) {
                also_update[
                    m.board[set.start_reach_space + (2 * set.r_add)][c]
                ] = true;
            }
            exports.relate(
                "blocking", 
                id,
                m.board[set.start_reach_space + (2 * set.r_add)][c],
                m
            );
        }
    });

    const enemy_char = e_c = ur.opposite_color_char(id);
    // Invert the value of orientation because you are looking for a pawn that
    // can move to the current square, in the opposite direction as it can move.
    const look_orientation = look_o = ur.get_orientation(e_c) * -1;
    [-1, 1].forEach(function (c_add) {
        if (
            ur.is_in_bounds(r + look_o, c + c_add)
            && m.board[r + look_o][c + c_add].substring(0, 2) === (e_c + "p")
        ) {
            if (top_call) {
                also_update[m.board[r+look_o][c + c_add]] = true;
            }
            exports.relate("enabling", id, m.board[r+look_o][c + c_add], m);
        }
    });
    if (top_call === false) {
        return undefined;
    }
    // Could be (cheap) undefined in the case that it isn't a top call.
    // Does all the work needed to order things correctly, taking it out  of the 
// engine's move function. Return an array of all of the other  pieces that need
// to update themselves, with kings (if any) in the last positions, and if two
// kings, then in the safe order (moved-piece-allied king first). 
    const kings_to_update = []
    return Array.prototype.concat(
        Object.keys(also_update).filter(function (item) {
            return (
                item[1] === "k"
                ? (kings_to_update.push(item), false)
                : true
            );
        }),
        (
            (kings_to_update.length === 2 && kings_to_update[0][0] !== id[0])
            ? [kings_to_update[1], kings_to_update[0]] // avoiding .reverse()
            : kings_to_update
        )
    );
};

return exports;
}()); // Module by closure pattern bookend.