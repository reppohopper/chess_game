const debug = (function debug_module_loader () {

const exports = {};
exports.pretty_print_threat_web = function (color_char, threat_web) {
    console.log(
        "threat web for " + color_char + " king: " 
        + "\n_______________________________\n"
        + threat_web.map(function (row) {
            return row.map(function (space) {
                return (
                    space === ""
                    ? "___"
                    : (space + "__").substring(0, 3)
                );
            }).join("|");
        }).join("\n")
        + "\n\n"
    );
};

exports.pretty_print_threats_map = function (color_char, threats_map) {
    console.log(
        "threats map for " + color_char + " side: " 
        + "\n_______________________________\n"
        + threats_map.map(function (row, r) {
            return row.map(function (space_value, c) {
                return (
                    space_value === 0
                    ? "___"
                    : "_" + String(parseInt(threats_map[r][c])) + "_"
                );
            }).join("|");
        }).join("\n")
        + "\n\n"
    );
};

return exports; 
}());