const test_boards = (function () {
    const exports = {};
    
    exports.one = [
        ["",    "bk_", "",    "",    "",    "",    "",    ""    ],
        ["bb1", "",    "",    "",    "",    "",    "",    "bp8" ],
        ["",    "",    "br1", "",    "",    "",    "bp7", ""    ],
        ["",    "",    "",    "",    "",    "",    "",    ""    ],
        ["",    "",    "",    "",    "",    "",    "wp7", ""    ],
        ["",    "",    "wn1", "",    "",    "",    "",    ""    ],
        ["",    "wk_", "",    "",    "",    "",    "",    ""    ],
        ["",    "",    "",    "",    "",    "",    "",    ""    ]
    ];
    
    exports.two = [
        ["br1", "",    "bb1", "",    "",    "bk_", "",    ""    ],
        ["",    "",    "",    "",    "",    "",    "bp7", "bp8" ],
        ["bn1", "",    "wn1", "",    "",    "",    "",    ""    ],
        ["",    "",    "",    "",    "",    "bp6", "",    ""    ],
        ["",    "",    "",    "",    "",    "",    "wp7", ""    ],
        ["wp1", "wp2", "",    "",    "",    "",    "",    ""    ],
        ["",    "",   "wp3", "wp4",  "",    "",    "",    ""    ],
        ["",    "",    "",    "",    "",    "",    "",    "wk_" ]
    ];

    return exports;
}());