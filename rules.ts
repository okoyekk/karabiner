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
        // Retain normal caps_lock functionality when tapped alone
        to_if_alone: [
          {
            key_code: "caps_lock",
            hold_down_milliseconds: 100,
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
      c: open("https://chat.com"),
      g: open("https://gemini.google.com"),
      a: open("https://claude.ai"),
      m: open("https://monkeytype.com"),
    },
    // a = open "A"pplications
    a: {
      s: app("Google Chrome"),
      b: app("Safari"),
      d: app("Discord"),
      x: app("Calendar"),
      r: app("Reminders"),
      z: app("Spark"),
      n: app("Notes"),
      t: app("iTerm"),
      f: app("Finder"),
      c: app("Messages"),
      i: app("iPhone Mirroring"),
      p: app("Preview"),
      m: app("Spotify"),
      w: app("Sublime Text"),
      v: app("Visual Studio Code"),
      e: app("Obsidian"),
    },

    // JKIL Movement
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
    // Homerow.app - Click shortcut
    b: {
      to: [
        {
          key_code: "b",
          modifiers: ["left_control", "left_command"],
        },
      ],
    },
    // Homerow.app - Search+Click shortcut
    n: {
      to: [
        {
          key_code: "n",
          modifiers: ["left_control", "left_command"],
        },
      ],
    },
    // Homerow.app - Scroll shortcut
    m: {
      to: [
        {
          key_code: "m",
          modifiers: ["left_control", "left_command"],
        },
      ],
    }

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
            // Overrides for Keychron K6
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
                  // Map home button to play/pause
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
