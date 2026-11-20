// Keyboard + gamepad -> arcade buttons {left,right,up,down,jump,shoot,bomb,start}.
const KEYS = {
  left: ['arrowleft', 'a'],
  right: ['arrowright', 'd'],
  up: ['arrowup', 'w'],
  down: ['arrowdown', 's'],
  shoot: ['j', 'z'],
  jump: ['k', ' ', 'x'],
  bomb: ['l', 'g', 'c'],
  start: ['enter']
};

export function createInput(target = window) {
  const down = new Set();
  // keys pressed since the last read: a tap shorter than one frame still registers
  const tapped = new Set();
  let mouse = false;
  target.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (Object.values(KEYS).some((list) => list.includes(k))) e.preventDefault();
    down.add(k);
    tapped.add(k);
  });
  target.addEventListener('keyup', (e) => down.delete(e.key.toLowerCase()));
  target.addEventListener('blur', () => down.clear());
  target.addEventListener('mousedown', (e) => { if (e.button === 0) { mouse = true; tapped.add('mouse'); } });
  target.addEventListener('mouseup', () => { mouse = false; });

  return function read() {
    const s = {};
    for (const [btn, keys] of Object.entries(KEYS)) s[btn] = keys.some((k) => down.has(k) || tapped.has(k));
    s.shoot = s.shoot || mouse || tapped.has('mouse');
    tapped.clear();
    const pad = navigator.getGamepads?.()[0];
    if (pad) {
      const b = (i) => !!pad.buttons[i]?.pressed;
      s.left ||= pad.axes[0] < -0.4 || b(14);
      s.right ||= pad.axes[0] > 0.4 || b(15);
      s.up ||= pad.axes[1] < -0.4 || b(12);
      s.down ||= pad.axes[1] > 0.4 || b(13);
      s.shoot ||= b(2) || b(7); // Square / X, R2
      s.jump ||= b(0); // Cross / A
      s.bomb ||= b(1) || b(5); // Circle / B, R1
      s.start ||= b(9);
    }
    return s;
  };
}
