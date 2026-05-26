export interface KarabinerRules {
  description?: string;
  manipulators?: Manipulator[];
}

export interface Manipulator {
  description?: string;
  type: "basic";
  from: From;
  to?: To[];
  to_after_key_up?: To[];
  to_if_alone?: To[];
  parameters?: Parameters;
  conditions?: Conditions[];
}

export interface Parameters {
  "basic.simultaneous_threshold_milliseconds"?: number;
}

type Conditions =
  | FrontMostApplicationCondition
  | DeviceCondition
  | KeybaordTypeCondition
  | InputSourceCondition
  | VaribaleCondition
  | EventChangedCondition;

type FrontMostApplicationCondition = {
  type: "frontmost_application_if" | "frontmost_application_unless";
  bundle_identifiers?: string[];
  file_paths?: string[];
  description?: string;
};

type DeviceCondition = {
  type:
  | "device_if"
  | "device_unless"
  | "device_exists_if"
  | "device_exists_unless";
  identifiers: Identifiers;
  description?: string;
};

interface Identifiers {
  vendor_id?: number;
  product_id?: number;
  location_id?: number;
  is_keyboard?: boolean;
  is_pointing_device?: boolean;
  is_touch_bar?: boolean;
  is_built_in_keyboard?: boolean;
}

type KeybaordTypeCondition = {
  type: "keyboard_type_if" | "keyboard_type_unless";
  keyboard_types: string[];
  description?: string;
};

type InputSourceCondition = {
  type: "input_source_if" | "input_source_unless";
  input_sources: InputSource[];
  description?: string;
};

interface InputSource {
  language?: string;
  input_source_id?: string;
  input_mode_id?: string;
}

type VaribaleCondition = {
  type: "variable_if" | "variable_unless";
  name: string | number | boolean;
  value: string | number;
  description?: string;
};

type EventChangedCondition = {
  type: "event_changed_if" | "event_changed_unless";
  value: boolean;
  description?: string;
};

export interface SimultaneousFrom {
  key_code: KeyCode;
}

export interface SimultaneousOptions {
  key_down_order?: "insensitive" | "strict" | "strict_inverse";
  detect_key_down_uninterruptedly?: boolean;
}

type ModifiersKeys =
  | "caps_lock"
  | "left_command"
  | "left_control"
  | "left_option"
  | "left_shift"
  | "right_command"
  | "right_control"
  | "right_option"
  | "right_shift"
  | "fn"
  | "command"
  | "control"
  | "option"
  | "shift"
  | "any";

export interface From {
  key_code?: KeyCode;
  simultaneous?: SimultaneousFrom[];
  simultaneous_options?: SimultaneousOptions;
  modifiers?: Modifiers;
}

export interface Modifiers {
  optional?: ModifiersKeys[];
  mandatory?: ModifiersKeys[];
}

/**
 * @see https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to/
 */
export interface To {
  key_code?: KeyCode;
  modifiers?: ModifiersKeys[];
  shell_command?: string;
  set_variable?: {
    name: string;
    value: boolean | number | string;
  };
  mouse_key?: MouseKey;
  pointing_button?: string;
  software_function?: SoftwareFunction;
  hold_down_milliseconds?: number;
  repeat?: boolean;
}

export interface MouseKey {
  y?: number;
  x?: number;
  speed_multiplier?: number;
  vertical_wheel?: number;
  horizontal_wheel?: number;
}

export interface SoftwareFunction {
  iokit_power_management_sleep_system?: {};
}

// NOTE: Keycodes should be added here once they are used in your layouts/rules.
export type KeyCode =
  | "caps_lock"
  | "left_control"
  | "left_shift"
  | "left_command"
  | "escape"
  | "spacebar"
  | "grave_accent_and_tilde"
  | "up_arrow"
  | "down_arrow"
  | "left_arrow"
  | "right_arrow"
  | "home"
  | "play_or_pause"
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z"
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9";
