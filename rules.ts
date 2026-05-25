import fs from "fs";
import { KarabinerRules } from "./types";
import { createHyperSubLayers, app, open, shell } from "./utils";

const METADATA_KEYS = ["_comment"] as const;
const PRIORITY_MAPPING_KEYS = ["spacebar", "a", "s", "x"] as const;

// Load mappings dynamically from JSON config file
const mappingsData = JSON.parse(fs.readFileSync("mappings.json", "utf-8"));

validateMappingsData(mappingsData);

function mapAction(action: any) {
  if (action.type === "open") {
    return open(action.value);
  }
  if (action.type === "app") {
    return app(action.value);
  }
  if (action.type === "shell") {
    return shell`${action.value}`;
  }
  if (action.type === "to") {
    return { to: action.value };
  }
  return action;
}

const activeSublayers: Record<string, any> = {};

for (const [key, mapping] of getOrderedMappingEntries(mappingsData)) {
  if ((mapping as any).type === "sublayer") {
    const sublayerMap: Record<string, any> = {};
    for (const [subKey, subMapping] of Object.entries((mapping as any).mappings)) {
      sublayerMap[subKey] = mapAction(subMapping);
    }
    activeSublayers[key] = sublayerMap;
  } else {
    activeSublayers[key] = mapAction(mapping);
  }
}

function getOrderedMappingEntries(mappings: Record<string, any>) {
  const orderedEntries: [string, any][] = [];
  const seen = new Set<string>();

  METADATA_KEYS.forEach((key) => {
    seen.add(key);
  });

  PRIORITY_MAPPING_KEYS.forEach((key) => {
    if (key in mappings) {
      orderedEntries.push([key, mappings[key]]);
      seen.add(key);
    }
  });

  Object.entries(mappings).forEach(([key, value]) => {
    if (!seen.has(key)) {
      orderedEntries.push([key, value]);
    }
  });

  return orderedEntries;
}

function validateMappingsData(mappings: Record<string, any>) {
  Object.entries(mappings).forEach(([key, value]) => {
    if (isMetadataKey(key)) {
      return;
    }

    if ((value as any).type !== "sublayer") {
      return;
    }

    const sublayerMappings = (value as any).mappings || {};
    if (key in sublayerMappings) {
      throw new Error(
        `Sublayer "${key}" cannot define a shortcut on "${key}" because that key is reserved to activate the sublayer.`
      );
    }
  });
}

function isMetadataKey(key: string) {
  return METADATA_KEYS.includes(key as (typeof METADATA_KEYS)[number]);
}

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

  ...createHyperSubLayers(activeSublayers),
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
