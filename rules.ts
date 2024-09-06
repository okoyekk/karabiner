import fs from "fs";
import { KarabinerRules } from "./types";
import { createHyperSubLayers, app, open, rectangle, shell } from "./utils";

const rules: KarabinerRules[] = [
  // Define the Hyper key itself
  {
    description: "Hyper Key (⌃⌥⇧⌘)",
    manipulators: [
      {
        description: "Caps Lock -> Hyper Key",
        from: {
          key_code: "caps_lock",
          modifiers: {
            optional: ["any"],
          },
        },
        to: [
          {
            set_variable: {
              name: "hyper",
              value: 1,
            },
          },
        ],
        to_after_key_up: [
          {
            set_variable: {
              name: "hyper",
              value: 0,
            },
          },
        ],
        to_if_alone: [
          {
            key_code: "escape",
          },
        ],
        type: "basic",
      },
    ],
  },
  {
    description: "Shift + Esc to ~",
    manipulators: [
        {
            from: {
                key_code: "escape",
                modifiers: {
                    mandatory: [
                        "shift"
                    ]
                }
            },
            to: [
                {
                    key_code: "grave_accent_and_tilde",
                    modifiers: [
                        "left_shift"
                    ],
                    repeat: true
                }
            ],
            type: "basic"
        }
    ]
  },
  {
    description: "Command + Esc to Command + ` (for window switching)",
    manipulators: [
        {
            from: {
                key_code: "escape",
                modifiers: {
                    mandatory: [
                        "command"
                    ]
                }
            },
            to: [
                {
                    key_code: "grave_accent_and_tilde",
                    modifiers: [
                        "command"
                    ]
                }
            ],
            type: "basic"
        }
    ]
  },
  {
    description: "Command + Shift + Esc to Command + ~ (for reverse window switching)",
    manipulators: [
        {
            from: {
                key_code: "escape",
                modifiers: {
                    mandatory: [
                        "command",
                        "shift"
                    ]
                }
            },
            to: [
                {
                    key_code: "grave_accent_and_tilde",
                    modifiers: [
                        "command",
                        "shift"
                    ]
                }
            ],
            type: "basic"
        }
    ]
  },


  ...createHyperSubLayers({
    spacebar: open(
      "https://google.com"
    ),
    // s = browse "S"ite
    s: {
      r: open("https://reddit.com"),
      f: open("https://www.bogleheads.org/index.php"),
      y: open("https://www.youtube.com"),
      m: open("https://monkeytype.com"),
    },
    // a = open "A"pplications
    a: {
      g: app("Google Chrome"),
      s: app("Safari"),
      c: app("Calendar"),
      r: app("Reminders"),
      m: app("Spark"),
      n: app("Notes"),
      t: app("Terminal"),
      f: app("Finder"),
      i: app("Messages"),
      p: app("Spotify"),
      u: app("Sublime Text"),
      v: app("Visual Studio Code"),
    },

    // w = "Window"
    w: {
      semicolon: {
        description: "Window: Hide",
        to: [
          {
            key_code: "h",
            modifiers: ["right_command"],
          },
        ],
      },
      // Currently use amethyst and already prefer existing rectangle shortcuts.
      // y: rectangle("previous-display"),
      // o: rectangle("next-display"),
      // k: rectangle("top-half"),
      // j: rectangle("bottom-half"),
      // h: rectangle("left-half"),
      // l: rectangle("right-half"),
      // f: rectangle("maximize"),
      u: {
        description: "Window: Previous Tab",
        to: [
          {
            key_code: "tab",
            modifiers: ["right_control", "right_shift"],
          },
        ],
      },
      i: {
        description: "Window: Next Tab",
        to: [
          {
            key_code: "tab",
            modifiers: ["right_control"],
          },
        ],
      },
      n: {
        description: "Window: Next Window",
        to: [
          {
            key_code: "grave_accent_and_tilde",
            modifiers: ["right_command"],
          },
        ],
      },
      b: {
        description: "Window: Back",
        to: [
          {
            key_code: "open_bracket",
            modifiers: ["right_command"],
          },
        ],
      },
      // Note: No literal connection. Both f and n are already taken.
      m: {
        description: "Window: Forward",
        to: [
          {
            key_code: "close_bracket",
            modifiers: ["right_command"],
          },
        ],
      },
      d: {
        description: "Window: Next display",
        to: [
          {
            key_code: "right_arrow",
            modifiers: ["right_control", "right_option", "right_command"],
          },
        ],
      },
    },

    // // s = "System"
    // s: {
    //   u: {
    //     to: [
    //       {
    //         key_code: "volume_increment",
    //       },
    //     ],
    //   },
    //   j: {
    //     to: [
    //       {
    //         key_code: "volume_decrement",
    //       },
    //     ],
    //   },
    //   i: {
    //     to: [
    //       {
    //         key_code: "display_brightness_increment",
    //       },
    //     ],
    //   },
    //   k: {
    //     to: [
    //       {
    //         key_code: "display_brightness_decrement",
    //       },
    //     ],
    //   },
    //   l: {
    //     to: [
    //       {
    //         key_code: "q",
    //         modifiers: ["right_control", "right_command"],
    //       },
    //     ],
    //   },
    //   p: {
    //     to: [
    //       {
    //         key_code: "play_or_pause",
    //       },
    //     ],
    //   },
    //   semicolon: {
    //     to: [
    //       {
    //         key_code: "fastforward",
    //       },
    //     ],
    //   },
    // },

      j: {
        to: [{ key_code: "left_arrow" }],
      },
      k: {
        to: [{ key_code: "down_arrow" }],
      },
      i: {
        to: [{ key_code: "up_arrow" }],
      },
      l: {
        to: [{ key_code: "right_arrow" }],
      },
    // Homerow - Click shortcut
    b: {
      to: [
        {
          key_code: "b",
          modifiers: ["left_control", "left_command"],
        },
      ],
    },
    
    // Homerow - Search+Click shortcut
    n: {
      to: [
        {
          key_code: "n",
          modifiers: ["left_control", "left_command"],
        },
      ],
    },
    
    // Homerow - Scroll shortcut
    m: {
      to: [
        {
          key_code: "m",
          modifiers: ["left_control", "left_command"],
        },
      ],
    }
    // // c = Musi*c* which isn't "m" because we want it to be on the left hand
    // c: {
      //   p: {
    //     to: [{ key_code: "play_or_pause" }],
    //   },
    //   n: {
    //     to: [{ key_code: "fastforward" }],
    //   },
    //   b: {
    //     to: [{ key_code: "rewind" }],
    //   },
    // },

  }),
];

fs.writeFileSync(
  "karabiner.json",
  JSON.stringify(
    {
      global: {
        show_in_menu_bar: false,
      },
      profiles: [
        {
          name: "Default",
          complex_modifications: {
            rules,
          },
          devices: [
            {
              disable_built_in_keyboard_if_exists: false,
              fn_function_keys: [],
              identifiers: {
                  is_keyboard: true,
                  is_pointing_device: false,
                  product_id: 591,
                  vendor_id: 1452
              },
              ignore: false,
              manipulate_caps_lock_led: true,
              simple_modifications: [
                  {
                      // Map home button to play/pause on keychron k6
                      from: {
                          key_code: "home"
                      },
                      to: [
                          {
                              consumer_key_code: "play_or_pause"
                          }
                      ]
                  }
              ]
            }
          ],
        },
      ],
    },
    null,
    2
  )
);
