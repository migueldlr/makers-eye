export function mixColorWithMidpoint(
  t: number,
  hex1: string,
  hexMid: string,
  hex2: string
): string {
  // Clamp t to [0, 1]
  t = Math.max(0, Math.min(1, t));

  const hexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    const bigint = parseInt(clean, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const rgbToHex = (rgb: [number, number, number]): string => {
    return (
      "#" +
      rgb
        .map((c) => c.toString(16).padStart(2, "0"))
        .join("")
        .toLowerCase()
    );
  };

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  const lerpColor = (
    c1: [number, number, number],
    c2: [number, number, number],
    t: number
  ): [number, number, number] =>
    c1.map((ch, i) => Math.round(lerp(ch, c2[i], t))) as [
      number,
      number,
      number
    ];

  const rgb1 = hexToRgb(hex1);
  const rgbMid = hexToRgb(hexMid);
  const rgb2 = hexToRgb(hex2);

  const alpha = 2 * Math.pow(t - 0.5, 2) + 0.5;

  const result: [number, number, number] = lerpColor(rgb1, rgb2, t); // lerpColor(rgb1, rgbMid, t);
  // t < 0.5
  //   ? lerpColor(rgb1, rgbMid, t / 0.5)
  //   : lerpColor(rgbMid, rgb2, (t - 0.5) / 0.5);

  return `rgb(${result.join(",")},${alpha})`;
}
