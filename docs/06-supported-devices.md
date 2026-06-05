# Supported Devices

This document tracks feature support across emulated and real devices.

**Legend**

| Symbol | Meaning |
|--------|---------|
| ✅ | Supported |
| ⚠️ | Partially supported |
| ❌ | Unsupported |
| — | Not applicable / not yet tested |

**Features**

| Column | What is tested |
|--------|---------------|
| App Bootstrap | App loads, canvas renders, modules instantiate without errors |
| Canvas Interactions | Drag, resize, and selection gestures work correctly |
| Plug Connections | Cables can be drawn and disconnected between modules |
| Web Audio API | `AudioContext` reaches `running` state and audio is produced |
| MIDI | Web MIDI API is available and MIDI input events are received |

---

## Desktop browsers

| Device / Browser | App Bootstrap | Canvas Interactions | Plug Connections | Web Audio API | MIDI |
|-----------------|:-------------:|:-------------------:|:----------------:|:-------------:|:----:|
| Desktop Firefox (latest) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Desktop Safari (WebKit, latest) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Desktop Chrome (latest) | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## iOS

| Device | Engine | App Bootstrap | Canvas Interactions | Plug Connections | Web Audio API | MIDI |
|--------|--------|:-------------:|:-------------------:|:----------------:|:-------------:|:----:|
| iPhone SE (emulated) | WebKit | ✅ | ✅ | ✅ | ✅ | ❌ |
| iPhone 12 (emulated) | WebKit | ✅ | ✅ | ✅ | ✅ | ❌ |
| iPad (gen 7) (emulated) | WebKit | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Android Chrome

| Device | Chrome version | App Bootstrap | Canvas Interactions | Plug Connections | Web Audio API | MIDI |
|--------|:--------------:|:-------------:|:-------------------:|:----------------:|:-------------:|:----:|
| Moto G4 (emulated) | 55 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Galaxy S8 (emulated) | 63 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nexus 6P (emulated) | 70 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pixel 4 (emulated) | 79 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Galaxy Tab S4 (emulated) | 86 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pixel 5 (emulated) | 96 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Galaxy S9+ (emulated) | 107 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Galaxy Tab S9 (emulated) | 116 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Galaxy A55 (emulated) | 124 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pixel 7 (emulated) | latest | ✅ | ✅ | ✅ | ✅ | ✅ |

